import { accountConfig } from "@/server/qb-lab/accounts/config";
import {
  accountClient,
  verifiedAccount,
} from "@/server/qb-lab/accounts/session";
import {
  AccountError,
  accountResponse,
  boundedJson,
  fields,
  requireOrigin,
  text,
  uuid,
} from "@/server/qb-lab/accounts/http";

async function handle(
  request: Request,
  context: { params: Promise<{ operation: string[] }> },
) {
  const config = accountConfig();
  if (!config)
    return accountResponse(
      {
        code: "ACCOUNTS_NOT_CONFIGURED",
        message:
          "Synthetic staging accounts are not configured. Real registration and uploads remain disabled.",
      },
      503,
    );
  try {
    const operation = (await context.params).operation.join("/");
    if (request.method !== "GET") requireOrigin(request, config.origin);
    const client = await accountClient(config);
    if (request.method === "POST" && operation === "login") {
      const input = await boundedJson(request);
      fields(input, ["email", "password"]);
      const email = text(input.email, 254);
      if (
        typeof input.password !== "string" ||
        input.password.length < 1 ||
        input.password.length > 128
      )
        throw new AccountError(422, "INVALID_CREDENTIALS");
      const password = input.password;
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new AccountError(401, "SIGN_IN_FAILED");
      try {
        await verifiedAccount(client);
      } catch (error) {
        await client.auth.signOut({ scope: "local" });
        throw error;
      }
      return accountResponse({ signedIn: true });
    }
    if (request.method === "POST" && operation === "logout") {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw new AccountError(503, "SESSION_SERVICE_UNAVAILABLE");
      return accountResponse({ signedIn: false });
    }
    const account = await verifiedAccount(client);
    if (request.method === "GET" && operation === "session")
      return accountResponse({ account });
    if (request.method === "GET" && operation === "athletes") {
      const { data, error } = await client
        .from("qb_athletes")
        .select("id,pathway,age_band,minor")
        .order("id")
        .limit(100);
      if (error) throw new AccountError(503, "DATABASE_UNAVAILABLE");
      return accountResponse({ athletes: data });
    }
    const athlete = uuid(new URL(request.url).searchParams.get("athlete"));
    if (
      request.method === "GET" &&
      ["progress", "assignments"].includes(operation)
    ) {
      const table =
        operation === "progress" ? "qb_learning_events" : "qb_tasks";
      const columns =
        operation === "progress"
          ? "id,kind,content_key,duration_seconds,created_at,source"
          : "id,content_version,title,assigned_by,completed_at,created_at";
      const { data, error } = await client
        .from(table)
        .select(columns)
        .eq("athlete_id", athlete)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new AccountError(503, "DATABASE_UNAVAILABLE");
      return accountResponse({ records: data });
    }
    if (request.method === "POST" && operation === "progress") {
      const input = await boundedJson(request);
      fields(input, ["id", "kind", "contentKey", "durationSeconds"]);
      if (
        typeof input.kind !== "string" ||
        !["lesson", "simulation", "workout"].includes(input.kind) ||
        !Number.isInteger(input.durationSeconds) ||
        Number(input.durationSeconds) < 0 ||
        Number(input.durationSeconds) > 3600
      )
        throw new AccountError(422, "INVALID_ACTIVITY");
      const { error } = await client
        .from("qb_learning_events")
        .upsert(
          {
            id: uuid(input.id),
            athlete_id: athlete,
            recorded_by: account.id,
            kind: input.kind,
            content_key: text(input.contentKey, 120),
            duration_seconds: input.durationSeconds,
          },
          { onConflict: "id", ignoreDuplicates: true },
        );
      if (error) throw new AccountError(403, "WRITE_DENIED");
      return accountResponse({ saved: true, source: "self_reported" });
    }
    if (request.method === "POST" && operation === "assignments") {
      if (account.role !== "coach")
        throw new AccountError(403, "COACH_REQUIRED");
      const input = await boundedJson(request);
      fields(input, ["contentKey", "title"]);
      const { data, error } = await client
        .from("qb_tasks")
        .insert({
          athlete_id: athlete,
          assigned_by: account.id,
          content_version: text(input.contentKey, 120),
          title: text(input.title, 160),
        })
        .select("id")
        .single();
      if (error) throw new AccountError(403, "WRITE_DENIED");
      return accountResponse({ id: data.id }, 201);
    }
    if (request.method === "POST" && operation === "complete") {
      const input = await boundedJson(request);
      fields(input, ["id"]);
      const { error } = await client.rpc("qb_complete_task", {
        target: uuid(input.id),
        athlete,
      });
      if (error) throw new AccountError(403, "WRITE_DENIED");
      return accountResponse({ completed: true });
    }
    return accountResponse({ code: "NOT_FOUND" }, 404);
  } catch (error) {
    return error instanceof AccountError
      ? accountResponse({ code: error.code }, error.status)
      : accountResponse({ code: "ACCOUNT_SERVICE_UNAVAILABLE" }, 503);
  }
}
export const GET = handle;
export const POST = handle;

import { createHmac, timingSafeEqual } from "node:crypto";
const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
export function signedRequest(
  origin,
  path,
  secret,
  timestamp = String(Date.now()),
) {
  return {
    timestamp,
    signature: createHmac("sha256", secret)
      .update(`${origin}\n${path}\n${timestamp}`)
      .digest("hex"),
  };
}
export function authorized(request, secret, now = Date.now()) {
  if (!secret || secret.length < 32) return false;
  const url = new URL(request.url),
    header = request.headers
      .get("authorization")
      ?.match(/^DCC (\d{13}):([a-f0-9]{64})$/);
  const health = url.pathname.endsWith("/health");
  const timestamp =
      header?.[1] || (health ? url.searchParams.get("timestamp") : null),
    signature =
      header?.[2] || (health ? url.searchParams.get("signature") : null);
  if (
    !timestamp ||
    !/^\d{13}$/.test(timestamp) ||
    Math.abs(now - Number(timestamp)) > 60000 ||
    !signature ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return false;
  const expected = signedRequest(
    url.origin,
    url.pathname,
    secret,
    timestamp,
  ).signature;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
const unavailable = (reason) => ({
  status: "Unavailable",
  reason,
  items: [],
  measuredAt: null,
});
async function requestJson(url, headers, fetcher) {
  const response = await fetcher(url, {
    headers,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok)
    throw new Error(`Provider returned HTTP ${response.status}`);
  return response.json();
}
async function tableRows(config, table, select, env, fetcher, order = "id") {
  const url = env[config.urlKey],
    key = env[config.dbKey];
  if (!url || !key)
    return unavailable(
      `Configure ${config.urlKey} and ${config.dbKey} in this existing business deployment.`,
    );
  try {
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url))
      throw new Error("Invalid hosted database origin");
    const items = [];
    for (let offset = 0; offset < 50000; offset += 500) {
      const data = await requestJson(
        `${url.replace(/\/$/, "")}/rest/v1/${table}?${new URLSearchParams({ select, order: `${order}.asc`, limit: "500", offset: String(offset) })}`,
        { apikey: key, Authorization: `Bearer ${key}` },
        fetcher,
      );
      if (!Array.isArray(data)) throw new Error("Invalid database response");
      items.push(...data);
      if (data.length < 500)
        return {
          status: "Connected",
          reason: null,
          items,
          measuredAt: new Date().toISOString(),
        };
    }
    throw new Error(
      "Record pagination limit exceeded; incomplete totals withheld",
    );
  } catch (e) {
    return unavailable(
      e.message === "Invalid database response" ||
        e.message.startsWith("Provider returned HTTP")
        ? e.message
        : "Database read unavailable",
    );
  }
}
async function stripeReport(config, env, fetcher) {
  const key = env.STRIPE_SECRET_KEY;
  if (!config.payments)
    return unavailable("No payment integration requested for this business");
  if (!key)
    return unavailable(
      "STRIPE_SECRET_KEY is missing from this business deployment",
    );
  let stage = "account";
  try {
    const headers = {
      Authorization: `Bearer ${key}`,
      "Stripe-Version": "2026-09-30.endive",
    };
    const account = await requestJson(
      "https://api.stripe.com/v1/account",
      headers,
      fetcher,
    );
    const coach = "acct_1UVeHrQGpLTTSzQv";
    if (
      !account.id ||
      (config.business === "coach-tae"
        ? account.id !== coach
        : account.id === coach)
    )
      throw new Error("Business Stripe account isolation check failed");
    stage = "payment_intents";
    const activity = await requestJson(
      "https://api.stripe.com/v1/payment_intents?limit=20",
      headers,
      fetcher,
    );
    if (!Array.isArray(activity.data))
      throw new Error("Incomplete payment response");
    const amounts = new Map();
    let count = 0,
      cursor = "";
    const start = new Date(Date.now() - 30 * 86400000).toISOString();
    stage = "charges";
    for (let page = 0; page < 50; page++) {
      const params = new URLSearchParams({
        limit: "100",
        "created[gte]": String(Math.floor(Date.parse(start) / 1000)),
      });
      if (cursor) params.set("starting_after", cursor);
      const data = await requestJson(
        `https://api.stripe.com/v1/charges?${params}`,
        headers,
        fetcher,
      );
      if (!Array.isArray(data.data) || typeof data.has_more !== "boolean")
        throw new Error("Incomplete charge response");
      for (const c of data.data)
        if (c.paid && c.captured && c.status === "succeeded") {
          if (
            !Number.isSafeInteger(c.amount) ||
            !Number.isSafeInteger(c.amount_refunded) ||
            !/^[a-z]{3}$/.test(c.currency)
          )
            throw new Error("Invalid charge amounts");
          count++;
          amounts.set(
            c.currency,
            (amounts.get(c.currency) || 0) + c.amount - c.amount_refunded,
          );
        }
      if (!data.has_more)
        return {
          status: "Connected",
          reason: null,
          accountId: account.id,
          livemode: /^(sk|rk)_live_/.test(key),
          count,
          amounts: [...amounts].map(([currency, minorUnits]) => ({
            currency,
            minorUnits,
          })),
          items: activity.data.map((p) => ({
            id: p.id,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            date: new Date(p.created * 1000).toISOString(),
          })),
          hasMore: activity.has_more === true,
          periodStart: start,
          measuredAt: new Date().toISOString(),
        };
      if (!data.data.length) throw new Error("Inconsistent charge pagination");
      cursor = data.data.at(-1).id;
    }
    throw new Error(
      "Payment pagination limit exceeded; incomplete revenue withheld",
    );
  } catch (e) {
    return unavailable(
      e.message === "Business Stripe account isolation check failed"
        ? e.message
        : `Stripe ${stage} read unavailable${/^Provider returned HTTP [0-9]{3}$/.test(e.message) ? `: ${e.message}` : ""}; check STRIPE_SECRET_KEY permissions in this business deployment`,
    );
  }
}
export async function snapshot(config, env = process.env, fetcher = fetch) {
  const records = Object.fromEntries(
    await Promise.all(
      Object.entries(config.tables).map(
        async ([label, [table, select, order]]) => [
          label,
          await tableRows(config, table, select, env, fetcher, order),
        ],
      ),
    ),
  );
  const payments = await stripeReport(config, env, fetcher);
  return {
    business: config.business,
    collectedAt: new Date().toISOString(),
    deployment: {
      status: "Serving",
      environment: env.VERCEL_ENV || "local",
      commit: env.VERCEL_GIT_COMMIT_SHA || null,
      url: env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
        : null,
    },
    records,
    payments,
    bookingEnabled:
      config.business === "coach-tae"
        ? env.PLATFORM_BOOKING_ENABLED === "true"
        : null,
    legacyReconciled: env.BOOKING_LEGACY_RECONCILED_AT || null,
  };
}
export async function handle(
  request,
  config,
  env = process.env,
  fetcher = fetch,
) {
  if (!authorized(request, env.COMMAND_CENTER_SECRET))
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: privateHeaders },
    );
  const data = await snapshot(config, env, fetcher);
  if (new URL(request.url).pathname.endsWith("/health")) {
    return Response.json(
      {
        ...data,
        records: Object.fromEntries(
          Object.entries(data.records).map(([label, r]) => [
            label,
            {
              status: r.status,
              reason: r.reason,
              count: r.status === "Connected" ? r.items.length : null,
            },
          ]),
        ),
        payments: {
          status: data.payments.status,
          reason: data.payments.reason,
          accountId: data.payments.accountId || null,
          livemode: data.payments.livemode ?? null,
          count: data.payments.count ?? null,
          amounts: data.payments.amounts || [],
        },
      },
      { headers: privateHeaders },
    );
  }
  return Response.json(data, { headers: privateHeaders });
}

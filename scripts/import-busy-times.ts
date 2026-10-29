/** Read-only validation by default. --apply reserves occupied times; never edits external appointments. */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
const intervals = z
  .array(
    z
      .object({
        external_id: z.string().trim().min(1).max(1000),
        starts_at: z.string().datetime({ offset: true }),
        ends_at: z.string().datetime({ offset: true }),
        buffer_minutes: z.number().int().min(0).max(60).default(15),
      })
      .strict()
      .refine(
        (v) => Date.parse(v.ends_at) > Date.parse(v.starts_at),
        "End must follow start",
      ),
  )
  .max(1000);
async function main() {
  const file = process.argv.find((v) => v.startsWith("--input="))?.slice(8);
  if (!file)
    throw new Error(
      "Provide an authorized upcoming-appointments export as --input=/secure/path/appointments.json. No calendar data was accessed.",
    );
  const input = intervals.parse(JSON.parse(readFileSync(file, "utf8")));
  if (new Set(input.map((v) => v.external_id)).size !== input.length)
    throw new Error(
      "Duplicate external appointment identifiers; review the export.",
    );
  const items = input.map((v) => ({
    source_ref: createHash("sha256").update(v.external_id).digest("hex"),
    starts_at: new Date(
      Date.parse(v.starts_at) - v.buffer_minutes * 60000,
    ).toISOString(),
    ends_at: new Date(
      Date.parse(v.ends_at) + v.buffer_minutes * 60000,
    ).toISOString(),
  }));
  console.log(
    `Validated ${items.length} occupied intervals. Raw appointment identifiers and parent/athlete data are not printed or stored.`,
  );
  if (!process.argv.includes("--apply")) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url !== "https://fqmojknpqhogotyvxyie.supabase.co" || !key)
    throw new Error(
      "Apply requires the verified Coach Tae project URL and securely bound service-role key.",
    );
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc("ct_import_busy_times", {
    p_items: items,
  });
  if (error)
    throw new Error(
      "Occupied-time import failed. No batch was committed. Inspect schema/access or conflicting native reservations; existing appointments were not changed.",
    );
  console.log(
    `Imported ${data} new busy intervals. Recheck native availability and reconcile every upcoming legacy appointment before cutover.`,
  );
}
main().catch(() => {
  console.error(
    "Occupied-time validation/import failed; verify the file format, explicit timezone offsets, project credentials and conflicts. No external appointments were modified.",
  );
  process.exitCode = 1;
});

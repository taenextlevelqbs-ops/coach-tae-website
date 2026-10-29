import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import EmbeddedPostgres from "embedded-postgres";
import { Pool } from "pg";
let server: EmbeddedPostgres, pool: Pool, dir: string;
let family: string, other: string, athlete: string, otherAthlete: string;
before(async () => {
  dir = await mkdtemp(join(tmpdir(), "coach-tae-db-"));
  const net = createServer();
  await new Promise<void>((resolve) => net.listen(0, "127.0.0.1", resolve));
  const addr = net.address();
  assert.ok(addr && typeof addr !== "string");
  const port = addr.port;
  await new Promise<void>((resolve, reject) =>
    net.close((e) => (e ? reject(e) : resolve())),
  );
  const password = randomUUID();
  server = new EmbeddedPostgres({
    databaseDir: join(dir, "pg"),
    port,
    user: "postgres",
    password,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  await server.initialise();
  await server.start();
  pool = new Pool({
    host: "127.0.0.1",
    port,
    user: "postgres",
    password,
    database: "postgres",
    max: 12,
  });
  await pool.query(
    `create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated; create role service_role bypassrls; grant usage on schema auth, public to anon,authenticated,service_role; create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`,
  );
  for (const migration of (await readdir("supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pool.query(
      await readFile(`supabase/migrations/${migration}`, "utf8"),
    );
});
after(async () => {
  await pool?.end();
  await server?.stop();
  if (dir) await rm(dir, { recursive: true, force: true });
});
beforeEach(async () => {
  await pool.query(
    `truncate auth.users,ct_families,ct_coaches,ct_athletes,ct_bookings,ct_slots,ct_rules,ct_blocks,ct_credits,ct_orders,ct_memberships,ct_events,ct_outbox,ct_progress,ct_lessons,ct_rate_limits,ct_invoices,ct_credit_recovery cascade; update ct_settings set notice_hours=0,cancellation_hours=24,reschedule_hours=24;`,
  );
  family = randomUUID();
  other = randomUUID();
  athlete = randomUUID();
  otherAthlete = randomUUID();
  await pool.query("insert into auth.users values($1),($2)", [family, other]);
  await pool.query(
    "insert into ct_families(id,email) values($1,'test-family@example.invalid'),($2,'other-family@example.invalid')",
    [family, other],
  );
  await pool.query(
    "insert into ct_athletes(id,family_id,name) values($1,$2,'Athlete A'),($3,$4,'Athlete B')",
    [athlete, family, otherAthlete, other],
  );
});
async function slot(kind = "private", capacity = 1, offset = 96) {
  return (
    await pool.query(
      "insert into ct_slots(kind,capacity,starts_at,ends_at) values($1,$2,now()+$3*interval '1 hour',now()+($3+1)*interval '1 hour') returning id",
      [kind, capacity, offset],
    )
  ).rows[0].id as string;
}
async function credit(id = family, kind = "private", units = 3) {
  await pool.query(
    "insert into ct_credits(family_id,kind,delta,source) values($1,$2,$3,$4)",
    [id, kind, units, randomUUID()],
  );
}
async function book(
  s: string,
  f = family,
  a = athlete,
  useCredit = true,
  request = randomUUID(),
) {
  return (
    await pool.query("select (ct_book($1,$2,$3,$4,$5)).*", [
      f,
      a,
      s,
      useCredit,
      request,
    ])
  ).rows[0];
}
async function balance(id = family, kind = "private") {
  return Number(
    (
      await pool.query(
        "select coalesce(sum(delta),0) n from ct_credits where family_id=$1 and kind=$2",
        [id, kind],
      )
    ).rows[0].n,
  );
}
async function order(product = "group_pack", booking: string | null = null) {
  const id = randomUUID();
  await pool.query(
    "insert into ct_orders(id,family_id,product_key,price_id,booking_id,session_id) values($1,$2,$3,'price_fixture_not_a_real_id',$4,$5)",
    [id, family, product, booking, `cs_${id}`],
  );
  return id;
}
async function fulfill(id: string, event = randomUUID(), amount = 15000) {
  return pool.query("select ct_fulfill($1,$2,$3,$4,$5,'usd')", [
    event,
    id,
    `cs_${id}`,
    `pi_${id}`,
    amount,
  ]);
}

test("private booking concurrency: exactly one family wins the final place", async () => {
  const s = await slot();
  await credit();
  await credit(other);
  const results = await Promise.allSettled([
    book(s),
    book(s, other, otherAthlete),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    (
      await pool.query(
        "select count(*) n from ct_bookings where status='confirmed'",
      )
    ).rows[0].n,
    "1",
  );
  assert.equal((await balance()) + (await balance(other)), 5);
});
test("group capacity cannot be oversold by simultaneous requests", async () => {
  const s = await slot("group", 3);
  const athletes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const id = randomUUID();
    athletes.push(id);
    await pool.query(
      "insert into ct_athletes(id,family_id,name) values($1,$2,'Test athlete')",
      [id, family],
    );
  }
  await credit(family, "group", 8);
  const results = await Promise.allSettled(
    athletes.map((a) => book(s, family, a)),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
  assert.equal(await balance(family, "group"), 5);
});
test("one credit cannot pay for two simultaneous bookings", async () => {
  await credit(family, "private", 1);
  const a = await slot(),
    b = await slot("private", 1, 120);
  const results = await Promise.allSettled([book(a), book(b)]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(await balance(), 0);
});
test("booking request retries redeem a credit only once", async () => {
  await credit();
  const s = await slot(),
    request = randomUUID();
  const [a, b] = await Promise.all([
    book(s, family, athlete, true, request),
    book(s, family, athlete, true, request),
  ]);
  assert.equal(a.id, b.id);
  assert.equal(await balance(), 2);
});
test("group credits cannot be used for private training and athlete ownership is enforced", async () => {
  await credit(family, "group");
  const s = await slot();
  await assert.rejects(book(s), /No eligible credits/);
  await assert.rejects(book(s, family, otherAthlete), /Athlete not found/);
});
test("package webhook retries, including separate duplicate events, grant exactly three credits", async () => {
  const id = await order();
  const event = randomUUID();
  await Promise.all([fulfill(id, event), fulfill(id, event), fulfill(id)]);
  assert.equal(await balance(family, "group"), 3);
  assert.equal(
    (await pool.query("select count(*) n from ct_outbox")).rows[0].n,
    "1",
  );
});
test("paid held booking confirms without also granting reusable credit", async () => {
  const s = await slot();
  const b = await book(s, family, athlete, false);
  const id = await order("private", b.id);
  await fulfill(id, randomUUID(), 8500);
  assert.equal(
    (await pool.query("select status from ct_bookings where id=$1", [b.id]))
      .rows[0].status,
    "confirmed",
  );
  assert.equal(await balance(), 0);
});
test("late paid webhook cannot oversell a released hold; it queues a refund", async () => {
  const s = await slot();
  const b = await book(s, family, athlete, false);
  const id = await order("private", b.id);
  await pool.query(
    "update ct_bookings set hold_until=now()-interval '1 minute' where id=$1",
    [b.id],
  );
  await credit(other);
  await book(s, other, otherAthlete);
  await fulfill(id, randomUUID(), 8500);
  assert.equal(
    (await pool.query("select status from ct_orders where id=$1", [id])).rows[0]
      .status,
    "refund_pending",
  );
  assert.equal(
    (
      await pool.query(
        "select count(*) n from ct_bookings where status='confirmed'",
      )
    ).rows[0].n,
    "1",
  );
  assert.equal(
    (await pool.query("select count(*) n from ct_outbox where kind='refund'"))
      .rows[0].n,
    "1",
  );
});
test("qualifying cancellation restores credit exactly once and unauthorized cancellation fails", async () => {
  await credit();
  const b = await book(await slot());
  await assert.rejects(
    pool.query("select ct_manage_booking($1,$2,null)", [other, b.id]),
    /Booking not found/,
  );
  await Promise.all([
    pool.query("select ct_manage_booking($1,$2,null)", [family, b.id]),
    pool.query("select ct_manage_booking($1,$2,null)", [family, b.id]),
  ]);
  assert.equal(await balance(), 3);
});
test("late cancellation fails; rescheduling into full session rolls back without losing original", async () => {
  await credit();
  await credit(other);
  const s = await slot(),
    full = await slot("private", 1, 120);
  const b = await book(s);
  await book(full, other, otherAthlete);
  await assert.rejects(
    pool.query("select ct_manage_booking($1,$2,$3)", [family, b.id, full]),
    /full/,
  );
  assert.equal(
    (await pool.query("select slot_id from ct_bookings where id=$1", [b.id]))
      .rows[0].slot_id,
    s,
  );
  await pool.query(
    "update ct_slots set starts_at=now()+interval '2 hours',ends_at=now()+interval '3 hours' where id=$1",
    [s],
  );
  await assert.rejects(
    pool.query("select ct_manage_booking($1,$2,null)", [family, b.id]),
    /Outside self-service/,
  );
});
test("rescheduling preserves credits and creates a new reminder version", async () => {
  await credit();
  const b = await book(await slot());
  const s = await slot("private", 1, 120);
  await pool.query("select ct_manage_booking($1,$2,$3)", [family, b.id, s]);
  assert.equal(await balance(), 2);
  const updated = (
    await pool.query("select * from ct_bookings where id=$1", [b.id])
  ).rows[0];
  assert.equal(updated.slot_id, s);
  assert.equal(updated.version, 2);
});
test("coach cannot reduce capacity below reservations or block a booked time", async () => {
  await credit(family, "group");
  const s = await slot("group", 3);
  await book(s);
  await pool.query("select ct_admin_schedule('capacity',$1)", [
    JSON.stringify({ id: s, capacity: 1 }),
  ]);
  await assert.rejects(
    pool.query("select ct_admin_schedule('capacity',$1)", [
      JSON.stringify({ id: s, capacity: 0 }),
    ]),
    /Capacity below/,
  );
  await assert.rejects(
    pool.query(
      "select ct_admin_schedule('block',jsonb_build_object('starts_at',now()+interval '96 hours','ends_at',now()+interval '97 hours','reason','closed'))",
    ),
    /conflicts/,
  );
});
test("blocked dates and minimum notice prevent reservations", async () => {
  await credit();
  const s = await slot();
  await pool.query(
    "insert into ct_blocks(starts_at,ends_at) values(now()+interval '95 hours',now()+interval '98 hours')",
  );
  await assert.rejects(book(s), /blocked/);
  const soon = await slot("private", 1, 1);
  await pool.query("update ct_settings set notice_hours=12");
  await assert.rejects(book(soon), /notice/);
});
test("weekly availability honors local timezone across daylight saving and is repeatable", async () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 3);
  const weekday = date.getUTCDay();
  await pool.query("select ct_admin_schedule('rule',$1)", [
    JSON.stringify({
      kind: "group",
      weekday,
      local_start: "16:00",
      timezone: "America/New_York",
      duration_minutes: 60,
      buffer_minutes: 15,
      capacity: 4,
    }),
  ]);
  await pool.query("select ct_publish(60)");
  const rows = (
    await pool.query(
      "select starts_at at time zone 'America/New_York' local_time from ct_slots order by starts_at",
    )
  ).rows;
  assert.ok(rows.length >= 8);
  for (const r of rows) assert.equal(r.local_time.getHours(), 16);
  const n = rows.length;
  await pool.query("select ct_publish(60)");
  assert.equal(
    (await pool.query("select count(*) n from ct_slots")).rows[0].n,
    String(n),
  );
});
test("buffered weekly rules never publish overlapping coach sessions", async () => {
  await pool.query(
    "insert into ct_rules(kind,weekday,local_start,timezone,duration_minutes,buffer_minutes,capacity) values('private',3,'16:00','America/New_York',60,15,1),('group',3,'17:00','America/New_York',60,15,4)",
  );
  await pool.query("select ct_publish(60)");
  assert.equal(
    (
      await pool.query(
        "select count(*) n from ct_slots a join ct_slots b on a.id<b.id where tstzrange(a.starts_at-a.buffer_minutes*interval '1 minute',a.ends_at+a.buffer_minutes*interval '1 minute','[)') && tstzrange(b.starts_at-b.buffer_minutes*interval '1 minute',b.ends_at+b.buffer_minutes*interval '1 minute','[)')",
      )
    ).rows[0].n,
    "0",
  );
});
test("subscription renewal, failure, stale delivery, cancellation and expiration control access", async () => {
  async function sync(status: string, offset: number, created: number) {
    await pool.query(
      "select ct_sync_membership($1,$2,'sub_test',$3,now()+$4*interval '1 hour',false,$5)",
      [randomUUID(), family, status, offset, created],
    );
  }
  await sync("active", 24, 10);
  assert.equal(
    (await pool.query("select ct_has_membership($1) ok", [family])).rows[0].ok,
    true,
  );
  await sync("active", 720, 20);
  await sync("past_due", 720, 30);
  assert.equal(
    (await pool.query("select ct_has_membership($1) ok", [family])).rows[0].ok,
    false,
  );
  await sync("active", 24, 15);
  assert.equal(
    (await pool.query("select status from ct_memberships")).rows[0].status,
    "past_due",
  );
  await sync("active", 720, 40);
  await sync("canceled", 720, 50);
  await sync("active", 720, 50);
  assert.equal(
    (await pool.query("select ct_has_membership($1) ok", [family])).rows[0].ok,
    false,
  );
  await pool.query("delete from ct_memberships");
  await sync("active", -1, 60);
  assert.equal(
    (await pool.query("select ct_has_membership($1) ok", [family])).rows[0].ok,
    false,
  );
});
test("full package refund reverses credits once, even after some were spent", async () => {
  const id = await order("private_pack");
  await fulfill(id, randomUUID(), 24000);
  await book(await slot());
  await pool.query("select ct_apply_refund($1,$2)", [randomUUID(), `pi_${id}`]);
  await pool.query("select ct_apply_refund($1,$2)", [randomUUID(), `pi_${id}`]);
  assert.equal(await balance(), 0);
  assert.equal(
    (
      await pool.query(
        "select units from ct_credit_recovery where family_id=$1 and kind='private'",
        [family],
      )
    ).rows[0].units,
    1,
  );
  await assert.rejects(
    book(await slot("private", 1, 120)),
    /No eligible credits/,
  );
});
test("outbox workers claim disjoint batches, with leases and bounded retries", async () => {
  for (let i = 0; i < 12; i++)
    await pool.query("select ct_enqueue($1,'reminder',$2,'{}')", [
      randomUUID(),
      family,
    ]);
  const [a, b] = await Promise.all([
    pool.query("select * from ct_claim_jobs(5)"),
    pool.query("select * from ct_claim_jobs(5)"),
  ]);
  assert.equal(a.rows.length, 5);
  assert.equal(b.rows.length, 5);
  assert.equal(new Set([...a.rows, ...b.rows].map((r) => r.id)).size, 10);
  await pool.query("update ct_outbox set attempts=12,locked_until=null");
  assert.equal(
    (await pool.query("select * from ct_claim_jobs(20)")).rows.length,
    0,
  );
});
test("browser RLS isolates families, protects writes, coach roles, premium bodies and quiz answers", async () => {
  await credit();
  await pool.query(
    'insert into ct_lessons(title,category,body,published,questions) values(\'Private lesson\',\'quiz\',\'Premium content\',true,\'[{"prompt":"Test","options":["A","B"],"answer":0}]\')',
  );
  const conn = await pool.connect();
  try {
    await conn.query("begin");
    await conn.query("set local role authenticated");
    await conn.query("select set_config('request.jwt.claim.sub',$1,true)", [
      other,
    ]);
    assert.equal((await conn.query("select * from ct_credits")).rows.length, 0);
    assert.equal(
      (await conn.query("select * from ct_athletes")).rows.length,
      1,
    );
    assert.equal((await conn.query("select * from ct_lessons")).rows.length, 0);
    await conn.query("rollback");
    for (const sql of [
      "insert into ct_coaches(user_id) values('" + other + "')",
      "update ct_credits set delta=999",
      `select ct_book('${other}','${otherAthlete}','${randomUUID()}',false,'${randomUUID()}')`,
    ]) {
      await conn.query("begin");
      await conn.query("set local role authenticated");
      await assert.rejects(conn.query(sql), /permission denied/);
      await conn.query("rollback");
    }
    await conn.query("begin");
    await conn.query("set local role anon");
    await assert.rejects(
      conn.query("select * from ct_families"),
      /permission denied/,
    );
    await conn.query("rollback");
  } finally {
    conn.release();
  }
});

test("publishing preserves slot IDs; disabling a rule closes empty times and preserves booked times", async () => {
  await pool.query(
    "insert into ct_rules(kind,weekday,local_start,timezone,duration_minutes,buffer_minutes,capacity) values('private',4,'16:00','America/New_York',60,15,1)",
  );
  await pool.query("select ct_publish(60)");
  const first = (
    await pool.query("select id,rule_id from ct_slots order by starts_at")
  ).rows;
  assert.ok(first.length > 1);
  await pool.query("select ct_publish(60)");
  assert.deepEqual(
    (await pool.query("select id,rule_id from ct_slots order by starts_at"))
      .rows,
    first,
  );
  await credit();
  await book(first[1].id);
  await pool.query("select ct_admin_schedule('rule_toggle',$1)", [
    JSON.stringify({ id: first[0].rule_id, active: false }),
  ]);
  assert.equal(
    (
      await pool.query("select cancelled from ct_slots where id=$1", [
        first[0].id,
      ])
    ).rows[0].cancelled,
    true,
  );
  assert.equal(
    (
      await pool.query("select cancelled from ct_slots where id=$1", [
        first[1].id,
      ])
    ).rows[0].cancelled,
    false,
  );
});
test("database constraint independently rejects buffered coach overlaps", async () => {
  await slot();
  await assert.rejects(slot("group", 4, 96), /ct_no_coach_overlap/);
});

function windowData(day: number, start = "16:00", end = "20:00") {
  return {
    weekdays: [day],
    kind: "group",
    timezone: "America/New_York",
    local_start: start,
    local_end: end,
    duration_minutes: 60,
    buffer_minutes: 15,
    capacity: 4,
  };
}
test("availability windows generate multiple buffered sessions and edits preserve booked slots", async () => {
  const data = windowData(2);
  await pool.query("select ct_save_windows(null,$1)", [JSON.stringify(data)]);
  const rules = (await pool.query("select * from ct_rules where active")).rows;
  assert.equal(rules.length, 1);
  const sessions = (
    await pool.query("select * from ct_slots order by starts_at")
  ).rows;
  assert.ok(sessions.length >= 16);
  const s = sessions.find(
    (x) => Date.parse(x.starts_at) > Date.now() + 7 * 86400000,
  );
  assert.ok(s);
  await credit(family, "group");
  const booking = await book(s.id);
  await pool.query("select ct_save_windows($1,$2)", [
    rules[0].id,
    JSON.stringify({ ...data, local_start: "17:00", local_end: "21:00" }),
  ]);
  assert.equal(
    (
      await pool.query("select status from ct_bookings where id=$1", [
        booking.id,
      ])
    ).rows[0].status,
    "confirmed",
  );
  assert.equal(
    (await pool.query("select cancelled from ct_slots where id=$1", [s.id]))
      .rows[0].cancelled,
    false,
  );
  assert.ok(
    (
      await pool.query("select superseded_by from ct_rules where id=$1", [
        rules[0].id,
      ])
    ).rows[0].superseded_by,
  );
  assert.equal(
    (await pool.query("select count(*) n from ct_rules where active")).rows[0]
      .n,
    "1",
  );
});
test("weekly windows support multiple days and separate hours on the same day", async () => {
  await pool.query("select ct_save_windows(null,$1)", [
    JSON.stringify({ ...windowData(2, "09:00", "12:00"), weekdays: [2, 4] }),
  ]);
  await pool.query("select ct_save_windows(null,$1)", [
    JSON.stringify(windowData(2, "16:00", "19:00")),
  ]);
  assert.equal(
    (await pool.query("select count(*) n from ct_rules where active")).rows[0]
      .n,
    "3",
  );
  assert.ok(
    (await pool.query("select count(*) n from ct_slots")).rows[0].n > 0,
  );
  await assert.rejects(
    pool.query("select ct_save_windows(null,$1)", [
      JSON.stringify(windowData(3, "17:00", "16:00")),
    ]),
    /Window must fit/,
  );
});
test("coach can move and cancel a confirmed booking inside parent cutoff; noncoaches cannot", async () => {
  await credit();
  const source = await slot("private", 1, 2),
    target = await slot("private", 1, 5);
  const b = await book(source);
  await assert.rejects(
    pool.query("select ct_coach_booking($1,$2,$3)", [other, b.id, target]),
    /Coach access/,
  );
  await pool.query("insert into ct_coaches values($1)", [family]);
  await pool.query("select ct_coach_booking($1,$2,$3)", [family, b.id, target]);
  assert.equal(
    (await pool.query("select slot_id from ct_bookings where id=$1", [b.id]))
      .rows[0].slot_id,
    target,
  );
  await pool.query("select ct_coach_booking($1,$2,null)", [family, b.id]);
  assert.equal(await balance(), 3);
});
test("cancelling a recurring session does not let cron reopen it", async () => {
  await pool.query("insert into ct_coaches values($1)", [family]);
  await pool.query("select ct_save_windows(null,$1)", [
    JSON.stringify(windowData(3)),
  ]);
  const s = (
    await pool.query("select id from ct_slots order by starts_at limit 1")
  ).rows[0].id;
  await pool.query("select ct_cancel_session($1,$2)", [family, s]);
  await pool.query("select ct_publish(60)");
  assert.equal(
    (await pool.query("select cancelled from ct_slots where id=$1", [s]))
      .rows[0].cancelled,
    true,
  );
});
test("one-time special sessions reject conflicts with existing sessions and vacations", async () => {
  const s = await slot();
  const row = (await pool.query("select * from ct_slots where id=$1", [s]))
    .rows[0];
  const data = {
    kind: "group",
    capacity: 5,
    buffer_minutes: 15,
    starts_at: row.starts_at.toISOString(),
    ends_at: row.ends_at.toISOString(),
  };
  await assert.rejects(
    pool.query("select ct_one_time($1)", [JSON.stringify(data)]),
    /ct_no_coach_overlap/,
  );
  await pool.query(
    "insert into ct_blocks(starts_at,ends_at) values(now()+interval '120 hours',now()+interval '123 hours')",
  );
  await assert.rejects(
    pool.query(
      "select ct_one_time(jsonb_build_object('kind','private','capacity',1,'buffer_minutes',15,'starts_at',now()+interval '121 hours','ends_at',now()+interval '122 hours'))",
    ),
    /blocked time/,
  );
});
test("refund recovery never creates negative spendable balances or repeat deductions", async () => {
  const id = await order("private_pack");
  await fulfill(id, randomUUID(), 24000);
  const b = await book(await slot());
  await pool.query("select ct_apply_refund($1,$2)", [randomUUID(), `pi_${id}`]);
  assert.equal(await balance(), 0);
  await pool.query("select ct_manage_booking($1,$2,null)", [family, b.id]);
  assert.equal(await balance(), 0);
  assert.equal(
    (
      await pool.query(
        "select units from ct_credit_recovery where family_id=$1",
        [family],
      )
    ).rows[0].units,
    0,
  );
  await pool.query("select ct_manage_booking($1,$2,null)", [family, b.id]);
  assert.equal(await balance(), 0);
  await credit(family, "private", 3);
  assert.equal(await balance(), 3);
  await assert.rejects(
    pool.query(
      "insert into ct_credits(family_id,kind,delta,source) values($1,'private',-4,'invalid-spend')",
      [family],
    ),
    /Insufficient available/,
  );
});
test("public availability aggregates holds and confirmed bookings without a row-list cap", async () => {
  const s = await slot("group", 3);
  await credit(family, "group");
  await book(s);
  let rows = (
    await pool.query(
      "select * from ct_availability(now(),now()+interval '5 days','group')",
    )
  ).rows;
  assert.equal(Number(rows[0].remaining), 2);
  await book(s, other, otherAthlete, false);
  rows = (
    await pool.query(
      "select * from ct_availability(now(),now()+interval '5 days','group')",
    )
  ).rows;
  assert.equal(Number(rows[0].remaining), 1);
});
test("original curriculum migration is repeatable and preserves coach edits", async () => {
  const sql = await readFile(
    "supabase/migrations/202610280003_original_qb_lab.sql",
    "utf8",
  );
  await pool.query(sql);
  assert.equal(
    (await pool.query("select count(*) n from ct_lessons")).rows[0].n,
    "41",
  );
  await pool.query(
    "update ct_lessons set title='Coach edited title' where slug='grip'",
  );
  await pool.query(sql);
  assert.equal(
    (await pool.query("select title from ct_lessons where slug='grip'")).rows[0]
      .title,
    "Coach edited title",
  );
  assert.equal(
    (
      await pool.query(
        "select count(*) n from ct_lessons where level='advanced'",
      )
    ).rows[0].n,
    "5",
  );
});

test("partial package refunds revoke whole credit units cumulatively without duplicate deductions", async () => {
  const id = await order("private_pack");
  await fulfill(id, randomUUID(), 24000);
  await pool.query("select ct_reconcile_refund($1,$2,$3)", [
    randomUUID(),
    `pi_${id}`,
    4000,
  ]);
  assert.equal(await balance(), 3);
  await pool.query("select ct_reconcile_refund($1,$2,$3)", [
    randomUUID(),
    `pi_${id}`,
    8000,
  ]);
  assert.equal(await balance(), 2);
  await pool.query("select ct_reconcile_refund($1,$2,$3)", [
    randomUUID(),
    `pi_${id}`,
    8000,
  ]);
  assert.equal(await balance(), 2);
  await pool.query("select ct_reconcile_refund($1,$2,$3)", [
    randomUUID(),
    `pi_${id}`,
    16000,
  ]);
  assert.equal(await balance(), 1);
  assert.equal(
    (
      await pool.query("select refunded_amount from ct_orders where id=$1", [
        id,
      ])
    ).rows[0].refunded_amount,
    16000,
  );
  await pool.query("select ct_apply_refund($1,$2)", [randomUUID(), `pi_${id}`]);
  assert.equal(await balance(), 0);
});

test("even backend writes cannot rewrite or delete the credit audit ledger", async () => {
  await credit();
  await assert.rejects(
    pool.query("update ct_credits set delta=-99 where family_id=$1", [family]),
    /immutable/,
  );
  await assert.rejects(
    pool.query("delete from ct_credits where family_id=$1", [family]),
    /immutable/,
  );
  assert.equal(await balance(), 3);
});

async function schedulerFixture() {
  await pool.query(`create schema if not exists vault;create schema if not exists net;create schema if not exists cron;
 create table if not exists vault.decrypted_secrets(name text primary key,decrypted_secret text);
 create table if not exists net.http_request_queue(id bigserial primary key,url text,headers jsonb,body jsonb,timeout_milliseconds int);
 create table if not exists cron.job(jobid bigserial primary key,jobname text unique,schedule text,command text);
 create or replace function net.http_post(url text,body jsonb default '{}',params jsonb default '{}',headers jsonb default '{}',timeout_milliseconds int default 5000) returns bigint language sql as $$insert into net.http_request_queue(url,body,headers,timeout_milliseconds) values(url,body,headers,timeout_milliseconds) returning id$$;
 create or replace function cron.schedule(p_name text,p_schedule text,p_command text) returns bigint language sql as $$insert into cron.job(jobname,schedule,command) values(p_name,p_schedule,p_command) on conflict(jobname) do update set schedule=excluded.schedule,command=excluded.command returning jobid$$;
 truncate vault.decrypted_secrets,net.http_request_queue,cron.job;
 `);
  const secret = randomUUID();
  await pool.query(
    "insert into vault.decrypted_secrets values('coach_tae_preview_jobs_url','https://coach-tae-preview-fixture.vercel.app/api/jobs'),('coach_tae_preview_cron_secret',$1),('coach_tae_preview_bypass','fixture-bypass-not-a-credential')",
    [secret],
  );
  return secret;
}
test("optional external scheduler registers once, uses a fixed minute job and resolves Vault secrets only when dispatching", async () => {
  const secret = await schedulerFixture(),
    sql = await readFile(
      "supabase/operations/preview-notification-scheduler.sql",
      "utf8",
    );
  await pool.query(sql);
  await pool.query(sql);
  const jobs = (await pool.query("select * from cron.job")).rows;
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].schedule, "* * * * *");
  assert.equal(
    jobs[0].command,
    "select public.ct_dispatch_preview_notifications();",
  );
  assert.equal(jobs[0].command.includes(secret), false);
  await pool.query("select ct_dispatch_preview_notifications()");
  const request = (await pool.query("select * from net.http_request_queue"))
    .rows[0];
  assert.equal(
    request.url,
    "https://coach-tae-preview-fixture.vercel.app/api/jobs",
  );
  assert.equal(request.headers.Authorization, `Bearer ${secret}`);
  assert.equal(request.headers["x-coach-tae-environment"], "preview");
  assert.equal(
    request.headers["x-vercel-protection-bypass"],
    "fixture-bypass-not-a-credential",
  );
  assert.equal(request.timeout_milliseconds, 55000);
  const c = await pool.connect();
  try {
    await c.query("begin");
    await c.query("set local role authenticated");
    await assert.rejects(
      c.query("select ct_dispatch_preview_notifications()"),
      /permission denied/,
    );
    await c.query("rollback");
  } finally {
    c.release();
  }
});
test("external scheduler fails closed for exposed request queues or a non-preview URL", async () => {
  await schedulerFixture();
  const sql = await readFile(
    "supabase/operations/preview-notification-scheduler.sql",
    "utf8",
  );
  const c = await pool.connect();
  try {
    await c.query("grant select on net.http_request_queue to authenticated");
    await assert.rejects(c.query(sql), /must not be readable/);
    await c.query("rollback");
    await c.query("revoke select on net.http_request_queue from authenticated");
    await c.query(
      "update vault.decrypted_secrets set decrypted_secret='https://coachtaeqb.com/api/jobs' where name='coach_tae_preview_jobs_url'",
    );
    await assert.rejects(c.query(sql), /verified preview/);
    await c.query("rollback");
  } finally {
    c.release();
  }
});

test("production minute scheduler targets only the production domain, preserves preview jobs, and protects dispatch and metadata", async () => {
  await schedulerFixture();
  await pool.query(
    await readFile(
      "supabase/operations/preview-notification-scheduler.sql",
      "utf8",
    ),
  );
  const secret = randomUUID();
  await pool.query(
    "insert into vault.decrypted_secrets values('coach_tae_production_jobs_url','https://coachtaeqb.com/api/jobs'),('coach_tae_production_cron_secret',$1)",
    [secret],
  );
  const sql = await readFile(
    "supabase/operations/production-notification-scheduler.sql",
    "utf8",
  );
  await pool.query(sql);
  await pool.query(sql);
  const jobs = (
    await pool.query(
      "select jobname,schedule,command from cron.job order by jobname",
    )
  ).rows;
  assert.equal(jobs.length, 2);
  const production = jobs.find(
    (j) => j.jobname === "coach-tae-production-notifications",
  );
  assert.equal(production.schedule, "* * * * *");
  assert.equal(
    production.command,
    "select public.ct_dispatch_production_notifications();",
  );
  assert.ok(!production.command.includes(secret));
  await pool.query(production.command);
  const request = (await pool.query("select * from net.http_request_queue"))
    .rows[0];
  assert.equal(request.url, "https://coachtaeqb.com/api/jobs");
  assert.equal(request.headers.Authorization, `Bearer ${secret}`);
  assert.equal(request.headers["x-coach-tae-environment"], "production");
  const c = await pool.connect();
  try {
    for (const query of [
      "select ct_dispatch_production_notifications()",
      "select * from ct_production_scheduler_runs",
    ]) {
      await c.query("begin");
      await c.query("set local role authenticated");
      await assert.rejects(c.query(query), /permission denied/);
      await c.query("rollback");
    }
    await c.query(
      "update vault.decrypted_secrets set decrypted_secret='https://preview.vercel.app/api/jobs' where name='coach_tae_production_jobs_url'",
    );
    await assert.rejects(
      c.query("select ct_dispatch_production_notifications()"),
      /missing or invalid/,
    );
    await assert.rejects(c.query(sql), /Configure https/);
    await c.query("rollback");
    await c.query(
      "update vault.decrypted_secrets set decrypted_secret='https://coachtaeqb.com/api/jobs' where name='coach_tae_production_jobs_url'",
    );
    await c.query("grant select on net.http_request_queue to anon");
    await assert.rejects(c.query(sql), /must not be readable/);
    await c.query("rollback");
    await c.query("revoke select on net.http_request_queue from anon");
  } finally {
    c.release();
  }
});

test("legacy occupied intervals are idempotent, remove native availability and prevent reservations without changing appointments", async () => {
  const id = await slot();
  const times = (
    await pool.query("select starts_at,ends_at from ct_slots where id=$1", [id])
  ).rows[0];
  const items = [
    {
      source_ref: "a".repeat(64),
      starts_at: times.starts_at.toISOString(),
      ends_at: times.ends_at.toISOString(),
    },
  ];
  assert.equal(
    (
      await pool.query("select ct_import_busy_times($1) n", [
        JSON.stringify(items),
      ])
    ).rows[0].n,
    1,
  );
  assert.equal(
    (
      await pool.query("select ct_import_busy_times($1) n", [
        JSON.stringify(items),
      ])
    ).rows[0].n,
    0,
  );
  assert.equal(
    (await pool.query("select count(*) n from ct_blocks")).rows[0].n,
    "1",
  );
  assert.equal(
    (
      await pool.query(
        "select * from ct_availability(now(),now()+interval '10 days','private')",
      )
    ).rowCount,
    0,
  );
  await credit();
  await assert.rejects(book(id), /blocked|Blocked/);
  assert.equal(await balance(), 3);
  assert.equal(
    (await pool.query("select count(*) n from ct_bookings")).rows[0].n,
    "0",
  );
  const c = await pool.connect();
  try {
    for (const query of [
      "select ct_import_busy_times('[]')",
      "select * from ct_legacy_busy_times",
    ]) {
      await c.query("begin");
      await c.query("set local role authenticated");
      await assert.rejects(c.query(query), /permission denied/);
      await c.query("rollback");
    }
  } finally {
    c.release();
  }
});

test("occupied-time import rolls back a whole conflicting batch and refuses silent changes to previous imports", async () => {
  const id = await slot();
  await credit();
  await book(id);
  const times = (
    await pool.query("select starts_at,ends_at from ct_slots where id=$1", [id])
  ).rows[0];
  const first = {
    source_ref: "b".repeat(64),
    starts_at: new Date(Date.now() + 200 * 3600000).toISOString(),
    ends_at: new Date(Date.now() + 201 * 3600000).toISOString(),
  };
  const conflicting = {
    source_ref: "c".repeat(64),
    starts_at: times.starts_at.toISOString(),
    ends_at: times.ends_at.toISOString(),
  };
  await assert.rejects(
    pool.query("select ct_import_busy_times($1)", [
      JSON.stringify([first, conflicting]),
    ]),
    /overlaps/,
  );
  assert.equal(
    (await pool.query("select count(*) n from ct_blocks")).rows[0].n,
    "0",
  );
  await pool.query("select ct_import_busy_times($1)", [
    JSON.stringify([first]),
  ]);
  await assert.rejects(
    pool.query("select ct_import_busy_times($1)", [
      JSON.stringify([
        {
          ...first,
          ends_at: new Date(Date.parse(first.ends_at) + 60000).toISOString(),
        },
      ]),
    ]),
    /Previously imported appointment changed/,
  );
  assert.equal(
    (await pool.query("select count(*) n from ct_blocks")).rows[0].n,
    "1",
  );
});

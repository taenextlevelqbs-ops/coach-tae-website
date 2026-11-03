import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
test("PostgreSQL booking lifecycle, capacity, retries, expiration, privacy and schedule safety", async () => {
  const db = new PGlite({ extensions: { btree_gist } });
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls;",
  );
  await db.exec(
    await readFile("supabase/migrations/202611020001_booking.sql", "utf8"),
  );
  const type = "10000000-0000-4000-8000-000000000001",
    slot = "20000000-0000-4000-8000-000000000001",
    target = "20000000-0000-4000-8000-000000000002";
  await db.query(
    `insert into ct_session_types(id,name,kind,amount,stripe_price_id,active) values($1,'Private','private',7500,'price_verified_fixture',true)`,
    [type],
  );
  await db.query(
    `insert into ct_sessions(id,session_type_id,starts_at,ends_at,capacity) values($1,$3,now()+interval '7 days',now()+interval '7 days 1 hour',1),($2,$3,now()+interval '8 days',now()+interval '8 days 1 hour',1)`,
    [slot, target, type],
  );
  await assert.rejects(
    db.query(
      `insert into ct_sessions(session_type_id,starts_at,ends_at,capacity) select session_type_id,starts_at,ends_at,1 from ct_sessions where id=$1`,
      [slot],
    ),
    /conflicting/,
  );
  const hold = (email: string, id = slot) =>
    db.query<{ id: string }>(
      `select id from ct_hold($1,'Parent','Athlete',$2,'5551234567')`,
      [id, email],
    );
  const race = await Promise.allSettled([
    hold("one@example.com"),
    hold("two@example.com"),
  ]);
  assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(race.filter((r) => r.status === "rejected").length, 1);
  const result = race.find(
    (r) => r.status === "fulfilled",
  ) as PromiseFulfilledResult<Awaited<ReturnType<typeof hold>>>;
  const id = result.value.rows[0].id;
  await db.query(
    `update ct_bookings set stripe_session_id='cs_fixture' where id=$1`,
    [id],
  );
  await assert.rejects(
    db.query(`select ct_confirm('evt_bad',$1,'cs_fixture','pi_fixture',5000)`, [
      id,
    ]),
    /mismatch/,
  );
  await db.query(
    `select ct_confirm('evt_paid',$1,'cs_fixture','pi_fixture',7500)`,
    [id],
  );
  await db.query(
    `select ct_confirm('evt_paid',$1,'cs_fixture','pi_fixture',7500)`,
    [id],
  );
  await db.query(
    `select ct_confirm('evt_paid_again',$1,'cs_fixture','pi_fixture',7500)`,
    [id],
  );
  assert.equal(
    (await db.query(`select * from ct_notifications`)).rows.length,
    1,
  );
  assert.equal(
    (
      await db.query<{ status: string }>(
        `select status from ct_bookings where id=$1`,
        [id],
      )
    ).rows[0].status,
    "confirmed",
  );
  await db.query(`select ct_manage('close',$1)`, [slot]);
  assert.equal(
    (
      await db.query<{ status: string }>(
        `select status from ct_bookings where id=$1`,
        [id],
      )
    ).rows[0].status,
    "confirmed",
  );
  await assert.rejects(
    db.query(`select ct_manage('delete',$1)`, [slot]),
    /history/,
  );
  await db.query(`select ct_manage('reschedule',$1,$2)`, [id, target]);
  assert.equal(
    (
      await db.query<{ session_id: string }>(
        `select session_id from ct_bookings where id=$1`,
        [id],
      )
    ).rows[0].session_id,
    target,
  );
  await db.exec("set role anon");
  await assert.rejects(
    db.query("select * from ct_bookings"),
    /permission denied/,
  );
  await assert.rejects(hold("intruder@example.com"), /permission denied/);
  await db.exec("reset role");
  await db.query(`select ct_manage('cancel',$1)`, [id]);
  const expired = (await hold("expired@example.com", target)).rows[0].id;
  await db.query(
    `update ct_bookings set expires_at=now()-interval '1 second',stripe_session_id='cs_late' where id=$1`,
    [expired],
  );
  const replacement = (await hold("replacement@example.com", target)).rows[0]
    .id;
  await db.query(`select ct_confirm('evt_late',$1,'cs_late','pi_late',7500)`, [
    expired,
  ]);
  assert.equal(
    (
      await db.query<{ status: string }>(
        `select status from ct_bookings where id=$1`,
        [expired],
      )
    ).rows[0].status,
    "payment_review",
  );
  assert.equal(
    (
      await db.query<{ status: string }>(
        `select status from ct_bookings where id=$1`,
        [replacement],
      )
    ).rows[0].status,
    "held",
  );
  // Three-session purchase grants exactly two remaining credits; retries never grant more.
  const packageSlot = "20000000-0000-4000-8000-000000000003";
  const redemptionSlot = "20000000-0000-4000-8000-000000000004";
  const offer = "30000000-0000-4000-8000-000000000001";
  await db.query(
    `insert into ct_offers(id,session_type_id,name,amount,stripe_price_id,credits,active) values($1,$2,'Three private sessions',24000,'price_package_fixture',3,true)`,
    [offer, type],
  );
  await db.query(
    `insert into ct_sessions(id,session_type_id,starts_at,ends_at,capacity) values($1,$3,now()+interval '10 days',now()+interval '10 days 1 hour',1),($2,$3,now()+interval '11 days',now()+interval '11 days 1 hour',1)`,
    [packageSlot, redemptionSlot, type],
  );
  const purchase = (
    await db.query<{ id: string }>(
      `select id from ct_hold($1,'Parent','QB','package@example.com','555',$2)`,
      [packageSlot, offer],
    )
  ).rows[0].id;
  await db.query(
    `update ct_bookings set stripe_session_id='cs_package' where id=$1`,
    [purchase],
  );
  await db.query(
    `select ct_confirm('evt_package',$1,'cs_package','pi_package',24000)`,
    [purchase],
  );
  await db.query(
    `select ct_confirm('evt_package_retry',$1,'cs_package','pi_package',24000)`,
    [purchase],
  );
  const credit = (
    await db.query<{ id: string; remaining: number }>(
      `select id,remaining from ct_package_credits where source_booking_id=$1`,
      [purchase],
    )
  ).rows[0];
  assert.equal(credit.remaining, 2);
  await assert.rejects(
    db.query(
      `select ct_redeem($1,$2,'Intruder','QB','intruder@example.com','555')`,
      [credit.id, redemptionSlot],
    ),
    /No available credits/,
  );
  const redemption = (
    await db.query<{ ct_redeem: string }>(
      `select ct_redeem($1,$2,'Parent','QB','package@example.com','555')`,
      [credit.id, redemptionSlot],
    )
  ).rows[0].ct_redeem;
  assert.equal(
    (
      await db.query<{ remaining: number }>(
        `select remaining from ct_package_credits where id=$1`,
        [credit.id],
      )
    ).rows[0].remaining,
    1,
  );
  await assert.rejects(
    db.query(
      `select ct_redeem($1,$2,'Parent','QB','package@example.com','555')`,
      [credit.id, redemptionSlot],
    ),
    /Full/,
  );
  assert.equal(
    (
      await db.query<{ remaining: number }>(
        `select remaining from ct_package_credits where id=$1`,
        [credit.id],
      )
    ).rows[0].remaining,
    1,
  );
  assert.equal(
    (
      await db.query<{ status: string }>(
        `select status from ct_bookings where id=$1`,
        [redemption],
      )
    ).rows[0].status,
    "confirmed",
  );
  await assert.rejects(
    db.query(
      `select ct_edit($1,now()+interval '12 days',now()+interval '12 days 1 hour',1,$2)`,
      [packageSlot, type],
    ),
    /Reschedule/,
  );
  // A later duplicate paid event must not undo a coach cancellation.
  await db.query(`select ct_manage('cancel',$1)`, [purchase]);
  await db.query(
    `select ct_confirm('evt_after_cancel',$1,'cs_package','pi_package',24000)`,
    [purchase],
  );
  assert.equal(
    (
      await db.query<{ status: string }>(
        `select status from ct_bookings where id=$1`,
        [purchase],
      )
    ).rows[0].status,
    "cancelled",
  );
  const snapshot = (
    await db.query<{ payload: { status: string } }>(
      `select payload from ct_notifications where booking_id=$1 and kind='confirmation'`,
      [purchase],
    )
  ).rows[0].payload;
  assert.equal(snapshot.status, "confirmed");
  const availability = (
    await db.query<{ ct_public_availability: { slots: { id: string }[] } }>(
      "select ct_public_availability()",
    )
  ).rows[0].ct_public_availability;
  assert.ok(!JSON.stringify(availability).includes("example.com"));
  assert.ok(!JSON.stringify(availability).includes("athlete_name"));
  assert.ok(!availability.slots.some((s) => s.id === redemptionSlot));
  await db.close();
});

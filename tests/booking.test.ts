import test from "node:test";
import assert from "node:assert/strict";
import {
  localSlot,
  validateParent,
  paidCheckout,
  calendarInvite,
} from "../lib/booking/core";
test("Eastern slots preserve local hours through DST", () => {
  assert.equal(localSlot("2027-03-07", "10:00"), "2027-03-07T15:00:00.000Z");
  assert.equal(localSlot("2027-03-14", "10:00"), "2027-03-14T14:00:00.000Z");
  assert.equal(localSlot("2026-11-08", "10:00"), "2026-11-08T15:00:00.000Z");
});
test("invalid and ambiguous daylight saving slots are rejected", () => {
  assert.throws(() => localSlot("2027-03-14", "02:30"));
  assert.throws(() => localSlot("2026-11-01", "01:30"));
  assert.throws(() => localSlot("garbage", "12:00"));
});
test("parent details validate and normalize without collecting birth dates", () => {
  assert.deepEqual(
    validateParent({
      email: " PARENT@example.com ",
      parent: " Parent ",
      athlete: "QB",
      phone: "555-1234",
    }),
    {
      email: "parent@example.com",
      parent: "Parent",
      athlete: "QB",
      phone: "555-1234",
    },
  );
  for (const email of ["bad", "a@b", "a b@c.com"])
    assert.throws(() =>
      validateParent({ email, parent: "P", athlete: "A", phone: "555" }),
    );
  assert.throws(() =>
    validateParent({
      email: "p@a.com",
      parent: "P",
      athlete: "",
      phone: "555",
    }),
  );
});
test("only verified paid USD checkouts with exact amount qualify", () => {
  const s = { payment_status: "paid", amount_total: 7500, currency: "usd" };
  assert.equal(paidCheckout(s, 7500), true);
  assert.equal(paidCheckout({ ...s, payment_status: "unpaid" }, 7500), false);
  assert.equal(paidCheckout({ ...s, currency: "eur" }, 7500), false);
  assert.equal(paidCheckout(s, 5000), false);
  assert.equal(paidCheckout({ ...s, amount_total: null }, 7500), false);
});
test("calendar attachment includes stable UID and UTC appointment times", () => {
  const invite = calendarInvite(
    "booking-123",
    "2027-03-14T14:00:00Z",
    "2027-03-14T15:00:00Z",
  );
  assert.match(invite, /UID:booking-123@coachtaeqb.com\r\n/);
  assert.match(invite, /DTSTART:20270314T140000Z/);
  assert.match(invite, /DTEND:20270314T150000Z/);
  assert.ok(!invite.includes("athlete"));
});

test("Stripe webhook signature verification rejects tampering and wrong secrets", async () => {
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe("sk_test_local_fixture_only");
  const body = JSON.stringify({
    id: "evt_local",
    type: "checkout.session.completed",
    data: { object: { payment_status: "paid" } },
  });
  const secret = "whsec_local_fixture_only";
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
  });
  assert.equal(
    stripe.webhooks.constructEvent(body, signature, secret).id,
    "evt_local",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(body, signature, "whsec_wrong_fixture"),
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(
      body.replace("paid", "unpaid"),
      signature,
      secret,
    ),
  );
});

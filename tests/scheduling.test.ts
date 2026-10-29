import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  authorizedJobRequest,
  matchesJobEnvironment,
} from "../lib/platform/job-auth";
import {
  createsNotifications,
  dispatchNotifications,
} from "../lib/platform/dispatch";

test("every Vercel cron is compatible with Hobby: one fixed minute/hour each day", async () => {
  const config = JSON.parse(await readFile("vercel.json", "utf8"));
  assert.ok(config.crons.length > 0);
  for (const cron of config.crons) {
    const [minute, hour, day, month, weekday] = cron.schedule.split(" ");
    assert.match(minute, /^\d{1,2}$/);
    assert.match(hour, /^\d{1,2}$/);
    assert.ok(Number(minute) < 60 && Number(hour) < 24);
    assert.deepEqual([day, month, weekday], ["*", "*", "*"]);
  }
});
test("job authentication is exact, rejects absent/incorrect credentials, and protects production from preview ticks", () => {
  assert.equal(
    authorizedJobRequest("Bearer fixture-secret", "fixture-secret"),
    true,
  );
  for (const h of [
    null,
    "",
    "fixture-secret",
    "Bearer wrong",
    "bearer fixture-secret",
    "Bearer fixture-secret ",
  ])
    assert.equal(authorizedJobRequest(h, "fixture-secret"), false);
  assert.equal(authorizedJobRequest("Bearer ", ""), false);
  assert.equal(matchesJobEnvironment("preview", "production"), false);
  assert.equal(matchesJobEnvironment("preview", "preview"), true);
  assert.equal(matchesJobEnvironment(null, "production"), true);
});
test("confirmation dispatch runs after the response and notification failures cannot undo a successful transaction", async () => {
  const callbacks: (() => Promise<void>)[] = [];
  let calls = 0;
  dispatchNotifications(
    (task) => {
      callbacks.push(task);
    },
    async () => {
      calls++;
    },
  );
  assert.equal(calls, 0);
  assert.equal(callbacks.length, 1);
  await callbacks[0]();
  assert.equal(calls, 1);
  const { mock } = await import("node:test");
  const errors = mock.method(console, "error", () => {});
  try {
    dispatchNotifications(
      (task) => {
        callbacks.push(task);
      },
      async () => {
        throw new Error("provider unavailable");
      },
    );
    await assert.doesNotReject(callbacks[1]());
    assert.equal(errors.mock.calls.length, 1);
    assert.doesNotThrow(() =>
      dispatchNotifications(
        () => {
          throw new Error("registration failed");
        },
        async () => {},
      ),
    );
    assert.equal(errors.mock.calls.length, 2);
  } finally {
    errors.mock.restore();
  }
});
test("booking and coach changes that create notifications trigger post-response delivery, without doing so on reads or checkout redirects", () => {
  for (const path of [
    "book",
    "bookings/manage",
    "admin/booking",
    "admin/cancel-session",
    "admin/retry",
  ])
    assert.equal(createsNotifications(path), true, path);
  for (const path of [
    "me",
    "availability",
    "checkout",
    "billing",
    "progress",
    "admin/windows",
  ])
    assert.equal(createsNotifications(path), false, path);
});

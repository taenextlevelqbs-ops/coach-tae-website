// @vitest-environment node
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
it("fails closed and removes partial backup files when the dump fails (synthetic command harness)", () => {
  const root = mkdtempSync(join(tmpdir(), "qb-backup-test-"));
  try {
    const bin = join(root, "bin"),
      out = join(root, "out");
    mkdirSync(bin);
    mkdirSync(out, { mode: 0o700 });
    const service = join(root, "service"),
      pass = join(root, "pass");
    writeFileSync(service, "synthetic", { mode: 0o600 });
    writeFileSync(pass, "synthetic", { mode: 0o600 });
    writeFileSync(
      join(bin, "pg_dump"),
      "#!/bin/sh\nprintf synthetic-partial\nexit 1\n",
      { mode: 0o700 },
    );
    writeFileSync(join(bin, "age"), "#!/bin/sh\ncat\n", { mode: 0o700 });
    const script = join(process.cwd(), "scripts/operations/backup-staging.sh");
    const env = {
      ...process.env,
      PATH: bin + ":" + process.env.PATH,
      QB_LAB_BACKUP_STAGE: "synthetic-staging",
      PGSERVICEFILE: service,
      PGPASSFILE: pass,
      QB_LAB_BACKUP_RECIPIENT: "age1" + "q".repeat(58),
      QB_LAB_BACKUP_DIRECTORY: out,
    };
    expect(
      spawnSync("bash", [script], { env: { ...env, QB_LAB_BACKUP_STAGE: "" } })
        .status,
    ).not.toBe(0);
    expect(spawnSync("bash", [script], { env }).status).not.toBe(0);
    expect(readdirSync(out)).toEqual([]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

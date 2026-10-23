/**
 * Local component integration harness, NOT an authenticated product or deploy target.
 * Existing prototype browser regressions need to run while real account services are disabled.
 * Copy the actual app/components without the root proxy; test the real deployed proxy separately
 * on port 3192. No production source has a test token, cookie, role or environment bypass.
 */
import { cp, mkdir, readFile, symlink, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const destination = join(root, ".qb-lab-browser-harness");
await mkdir(destination, { recursive: true });
await rm(join(destination, "app"), { recursive: true, force: true });
await cp(join(root, "app"), join(destination, "app"), { recursive: true });
for (const name of ["public", "postcss.config.mjs"]) {
  await rm(join(destination, name), { force: true, recursive: true });
  await symlink(join(root, name), join(destination, name));
}
const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
await writeFile(join(destination, "package.json"), JSON.stringify({ name: "qb-lab-local-component-harness", private: true, dependencies: pkg.dependencies }));
const ts = JSON.parse(await readFile(join(root, "tsconfig.json"), "utf8"));
ts.compilerOptions.paths = { "@/*": ["../*"] };
ts.exclude = ["node_modules"];
await writeFile(join(destination, "tsconfig.json"), JSON.stringify(ts, null, 2));
const sourceConfig = await readFile(join(root, "next.config.ts"), "utf8");
await writeFile(join(destination, "next.config.ts"), sourceConfig.replace("const nextConfig: NextConfig = {", `const nextConfig: NextConfig = { turbopack: { root: ${JSON.stringify(resolve(root))} },`));
// Never import/copy proxy.ts here. Only the real production app owns its request guard.
const result = spawnSync(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "build", destination], {
  cwd: root, stdio: "inherit", env: { ...process.env, QB_LAB_ACCOUNTS_STAGE: "disabled", NEXT_TELEMETRY_DISABLED: "1" },
});
process.exitCode = result.status ?? 1;

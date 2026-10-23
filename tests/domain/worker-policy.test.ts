// @vitest-environment node
import { readFileSync } from "node:fs";
import { Script } from "node:vm";
import { expect, it, vi } from "vitest";
function worker(offline = false) {
  const handlers = new Map<string, (event: unknown) => void>();
  const open = vi.fn(() => { throw new Error("Private navigation must not open a runtime cache."); });
  const fallback = new Response("Public offline guide");
  const match = vi.fn(async () => fallback);
  const fetch = vi.fn(async () => { if (offline) throw new Error("offline"); return new Response("Network only"); });
  new Script(readFileSync(new URL("../../public/qb-lab/sw.js", import.meta.url), "utf8")).runInNewContext({
    URL, Response, caches:{open,match}, fetch,
    self:{location:{origin:"https://lab.test"},addEventListener:(name: string, fn: (event: unknown) => void) => handlers.set(name,fn)},
  });
  function request(path: string, options: {method?: string; mode?: string; headers?: Record<string,string>} = {}) {
    const respondWith = vi.fn();
    handlers.get("fetch")!({request:{url:`https://lab.test${path}`,method:options.method ?? "GET",mode:options.mode ?? "cors",headers:new Headers(options.headers)},respondWith});
    return respondWith;
  }
  return {request,open,match,fetch};
}
it("never intercepts private/API, RSC, query, authorization or non-GET requests for caching", () => {
  const w = worker();
  const cases = [
    ["/api/qb-lab/private/athletes",{}],
    ["/api/qb-lab/video/submissions",{}],
    ["/qb-lab/film",{headers:{rsc:"1"}}],
    ["/qb-lab/film?profile=B",{mode:"navigate"}],
    ["/_next/static/asset.js",{headers:{authorization:"Bearer synthetic-test"}}],
    ["/qb-lab/film",{method:"POST"}],
  ] as const;
  for (const [path, options] of cases) expect(w.request(path, options)).not.toHaveBeenCalled();
  expect(w.open).not.toHaveBeenCalled();
});
it("online athlete navigation uses the network without opening or populating a cache", async () => {
  const w = worker();
  const response = await w.request("/qb-lab/film",{mode:"navigate"}).mock.calls[0][0];
  expect(await response.text()).toBe("Network only");
  expect(w.open).not.toHaveBeenCalled(); expect(w.match).not.toHaveBeenCalled();
});
it("offline athlete navigation receives only the fixed public guide, never a cached athlete page", async () => {
  const w = worker(true);
  const response = await w.request("/qb-lab/family",{mode:"navigate"}).mock.calls[0][0];
  expect(await response.text()).toBe("Public offline guide");
  expect(w.match).toHaveBeenCalledWith("/qb-lab/offline.html");
  expect(w.open).not.toHaveBeenCalled();
});

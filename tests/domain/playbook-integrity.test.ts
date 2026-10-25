import { describe, expect, it } from "vitest";
import { validateFormation } from "@/modules/qb-lab/football/content";
import { empty, parseState, validPlay } from "@/modules/qb-lab/platform/store";
import { formation } from "@/modules/qb-lab/simulation/model";
import { defaultConfig } from "@/modules/qb-lab/live-engine/defaults";
import { createEngine } from "@/modules/qb-lab/live-engine/engine";
import { toField } from "@/modules/qb-lab/football/geometry";

describe("playbook integrity and stationary formation guards", () => {
  it("returns false rather than throwing on malformed imported player entries", () => {
    for (const entry of [null, [], 0, true, "QB", {}]) {
      const p = formation("flag5");
      const payload = { ...p, players: [entry, ...p.players.slice(1)] };
      expect(() => validPlay(payload)).not.toThrow();
      expect(validPlay(payload)).toBe(false);
      expect(() => parseState(JSON.stringify({ ...empty, plays: [payload] })))
        .toThrow("Invalid playbook format or roster");
    }
  });

  it("allows bounded invalid drafts to be retained while preventing their live launch", () => {
    const play = formation("tackle");
    play.players.find((p) => p.label === "X")!.start.y = 68;
    expect(validPlay(play)).toBe(true);
    expect(parseState(JSON.stringify({ ...empty, plays: [play] })).plays[0]).toEqual(play);
    expect(validateFormation(play)).toContain("Offensive players cannot start beyond the line of scrimmage in this stationary formation fixture.");
    expect(() => createEngine({ ...defaultConfig(), play })).toThrow("beyond the line of scrimmage");
  });

  it("rejects role, eligibility, personnel and center inconsistencies independently of receiver letters", () => {
    const cases = [
      { change: (p: ReturnType<typeof formation>) => { p.players[0].eligible = true; }, error: "Only the designated QB" },
      { change: (p: ReturnType<typeof formation>) => { p.players[0].role = "WR"; }, error: "Only the designated QB" },
      { change: (p: ReturnType<typeof formation>) => { p.players.find((a) => a.label === "H")!.eligible = false; }, error: "exactly five eligible" },
      { change: (p: ReturnType<typeof formation>) => { p.players.find((a) => a.label === "Y")!.role = "WR"; }, error: "Declared tackle personnel" },
      { change: (p: ReturnType<typeof formation>) => { p.players.find((a) => a.role === "C")!.start.y = 73; }, error: "center must start" },
      { change: (p: ReturnType<typeof formation>) => { p.players.find((a) => a.label === "H")!.role = "DL"; }, error: "defensive player roles" },
      { change: (p: ReturnType<typeof formation>) => { p.players[3].id = p.players[2].id; }, error: "identifiers must be unique" },
    ];
    for (const item of cases) {
      const play = formation("tackle");
      item.change(play);
      expect(validateFormation(play).some((error) => error.includes(item.error))).toBe(true);
    }
    const custom = formation("tackle", true, "12");
    custom.players.find((p) => p.role === "TE")!.label = "Slot-A";
    expect(validateFormation(custom)).toEqual([]); // A TE role does not require an attached alignment.
  });

  it("transfers every saved offensive alignment and route to the live field exactly", () => {
    const play = formation("tackle");
    play.tactics = { hash: "right", strongSide: "left", boundaryBreakScale: 1 };
    const receiver = play.players.find((p) => p.label === "H")!;
    receiver.start.x = 34;
    receiver.route = [{ x: 34, y: 52 }, { x: 63, y: 52 }, { x: 68, y: 35 }];
    const saved = parseState(JSON.stringify({ ...empty, plays: [play] })).plays[0];
    const config = { ...defaultConfig(), play: saved };
    const live = createEngine(config);
    for (const p of saved.players) {
      const actor = live.players.find((a) => a.team === "offense" && a.id === p.id)!;
      expect(actor.start).toEqual(toField(p.start, config.rules.width, config.rules.los, saved.tactics, undefined, ["OL", "C", "QB", "RB", "DL"].includes(p.role ?? "")));
      expect(actor.route).toEqual(p.route.map((point) => toField(point, config.rules.width, config.rules.los, saved.tactics, p.start)));
      expect(actor.label).toBe(p.label);
    }
  });
});

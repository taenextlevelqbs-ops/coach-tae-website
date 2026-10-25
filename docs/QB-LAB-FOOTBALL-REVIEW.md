# Current extension

The newer shared personnel/front/coverage models, rules-aware flag pathways and coach-review boundaries are documented in [Football models and lessons](QB-LAB-FOOTBALL-MODELS.md). The earlier observation review below remains historical.

# QB LAB front-end: football content review

Checked October 22, 2026. This is an introductory **observation demonstration**, not a reviewed academy curriculum, validated playbook, film assessment or quarterback ability test. All field movement and feedback are authored synthetic examples. No NFL or NFL FLAG endorsement is claimed.

## Sources actually inspected

Source access initially failed at the network proxy. After the owner supplied the two domains, they were added to the existing network draft without removing other rules. Requests subsequently succeeded. The older `/learn-the-game/...` Football Operations addresses returned HTTP 404; the current URLs below were discovered from the official site's navigation, not guessed and presented as working references.

| Source | Verified material used | Scope limits |
| --- | --- | --- |
| [NFL Football Operations: Football Terms](https://operations.nfl.com/rules-officiating/nfl-football-basics/football-terms) | The Safety (Position), Linebacker and Quarterback entries describe different responsibilities, pass/run support, coverage and pressure. | Professional tackle context. Not a universal youth/college or flag rulebook, nor an answer key for our animation. |
| [NFL Football Operations: Formations](https://operations.nfl.com/rules-officiating/nfl-football-basics/formations) | Distinguishes offensive and defensive roles and formations. | Provides context; it does not certify the formation in the demo as legal. |
| [NFL FLAG: Rules](https://nflflag.com/flag-football-rules) | The rules page identifies NFL FLAG's 5-on-5 format and distinguishes other league sizes. It has separate restrictions for passing, rushing, quarterback runs and contact. | Rules belong to the stated format/body. No rule timing, distance, eligibility restriction or play legality is automatically applied to a different league. |
| [NFL FLAG: Football Positions](https://nflflag.com/flag-football-rules/football-positions) | Defensive backs can have man or zone responsibilities depending on strategy/rules. The center snaps and may participate as a receiver; formats and positions vary. | General editorial guidance; use a selected official season rulebook for any future graded rules questions. |

The NFL FLAG positions page states “seven feet” for a rush-line description, while its rules page states seven **yards** and discusses designated rushers. The general plays page also contains blocking/guarding descriptions that do not agree cleanly with the non-contact rules summary. Those statements were **not** converted into quiz keys or taught as universal rules. Resolve editorial conflicts against the exact official season/league rulebook and a qualified reviewer before adding that material. The demo deliberately avoids rush distances, pass clocks, eligibility decisions and blocking instruction.

## What each observation can establish

1. **Visible depth:** two highlighted defenders are present in the starting authored picture. This answer can be verified directly from `Field.tsx`; the component test checks separate tackle/flag player counts, and browser tests exercise the observation.
2. **Inference limits:** the starting alignment does not, by itself, prove the later authored assignments. The rotation is an explicit counterexample to assuming a fixed starting picture. The exercise does not label the animation as a complete Cover 2, Cover 3, Cover 4 or man defense. Two-high is a description of the starting depth, not a guarantee of a named coverage.
3. **Decision process:** the learner is asked to revisit defenders and developing space rather than trust an initial label or guarantee a touchdown. No specific receiver, throw, protection or universal progression is graded as correct. The example intentionally lacks enough scheme information to make those claims.

The diagram is not to scale; the shaded deep area is a teaching aid. White and blue markers distinguish offense and defense. Tackle has eleven players per side, flag five. The flag offense includes a center and quarterback; the flag renderer uses its own roster rather than silently inheriting eleven-player personnel. The animation illustrates a change in the picture, not the physical or tactical outcome of a live play. The field and route geometry are not a play legality validator.

## Publication gate

Before academy content is published as instruction, Coach Tae or another qualified pathway reviewer must approve the scenario assumptions, vocabulary, animation, answer explanations and age/experience suitability. Select and version the actual flag league/body/season and separately review any 7v7 format. Tackle rules may also differ between youth, high school, college and professional levels.

An 8–10 age selection currently changes learning context and guidance in the athlete preview; it does not magically produce an age-specific curriculum. Source checks and transparent limitations do not replace qualified coaching review. There are no invented IQ ratings, player-improvement percentages, injury assessments or animation-derived mechanics claims. The completion message reports only that the user explored the three demo observations.

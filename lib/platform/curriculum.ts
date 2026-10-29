import "server-only";
export type LearningLevel = "beginner" | "intermediate" | "advanced";
export type CurriculumLesson = {
  slug: string;
  title: string;
  level: LearningLevel;
  topic: string;
  category: string;
  diagram: string | null;
  body: string;
  questions: {
    prompt: string;
    options: string[];
    answer: number;
    explanation: string;
  }[];
  sort_order: number;
};
const lessons: CurriculumLesson[] = [];
function add(
  slug: string,
  title: string,
  level: LearningLevel,
  topic: string,
  diagram: string | null,
  body: string,
  question: string,
  options: string[],
  answer: number,
  explanation: string,
) {
  lessons.push({
    slug,
    title,
    level,
    topic,
    category: topic === "Athlete development" ? "development" : "football_iq",
    diagram,
    body: body.trim(),
    questions: [{ prompt: question, options, answer, explanation }],
    sort_order: lessons.length + 1,
  });
}
add(
  "stance-posture",
  "A balanced stance and ready posture",
  "beginner",
  "Fundamentals",
  null,
  `
THE GOAL
Start in a position that lets you receive the snap, see the defense, and move without first standing up or dropping down. In shotgun, keep your feet around shoulder width, knees softly bent, and pressure through the middle of each foot. Your chest stays tall enough to see; your hips stay athletic rather than sitting in a deep squat. Let your arms stay relaxed and ready for the ball.

ON THE FIELD
Before each snap, check the play clock, personnel, formation and protection call. Under center, learn the hand placement and exchange your team teaches with your center; it is different from a shotgun catch. Do not mix techniques without agreeing with the center. A reliable exchange comes before a fast drop.

PRACTICE
With a partner, freeze your stance for three seconds, receive a gentle snap, and set your feet without throwing. Repeat five quality exchanges, reset, and check whether your head level changed. Younger athletes can begin with a short hand toss. Add movement only when the catch and balance are consistent.

CHECK YOURSELF
Could you step in either direction immediately? Could you see both safeties? Film from the side to see whether you rock backward at the snap. The exact width can vary with the athlete; balance is the standard, not copying a photograph.
`,
  "You must rock backward before moving out of your stance. What should you change first?",
  [
    "Widen as far as possible",
    "Find balanced pressure and a relaxed athletic base",
    "Throw harder",
  ],
  1,
  "A balanced starting position removes the extra recovery movement. Maximum width or throwing effort does not fix an unstable stance.",
);
add(
  "grip",
  "Grip, ball security and a relaxed release",
  "beginner",
  "Fundamentals",
  null,
  `
THE GOAL
Control the football without squeezing the forearm rigid. Hand size and ball size matter. Many quarterbacks place the ring finger across a lace and spread the remaining fingers comfortably, but a useful grip is one that keeps the wrist free and the ball secure. You do not need identical finger placement to another player.

LEARN IT
Use an age-appropriate ball. Hold it in a ready position near the chest with the off hand supporting it while moving in the pocket. The throwing hand should be able to release without regripping several times. Keep your eyes up while finding a comfortable grip; staring at the laces hides defensive movement.

PRACTICE
A partner softly feeds the ball in different orientations. Catch with two hands, find the grip while looking toward a target, and freeze. Begin without a throw. Then make short, easy throws, noticing whether you squeeze harder when trying to aim. Stop the set when technique becomes tense rather than adding effort.

BALL SECURITY
Use two hands when resetting or moving through traffic. On a scramble, follow your team's ball-carrying rules instead of holding the ball away from your body. Protecting possession is part of quarterback mechanics.

REFLECT
Can you prepare the ball without looking down? If the ball is too large to control comfortably, choose the appropriate size rather than forcing a painful grip.
`,
  "While climbing a crowded pocket, what is the best default?",
  [
    "Carry the ball loose in one hand",
    "Look down at the laces throughout the play",
    "Keep two hands on the ball while staying ready to throw",
  ],
  2,
  "Two-hand control protects the ball during movement. Your eyes still need to track the defense.",
);
add(
  "footwork-base",
  "Footwork: build a base that can deliver",
  "beginner",
  "Fundamentals",
  null,
  `
THE GOAL
Connect the timing of your feet with the route, rather than taking an automatic number of steps on every play. Your offense may teach catch-and-throw, a short rhythm drop, or a deeper timing drop. Learn which one belongs to each concept.

BASE AND DIRECTION
Move with enough separation between the feet to stay balanced. Avoid crossing your feet during a small pocket reset when a controlled shuffle is sufficient. A long movement or a scramble may use a different running pattern. As you prepare to deliver, organize the base toward the intended throw without forcing every throw into one frozen stance.

PRACTICE
Mark a starting point and two target directions on the ground. Catch a soft toss, make your coach's assigned drop, reset toward the called target, and freeze before throwing. Check balance first. Then add an easy throw and a receiver breaking on time.

COMMON ERROR
A receiver becomes open, but the quarterback takes two extra hitches. The window closes while the feet continue moving. Work backward: identify the receiver's break, identify when the ball should leave, and match the drop to that rhythm.

SUCCESS STANDARD
You can stop in control, keep your vision up and throw without a large recovery step. Faster feet alone do not create a faster decision.
`,
  "The route breaks open, but you keep taking extra hitches. What should guide the correction?",
  [
    "Match the footwork to the route timing",
    "Use the deepest drop on every play",
    "Watch your own feet",
  ],
  0,
  "The drop and hitch must fit the concept. Unnecessary steps delay a correct read.",
);
add(
  "throwing-sequence",
  "Throwing mechanics: sequence before force",
  "beginner",
  "Fundamentals",
  null,
  `
THE GOAL
Produce a repeatable throw using the whole body, without chasing maximum arm speed. Begin from a balanced base, let the lower body and trunk contribute, and allow the arm to deliver naturally toward the target. Athletes vary; do not force an exact elbow angle or release shape that causes discomfort.

ACCURACY HAS A PURPOSE
A complete pass is not always a well-placed pass. On a moving route, put the ball where the receiver can continue away from a defender. Against tight leverage, a safe location may be away from the defender even if it reduces yards after the catch. Your receiver and coach must understand the same landmark.

PRACTICE
From a comfortable short distance, make five relaxed throws toward a receiver's outside shoulder, then five toward the other shoulder. Pause between sets. Notice balance, target selection and a smooth finish. Increase difficulty with a moving receiver before increasing distance or effort.

COMMON ERROR
Trying to fix every miss by throwing harder adds tension. Identify whether the miss came from the read, late timing, an unstable base, or an actual release problem. Fix one variable per set.

TRAINING NOTE
Stop throwing when pain appears or mechanics deteriorate. A coach should coordinate total throwing across team practice, private lessons and games. There is no universal daily throw count appropriate for every youth athlete.
`,
  "You are balanced but consistently late to a short breaking route. Is more arm effort the first fix?",
  [
    "Yes, use maximum force",
    "No, check the read and release timing first",
    "Always change your grip",
  ],
  1,
  "A stronger late throw can still miss the window. Diagnose timing and decisions before changing mechanics.",
);
add(
  "pocket-movement",
  "Pocket movement: climb, slide and reset",
  "beginner",
  "Fundamentals",
  "pocket",
  `
THE GOAL
Move enough to improve the throwing lane without creating new pressure. A pocket is changing space, not a marked spot you must stand on. Feel the rush while keeping your eyes on the route and your hands ready.

CLIMB OR SLIDE
If edge rushers run beyond your drop, a controlled climb may shorten their path to nowhere while opening yours. If interior pressure blocks that path, a small lateral slide may be better. Do not drift backward automatically: it gives edge rushers a shorter angle and makes the throw longer.

PRACTICE
Place three cones around a safe starting area. A coach points toward simulated pressure. Move into the open lane, reset, and make a short controlled throw. No live contact is needed. Begin at walking speed. Add a receiver only after you can move without dropping your eyes.

BALL AND BODY
Keep two hands on the ball during a reset. When the pocket is truly lost, follow the team's escape and scramble rules. Avoid throwing across your body into an unseen middle merely because you are moving away from pressure.

FILM QUESTION
Did your movement improve the angle, or did it turn manageable pressure into a scramble? Evaluate the space you gained and the time you used, not just whether the pass was completed.
`,
  "Edge rushers have gone beyond your drop and the inside lane is clear. Which movement may help?",
  [
    "Drift farther backward",
    "Close your eyes and sprint",
    "Climb under control while keeping your vision up",
  ],
  2,
  "A controlled climb can move you away from deep edge rushers. It is appropriate only when the interior lane is actually clear.",
);
add(
  "cover-0",
  "Cover 0: pressure without a deep safety",
  "beginner",
  "Defensive recognition",
  "cover0",
  `
WHAT IT MEANS
Cover 0 generally describes man coverage with no dedicated deep safety. That can free defenders to pressure, but a zero-high picture before the snap is a clue, not proof. A defense can disguise, drop a rusher, or change its coverage responsibilities.

WHAT TO CHECK
Count potential rushers, identify your protection assignments, and locate receivers with useful leverage. Ask whether your offense has an answer for a defender the protection cannot block. That answer must come from the installed play and protection rules, not an improvised route the receiver does not know.

AFTER THE SNAP
Confirm who actually rushes and whether defenders carry receivers in man coverage. A quick option can be better than a hopeful deep throw, even when no safety is visible. The ball still needs a clear throwing lane and a receiver who can win on time.

SCENARIO
Your team can account for five rushers. A sixth defender threatens the edge. Before demanding that the line block everyone, identify your team's unblocked-defender answer with the coach. If that defender drops out, you may need to return to the concept rather than throwing a blind hot pass.

PRACTICE
On a board, circle the possible extra rusher and mark the offense's agreed answer. Then draw the same front with that defender dropping into the passing lane. Explain what must change in your decision.
`,
  "Does seeing no deep safety guarantee that a deep pass is the right answer?",
  [
    "No; confirm leverage, actual pressure and the installed answer",
    "Yes; every receiver is open deep",
    "Yes; protection no longer matters",
  ],
  0,
  "Cover 0 can create opportunities, but it does not erase protection, leverage or timing.",
);
add(
  "cover-1",
  "Cover 1: man coverage with a middle-field safety",
  "beginner",
  "Defensive recognition",
  "cover1",
  `
WHAT IT MEANS
Cover 1 commonly combines man coverage underneath with one deep middle safety. Some versions include a low-hole defender or a robber reading the quarterback. The exact rules vary by defense.

PRE-SNAP CLUES
A single high safety, cornerback leverage, and defenders following motion can suggest man coverage. None is conclusive on its own. Identify where the safety begins and whether the middle underneath looks occupied.

POST-SNAP CONFIRMATION
Check whether underneath defenders carry receivers rather than passing them into zones. Locate the deep safety and any low-hole help before throwing an inside route. A receiver who looks isolated against a corner can still be running toward safety assistance.

BALL PLACEMENT
Throw away from leverage and on your receiver's timing. An outside route may reduce the middle safety's influence, but route design and field width matter. A seam or post needs an honest plan for the safety, not an assumption that he will stay still.

SCENARIO PRACTICE
Draw a slot receiver crossing toward the middle. Place a low-hole defender inside. Explain why beating the first defender does not automatically create an open throw. Next, move the safety away and identify the new space without declaring it open before the receiver gets there.
`,
  "A slot receiver beats his man inside. What else should you locate before throwing?",
  [
    "Only the sideline",
    "The deep safety and possible low-hole help",
    "Nothing; beating one defender guarantees a completion",
  ],
  1,
  "Cover 1 often includes help inside. The first matchup is only part of the picture.",
);
add(
  "cover-2",
  "Cover 2: two deep halves and underneath space",
  "beginner",
  "Defensive recognition",
  "cover2",
  `
WHAT IT MEANS
Traditional zone Cover 2 uses two deep-half safeties and underneath defenders dividing shorter space. Cornerbacks often protect the flat and disrupt outside releases. Two high safeties before the snap can also lead to quarters, man coverage, or a rotation, so confirm the action.

READ THE FLAT DEFENDER
Many concepts challenge a flat defender with one route below and another behind. Your read depends on his depth, width and responsibility. If he sinks underneath the deeper route, the short completion may be the correct answer. If he drives down, a window may open behind him before the safety can close it.

RESPECT THE HOLE
The area outside a safety and behind a corner is often called a hole shot. It is a demanding timing and placement throw, not a free pass. A sinking corner or a widening safety can close it quickly.

VARIATIONS
In Tampa 2, a middle linebacker can run deep down the middle. Other defenses match vertical routes. Watch what the underneath defenders actually do rather than labeling all two-high defenses the same.

PRACTICE
Draw a shallow flat route and a deeper outside route. Move the corner first shallow, then deep. Say your decision aloud in each case, including when you would reject the deeper throw.
`,
  "In a high-low read, the flat defender sinks beneath the deeper route. What may be available?",
  [
    "The shorter route underneath, if its lane is clear",
    "A guaranteed deep touchdown",
    "A blind throw between safeties",
  ],
  0,
  "A sinking flat defender can concede the short route. Check the actual lane and remaining pursuit.",
);
add(
  "cover-3",
  "Cover 3: three deep defenders and underneath rotation",
  "beginner",
  "Defensive recognition",
  "cover3",
  `
WHAT IT MEANS
Cover 3 generally divides deep space into three zones. Outside corners often take the outside thirds and a safety the middle third. Four underneath defenders commonly handle shorter zones, but pressure versions can change that count.

BEFORE THE SNAP
A one-high shell is a starting clue. A safety may roll down late to become a curl-flat defender while the other rotates to the middle. Identify both safeties, not only the one already deep.

AFTER THE SNAP
Watch the flat and seam defenders. Flood concepts may stretch a sideline defender vertically; seams can challenge the space between deep defenders. Defenses can match receivers rather than simply dropping to landmarks, so a route entering a zone is not automatically uncovered.

SCENARIO
A flat receiver seems open. The rotating safety is driving down from depth. A late throw can turn a modest gain into a collision or interception. Your timing, the receiver's spacing and the defender's closing path determine whether the pass is still available.

PRACTICE
Sketch three deep defenders, then add a curl-flat defender. Show how the underneath defender changes his leverage when a second receiver releases outside. Explain which movement your concept is designed to read and what the deep corner can still take away.
`,
  "What confirms a Cover 3 hypothesis better than a one-high pre-snap shell?",
  [
    "The jersey color",
    "Deep-third behavior plus the underneath defenders’ actual movement",
    "The quarterback’s favorite route",
  ],
  1,
  "The shell is only a clue. Post-snap responsibilities reveal how the defense is playing.",
);
add(
  "cover-4",
  "Cover 4: quarters can become match coverage",
  "intermediate",
  "Defensive recognition",
  "cover4",
  `
WHAT IT MEANS
Cover 4 is commonly associated with four deep quarter responsibilities. It is often a match system in which defenders react to receiver releases, not four players standing still in four boxes. Some calls are more conservative spot drops; others aggressively involve safeties in the run fit.

NUMBER THE RECEIVERS
On each side, number eligible receivers from the sideline inward. The outside receiver is commonly number 1 and the next inside number 2. Your team's terminology may differ, but the purpose is to describe which release a defender is reading.

WATCH THE SAFETY
A safety may key the inside receiver and carry him vertically. If that receiver goes shallow, the safety's next responsibility depends on the coverage rules. Never assume a shallow release automatically removes safety help from a deep outside route.

WHY IT MATTERS
A seam that looked open against a spot-drop defense may be carried tightly against quarters match. The quarterback must connect the concept to the actual response, especially against two-receiver sides.

PRACTICE
Draw two receivers and a corner/safety pair. Give number 2 a vertical release, then an out-breaking release. Ask a coach to explain the opponent's likely matching rules. Write a conditional answer: if the safety carries, then inspect the next route; if he drives down, locate who takes the vertical threat. Avoid calling quarters a universal weakness against one route.
`,
  "Why can a seam route be covered tightly against quarters?",
  [
    "Quarters never covers vertical routes",
    "The safety may match the inside receiver’s vertical release",
    "All defenders must stay on a fixed yard line",
  ],
  1,
  "Many quarters systems turn vertical releases into match assignments.",
);
add(
  "cover-6",
  "Cover 6: recognize the split-field combination",
  "intermediate",
  "Defensive recognition",
  "cover6",
  `
WHAT IT MEANS
Cover 6 usually combines quarters principles to one side with Cover 2 principles to the other. Teams may use different names or reverse the sides. The number is a label for a combination, not six deep defenders.

READ EACH SIDE
Start by locating the safeties, corner depths, receiver distribution and the field/boundary relationship. A corner playing short with safety help above may indicate the Cover 2 side. A corner/safety pair matching vertical releases may suggest the quarters side.

MAKE THE CONCEPT FIT
A high-low that targets the Cover 2 flat defender does not necessarily produce the same read on the quarters side. Your offense should define which side is preferred against each response, and when the quarterback is allowed to change it.

AFTER THE SNAP
Confirm the side you selected rather than staring at the entire defense without a read. If the expected flat defender does something different, respond to that action. A split-field defense can disguise its intentions or change with formation and motion.

PRACTICE
Use the diagram to label one half as quarters and the other as a half-field safety structure. Put the same route pair on both sides. Explain why defender responsibilities differ, then describe the first post-snap movement that would confirm your choice.
`,
  "What is the most useful way to approach Cover 6?",
  [
    "Assume all six defenders play deep",
    "Read both sides as identical Cover 3",
    "Identify the combination and apply the correct read to the selected side",
  ],
  2,
  "Split-field coverage can use different rules on each side.",
);
add(
  "pre-snap-checklist",
  "Pre-snap identification: count, locate, communicate",
  "beginner",
  "Defensive recognition",
  null,
  `
BUILD A ROUTINE
A repeatable routine is more useful than guessing a coverage name quickly. Confirm the play and personnel, check the clock and formation, count the box when your offense asks for it, locate the safeties, and identify the protection point and possible extra pressure. Finish with a clear picture of your first read and built-in answer.

USE MOTION PURPOSEFULLY
Motion can change strength, reveal communication, or create a matchup. A defender following a receiver may suggest man coverage, but defenses can bump, exchange or disguise assignments. Treat motion as information that updates your picture.

COMMUNICATE EARLY
Use only the protection and route adjustments your team has installed. A quarterback and receiver making different checks can create an interception even when each thinks he recognized the defense correctly. Repeat the important call clearly; verify that the relevant players heard it.

PRACTICE
Pause a film clip before the snap. In fifteen seconds, say the shell, pressure threat, protection responsibility and first read. Resume the clip and compare prediction with reality. Score yourself on the quality of the routine, not just whether you guessed the label.

YOUTH VERSION
Start with three questions: where is the deep help, who could rush unblocked, and where is my first read? Add complexity gradually with a coach.
`,
  "A defender follows motion. What does that tell you?",
  [
    "It is useful evidence, but not a guarantee of man coverage",
    "The play must be a touchdown",
    "No other checks are needed",
  ],
  0,
  "Defenses can exchange assignments or disguise. Motion adds evidence to the full picture.",
);
add(
  "post-snap-rotation",
  "Post-snap rotations: update the picture",
  "intermediate",
  "Defensive recognition",
  "rotation",
  `
THE PROBLEM
Two safeties show high before the snap. At the snap, one drives toward the flat and the other moves to the deep middle. If you keep reading the original picture, you may throw directly toward the rotating defender.

EYES WITH A JOB
Your first post-snap landmark should match the concept. On a rotation-sensitive read, confirm the relevant safety or flat defender during the drop. Do not try to watch every defender equally. A clear progression gives your eyes a sequence and your feet a rhythm.

WHAT CAN ROTATE
A defense can move from two high to one high, from one high to two high, or disguise a robber entering the middle. The rotation might occur before the snap, immediately after it, or as routes develop. Some movements are run fits rather than a new coverage shell.

PRACTICE
Draw the shell before and after the snap with different colors. Identify the player whose movement matters most to your route combination. Say what his movement takes away and where the play's next answer is located.

ON FILM
Pause just after the snap. Predict the destination of the moving safety, then continue the clip. Check whether your route decision used his destination or only his starting point. A good quarterback changes the hypothesis when the evidence changes.
`,
  "A two-high safety rolls into the flat. What should you avoid?",
  [
    "Updating the read",
    "Throwing from the original shell assumption without locating him",
    "Following your installed progression",
  ],
  1,
  "A rotating defender changes the available space. The pre-snap hypothesis must be confirmed.",
);
add(
  "safety-leverage",
  "Safety leverage: read angle, depth and help",
  "intermediate",
  "Defensive recognition",
  null,
  `
READ MORE THAN DEPTH
A safety's leverage is his position relative to a route and the space he can protect. Depth tells you how much ground he must cover; width and body angle help show which routes he can influence. A safety standing deep is not automatically out of the play.

CONNECT TO YOUR RECEIVER
For a seam, compare the safety's inside/outside position with the receiver's track. For an outside breaking route, consider whether the safety can widen over the top while the corner sinks underneath. A pass must beat both the nearest defender and the next helper's arrival.

DO NOT MANUFACTURE A LOOK-OFF
Advanced quarterbacks may influence a safety with disciplined eyes, but moving your head randomly wastes the route's timing. First learn the correct read and footwork. Add eye manipulation only when it is part of the coached concept and you can still return to the target on time.

PRACTICE
Mark a receiver and a safety on a board. Move the safety two steps wider, then two steps shallower. Explain how each move changes the throwing window. Use a receiver jog-through to connect that picture to the ball's flight.

FILM STANDARD
Was the defender unable to arrive before the ball, or did the throw merely work because he reacted late? Learn from the geometry rather than judging only the result.
`,
  "Why can a deep safety still threaten a throw?",
  [
    "Depth eliminates all safety influence",
    "His width, angle and closing path may still intersect the route",
    "Only the nearest defender matters",
  ],
  1,
  "Safety leverage includes width and arrival angle as well as depth.",
);
add(
  "corner-leverage",
  "Cornerback leverage: release and placement",
  "beginner",
  "Defensive recognition",
  null,
  `
THE STARTING PICTURE
Inside leverage means a corner begins toward the receiver's inside shoulder; outside leverage means he begins toward the sideline side. Press and off describe distance, not the entire coverage. A corner can press and bail into a deep zone or play off while carrying a receiver in man coverage.

MAKE THE READ USEFUL
Ask what the receiver must do to reach the route landmark. Against inside leverage, an inside break may take longer or need a coached release. Against outside leverage, an outside route may be squeezed. The offense's timing must account for that fight.

BALL LOCATION
Place the ball away from the defender when the concept allows it. Do not force a receiver into contact to preserve an imagined perfect spot. On an outside throw, the sideline is another boundary; allow room for a legal catch.

PRACTICE
A partner stands at different leverage points without contact. A receiver walks the release and break. The quarterback identifies the safe shoulder before making a gentle throw. Discuss whether the route still fits the intended timing.

CAUTION
Leverage is a clue about a matchup, not permission to rewrite the route alone. Any adjustment must be understood by both quarterback and receiver under the team's rules.
`,
  "What does “off coverage” tell you by itself?",
  [
    "Exactly which deep zone is being played",
    "How far the corner begins from the receiver",
    "That a short pass is guaranteed open",
  ],
  1,
  "Distance is one clue. Post-snap movement and help determine the actual coverage.",
);
add(
  "linebacker-blitz",
  "Linebackers and blitz recognition",
  "intermediate",
  "Defensive recognition",
  null,
  `
IDENTIFY THE THREATS
Locate the linebackers, slot defenders and possible safety pressure. A defender close to the line can rush, bluff or drop. Count potential threats, then compare them with the protection your team actually has called. Counting alone is not a complete protection plan.

THE PROTECTION POINT
Your offense may identify a particular linebacker as the protection point or “Mike.” That label is an offensive communication tool and does not always name the defense's actual middle linebacker. Learn the assignments that follow the call.

AFTER THE SNAP
Confirm whether the threatened rusher comes. A defender who drops out can replace the space you expected to attack with a quick pass. If the rush comes from a different location, use the team's installed response rather than a route invented after the snap.

PRACTICE
Draw a six-person pressure threat against your protection. Have a coach remove one rusher and drop another into a passing lane. Say who is accounted for, who is not, and where the concept's answer belongs in each version.

DECISION STANDARD
A successful pressure answer is on time, into a clear lane, and understood by the receiver. It is not merely the fastest throw you can make. If the defense wins the play, protect possession and use the legal escape or throwaway options your coach has taught.
`,
  "A linebacker threatens pressure but drops into your planned hot lane. What now?",
  [
    "Throw the hot pass blindly",
    "Assume he cannot intercept it",
    "Confirm the lane and follow the installed alternate answer",
  ],
  2,
  "A bluffing defender may replace the very window you expected the rush to open.",
);
add(
  "slant-flat",
  "Slant/flat: create an underneath conflict",
  "beginner",
  "Passing concepts",
  "slant-flat",
  `
THE STRUCTURE
An inside-breaking slant and a route to the flat create different directions for an underneath defender. Receivers need enough horizontal and vertical spacing that one defender cannot easily cover both. Splits, route depth and timing come from your offense's installation.

READ THE RESPONSE
Some teams teach a leverage or matchup decision before the snap; others key a specific underneath defender after it. Learn which version you are running. If your key widens strongly with the flat route, an inside lane may develop. If he sits inside, the flat can be useful, provided no other defender is driving it.

TIMING
The ball should fit the break, not arrive after the receiver has drifted into another defender. Keep the drop compact when the concept calls for quick rhythm. Check the flat defender and inside help rather than locking onto the slant because it was your first preference.

PRACTICE
Use two receivers and a walking defender. Have the defender widen or settle inside. Call the choice before throwing, then explain the next defender who might affect the catch. Run the same drill from the opposite side so your footwork and vision work both ways.

COMMON ERROR
Both routes settle at the same depth close together. Fix receiver spacing with the coach before asking the quarterback to throw through a nonexistent window.
`,
  "Your assigned underneath key widens with the flat and the inside lane is clear. Which route may benefit?",
  [
    "The slant on its coached timing",
    "Neither route can ever be thrown",
    "A route that was not called",
  ],
  0,
  "The concept can open the inside lane by widening the underneath defender, but other help still matters.",
);
add(
  "stick",
  "Stick: understand the coached sit-or-out rules",
  "beginner",
  "Passing concepts",
  "stick",
  `
THE STRUCTURE
Stick often pairs a short inside-receiver route with a flat route and a vertical outside release. The vertical route helps influence deep coverage while the short routes challenge underneath leverage. Exact spacing and read order differ across offenses.

RECEIVER AGREEMENT
A stick receiver might settle against zone or break away from man leverage. That choice must be a rule both players know. If the quarterback expects a stop while the receiver runs an out, a safe-looking throw can become dangerous.

THE QUARTERBACK READ
Identify the intended underneath key and how the flat route affects him. Confirm that the stick receiver has usable space and that a rotating defender is not arriving from depth. A five-yard completion in rhythm is often better than waiting for an uncovered receiver who will never appear.

PRACTICE
Walk the stick receiver through each coached response. Have the quarterback point to the expected finishing landmark. Only add a ball when both describe the same route. Then add a defender who widens or stays inside.

EVALUATE
Did the receiver create space? Did the quarterback deliver on schedule? Did both use the same coverage rule? Separate those questions instead of labeling every incompletion a bad throw. Concept knowledge is shared knowledge, not a private quarterback prediction.
`,
  "What must be settled before a receiver uses a sit-or-out adjustment?",
  [
    "Both players understand the same installed rule",
    "The receiver improvises without telling anyone",
    "The quarterback always throws to the original spot",
  ],
  0,
  "Shared adjustment rules keep the quarterback and receiver on the same landmark.",
);
add(
  "snag",
  "Snag: spacing the underneath triangle",
  "intermediate",
  "Passing concepts",
  "snag",
  `
THE STRUCTURE
A common snag concept builds a triangle with a short settling route, a flat route and a corner route. The exact receiver distribution changes by formation. The goal is useful spacing around underneath and deeper outside defenders.

READ THE TRIANGLE
Your team may teach a corner-to-flat progression, a specific defender key, or a pre-snap access throw to the snag route. Do not combine pieces from different systems into an uncoached read. Locate the flat defender and the defender above the corner route.

WHEN THE DEFENSE SQUEEZES
If the flat defender drives short, a route behind him may gain space; if he sinks, take the shorter option when clear. The snag receiver should settle in a visible window according to the installed rules, not drift next to the flat receiver.

PRACTICE
Place three cones at the receivers' finishing landmarks. A coach moves a defender between two points. State which space he has left and whether another defender can cover it before the ball arrives. Then walk the receivers through the concept together.

COMMON ERROR
The quarterback tries to force the corner route against deep help because it looks like the biggest gain. The triangle creates options; it does not promise that the deepest route is always available. An on-time short completion keeps the offense in a manageable situation.
`,
  "What makes the snag triangle useful?",
  [
    "All receivers standing close together",
    "Distinct spacing that forces defenders to choose between levels",
    "Always throwing the deepest route",
  ],
  1,
  "Horizontal and vertical separation is what creates the conflict.",
);
add(
  "mesh",
  "Mesh: crossing routes with shared traffic rules",
  "intermediate",
  "Passing concepts",
  "mesh",
  `
THE STRUCTURE
Mesh typically uses two shallow crossers passing near each other, with additional routes controlling deeper or outside space. It can stress man coverage and create underneath windows against zone, but receiver spacing and legal traffic rules are essential.

MAN AND ZONE RESPONSES
A crosser may keep running against man or settle in a zone window under your offense's rules. Both receivers and the quarterback must know those rules. Defenses may pass off crossers, place a low-hole defender in the path, or pressure before the concept develops.

KEEP IT LEGAL
Receivers run their routes; they do not deliberately block or collide with defenders to create a pick. Work with the coach on legal spacing and route paths under the applicable rules.

QUARTERBACK TIMING
Find the first read on time and check the next helper in the crossing lane. A late ball can lead a receiver directly into a defender. If the crosser clears his original man but enters another defender's space, he is not automatically open.

PRACTICE
Walk the crossing paths without contact, then add a stationary zone defender and a trailing man defender separately. Explain which situation asks the receiver to keep moving and which might ask him to settle. Use only the team's installed answers.
`,
  "A crosser has separated from his man but is approaching a low-hole defender. Is the throw automatically available?",
  [
    "Yes; only the original matchup counts",
    "No; check the next defender and timing",
    "Yes; throw harder through him",
  ],
  1,
  "Crossing routes still travel through other defenders’ space.",
);
add(
  "smash",
  "Smash: high-low outside coverage",
  "intermediate",
  "Passing concepts",
  "smash",
  `
THE STRUCTURE
A common smash pairing uses a short outside route beneath a corner route. It is designed to stretch an outside defender vertically, often on the Cover 2 side of a defense. Variations change the short route or who runs the corner.

THE KEY
Read the defender your offense assigns. A corner who squats on the short route may create space behind him, but a deep-half safety can still close over the corner route. If the corner sinks, the short route may be available. Your timing and the safety's width matter as much as the first defender's choice.

PLACEMENT
A corner route near the sideline needs room for the receiver to catch in bounds. Do not float the ball simply because the route is deeper. A short route should be placed so the receiver can secure it and protect himself from a driving defender.

PRACTICE
On the board, move the corner shallow and the safety wide. Explain why the high route still might be capped. Then move the corner deep and locate the short completion. Run the sequence slowly before adding a live read.

DECISION QUALITY
Recognizing “smash versus two high” is not the final answer. The quarterback still has to read actual defender movement and reject a covered throw.
`,
  "The corner squats, but a safety is already over the corner route. What should you do?",
  [
    "Force the high route because the first defender moved",
    "Reject the capped throw and continue the installed answer",
    "Throw without looking at the safety",
  ],
  1,
  "A high-low read does not remove the influence of deep help.",
);
add(
  "flood",
  "Flood: three levels near a sideline",
  "intermediate",
  "Passing concepts",
  "flood",
  `
THE STRUCTURE
Flood concepts place receivers at multiple depths toward one side, often with a deep clear-out, an intermediate outside route and a short flat route. The three levels must stay separated enough that defenders cannot cover two with one movement.

READ WITH THE PLAY
Some flood calls move the quarterback on a rollout; others are thrown from the pocket. The protection, launch point and progression differ. Learn your assigned order instead of assuming every flood call begins with the same receiver.

THE DEFENDER CONFLICT
An underneath outside defender may be stretched between the intermediate and short routes while a deep defender is occupied above. If the underneath defender sinks, the flat may be a useful answer. If he drives down, confirm the intermediate window before taking it.

MOVEMENT DISCIPLINE
On a rollout, keep the route timing in mind. Running farther toward the sideline can shrink your remaining space and change the throwing angle. Do not drift into an edge defender or throw late across your body toward the far middle.

PRACTICE
Draw three route landmarks, then move the flat defender up and down. Add a deep corner to show which route he can still influence. Say your decision with the launch point included: where you are throwing from changes the geometry of the concept.
`,
  "The underneath defender sinks beneath the intermediate route. What can the flood structure offer?",
  [
    "A short flat completion if its lane is clear",
    "A guaranteed throw through the sinking defender",
    "No need to check deep coverage",
  ],
  0,
  "The different depths give the quarterback a shorter answer when the intermediate window is occupied.",
);
add(
  "four-verticals",
  "Four verticals: seams, spacing and safety rules",
  "advanced",
  "Passing concepts",
  "verticals",
  `
THE STRUCTURE
Four vertical releases can stretch deep coverage horizontally. The goal is not four identical straight-line sprints with the quarterback choosing the fastest receiver. Offenses often define seam bends, outside landmarks and route adjustments against different safety structures.

START WITH THE SHELL
A one-high defense and a two-high defense can require different seam decisions. Against match coverage, a defender may carry an inside receiver tightly even when a diagram suggests open grass. Confirm the actual carry and the next helper.

TIMING AND SPACE
Vertical windows are often created by leverage and arrival timing. A quarterback who waits to see a receiver fully beyond everyone can be too late. Conversely, throwing early without confirming a carrying defender is not anticipation; it is guessing.

PRACTICE
Draw four receiver tracks with the correct landmarks from your playbook. Add one middle safety, then two half-field safeties. Explain which defenders must be read and which route adjustments the receivers are permitted to make. Do not invent a bend unless quarterback and receiver share it.

POSSESSION STANDARD
Checkdowns and throwaways can be correct when deep coverage wins. Advanced play means knowing the limit of the concept, not manufacturing a deep attempt every time a vertical call is made.
`,
  "A seam is carried by a matching defender. What does that mean for the diagram’s “open space”?",
  [
    "The receiver must be open because the diagram says so",
    "Only receiver speed matters",
    "Actual match behavior can remove that window",
  ],
  2,
  "Deep-space drawings simplify the game. A defender carrying the route changes the real window.",
);
add(
  "levels",
  "Levels: stretch an underneath defender vertically",
  "intermediate",
  "Passing concepts",
  "levels",
  `
THE STRUCTURE
Levels places in-breaking routes at different depths, often attacking a defender who must choose between a shallow and deeper window. Exact splits, route depths and progression are team-specific. Good spacing prevents a single defender from sitting between both routes.

READ THE MOVEMENT
Identify the relevant hook or inside defender. If he gains depth under the deeper route, a shallower answer may be available. If he drives forward, the deeper route can develop behind him, but only if another defender is not entering that space.

MATCH THE FEET
The deeper route takes longer to arrive. Your drop and permitted hitches must match its development and the protection. Waiting for the deep option beyond the play's timing can turn a sound concept into pressure.

PRACTICE
Use two receivers at distinct landmarks and one walking defender. First call out the defender's action. Then point to the available space. Add a second defender to demonstrate why a one-defender read does not mean ignoring everyone else.

COMMON ERROR
The quarterback sees a shallow route cross his face and immediately throws it even though the installed progression begins deeper. Learn the concept's order, then execute it decisively. A random scan is slower than a defined read.
`,
  "Your key gains depth beneath the deeper in-breaker. Which space may be conceded?",
  [
    "The shallow window below him",
    "A throw directly through his body",
    "Every deep route",
  ],
  0,
  "The vertical stretch can create space underneath when the defender gains depth.",
);
add(
  "curl-flat",
  "Curl/flat: width creates the conflict",
  "beginner",
  "Passing concepts",
  "curl-flat",
  `
THE STRUCTURE
A curl settles in an intermediate window while a flat route stretches a defender toward the sideline. The route depths and settling rules must come from your offense. If the curl drifts too wide or the flat stays too narrow, the conflict disappears.

THE READ
A common version keys the curl-flat defender. If he widens with the flat, the curl can become visible inside. If he sits under the curl, the flat can provide a short gain. A driving corner or rotating safety can change either window, so confirm the whole throwing lane.

ON-TIME DELIVERY
The curl receiver should not have to wait while the quarterback adds several hitches. A late curl pass gives defenders time to squeeze from both sides. The flat may also become dangerous late if a defender begins driving downhill.

PRACTICE
Mark the curl landmark and the flat width with cones. Have a defender move between them. The quarterback says “inside” or “outside,” then makes a controlled throw. Rotate the defender's movement after the snap rather than preselecting the answer every repetition.

REVIEW
Was the receiver spacing correct? Was the key identified correctly? Did the ball leave during the intended rhythm? Use these three questions before changing the concept.
`,
  "The curl-flat defender widens strongly with the flat. What route may gain space inside?",
  [
    "The curl, if the inside lane is clear",
    "The flat regardless of coverage",
    "An unrelated deep post",
  ],
  0,
  "Width can open the intermediate inside window, but nearby help still must be checked.",
);
add(
  "rpo",
  "RPOs: read the assigned conflict, respect the rules",
  "advanced",
  "Passing concepts",
  null,
  `
THE STRUCTURE
A run-pass option combines a run action with a permitted pass decision. Some calls use a pre-snap access decision; others read a particular defender after the snap. Your job is to know which kind is called and exactly who controls the decision.

SHARED RULES
The line, back, receivers and quarterback operate on the same timing. You cannot hold the ball indefinitely while linemen execute a run block. Restrictions on ineligible receivers downfield and other details differ by competition rules; learn the rules your team plays under with your coach.

THE READ
A conflict defender may fit the run or widen to a route. Your offense defines the give/throw response. A defense can exchange responsibilities, add a replacement defender or bluff the picture. Reading an unassigned player can make a correct-looking choice wrong for the play.

PRACTICE
Walk through the mesh without contact. Freeze at the decision point and name the key, his action, the permitted answer and the latest safe release timing. Only then add a ball and receiver. Young quarterbacks should master the exchange before adding a live read.

COMMON ERROR
The quarterback pulls the ball, double clutches and throws late while the run blocking continues. That is not an unlimited second chance. The concept has a decision window; if it is lost, follow the team's coached recovery rules.
`,
  "Why is a delayed RPO throw risky even when a receiver appears open?",
  [
    "Run blocking and rules create a limited decision/release window",
    "RPOs have no timing limits",
    "The quarterback can ignore the installed key",
  ],
  0,
  "The pass decision must fit the run action, protection and applicable rules.",
);
add(
  "reading-progressions",
  "Reading progressions: give your eyes an order",
  "beginner",
  "Quarterback IQ",
  null,
  `
THE GOAL
A progression is a planned sequence of reads, not a command to throw to the first receiver regardless of coverage. Some progressions move receiver to receiver; others read a defender and select between routes. Learn the structure of the actual play.

TIE THE FEET TO THE READ
The drop and hitches set checkpoints for your eyes. If the first window is unavailable at its intended time, move to the next answer with balance. Repeatedly returning to the same covered receiver often costs the protection's remaining time.

DEFINE “OPEN”
A receiver can be visible but not safely available. Consider leverage, the next defender, the ball's travel time and the receiver's route direction. Your coach should help define acceptable windows for your age and ability.

PRACTICE
Use three colored targets. A coach removes the first or second target after the snap. Progress through the assigned order, speaking each decision before the throw. Then replace targets with receivers and actual route timing.

REFLECT
Did you know the first key before the snap? Did you advance when the window closed? Did your feet stay ready at the next target? Faster decisions come from a repeatable sequence, not simply moving your eyes faster across the entire field.
`,
  "Your first read is covered at its scheduled checkpoint. What should guide the next action?",
  [
    "Stay locked on until the rush arrives",
    "Advance through the installed progression with ready feet",
    "Pick a random receiver",
  ],
  1,
  "A defined next answer preserves the play’s timing and keeps the decision organized.",
);
add(
  "timing-anticipation",
  "Timing and anticipation: throw to a developing window",
  "intermediate",
  "Quarterback IQ",
  null,
  `
ANTICIPATION IS EVIDENCE
Anticipation means using route timing, receiver leverage and defender behavior to deliver before the window is visibly large. It does not mean throwing to a spot without confirming what the defense is doing.

WORK BACKWARD
Identify where the receiver should be when he catches the pass. Account for ball travel, then determine when the ball must leave. Match the drop and hitch to that release. Distance, trajectory, weather and the athlete's throwing ability all affect the timing.

RECEIVER AGREEMENT
A route break has a depth, angle and pace. If those change every repetition, the quarterback has to wait for confirmation. Practice the receiver's landmark and the quarterback's rhythm together rather than only throwing stationary targets.

PRACTICE
Walk a short out route. Release as the receiver begins the coached break, using an easy ball and clear space. Add a defender's leverage at walking speed. Reject the throw when the defender already owns the lane; do not turn a timing drill into blind repetition.

FILM REVIEW
Freeze the clip when the ball leaves the hand. Locate the receiver and the defender who could affect the catch. Ask whether the decision came from reliable clues or simply a hopeful prediction. A completed gamble is still a gamble.
`,
  "Which best describes anticipation?",
  [
    "Throwing before reading anything",
    "Using reliable route and defensive clues to deliver on time",
    "Waiting until the receiver stops completely on every route",
  ],
  1,
  "Anticipation combines preparation and confirmation rather than replacing the read.",
);
add(
  "coverage-exercise",
  "Coverage recognition exercise: hypothesis, then proof",
  "intermediate",
  "Quarterback IQ",
  "rotation",
  `
THE EXERCISE
Start with two high safeties and two outside corners. Before the snap, write down at least two possible structures: Cover 2 and quarters are reasonable candidates. Do not force certainty from the shell alone.

CHANGE THE PICTURE
Now move one safety toward the flat and the other toward the middle third. Have both corners gain deep outside depth. Describe the new picture as a likely three-deep rotation, then identify how an underneath matching rule could still affect your concept.

APPLY A PLAY
Place a flat route and an intermediate outside route on the rotating side. Name the defender your play reads, the route he can remove, and the answer behind or below him. A coverage label is useful only when it helps the actual decision.

PRACTICE FORMAT
Use a whiteboard, pause a film clip, or have teammates walk the alignments without contact. One player describes the pre-snap hypothesis; another reveals the post-snap movement. Switch roles after three examples. Correct the explanation, not just the label.

SELF-SCORE
Award yourself one point for identifying a plausible shell, one for tracking the rotation, and one for naming the relevant concept key. The learning portal quiz records the scenario answer separately; these practice points are a reflection tool rather than a certified performance rating.
`,
  "Two high safeties rotate to one middle safety, with corners gaining outside thirds. What is the strongest conclusion?",
  [
    "The original Cover 2 guess must still be right",
    "A three-deep structure is plausible; confirm underneath rules",
    "The shell reveals no useful information at any time",
  ],
  1,
  "Post-snap movement updates the hypothesis. You still need the underneath response to read the play.",
);
add(
  "pressure-hot-routes",
  "Pressure answers and hot routes: shared, not improvised",
  "intermediate",
  "Quarterback IQ",
  null,
  `
WHAT “HOT” MEANS
A hot answer is an installed response when protection cannot account for a particular threat. It is not permission to throw quickly to any receiver. Some protections handle the threat by changing assignments; some plays use a route adjustment; some calls require a different check before the snap.

BEFORE THE SNAP
Know the protection, the possible unblocked defender and which receiver shares the answer. If the offense allows a check, communicate it using the exact team language. A receiver cannot react to a quarterback's private assumption.

AFTER THE SNAP
Confirm that the threat actually rushes and that the passing lane is clear. A dropping defender can replace the expected hot window. If the protection handles the rush, the quarterback may stay with the original progression under the play's rules.

PRACTICE
Draw the same pressure look three ways: full rush, a bluff dropping into the quick lane, and a protection adjustment that accounts for the threat. Explain why one preselected throw is not correct in all three cases.

YOUTH PRIORITY
Begin with simple shared rules, secure exchanges and clear communication. Do not overload an athlete with several unpracticed checks. Reliability is more valuable than a long list of terms the team cannot execute together.
`,
  "What makes a pressure answer dependable?",
  [
    "The quarterback invents it after the snap",
    "Both quarterback and receiver know the rule, and the threat/lane are confirmed",
    "It is always the shortest route",
  ],
  1,
  "A hot answer requires shared rules plus confirmation of the actual rush and lane.",
);
add(
  "red-zone",
  "Red-zone decisions: compressed space, protected possession",
  "intermediate",
  "Quarterback IQ",
  null,
  `
THE FIELD CHANGES
Near the goal line, defenders have less deep space to protect and can drive underneath routes quickly. A window that worked at midfield may close faster. Route spacing, timing and ball placement become especially important.

KNOW THE SITUATION
Track the down, distance, score and remaining time. A modest completion can be valuable; a forced interception can remove a scoring chance. Do not assume every red-zone snap requires a touchdown throw.

LEVERS TO WATCH
Locate inside help, safety depth and defenders who can undercut quick routes. A fade is a matchup and placement decision, not a guaranteed answer to tight coverage. Follow the team's progression and receiver adjustment rules.

PRACTICE
Move a familiar concept close to an imaginary end line. Draw the same defenders with less depth available. Identify which windows shrink, where the receiver must catch in bounds, and when a legal throwaway or next answer protects the possession.

REVIEW
Grade the decision before the result: was the target available at the ball's arrival time? Did the throw expose the receiver to unnecessary contact? Did you preserve the team's scoring opportunity? The offense can live to run another play when the quarterback refuses a low-quality attempt.
`,
  "Why can underneath windows close faster near the goal line?",
  [
    "Defenders have less deep space to defend and can compress routes",
    "The defense must stop covering receivers",
    "Every throw is automatically safer",
  ],
  0,
  "The shortened field changes defenders’ spacing and closing paths.",
);
add(
  "two-minute",
  "Two-minute offense: manage the clock and the next snap",
  "advanced",
  "Quarterback IQ",
  null,
  `
START WITH THE STATE
Know the score, time remaining, timeouts, down, distance and needed scoring result. A team needing a field goal has different priorities from one needing a touchdown. The quarterback should be able to state the situation before the play call.

GET THE OFFENSE ORGANIZED
Communicate the play, formation and clock plan clearly. A completed pass is not the end of your job: know whether to hurry to the next snap, use a timeout, or follow the team's clock-stopping instruction. Do not assume the clock rules are identical across youth, high school and other levels.

SIDELINE AND MIDDLE
Sideline throws can help the clock plan when completed in bounds or out under the applicable rules, but forcing a low-percentage sideline ball is not automatically better than a safe middle completion with time to reset. The decision depends on the full situation.

PRACTICE
Run a walk-through with a visible clock and a coach acting as the official. Pause after each play and state the next action. Include a completion in the middle, a sack, an incompletion and a penalty. Practice communication before adding speed.

AVOID
Do not spike, intentionally ground, or assume a clock stoppage without knowing the rules and the team's instruction. A rushed decision can waste a down or end the possession. Situational preparation creates calm under time pressure.
`,
  "What should determine your clock-management choice after a completion?",
  [
    "Only whether the pass gained yards",
    "The score, clock, timeouts, down and applicable rules",
    "Always spike regardless of time or down",
  ],
  1,
  "Clock decisions depend on the entire game state, not a single automatic rule.",
);
add(
  "situational-football",
  "Situational football: down, distance and risk",
  "beginner",
  "Quarterback IQ",
  null,
  `
BEFORE YOU READ COVERAGE
State the down and distance. Know the first-down marker, score, field position and time. These details affect how much risk is justified and what a useful completion looks like.

SHORT OF THE MARKER
A checkdown on third down can be useful if the receiver has realistic space to reach the marker. It is not automatically correct or incorrect simply because the catch point is short. Compare the defender's leverage and pursuit with the receiver's chance to gain the remaining yards.

WHEN THE DEFENSE WINS
A sack, scramble, legal throwaway and forced pass each have consequences. Learn your team's priorities and the applicable throwing-away rules. Protecting possession often creates a better next situation than trying to rescue every call with an unlikely throw.

PRACTICE
Use the same coverage drawing for first-and-ten, third-and-short, and fourth down with time nearly gone. Describe how the available routes stay the same while the acceptable risk can change. Keep the coach's play call and game plan central.

REFLECT
Separate decision quality from outcome. A well-read pass can be dropped; a poor decision can be caught. Write one sentence explaining the situation and one explaining why the chosen throw fit it. This habit builds a useful film vocabulary without blaming teammates.
`,
  "How should you judge a third-down checkdown caught short of the marker?",
  [
    "It is always wrong",
    "Consider whether the receiver has a realistic path to the needed yards",
    "It is always right",
  ],
  1,
  "The pursuit and remaining space determine whether the short catch can achieve the play’s objective.",
);
add(
  "warmups",
  "A progressive warmup before quarterback work",
  "beginner",
  "Athlete development",
  null,
  `
PURPOSE
Prepare for the session gradually rather than beginning with hard throws. A warmup should fit the athlete, weather, available space and the coach's training plan. It is preparation, not a conditioning test that leaves the athlete exhausted before skill work.

A SIMPLE ORDER
Begin with easy movement such as a walk progressing to a light jog. Add comfortable joint movement, controlled marching and gentle changes of direction. Rehearse the footwork that the session will use. Start ball work with easy catches and short relaxed throws before increasing distance or pace.

KEEP IT CONTROLLED
Choose movements the athlete can perform without pain. Avoid forcing end ranges or copying a teammate's maximum stretch. Younger athletes benefit from simple instructions and short blocks with attention to movement quality.

PRACTICE
Before the next session, explain the warmup's order to a parent or coach. Identify one movement for general readiness, one for controlled lower-body movement, and one for easy throwing preparation. Ask the coach how to adjust the sequence after a game or a long travel day.

CHECK-IN
If an athlete feels pain, unusual weakness or dizziness, stop and tell the supervising adult. Warmup discomfort is not something to hide to earn more repetitions. The day's readiness should shape the work that follows.
`,
  "What is the main goal of a pre-throwing warmup?",
  [
    "Maximum fatigue",
    "Gradual preparation for the session’s demands",
    "Start with the longest possible throw",
  ],
  1,
  "A warmup prepares movement and throwing progressively without exhausting the athlete first.",
);
add(
  "stretching",
  "Stretching: comfortable range, never forced range",
  "beginner",
  "Athlete development",
  null,
  `
UNDERSTAND THE TOOL
Stretching can be one part of a preparation or recovery routine. It is not a cure for every movement problem and does not replace coaching, strength development or recovery. Choose positions appropriate for the athlete's age and current ability.

BEFORE A SESSION
Controlled moving exercises can help an athlete rehearse the range needed for footwork and throwing. Keep movements smooth and comfortable. A long, aggressive hold immediately before an explosive task is not a universal requirement; follow the session plan your coach gives you.

AFTER A SESSION
Gentle positions may feel useful during a gradual cooldown. Breathe normally and avoid bouncing or a partner pushing a limb farther. The goal is a comfortable position, not winning a flexibility contest.

PRACTICE
With adult supervision, select two comfortable positions the athlete already knows. Describe where mild tension is felt and distinguish that from sharp pain, numbness or joint discomfort. Stop if those warning sensations appear and tell the supervising adult.

REFLECTION
Write down which movements felt comfortable and whether they changed after training. Share recurring pain or restricted movement with a qualified professional instead of trying to solve it by stretching harder. More range is useful only when the athlete can control it safely.
`,
  "A partner offers to push your shoulder farther into a stretch that hurts. What should you do?",
  [
    "Ask for more force",
    "Stop and tell the supervising adult",
    "Ignore the pain",
  ],
  1,
  "Stretching should not be forced through pain. Stop and get appropriate guidance.",
);
add(
  "mobility",
  "Mobility: control the range you use",
  "beginner",
  "Athlete development",
  null,
  `
THE DIFFERENCE
Flexibility describes available range; mobility includes your ability to control movement through it. A quarterback needs usable positions for stance, stepping, rotation and deceleration, not just impressive-looking stretches.

QUALITY FIRST
Use slow, comfortable movements with a stable trunk and normal breathing. A small controlled motion is more useful than a large uncontrolled one. If an athlete compensates by twisting somewhere else or losing balance, reduce the range and ask the coach for a simpler version.

CONNECT TO FOOTBALL
Practice a gentle split-stance weight shift, a controlled step and a balanced reset without throwing. Notice whether the front knee, hip and trunk stay organized. The aim is readiness for a task, not diagnosing an injury from a video.

PRACTICE
Choose one movement your coach has approved and perform a few slow repetitions on each side. Stop before fatigue changes the motion. Record whether you could maintain balance and direction; do not measure success only by distance traveled.

RECOVERY CONTEXT
Sleep, workload and previous activity can change how an athlete moves on a given day. A stiff day is not a reason to force range or double the routine. Adjust the session with the coach and communicate symptoms early.
`,
  "Which is the better mobility repetition?",
  [
    "A smaller controlled movement without pain",
    "The largest possible movement even if balance is lost",
    "A forced position held through sharp discomfort",
  ],
  0,
  "Useful mobility combines comfortable range with control.",
);
add(
  "footwork-routine",
  "A short footwork routine with a clear purpose",
  "beginner",
  "Athlete development",
  null,
  `
CHOOSE A TARGET
Pick one skill for the block: a balanced catch-and-set, a controlled climb, or a directional reset. Avoid combining every drill you know into an exhausting circuit. The routine should reinforce the timing of actual plays.

THREE STAGES
First rehearse without a ball at walking speed. Next receive a gentle toss and make the same movement with two-hand control. Finally add a short throw to a receiver on an agreed landmark. Keep the total work appropriate for the athlete's wider team schedule.

A COACHING CHECK
At the end of each stage, ask whether the athlete can stop balanced, keep eyes up and explain where the throw belongs. If the answer is no, simplify rather than speeding up. Cones guide movement; they should not teach staring at the ground.

PRACTICE
Use two starting points and one target. Perform three quality repetitions at one point, reset, then try the other. Take a short rest and discuss one thing to repeat and one thing to improve. A younger athlete can omit throwing and focus on the catch.

TRANSFER
Finish with the same footwork in a walk-through of a real concept. A drill earns its place when it helps the athlete execute a play, not merely because it looks fast on video.
`,
  "When a footwork drill becomes sloppy, what is the best immediate adjustment?",
  [
    "Add more speed",
    "Simplify and restore balanced movement",
    "Continue until exhaustion",
  ],
  1,
  "Quality and transfer matter more than speed or volume.",
);
add(
  "development-plan",
  "Build a development plan you can actually follow",
  "intermediate",
  "Athlete development",
  null,
  `
START WITH EVIDENCE
Choose one technical priority and one decision-making priority with your coach. Use a short film clip or a consistent drill to describe the starting point. “Get better at everything” is too broad to guide a week.

MAKE IT SMALL
A technical goal might be resetting without dropping the eyes. A decision goal might be naming the assigned flat defender before a concept. Define an observable success, a manageable practice block and a date to review it. Goals should fit school, team practices, games, rest and family time.

REVIEW WITHOUT BLAME
At the review, compare similar repetitions rather than selecting only the best highlight. Ask what improved, what stayed inconsistent and whether the task was appropriate. Adjust the plan instead of adding punishment for a slow learning week.

PRACTICE
Write a seven-day plan with training and rest already marked. Add one short learning block and one coach-approved movement block. Discuss the total throwing load with the coach before adding private work on top of team sessions.

OWNERSHIP
The athlete should be able to explain the plan in simple language. A parent can support scheduling and recovery, while the coach helps select and evaluate the skills. Sustainable development comes from consistent appropriate work, not from making every day a test.
`,
  "Which is the most useful weekly development goal?",
  [
    "Improve everything immediately",
    "Reset with eyes up on a defined, coached drill and review it next week",
    "Throw the maximum number of balls each day",
  ],
  1,
  "A specific observable goal makes practice and review meaningful.",
);
add(
  "age-appropriate",
  "Age-appropriate training and a healthy workload",
  "beginner",
  "Athlete development",
  null,
  `
DEVELOP THE ATHLETE
Youth and high school quarterbacks are not smaller copies of professionals. Coordination, growth, experience and overall workload vary. Training should match the individual rather than a rigid social-media schedule.

YOUNGER ATHLETES
Prioritize fun, secure exchanges, balanced movement and simple decisions. Use an appropriate ball and distances the athlete can manage without strain. Short instruction followed by a few quality repetitions is often more useful than a long lecture or an endurance throwing contest.

HIGH SCHOOL ATHLETES
Coordinate skill work with team practice, games, strength training and other sports. More tactical detail can be useful when the fundamentals are understood, but complexity should not replace recovery or sound communication.

FAMILY COMMUNICATION
Share the whole weekly activity schedule with the coach. Report pain, fatigue and changes in movement honestly. There is no single throw-count or strength plan suitable for every athlete; qualified supervision and the athlete's response matter.

PRACTICE
Before adding an extra session, list all practices, games, throws and other training from the previous week. Discuss where recovery fits. Set a goal based on learning or movement quality, not comparing the athlete's physical development with an older teammate.
`,
  "Before adding private throwing work during a busy team week, what should happen?",
  [
    "Ignore the team workload",
    "Coordinate the total workload and recovery with the coach",
    "Copy a professional athlete’s routine exactly",
  ],
  1,
  "Training should account for the athlete’s age, readiness and all other activity.",
);
add(
  "film-study",
  "Film study: explain the decision before the result",
  "advanced",
  "Quarterback IQ",
  null,
  `
A REPEATABLE REVIEW
Choose a small set of plays rather than scrolling through highlights. For each play, write the situation, expected read, actual defensive response and chosen answer. Separate what you knew before the snap from what became visible afterwards.

FREEZE THREE TIMES
Pause before the snap to describe the hypothesis. Pause as the drop finishes to locate the key defender. Pause when the ball leaves to evaluate the lane and timing. Only then watch the catch or incompletion.

USE NEUTRAL LANGUAGE
“Late to the second window” is more useful than “bad quarterback.” “Receiver and quarterback used different adjustment rules” identifies a communication problem without blaming a teammate. Good review produces a correction you can practice.

PRACTICE
Select three plays: a completion, an incompletion and a checkdown. Give each a decision explanation in two sentences. Ask the coach whether your key and timing match the play's installation. A completed risky throw should still be discussed as risky.

NEXT SESSION
Turn one observation into a specific practice task. For example, reproduce the relevant safety rotation on a board, then walk the read at controlled speed. Film study becomes valuable when it changes the next repetition, not when it merely produces more terminology.
`,
  "Why pause film before watching the final result?",
  [
    "To avoid learning the outcome",
    "To judge the available information and decision independently of the catch",
    "Because completions never need review",
  ],
  1,
  "Decision quality and outcome are different. A completion can hide a poor read and a drop can hide a sound one.",
);
add(
  "advanced-leverage",
  "Advanced scenario: leverage changes after the snap",
  "advanced",
  "Quarterback IQ",
  "cover6",
  `
THE SCENARIO
You expect a short outside defender to sit on a flat route, creating an intermediate window behind him. At the snap, that defender gains depth while a safety drives toward the outside. Your original high-low picture is changing from two directions.

REASON THROUGH IT
First identify the concept's assigned key. Notice that he has not made the movement you hoped for. Then locate the rotating safety's destination. A receiver running through space the safety is about to occupy may only appear open for an instant.

KEEP THE PROGRESSION
Do not add a new route or change your receiver's assignment with a late gesture. Continue to the installed next answer while your feet stay organized. If the protection clock expires, use the team's safe recovery decision rather than forcing the original throw.

BOARD PRACTICE
Draw the defense twice: before the snap and at the drop's final step. Mark the ball's flight path, not just the receiver's location. Explain whether the defender can intersect that path before arrival. Have a partner change one defender and repeat the explanation.

SUCCESS STANDARD
An advanced response is conditional: “If the key sinks and the safety drives outside, I reject this window and move to our next answer.” It is more useful than naming a coverage and assuming the route is always open against it.
`,
  "Your expected high-low key sinks while another defender drives into the next window. What is the sound response?",
  [
    "Force the original answer because it was planned",
    "Read the actual movement and continue the installed progression",
    "Invent a receiver adjustment after releasing the ball",
  ],
  1,
  "A progression must respond to current leverage. Preparation creates options, not a guarantee that the first window will open.",
);
export const curriculum: readonly CurriculumLesson[] = lessons;

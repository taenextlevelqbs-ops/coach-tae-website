import Intro from "./intro";

const SHOP_URL = "https://YOUR-SHOPIFY-STORE.myshopify.com";

const INDIVIDUAL_BOOKING_URL =
  "https://calendly.com/taenextlevelqbs/individual-training-clone";

const GROUP_BOOKING_URL =
  "https://calendly.com/taenextlevelqbs/training";

const trainingFocus = [
  "Throwing Mechanics",
  "Footwork",
  "Pocket Movement",
  "Coverage Recognition",
  "Decision Making",
  "Film & Football IQ",
];

export default function Home() {
  return (
    <>
      <Intro />

      <main className="min-h-screen bg-black text-white">
        {/* GLOBAL BACKGROUND */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:42px_42px]" />

          <div className="absolute left-[-150px] top-[250px] h-[350px] w-[350px] rounded-full bg-sky-500/[0.06] blur-[120px]" />

          <div className="absolute right-[-200px] top-[1200px] h-[420px] w-[420px] rounded-full bg-white/[0.04] blur-[130px]" />
        </div>

        {/* NAVIGATION */}
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-8">
            <a
              href="#"
              className="text-xl font-black tracking-[0.18em] md:text-2xl"
            >
              COACH TAE
            </a>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-white/65 md:gap-7 md:text-sm">
              <a href="#training" className="transition hover:text-white">
                Training
              </a>

              <a href="#about" className="transition hover:text-white">
                About
              </a>

              <a href="#attack" className="transition hover:text-white">
                DMV Attack
              </a>

              <a href="#foundation" className="transition hover:text-white">
                Foundation
              </a>

              <a href="#apparel" className="transition hover:text-white">
                Apparel
              </a>

              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-white transition hover:bg-white hover:text-black"
              >
                Shop
              </a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="px-6 py-8 md:px-8 md:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="relative min-h-[650px] overflow-hidden rounded-[32px] border border-white/10">
              <img
                src="/QbGroupTraining.jpeg"
                alt="Coach Tae quarterback group training"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:42px_42px]" />

              <div className="relative z-10 flex min-h-[650px] flex-col justify-between p-8 md:p-12 lg:p-16">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="h-[1px] w-10 bg-white/50" />

                    <p className="text-[10px] font-black tracking-[0.38em] text-white/60">
                      QUARTERBACK DEVELOPMENT // DMV
                    </p>
                  </div>

                  <h1 className="mt-8 text-6xl font-black leading-[0.86] tracking-[-0.05em] md:text-8xl lg:text-9xl">
                    TRAIN.
                    <br />
                    DEVELOP.
                    <br />
                    <span className="text-white/65">COMPETE.</span>
                  </h1>

                  <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/80 md:text-xl">
                    Quarterback development, competitive 7v7 football,
                    mentorship, and athlete development throughout the DMV.
                  </p>
                </div>

                <div className="mt-14 flex flex-col justify-between gap-8 border-t border-white/20 pt-8 md:flex-row md:items-end">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href="#training"
                      className="rounded-full bg-white px-7 py-3 text-center font-bold text-black transition hover:scale-[1.02]"
                    >
                      Train With Coach Tae →
                    </a>

                    <a
                      href="#attack"
                      className="rounded-full border border-white/30 bg-black/20 px-7 py-3 text-center font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-black"
                    >
                      DMV Attack 7v7
                    </a>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black tracking-[0.3em] text-white/50">
                      COACH TAE // QB DEVELOPMENT
                    </p>

                    <p className="mt-2 text-sm font-bold text-white/70">
                      Northern Virginia • DMV
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRAINING */}
        <section id="training" className="px-6 py-10 md:px-8 md:py-14">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[32px] border border-white/10">
              <img
                src="/Tae_Training.jpeg"
                alt="Coach Tae quarterback training"
                className="h-auto w-full"
              />
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 md:p-12">
              <p className="text-[10px] font-black tracking-[0.35em] text-white/35">
                TRAINING // QB DEVELOPMENT
              </p>

              <h2 className="mt-5 text-4xl font-black leading-[0.95] tracking-[-0.03em] md:text-6xl">
                Build the
                <br />
                Complete
                <br />
                Quarterback.
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/65 md:text-lg">
                Training focused on mechanics, footwork, accuracy,
                decision making, coverage recognition, football IQ,
                pocket movement, and game-specific quarterback situations.
              </p>

              <div className="mt-9 grid gap-4 sm:grid-cols-2">
                <a
                  href={GROUP_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-black/20 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.04]"
                >
                  <p className="text-[9px] font-black tracking-[0.25em] text-white/30">
                    SESSION // 01
                  </p>

                  <p className="mt-4 text-lg font-black">GROUP TRAINING</p>

                  <p className="mt-4 text-4xl font-black">$60</p>

                  <div className="my-4 h-[1px] bg-white/10" />

                  <p className="text-sm text-white/45">
                    Per athlete • 1 hour
                  </p>

                  <p className="mt-5 text-xs font-black tracking-[0.15em] text-white/60 transition group-hover:text-white">
                    BOOK GROUP →
                  </p>
                </a>

                <a
                  href={INDIVIDUAL_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-black/20 p-6 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.04]"
                >
                  <p className="text-[9px] font-black tracking-[0.25em] text-white/30">
                    SESSION // 02
                  </p>

                  <p className="mt-4 text-lg font-black">
                    PRIVATE TRAINING
                  </p>

                  <p className="mt-4 text-4xl font-black">$85</p>

                  <div className="my-4 h-[1px] bg-white/10" />

                  <p className="text-sm text-white/45">
                    1-on-1 • 1 hour
                  </p>

                  <p className="mt-5 text-xs font-black tracking-[0.15em] text-white/60 transition group-hover:text-white">
                    BOOK PRIVATE →
                  </p>
                </a>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-6">
                <p className="text-[9px] font-black tracking-[0.25em] text-white/30">
                  PACKAGE // 03
                </p>

                <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xl font-black">
                      3 Individual Sessions
                    </p>

                    <p className="mt-1 text-sm text-white/45">
                      $80 per session
                    </p>
                  </div>

                  <p className="text-4xl font-black">$240</p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {trainingFocus.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/60"
                  >
                    <span className="text-[9px] font-black text-white/25">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={INDIVIDUAL_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-7 py-3 text-center font-bold text-black transition hover:scale-[1.02]"
                >
                  Book Private Training →
                </a>

                <a
                  href={GROUP_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-7 py-3 text-center font-bold text-white transition hover:bg-white hover:text-black"
                >
                  Book Group Training →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="px-6 py-10 md:px-8 md:py-14">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="grid gap-5">
              <div className="overflow-hidden rounded-[32px] border border-white/10">
                <img
                  src="/College.jpeg"
                  alt="Coach Tae college quarterback"
                  className="h-auto w-full"
                />
              </div>

              <div className="overflow-hidden rounded-[32px] border border-white/10">
                <img
                  src="/Tae_Sideline.jpeg"
                  alt="Coach Tae coaching on the sideline"
                  className="h-auto w-full"
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 md:p-12">
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-8 bg-white/30" />

                <p className="text-[10px] font-black tracking-[0.35em] text-white/35">
                  ABOUT // COACH TAE
                </p>
              </div>

              <h2 className="mt-6 text-4xl font-black leading-[0.95] tracking-[-0.03em] md:text-6xl">
                Player.
                <br />
                Coach.
                <br />
                Trainer.
                <br />
                <span className="text-white/35">Founder.</span>
              </h2>

              <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/65 md:text-lg">
                Former college quarterback turned quarterback coach,
                trainer, mentor, DMV Attack 7v7 co-founder, and DMV Attack
                Foundation founder.
              </p>

              <div className="mt-9 grid gap-x-8 gap-y-4 text-sm text-white/55 md:grid-cols-2">
                <div className="border-b border-white/10 pb-3">
                  Former Fairmont State University Quarterback
                </div>

                <div className="border-b border-white/10 pb-3">
                  NCAA Passing Efficiency Leader
                </div>

                <div className="border-b border-white/10 pb-3">
                  Elite 11 Regional Quarterback
                </div>

                <div className="border-b border-white/10 pb-3">
                  Loudoun County Athletic Hall of Fame
                </div>

                <div className="border-b border-white/10 pb-3">
                  High School Quarterback Coach
                </div>

                <div className="border-b border-white/10 pb-3">
                  DMV Attack 7v7 Co-Founder
                </div>

                <div className="border-b border-white/10 pb-3">
                  DMV Attack Foundation Founder
                </div>
              </div>

              <div className="mt-10">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.3em] text-white/30">
                      CAREER // DATA
                    </p>

                    <p className="mt-2 text-xs font-bold tracking-wider text-white/50">
                      FAIRMONT STATE UNIVERSITY
                    </p>
                  </div>

                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="h-2 w-2 rounded-full bg-white/50" />

                    <p className="text-[9px] tracking-[0.2em] text-white/25">
                      COLLEGE CAREER
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-[9px] font-black tracking-[0.25em] text-white/25">
                      01
                    </p>

                    <p className="mt-3 text-3xl font-black md:text-4xl">
                      55
                    </p>

                    <div className="mt-4 h-[2px] w-8 bg-white/40" />

                    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Total TDs
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-[9px] font-black tracking-[0.25em] text-white/25">
                      02
                    </p>

                    <p className="mt-3 text-3xl font-black md:text-4xl">
                      178.3
                    </p>

                    <div className="mt-4 h-[2px] w-8 bg-white/40" />

                    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Efficiency
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-[9px] font-black tracking-[0.25em] text-white/25">
                      03
                    </p>

                    <p className="mt-3 text-3xl font-black md:text-4xl">
                      5,683
                    </p>

                    <div className="mt-4 h-[2px] w-8 bg-white/40" />

                    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Pass Yards
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                    <p className="text-[9px] font-black tracking-[0.25em] text-white/25">
                      04
                    </p>

                    <p className="mt-3 text-3xl font-black md:text-4xl">
                      #1
                    </p>

                    <div className="mt-4 h-[2px] w-8 bg-white/40" />

                    <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
                      NCAA Efficiency
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DMV ATTACK */}
        <section id="attack" className="px-6 py-10 md:px-8 md:py-14">
          <div className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-white/[0.03] p-8 md:p-12">
            <div className="mb-10 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end">
              <div>
                <p className="text-[10px] font-black tracking-[0.35em] text-white/35">
                  DMV ATTACK // 7V7
                </p>

                <h2 className="mt-4 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.03em] md:text-6xl">
                  Development.
                  <br />
                  Competition.
                  <br />
                  <span className="text-white/35">Opportunity.</span>
                </h2>
              </div>

              <p className="max-w-sm text-sm leading-relaxed text-white/45">
                Competitive football built around athlete development,
                relationships, exposure, and learning how to compete.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <div className="overflow-hidden rounded-[28px] border border-white/10">
                  <img
                    src="/Tae_DMVAttack.jpeg"
                    alt="DMV Attack development"
                    className="h-auto w-full transition duration-500 hover:scale-[1.01]"
                  />
                </div>

                <div className="mt-4">
                  <p className="text-[9px] font-black tracking-[0.28em] text-white/30">
                    DEVELOPMENT // 01
                  </p>

                  <p className="mt-2 text-xl font-black">
                    Develop Your Game.
                  </p>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-[28px] border border-white/10">
                  <img
                    src="/Tae_DMVAttack2.jpeg"
                    alt="DMV Attack competition"
                    className="h-auto w-full transition duration-500 hover:scale-[1.01]"
                  />
                </div>

                <div className="mt-4">
                  <p className="text-[9px] font-black tracking-[0.28em] text-white/30">
                    COMPETITION // 02
                  </p>

                  <p className="mt-2 text-xl font-black">
                    Attack the Opportunity.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[28px] border border-white/10">
                <img
                  src="/TaeCoach7v7.jpeg"
                  alt="Coach Tae coaching DMV Attack"
                  className="h-auto w-full"
                />
              </div>

              <div className="overflow-hidden rounded-[28px] border border-white/10">
                <img
                  src="/DMVAttackVideo.jpeg"
                  alt="DMV Attack football"
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDATION + APPAREL */}
        <section className="px-6 py-10 md:px-8 md:py-14">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            <div
              id="foundation"
              className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-8 md:p-12"
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-[250px] w-[250px] rounded-full bg-white/[0.04] blur-[90px]" />

              <p className="relative text-[10px] font-black tracking-[0.35em] text-white/35">
                FOUNDATION // COMMUNITY
              </p>

              <div className="relative mt-8 flex justify-center">
                <img
                  src="/DMVAttackLogo1.jpeg"
                  alt="DMV Attack Foundation"
                  className="h-auto w-full max-w-[320px] rounded-3xl"
                />
              </div>

              <div className="relative mt-9">
                <h2 className="text-4xl font-black leading-[0.95] md:text-5xl">
                  DMV Attack
                  <br />
                  Foundation
                </h2>

                <p className="mt-6 text-base leading-relaxed text-white/60 md:text-lg">
                  Supporting youth athletes through mentorship,
                  development, community initiatives, resources,
                  and opportunities beyond football.
                </p>

                <div className="mt-8 border-t border-white/10 pt-6">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-white/30">
                    Founder
                  </p>

                  <p className="mt-2 text-2xl font-black">Coach Tae</p>
                </div>
              </div>
            </div>

            <div
              id="apparel"
              className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 md:p-12"
            >
              <p className="text-[10px] font-black tracking-[0.35em] text-white/35">
                APPAREL // DMV ATTACK
              </p>

              <h2 className="mt-4 text-4xl font-black md:text-5xl">
                Shop the Brand.
              </h2>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <img
                  src="/DMVAttackApparel.jpeg"
                  alt="DMV Attack apparel"
                  className="h-auto w-full rounded-3xl"
                />

                <img
                  src="/DMVAttackApparel2.jpeg"
                  alt="DMV Attack apparel"
                  className="h-auto w-full rounded-3xl"
                />
              </div>

              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-bold text-black transition hover:scale-[1.02]"
              >
                Shop DMV Attack →
              </a>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="px-6 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-9 text-center md:p-16">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-[100px]" />

              <div className="relative">
                <p className="text-[10px] font-black tracking-[0.35em] text-white/35">
                  BOOK // COACH TAE
                </p>

                <h2 className="mt-5 text-4xl font-black md:text-6xl">
                  Ready to Get Better?
                </h2>

                <p className="mx-auto mt-6 max-w-xl leading-relaxed text-white/55">
                  Choose your training option and book an available
                  Sunday session directly online.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <a
                    href={INDIVIDUAL_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white px-8 py-4 font-bold text-black transition hover:scale-[1.02]"
                  >
                    Book Private →
                  </a>

                  <a
                    href={GROUP_BOOKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/20 px-8 py-4 font-bold text-white transition hover:bg-white hover:text-black"
                  >
                    Book Group →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 px-6 py-10 md:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-center md:flex-row md:items-center md:text-left">
            <div>
              <p className="font-black tracking-[0.18em]">COACH TAE</p>

              <p className="mt-2 text-[10px] tracking-[0.28em] text-white/25">
                TRAIN // DEVELOP // COMPETE
              </p>
            </div>

            <p className="text-xs text-white/25">
              © 2026 Coach Tae. All Rights Reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
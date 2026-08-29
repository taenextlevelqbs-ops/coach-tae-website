export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between border-b border-white/10 px-8 py-6">
        <h2 className="text-2xl font-bold tracking-widest">
          COACH TAE
        </h2>

        <div className="flex gap-6 text-sm">
          <a href="#training" className="hover:opacity-70">
            Coach Tae Training
          </a>

          <a href="#7v7" className="hover:opacity-70">
            DMV Attack 7v7
          </a>

          <a href="#about" className="hover:opacity-70">
            About
          </a>

          <a href="#apparel" className="hover:opacity-70">
            Apparel
          </a>
        </div>
      </nav>

      <section
        className="relative flex min-h-[85vh] flex-col items-center justify-center bg-cover bg-center px-6 text-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.8)), url('/Tae_Sideline.jpeg')",
        }}
      >
        <p className="mb-4 text-sm font-semibold tracking-[0.35em]">
          COACH TAE
        </p>

        <h1 className="max-w-5xl text-5xl font-black tracking-tight md:text-7xl">
          TRAIN. DEVELOP. COMPETE.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-white/80">
          Quarterback training, competitive 7v7 football,
          and apparel in the DMV.
        </p>

        <div className="mt-8 flex gap-4">
          <a
            href="#training"
            className="rounded-md bg-white px-6 py-3 font-semibold text-black"
          >
            Book Training
          </a>

          <a
            href="#7v7"
            className="rounded-md border border-white px-6 py-3 font-semibold"
          >
            DMV Attack
          </a>
        </div>
      </section>

      <section
        id="training"
        className="grid gap-10 border-t border-white/10 px-8 py-20 md:grid-cols-2 md:items-center"
      >
        <div>
          <p className="text-sm tracking-widest text-white/50">
            QUARTERBACK DEVELOPMENT
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            Coach Tae Training
          </h2>

          <p className="mt-4 max-w-xl text-white/70">
            Individual and group quarterback training focused on
            mechanics, footwork, decision making, confidence,
            and complete quarterback development.
          </p>

          <button className="mt-8 rounded-md bg-white px-6 py-3 font-semibold text-black">
            Book Training
          </button>
        </div>

        <img
          src="/Tae_Training.jpeg"
          alt="Coach Tae quarterback training"
          className="h-[420px] w-full rounded-xl object-cover"
        />
      </section>

      <section
        id="7v7"
        className="grid gap-10 border-t border-white/10 px-8 py-20 md:grid-cols-2 md:items-center"
      >
        <div className="grid grid-cols-2 gap-4">
          <img
            src="/Tae_DMVAttack.jpeg"
            alt="DMV Attack 7v7"
            className="h-[420px] w-full rounded-xl object-cover"
          />

          <img
            src="/Tae_DMVAttack2.jpeg"
            alt="DMV Attack football"
            className="h-[420px] w-full rounded-xl object-cover"
          />
        </div>

        <div>
          <p className="text-sm tracking-widest text-white/50">
            COMPETE
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            DMV Attack 7v7
          </h2>

          <p className="mt-4 max-w-xl text-white/70">
            Competitive 7v7 football built around development,
            competition, exposure, and creating opportunities
            for athletes throughout the DMV.
          </p>

          <button className="mt-8 rounded-md border border-white px-6 py-3 font-semibold">
            Learn More
          </button>
        </div>
      </section>

      <section
        id="about"
        className="grid gap-10 border-t border-white/10 px-8 py-20 md:grid-cols-2 md:items-center"
      >
        <div>
          <p className="text-sm tracking-widest text-white/50">
            ABOUT
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            Coach Tae
          </h2>

          <p className="mt-4 max-w-xl text-white/70">
            Former college quarterback, quarterback coach,
            trainer, and football mentor focused on helping
            quarterbacks understand the position and develop
            on and off the field.
          </p>
        </div>

        <img
          src="/Tae_Lockerroom.jpeg"
          alt="Coach Tae"
          className="h-[420px] w-full rounded-xl object-cover"
        />
      </section>

      <section
        id="apparel"
        className="border-t border-white/10 px-8 py-24 text-center"
      >
        <p className="text-sm tracking-widest text-white/50">
          SHOP
        </p>

        <h2 className="mt-3 text-4xl font-bold">
          Apparel
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-white/70">
          Shop Coach Tae and DMV Attack apparel.
        </p>

        <button className="mt-8 rounded-md bg-white px-6 py-3 font-semibold text-black">
          Shop Apparel
        </button>
      </section>

      <footer className="border-t border-white/10 px-8 py-8 text-center text-sm text-white/40">
        Coach Tae Training • DMV Attack 7v7 • Apparel
      </footer>
    </main>
  );
}
import { createGame } from "./actions";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col text-black">
      <header className="mx-auto flex w-full items-center justify-between px-6 py-6 text-white">
        <img
          src="/logo.png"
          alt="Buzzword"
          className="h-32 w-auto"
        />
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 md:grid-cols-2">
        <section className="flex h-full flex-col pb-6 px-6">
          <h1 className="text-4xl font-semibold leading-tight md:text-5x">
            Match the group. Stay in the hive.
          </h1>
          <p className="mt-4 text-base opacity-80">
            Inspired by the classic party game <b>Hive Mind</b> by Richard Garfield
          </p>
          <div className="mt-8 rounded-2xl border border-black/20 bg-black/80 backdrop-blur">
            <form action={createGame} className="p-6 space-y-3">
              <label className="block text-white font-semibold text-xl">
                Theme
                <textarea
                  className="w-full bg-white text-black font-normal p-4 rounded-xl mt-4"
                  placeholder='90s cartoons, fast food, travel, music, etc.'
                  rows={3}
                  name="theme"
                />
              </label>
              <button className="w-full rounded-xl bg-yellow-300 text-xl px-4 py-3 mt-6 font-semibold text-black cursor-pointer hover:bg-yellow-400 transition">
                Create Game
              </button>
            </form>
            <hr className="border-white/20 mx-6"></hr>
            <div className="text-white p-6 font-semibold">
              Have a room code? Join a game →
              <form className="mt-6 flex gap-3" action="/game" method="GET">
                <input
                  className="w-full rounded-xl bg-white px-4 py-3 text-black text-sm font-semibold"
                  type="text"
                  name="roomId"
                  placeholder="Enter Room Code"
                />
                <button
                  className="shrink-0 rounded-xl text-sm bg-yellow-300 px-4 py-3 text-sm font-semibold text-black"
                  type="submit"
                >
                  Join
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="flex h-full items-center justify-center" />
      </main>
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[75%]">
        <img
          src="/bee.png"
          alt="Bee"
          className="bee-float md:w128"
        />
      </div>
      <footer className="w-full p-4 text-sm text-black text-center">
        Made with ❤️ by{" "}
        <a
          className="underline underline-offset-4"
          href="https://dylandunn.me"
          rel="noreferrer"
          target="_blank"
        >
          Dylan Dunn
        </a>
      </footer>
    </div>
  );
}

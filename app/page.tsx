export default function Home() {
  return (
    <div className="flex min-h-screen flex-col text-black">
      <header className="mx-auto flex w-full items-center justify-between px-6 py-6 text-white">
        <div className="text-4xl font-semibold tracking-tight">
          Buzzword
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 md:grid-cols-2">
        <section className="flex h-full flex-col pt-20 pb-6 px-6">
          <h1 className="text-4xl font-semibold leading-tight md:text-5x">
            Match the group. Stay in the hive.
          </h1>
          <p className="mt-4 text-base opacity-80">
            Inspired by the classic party game <b>Hive Mind</b> by Richard Garfield
          </p>
          <div className="mt-6 flex justify-end">
            <div className="flex w-full max-w-sm gap-2">
              <input
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-3 text-sm text-black placeholder:text-black/50"
                placeholder="Room ID"
                type="text"
              />
              <button className="shrink-0 rounded-xl bg-black px-4 py-3 text-sm font-bold text-white">
                Join Game
              </button>
            </div>
          </div>
        </section>

        <section className="flex h-full items-center justify-center">
        </section>
      </main>
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

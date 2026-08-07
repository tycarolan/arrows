import { Game } from "@/components/Game";

/**
 * The whole game, and the link back to the hub.
 *
 * The footer is load-bearing rather than decorative: `docs/WORKSHOP.md` in the
 * hub names the hub link in an app's footer as one half of the boundary between
 * the repos.
 */
export default function Page() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Game />
      <footer className="flex items-baseline justify-between border-t border-line px-4 py-2 text-xs text-muted">
        <a
          href="https://taiotech.com"
          className="transition-colors hover:text-foreground"
        >
          taiotech.com
        </a>
        <span>Arrows</span>
      </footer>
    </main>
  );
}

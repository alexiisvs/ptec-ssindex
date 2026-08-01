import { Heart } from "lucide-react";

import type { Fact } from "../api/types";

type FactCardProps = {
  fact: Fact;
  onToggleLike: (fact: Fact) => void;
  pending?: boolean;
};

export function FactCard({ fact, onToggleLike, pending }: FactCardProps) {
  return (
    <article className="flex min-h-52 flex-col rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="text-xs font-semibold uppercase text-zinc-500">
          {fact.source}
        </span>
        {fact.cached && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
            En caché
          </span>
        )}
      </div>
      <p className="grow text-lg leading-8 text-zinc-800">{fact.text}</p>
      <footer className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
        <span className="text-sm text-zinc-500">
          {fact.like_count} {fact.like_count === 1 ? "like" : "likes"}
        </span>
        <button
          type="button"
          className={`inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors ${
            fact.liked
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          }`}
          onClick={() => onToggleLike(fact)}
          disabled={pending}
          aria-pressed={fact.liked}
        >
          <Heart size={17} fill={fact.liked ? "currentColor" : "none"} />
          {fact.liked ? "Guardado" : "Guardar"}
        </button>
      </footer>
    </article>
  );
}

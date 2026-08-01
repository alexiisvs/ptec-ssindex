import { useQuery } from "@tanstack/react-query";
import { Heart, RefreshCw, WifiOff } from "lucide-react";

import { apiErrorMessage } from "../api/client";
import type { Fact } from "../api/types";
import { PageHeader } from "../components/PageHeader";
import { PageState } from "../components/PageState";
import { useAuthenticatedApi } from "../hooks/useAuthenticatedApi";
import { useLikeFact } from "../hooks/useLikeFact";

export function DiscoverPage() {
  const api = useAuthenticatedApi();
  const likeMutation = useLikeFact();
  const query = useQuery({
    queryKey: ["facts", "random"],
    queryFn: ({ signal }) => api.randomFact(signal),
    staleTime: Infinity,
  });

  return (
    <>
      <PageHeader
        title="Descubrir"
        description="Encuentra un nuevo dato sobre gatos y guárdalo en tu colección."
        action={
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw
              size={17}
              className={query.isFetching ? "animate-spin" : undefined}
            />
            Otro fact
          </button>
        }
      />

      {query.isPending && (
        <div className="grid min-h-105 animate-pulse overflow-hidden rounded-lg border border-zinc-200 bg-white md:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5 p-7 sm:p-10">
            <div className="h-4 w-28 rounded bg-zinc-200" />
            <div className="h-7 w-full rounded bg-zinc-200" />
            <div className="h-7 w-5/6 rounded bg-zinc-200" />
          </div>
          <div className="hidden bg-zinc-200 md:block" />
        </div>
      )}

      {query.isError && (
        <PageState
          title="No pudimos buscar un fact"
          message={apiErrorMessage(query.error)}
          error
          action={() => void query.refetch()}
        />
      )}

      {query.data && (
        <FeaturedFact
          fact={query.data}
          pending={likeMutation.isPending}
          onToggleLike={(fact) => likeMutation.mutate(fact)}
        />
      )}
    </>
  );
}

function FeaturedFact({
  fact,
  pending,
  onToggleLike,
}: {
  fact: Fact;
  pending: boolean;
  onToggleLike: (fact: Fact) => void;
}) {
  return (
    <article className="grid min-h-105 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm md:grid-cols-[1.25fr_0.75fr]">
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-zinc-500">
          <span>{fact.source}</span>
          {fact.cached && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-800">
              <WifiOff size={12} /> En caché
            </span>
          )}
        </div>
        <blockquote className="my-auto py-8 text-2xl font-semibold leading-10 text-zinc-900 sm:text-3xl sm:leading-12">
          “{fact.text}”
        </blockquote>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5">
          <span className="text-sm text-zinc-500">
            {fact.length} caracteres · {fact.like_count} likes
          </span>
          <button
            type="button"
            className={`inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-bold ${
              fact.liked
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
            onClick={() => onToggleLike(fact)}
            disabled={pending}
            aria-pressed={fact.liked}
          >
            <Heart size={18} fill={fact.liked ? "currentColor" : "none"} />
            {fact.liked ? "Guardado" : "Guardar"}
          </button>
        </footer>
      </div>
      <img
        src="/cat-discover.jpg"
        alt="Gato naranja mirando hacia arriba"
        className="h-64 w-full object-cover md:h-full"
      />
    </article>
  );
}

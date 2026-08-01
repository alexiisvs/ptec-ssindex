import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { apiErrorMessage } from "../api/client";
import { FactCard } from "../components/FactCard";
import { PageHeader } from "../components/PageHeader";
import { PageState } from "../components/PageState";
import { Pagination } from "../components/Pagination";
import { useAuthenticatedApi } from "../hooks/useAuthenticatedApi";
import { useLikeFact } from "../hooks/useLikeFact";

const PAGE_SIZE = 6;

export function FavoritesPage() {
  const [page, setPage] = useState(1);
  const api = useAuthenticatedApi();
  const likeMutation = useLikeFact();
  const query = useQuery({
    queryKey: ["facts", "favorites", page],
    queryFn: ({ signal }) => api.favorites(page, PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Favoritos"
        description="Los facts que guardaste, ordenados desde el más reciente."
      />

      {query.isPending && <CardsSkeleton />}
      {query.isError && (
        <PageState
          title="No pudimos cargar tus favoritos"
          message={apiErrorMessage(query.error)}
          error
          action={() => void query.refetch()}
        />
      )}
      {query.data?.items.length === 0 && (
        <PageState
          title="Todavía no guardaste facts"
          message="Cuando encuentres uno que te guste en Descubrir, aparecerá aquí."
        />
      )}
      {query.data && query.data.items.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {query.data.items.map((fact) => (
              <FactCard
                key={fact.id}
                fact={fact}
                pending={likeMutation.isPending}
                onToggleLike={(item) => likeMutation.mutate(item)}
              />
            ))}
          </div>
          <Pagination
            page={query.data.page}
            total={query.data.total}
            pageSize={query.data.page_size}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="h-52 animate-pulse rounded-lg border border-zinc-200 bg-white p-5"
        >
          <div className="h-4 w-24 rounded bg-zinc-200" />
          <div className="mt-7 h-5 w-full rounded bg-zinc-200" />
          <div className="mt-3 h-5 w-4/5 rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

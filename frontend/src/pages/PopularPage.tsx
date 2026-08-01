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

export function PopularPage() {
  const [page, setPage] = useState(1);
  const api = useAuthenticatedApi();
  const likeMutation = useLikeFact();
  const query = useQuery({
    queryKey: ["facts", "popular", page],
    queryFn: ({ signal }) => api.popular(page, PAGE_SIZE, signal),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Populares"
        description="Los datos favoritos de toda la comunidad, ordenados por likes."
      />
      {query.isPending && (
        <div className="h-72 animate-pulse border-y border-zinc-200 bg-white" />
      )}
      {query.isError && (
        <PageState
          title="No pudimos cargar el ranking"
          message={apiErrorMessage(query.error)}
          error
          action={() => void query.refetch()}
        />
      )}
      {query.data?.items.length === 0 && (
        <PageState
          title="El ranking está vacío"
          message="Los facts aparecerán aquí después de ser descubiertos."
        />
      )}
      {query.data && query.data.items.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {query.data.items.map((fact, index) => (
              <div key={fact.id} className="relative">
                <span className="absolute -left-2 -top-2 z-10 grid size-8 place-items-center rounded-full bg-amber-400 text-sm font-black text-zinc-950 shadow-sm">
                  {(page - 1) * PAGE_SIZE + index + 1}
                </span>
                <FactCard
                  fact={fact}
                  pending={likeMutation.isPending}
                  onToggleLike={(item) => likeMutation.mutate(item)}
                />
              </div>
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

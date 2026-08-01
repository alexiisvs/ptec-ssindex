import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { apiErrorMessage } from "../api/client";
import type { Fact, PageResponse } from "../api/types";
import { useAuthenticatedApi } from "./useAuthenticatedApi";

type FactQueryData = Fact | PageResponse<Fact>;
type MutationContext = {
  snapshots: [QueryKey, FactQueryData | undefined][];
};

function isPage(data: FactQueryData): data is PageResponse<Fact> {
  return "items" in data;
}

function replaceFact(data: FactQueryData | undefined, next: Fact) {
  if (!data) return data;
  if (isPage(data)) {
    return {
      ...data,
      items: data.items.map((item) => (item.id === next.id ? next : item)),
    };
  }
  return data.id === next.id ? next : data;
}

function optimisticFact(fact: Fact): Fact {
  return {
    ...fact,
    liked: !fact.liked,
    like_count: Math.max(0, fact.like_count + (fact.liked ? -1 : 1)),
  };
}

export function useLikeFact() {
  const api = useAuthenticatedApi();
  const queryClient = useQueryClient();

  return useMutation<Fact, Error, Fact, MutationContext>({
    mutationFn: (fact) => api.setLike(fact.id, !fact.liked),
    async onMutate(fact) {
      await queryClient.cancelQueries({ queryKey: ["facts"] });
      const snapshots = queryClient.getQueriesData<FactQueryData>({
        queryKey: ["facts"],
      });
      const next = optimisticFact(fact);
      for (const [queryKey, data] of snapshots) {
        queryClient.setQueryData(queryKey, replaceFact(data, next));
      }
      return { snapshots };
    },
    onError(error, _fact, context) {
      for (const [queryKey, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(queryKey, data);
      }
      toast.error(apiErrorMessage(error));
    },
    onSuccess(fact) {
      const snapshots = queryClient.getQueriesData<FactQueryData>({
        queryKey: ["facts"],
      });
      for (const [queryKey, data] of snapshots) {
        queryClient.setQueryData(queryKey, replaceFact(data, fact));
      }
      toast.success(
        fact.liked ? "Fact guardado" : "Fact eliminado de favoritos",
      );
    },
    async onSettled() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["facts", "favorites"] }),
        queryClient.invalidateQueries({ queryKey: ["facts", "popular"] }),
      ]);
    },
  });
}

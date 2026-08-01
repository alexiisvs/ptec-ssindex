import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="mt-7 flex items-center justify-between border-t border-zinc-200 pt-5">
      <p className="text-sm text-zinc-600">
        Página <strong>{page}</strong> de <strong>{pages}</strong>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={19} />
        </button>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Página siguiente"
          title="Página siguiente"
        >
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}

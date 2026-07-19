import * as React from "react";
import { cn } from "../../lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <nav className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground/70">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
          className="inline-flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:bg-accent/50 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {getPages().map((p) => (
          <button key={p} onClick={() => onPageChange(p)}
            className={cn(
              "inline-flex items-center justify-center size-9 rounded-xl text-sm font-medium transition-all",
              p === page
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            )}>
            {p}
          </button>
        ))}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="inline-flex items-center justify-center size-9 rounded-xl text-muted-foreground hover:bg-accent/50 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

export { Pagination };
export default Pagination;

import * as React from "react";
import { cn } from "../../lib/utils";

function EmptyState({ icon: Icon, title = "No data found", description, action, onAction, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 backdrop-blur-sm">
        {Icon && <Icon className="h-8 w-8 text-muted-foreground/40" />}
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground/80">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground/60 text-center max-w-sm">{description}</p>}
      {action && onAction && (
        <button onClick={onAction} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all px-5 py-2.5">
          {action}
        </button>
      )}
    </div>
  );
}

export { EmptyState };
export default EmptyState;

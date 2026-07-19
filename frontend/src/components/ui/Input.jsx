import * as React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, label, error, icon: Icon, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground/80">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-muted-foreground/60" />
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm px-4 py-2 text-sm transition-all duration-200",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive/50 focus:ring-destructive/20",
            Icon && "pl-10",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-destructive/80">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

export { Input };
export default Input;

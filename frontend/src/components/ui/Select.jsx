import * as React from "react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(({ className, label, error, options = [], placeholder = "Select...", ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground/80">{label}</label>
      )}
      <select
        className={cn(
          "flex h-10 w-full rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm px-4 py-2 text-sm transition-all duration-200 appearance-none",
          "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive/50 focus:ring-destructive/20",
          className
        )}
        ref={ref}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-destructive/80">{error}</p>}
    </div>
  );
});
Select.displayName = "Select";

export { Select };
export default Select;

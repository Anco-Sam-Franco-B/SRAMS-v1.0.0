import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "../../lib/utils";

const SearchInput = React.forwardRef(({ value = "", onChange, placeholder = "Search...", debounce = 300, className, ...props }, ref) => {
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => { setLocal(value); }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    setLocal(v);
    clearTimeout(window.__searchTimer);
    window.__searchTimer = setTimeout(() => onChange(v), debounce);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
      <input
        ref={ref}
        type="text"
        value={local}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "flex h-10 w-full rounded-xl border border-border/60 bg-background/50 backdrop-blur-sm pl-10 pr-4 py-2 text-sm transition-all duration-200",
          "placeholder:text-muted-foreground/50",
          "focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary/40",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        {...props}
      />
    </div>
  );
});
SearchInput.displayName = "SearchInput";

export { SearchInput };
export default SearchInput;

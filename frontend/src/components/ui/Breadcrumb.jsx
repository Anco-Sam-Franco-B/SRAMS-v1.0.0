import { cn } from "../../lib/utils";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const Breadcrumb = ({ items = [] }) => (
  <nav className="flex items-center gap-1 text-sm text-muted-foreground/60">
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/30" />}
        {item.href ? (
          <Link to={item.href} className="hover:text-foreground transition-colors">{item.label}</Link>
        ) : (
          <span className="text-foreground/80 font-medium">{item.label}</span>
        )}
      </span>
    ))}
  </nav>
);

export { Breadcrumb };
export default Breadcrumb;

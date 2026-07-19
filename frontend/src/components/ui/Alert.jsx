import * as React from "react";
import { cn } from "../../lib/utils";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

const variants = {
  default: { bg: "bg-background", border: "border-border/50", icon: Info, iconColor: "text-foreground/60" },
  destructive: { bg: "bg-destructive/5", border: "border-destructive/20", icon: AlertCircle, iconColor: "text-destructive/70" },
  success: { bg: "bg-success/5", border: "border-success/20", icon: CheckCircle, iconColor: "text-success/70" },
  warning: { bg: "bg-amber-500/5", border: "border-amber-500/20", icon: AlertTriangle, iconColor: "text-amber-600/70" },
  info: { bg: "bg-blue-500/5", border: "border-blue-500/20", icon: Info, iconColor: "text-blue-600/70" },
};

const Alert = React.forwardRef(({ className, variant = "default", title, children, onClose, ...props }, ref) => {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "relative flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm",
        v.bg, v.border, className
      )}
      {...props}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", v.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <h5 className="mb-1 font-medium">{title}</h5>}
        <div className="text-foreground/70">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-foreground/5 transition-colors">
          <X className="h-4 w-4 text-foreground/40" />
        </button>
      )}
    </div>
  );
});
Alert.displayName = "Alert";

export { Alert };
export default Alert;

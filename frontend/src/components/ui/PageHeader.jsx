import { cn } from '../../lib/utils';

export default function PageHeader({ title, subtitle, action, actionIcon: ActionIcon, actionLabel, onAction, className }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground/70 mt-1">{subtitle}</p>}
      </div>
      {action && onAction && (
        <button onClick={onAction}
          className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all h-10 px-5 py-2">
          {ActionIcon && <ActionIcon className="h-4 w-4" />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

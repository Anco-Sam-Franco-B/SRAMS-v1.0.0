import { cn } from '../../lib/utils';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Confirm', message = 'Are you sure?', confirmLabel = 'Confirm', confirmVariant = 'destructive', loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-glass-lg max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground/70 mt-2">{message}</p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-xl text-sm font-medium border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/50 h-9 px-4 py-2 transition-all">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={cn(
              "inline-flex items-center justify-center rounded-xl text-sm font-medium h-9 px-4 py-2 disabled:opacity-50 transition-all",
              confirmVariant === 'destructive'
                ? "bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground shadow-soft hover:shadow-soft-md"
                : "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-soft hover:shadow-soft-md"
            )}>
            {loading ? 'Loading...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

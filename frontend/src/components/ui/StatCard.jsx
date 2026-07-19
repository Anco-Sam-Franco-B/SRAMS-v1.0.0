import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-amber-500/10 text-amber-600',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-blue-500/10 text-blue-600',
};

export default function StatCard({ icon: Icon, label, value, color = 'primary', trend, trendValue, className }) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-soft p-6 transition-all hover:shadow-soft-md hover:-translate-y-0.5", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={cn("p-3 rounded-xl", colorMap[color] || colorMap.primary)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground/70">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className={cn("flex items-center gap-1 text-xs mt-1", trend === 'up' ? 'text-success' : 'text-destructive')}>
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

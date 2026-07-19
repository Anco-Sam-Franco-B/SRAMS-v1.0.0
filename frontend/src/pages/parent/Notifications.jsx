import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function ParentNotifications() {
  const { data: notifications } = useQuery({ queryKey: ['notifications'], queryFn: () => api.get('/notifications').then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Notifications</h1>
      <Card>
        {notifications && notifications.length > 0 ? (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {notifications.map((n) => (
              <div key={n.id} className={`p-4 ${!n.is_read ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`}>
                <div className="flex items-start justify-between">
                  <div><h3 className="text-sm font-semibold text-gray-900 dark:text-surface-100">{n.title}</h3><p className="text-sm text-gray-500 mt-1">{n.message}</p></div>
                  <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No notifications" description="You're all caught up" />}
      </Card>
    </div>
  );
}

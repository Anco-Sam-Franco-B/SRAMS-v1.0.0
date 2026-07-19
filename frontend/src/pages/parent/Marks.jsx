import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';

export default function ParentMarks() {
  const { data: children } = useQuery({ queryKey: ['parent-children'], queryFn: () => api.get('/parents/children').then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Children's Marks</h1>
      {children && children.length > 0 ? children.map((child) => (
        <Card key={child.id}>
          <h3 className="font-semibold text-gray-900 dark:text-surface-100 mb-3">{child.first_name} {child.last_name} - {child.class_name}</h3>
          <p className="text-sm text-gray-500">Select a child from the dashboard to view detailed marks.</p>
        </Card>
      )) : <EmptyState title="No children linked" description="Contact admin to link your children" />}
    </div>
  );
}

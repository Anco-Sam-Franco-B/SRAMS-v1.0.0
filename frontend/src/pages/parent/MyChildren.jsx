import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { useNavigate } from 'react-router-dom';

export default function ParentMyChildren() {
  const navigate = useNavigate();
  const { data: children } = useQuery({ queryKey: ['parent-children'], queryFn: () => api.get('/parents/children').then((r) => r.data.data) });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">My Children</h1>
      {children && children.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((c) => (
            <Card key={c.id} hover className="cursor-pointer" onClick={() => navigate(`/parent/marks?student=${c.id}`)}>
              <div className="flex items-center gap-4">
                <Avatar name={`${c.first_name} ${c.last_name}`} size="lg" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-surface-100">{c.first_name} {c.last_name}</h3>
                  <p className="text-sm text-gray-500">{c.admission_no}</p>
                  <p className="text-sm text-gray-400">{c.class_name} - {c.trade_name}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No children linked" description="Contact admin to link your children" />}
    </div>
  );
}

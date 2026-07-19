import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ReportCardVerify() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComments, setRejectComments] = useState('');
  const queryClient = useQueryClient();

  const { data: verifications } = useQuery({ queryKey: ['report-card-verifications'], queryFn: () => api.get('/report-card-verifications').then((r) => r.data.data) });

  const verifyMutation = useMutation({
    mutationFn: (id) => api.post(`/report-card-verifications/${id}/verify`),
    onSuccess: () => { queryClient.invalidateQueries(['report-card-verifications']); toast.success('Report card verified'); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comments }) => api.post(`/report-card-verifications/${id}/reject`, { comments }),
    onSuccess: () => { queryClient.invalidateQueries(['report-card-verifications']); setShowRejectModal(false); setRejectComments(''); toast.success('Report card rejected'); },
  });

  const statusColors = { pending: 'warning', verified: 'success', rejected: 'destructive' };
  const statusIcons = { pending: Clock, verified: CheckCircle, rejected: XCircle };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Report Card Verification</h1><p className="text-sm text-muted-foreground mt-1">Review and verify report cards</p></div>
      {verifications && verifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {verifications.map((v) => {
            const Icon = statusIcons[v.status] || Clock;
            return (
              <Card key={v.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Icon className="h-5 w-5 text-primary" /></div>
                    <div><h3 className="font-semibold">{v.first_name} {v.last_name}</h3><p className="text-sm text-muted-foreground">{v.admission_no}</p></div>
                  </div>
                  <Badge variant={statusColors[v.status]}>{v.status}</Badge>
                </div>
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {v.average && <p>Average: {Number(v.average).toFixed(1)}%</p>}
                  {v.position && <p>Position: {v.position}</p>}
                  {v.grade && <p>Grade: {v.grade}</p>}
                  {v.comments && <p className="text-xs italic mt-2">"{v.comments}"</p>}
                </div>
                {v.status === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Button variant="success" size="sm" onClick={() => verifyMutation.mutate(v.id)} loading={verifyMutation.isPending}><CheckCircle className="h-4 w-4" /> Verify</Button>
                    <Button variant="destructive" size="sm" onClick={() => { setSelectedItem(v); setShowRejectModal(true); }}><XCircle className="h-4 w-4" /> Reject</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : <EmptyState title="No pending verifications" description="All report cards have been verified" />}

      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Report Card</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><label className="text-sm font-medium">Comments</label><textarea value={rejectComments} onChange={(e) => setRejectComments(e.target.value)} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" placeholder="Reason for rejection..." /></div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => rejectMutation.mutate({ id: selectedItem.id, comments: rejectComments })} loading={rejectMutation.isPending}>Reject</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

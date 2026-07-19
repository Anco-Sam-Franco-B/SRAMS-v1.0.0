import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Badge from '../../components/ui/Badge';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentsPage() {
  const [search, setSearch] = useState('');
  const { data: files, refetch } = useQuery({
    queryKey: ['files', search],
    queryFn: () => api.get('/files/student').then((r) => r.data.data),
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/upload/student/default', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-surface-100">Documents</h1>
          <p className="text-sm text-gray-500 dark:text-surface-400 mt-1">Manage uploaded files</p>
        </div>
        <label className="cursor-pointer">
          <Button icon={Upload}>Upload File</Button>
          <input type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
        </label>
      </div>
      <SearchInput value={search} onChange={setSearch} placeholder="Search files..." className="max-w-sm" />
      <Card>
        {files && files.length > 0 ? (
          <div className="space-y-3">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-brand-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-surface-100">{f.file_name}</p>
                    <p className="text-xs text-gray-500">{f.file_type} - {new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm" icon={Download} /></a>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-center py-8">No files uploaded yet</p>}
      </Card>
    </div>
  );
}

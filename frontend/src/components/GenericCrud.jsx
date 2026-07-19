import React, { useEffect, useState } from 'react';
import { Plus, X, Loader2, Trash2 } from 'lucide-react';
import api from '../api/client';

export default function GenericCrud({ table, title }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/data/${table}`);
      setData(res.data.data || []);
    } catch (e) {
      console.error(`Failed to fetch ${table}`, e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = () => {
    // generate empty form based on column keys of first row (excluding id)
    const empty = {};
    if (data.length) {
      Object.keys(data[0]).forEach(k => {
        if (k !== 'id') empty[k] = '';
      });
    }
    setForm(empty);
    setModalOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/data/${table}`, form);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Create error', err);
      alert(err.response?.data?.error || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/data/${table}/${id}`);
      fetchData();
    } catch (err) {
      console.error('Delete error', err);
      alert(err.response?.data?.error || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <button onClick={openModal} className="flex items-center p-2 bg-blue-600 text-white rounded-lg shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> Add {title.slice(0, -1)}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"/></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {data[0] && Object.keys(data[0]).map((col) => (
                  <th key={col}>{col}</th>
                ))}
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  {Object.entries(row).map(([k, v]) => (
                    <td key={k}>{v?.toString()}</td>
                  ))}
                  <td className="text-right space-x-2">
                    {/* Edit functionality can be added later */}
                    <button onClick={() => handleDelete(row.id)} disabled={deletingId === row.id}
                      className="btn btn-ghost btn-xs text-error">
                      {deletingId === row.id ? <Loader2 className="size-4 animate-spin"/> : <Trash2 className="size-4"/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold">Add New {title.slice(0, -1)}</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {Object.keys(form).map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium mb-1">{field.replace('_', ' ')}</label>
                  <input
                    required
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    className="appearance-none w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow">
                  {submitting ? <Loader2 className="size-4 animate-spin mr-2"/> : <Plus className="w-4 h-4 mr-2"/>}
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

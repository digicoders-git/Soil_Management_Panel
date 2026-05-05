import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';

const AllSites = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '', estimatedCost: '', status: '', notes: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { data } = await api.get('/sites');
      setSites(data.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const handleView = (site) => {
    navigate(`/admin/sites/${site._id}`);
  };

  const handleEdit = (site) => {
    setEditingId(site._id);
    setEditForm({
      name: site.name,
      address: site.address,
      estimatedCost: site.estimatedCost,
      status: site.status,
      notes: site.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/sites/${editingId}`, editForm);
      setIsEditModalOpen(false);
      fetchSites();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating site.');
    }
  };

  const filteredSites = sites.filter(site => {
    if (filter === 'all') return true;
    if (filter === 'active') return !['completed', 'cancelled', 'closed'].includes(site.status);
    return site.status === filter;
  });

  const columns = [
    { key: 'name', label: 'Site Name' },
    {
      key: 'userId',
      label: 'supervisor',
      render: (val) => Array.isArray(val) && val.length > 0 ? val.map(u => u.name).join(', ') : 'Unassigned'
    },
    {
      key: 'adminId',
      label: 'Admin',
      render: (val) => val?.name || '-'
    },
    {
      key: 'estimatedCost',
      label: 'Estimated Cost',
      render: (value) => `₹${value?.toLocaleString() || 0}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Sites</h1>
        <div className="flex gap-2">
          <ExportButtons
            onExcel={() => {
              const data = filteredSites.map(s => ({
                ...s,
                supervisor: Array.isArray(s.userId) ? s.userId.map(u => u.name).join(', ') : (s.userId?.name || '-'),
                adminName: s.adminId?.name || '-',
              }));
              exportToExcel(data, [
                { key: 'name', label: 'Site Name' },
                { key: 'supervisor', label: 'Supervisor' },
                { key: 'operators', label: 'Operators' },
                { key: 'adminName', label: 'Admin' },
                { key: 'estimatedCost', label: 'Estimated Cost' },
                { key: 'status', label: 'Status' },
                { key: 'startDate', label: 'Start Date' },
              ], 'sites');
            }}
            onPdf={() => exportToPdf(filteredSites, [
              { key: 'name', label: 'Site Name' },
              { key: 'userId', label: 'Supervisor' },
              { key: 'adminId', label: 'Admin' },
              { key: 'estimatedCost', label: 'Est. Cost' },
              { key: 'status', label: 'Status' },
            ], 'All Sites', 'sites')}
          />
          <button onClick={() => navigate('/admin/create-site')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold">
            Create New Site
          </button>
        </div>
      </div>

      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'active', 'completed', 'closed', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white text-slate-600 hover:bg-slate-100 border'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable columns={columns} data={filteredSites} onView={handleView} onEdit={handleEdit} />
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Site">
        <form onSubmit={handleEditSubmit}>
          <FormInput label="Site Name" name="name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
          <FormInput label="Address" name="address" value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} required />
          <FormInput label="Estimated Cost" type="number" name="estimatedCost" value={editForm.estimatedCost} onChange={e => setEditForm({ ...editForm, estimatedCost: e.target.value })} required />
          <FormInput
            label="Status"
            type="select"
            name="status"
            value={editForm.status}
            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
            options={[
              { value: 'created', label: 'Created' },
              { value: 'machines_assigned', label: 'Machines Assigned' },
              { value: 'supervisor_assigned', label: 'Supervisor Assigned' },
              { value: 'active', label: 'Active' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'closed', label: 'Closed' },
            ]}
            required
          />
          <FormInput label="Notes" type="textarea" name="notes" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">
            Save Changes
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AllSites;

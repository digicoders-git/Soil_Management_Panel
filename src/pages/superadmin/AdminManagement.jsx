import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import StatusBadge from '../../components/StatusBadge';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';

export const ALL_PERMISSIONS = [
  { key: 'manage_supervisors', label: 'Manage Supervisors' },
  { key: 'manage_sites', label: 'Manage Sites' },
  { key: 'create_site', label: 'Create Site' },
  { key: 'manage_machines', label: 'Manage Machines/Stocks' },
  { key: 'manage_operators', label: 'Manage Operators' },
  { key: 'give_installments', label: 'Give Installments' },
  { key: 'view_expenses', label: 'View Expenses' },
  { key: 'manage_movements', label: 'Manage Stock Movements' },
  { key: 'view_reports', label: 'View Reports' },
];

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', permissions: [] });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    try {
      const { data } = await api.get('/users');
      setAdmins(data.data.filter(u => u.role === 'admin'));
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const togglePermission = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  const selectAll = () => setFormData(prev => ({ ...prev, permissions: ALL_PERMISSIONS.map(p => p.key) }));
  const clearAll = () => setFormData(prev => ({ ...prev, permissions: [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, formData);
      } else {
        await api.post('/users', { ...formData, role: 'admin' });
      }
      fetchAdmins();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving admin:', error);
      alert(error.response?.data?.message || 'Error saving admin.');
    }
  };

  const handleEdit = (admin) => {
    setEditingId(admin._id);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
      permissions: admin.permissions || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (admin) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await api.delete(`/users/${admin._id}`);
        fetchAdmins();
      } catch (error) {
        console.error('Error deleting admin:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', permissions: [] });
    setEditingId(null);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (val) => val?.length > 0
        ? <span className="text-xs text-indigo-600 font-semibold">{val.length} permissions</span>
        : <span className="text-xs text-gray-400">All Access</span>
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => <StatusBadge status={value ? 'active' : 'inactive'} />
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
        <div className="flex gap-2">
          <ExportButtons
            onExcel={() => exportToExcel(admins, columns, 'admins')}
            onPdf={() => exportToPdf(admins, columns, 'Admin Management', 'admins')}
          />
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Admin
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={admins} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingId ? 'Edit Admin' : 'Add Admin'}>
        <form onSubmit={handleSubmit}>
          <FormInput label="Name" name="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <FormInput label="Email" type="email" name="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <FormInput label="Password" type="password" name="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingId} />
          <FormInput label="Phone" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />

          {/* Permissions */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Permissions</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-indigo-600 hover:underline font-semibold">Select All</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={clearAll} className="text-xs text-red-500 hover:underline font-semibold">Clear All</button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">Leave empty to give full access (same as before)</p>
            <div className="grid grid-cols-1 gap-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-56 overflow-y-auto">
              {ALL_PERMISSIONS.map(p => (
                <label key={p.key} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${formData.permissions.includes(p.key) ? 'bg-indigo-50 border border-indigo-200' : 'bg-white border border-gray-100 hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                    className="h-4 w-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">{p.label}</span>
                </label>
              ))}
            </div>
            {formData.permissions.length > 0 && (
              <p className="text-xs text-indigo-600 mt-1 font-semibold">{formData.permissions.length} of {ALL_PERMISSIONS.length} permissions selected</p>
            )}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            {editingId ? 'Update' : 'Create'} Admin
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminManagement;

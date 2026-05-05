import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import StatusBadge from '../../components/StatusBadge';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';

export const MODULES = [
  { key: 'manage_site_incharge', label: '1) Manage Site Incharge' },
  { key: 'manage_stock_operator', label: '2) Manage Stock Operator' },
  { key: 'create_site', label: '3) Create Site' },
  { key: 'view_all_site', label: '4) View all Site' },
  { key: 'stock', label: '5) Add Stock Type' }, // Mapping 'stock' to 'Add Stock Type'
  { key: 'stock_units', label: '6) Add Stock Units' }, // New key
  { key: 'all_stock', label: '7) All Stock' },
  { key: 'stock_movement', label: '8) Stock Movement' },
  { key: 'installment', label: '9) Installment' },
  { key: 'expenses', label: '10) Expenses' },
  { key: 'report', label: '11) Report' },
];

export const ACTIONS = [
  { key: 'add', label: 'Add' },
  { key: 'view', label: 'View' },
  { key: 'edit', label: 'Edited' },
  { key: 'delete', label: 'Deleted' },
];

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', permissions: {} });
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

  const togglePermission = (moduleKey, actionKey) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions };
      if (!newPermissions[moduleKey]) {
        newPermissions[moduleKey] = { add: false, view: false, edit: false, delete: false };
      }
      newPermissions[moduleKey] = {
        ...newPermissions[moduleKey],
        [actionKey]: !newPermissions[moduleKey][actionKey]
      };
      return { ...prev, permissions: newPermissions };
    });
  };

  const selectAll = () => {
    const all = {};
    MODULES.forEach(m => {
      all[m.key] = { add: true, view: true, edit: true, delete: true };
    });
    setFormData(prev => ({ ...prev, permissions: all }));
  };
  const clearAll = () => setFormData(prev => ({ ...prev, permissions: {} }));

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
      permissions: admin.permissions || {},
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
    setFormData({ name: '', email: '', password: '', phone: '', permissions: {} });
    setEditingId(null);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'permissions',
      label: 'Permissions',
      render: (val) => {
        const count = Object.values(val || {}).reduce((acc, curr) => 
          acc + Object.values(curr).filter(Boolean).length, 0);
        return count > 0
          ? <span className="text-xs text-indigo-600 font-semibold">{count} active</span>
          : <span className="text-xs text-gray-400">No Access</span>
      }
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

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Permissions</label>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-xs text-indigo-600 hover:underline font-semibold">Select All</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={clearAll} className="text-xs text-red-500 hover:underline font-semibold">Clear All</button>
              </div>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                    {ACTIONS.map(a => (
                      <th key={a.key} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">{a.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {MODULES.map(m => (
                    <tr key={m.key}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">{m.label}</td>
                      {ACTIONS.map(a => (
                        <td key={a.key} className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions?.[m.key]?.[a.key] || false}
                            onChange={() => togglePermission(m.key, a.key)}
                            className="h-3.5 w-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

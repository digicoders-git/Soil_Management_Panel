import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import StatusBadge from '../../components/StatusBadge';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SupervisorManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [supervisors, setsupervisors] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    adminId: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchsupervisors();
    if (user?.role === 'superadmin') {
      fetchAdmins();
    }
  }, [user]);

  const fetchsupervisors = async () => {
    try {
      const { data } = await api.get('/users');
      const userList = data.data.filter(u => u.role === 'user');
      setsupervisors(userList);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data } = await api.get('/users');
      const adminList = data.data.filter(u => u.role === 'admin');
      setAdmins(adminList);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, formData);
      } else {
        await api.post('/users', { ...formData, role: 'user' });
      }
      fetchsupervisors();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving supervisor:', error);
    }
  };

  const handleEdit = (supervisor) => {
    setEditingId(supervisor._id);
    setFormData({
      name: supervisor.name,
      email: supervisor.email,
      password: '',
      phone: supervisor.phone || '',
      adminId: supervisor.adminId?._id || supervisor.adminId || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (supervisor) => {
    if (window.confirm('Are you sure you want to delete this supervisor?')) {
      try {
        await api.delete(`/users/${supervisor._id}`);
        fetchsupervisors();
      } catch (error) {
        console.error('Error deleting supervisor:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', adminId: '' });
    setEditingId(null);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    ...(user?.role === 'superadmin' ? [{
      key: 'adminId',
      label: 'Admin',
      render: (val) => val?.name || 'Unassigned'
    }] : []),
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => <StatusBadge status={value ? 'active' : 'inactive'} />
    },
    {
      key: '_id',
      label: 'Details',
      render: (val) => (
        <button
          onClick={() => navigate(`/admin/supervisors/${val}`)}
          className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm"
        >
          View →
        </button>
      )
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Site Incharge Management</h1>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            onExcel={() => exportToExcel(supervisors, [{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'isActive',label:'Status'}], 'supervisors')}
            onPdf={() => exportToPdf(supervisors, [{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'isActive',label:'Status'}], 'Site Incharge List', 'supervisors')}
          />
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Add supervisor</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={columns}
          data={supervisors}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingId ? 'Edit supervisor' : 'Add supervisor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingId}
          />
          <FormInput
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          {user?.role === 'superadmin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Admin</label>
              <select
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.adminId}
                onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                required={!editingId}
              >
                <option value="">-- Select Admin --</option>
                {admins.map(admin => (
                  <option key={admin._id} value={admin._id}>{admin.name} ({admin.email})</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold"
          >
            {editingId ? 'Update' : 'Create'} supervisor
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default SupervisorManagement;

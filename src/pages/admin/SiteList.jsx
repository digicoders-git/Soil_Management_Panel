import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SiteList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [enrichedSites, setEnrichedSites] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', address: '', estimatedCost: '', status: '', notes: '' });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const [sitesRes, installmentsRes, expensesRes] = await Promise.all([
        api.get('/sites'),
        api.get('/installments'),
        api.get('/expenses'),
      ]);

      const sitesData = sitesRes.data.data;
      const installments = installmentsRes.data.data;
      const expenses = expensesRes.data.data;

      const enriched = sitesData.map(site => {
        const siteInstallments = installments.filter(i => i.siteId?._id === site._id || i.siteId === site._id);
        const siteExpenses = expenses.filter(e => e.siteId?._id === site._id || e.siteId === site._id);
        
        const givenAmount = siteInstallments.reduce((sum, i) => sum + i.amount, 0);
        const expenseUsed = siteExpenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingBalance = givenAmount - expenseUsed;

        return {
          ...site,
          givenAmount,
          expenseUsed,
          remainingBalance,
        };
      });

      setEnrichedSites(enriched);
      setSites(sitesData);
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

  const columns = [
    { key: 'name', label: 'Site Name' },
    { 
      key: 'userId', 
      label: 'supervisor',
      render: (val) => Array.isArray(val) && val.length > 0 ? val.map(u => u.name).join(', ') : '-'
    },
    { 
      key: 'estimatedCost', 
      label: 'Estimated Cost',
      render: (value) => `₹${value?.toLocaleString() || 0}`
    },
    { 
      key: 'givenAmount', 
      label: 'Given Amount',
      render: (value) => `₹${value?.toLocaleString() || 0}`
    },
    { 
      key: 'expenseUsed', 
      label: 'Expense Used',
      render: (value) => `₹${value?.toLocaleString() || 0}`
    },
    { 
      key: 'remainingBalance', 
      label: 'Remaining Balance',
      render: (value) => (
        <span className={value < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
          ₹{value?.toLocaleString() || 0}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => <StatusBadge status={value} />
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sites</h1>
        <button
          onClick={() => navigate('/admin/create-site')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Create Site
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={enrichedSites} onView={handleView} onEdit={user?.role === 'superadmin' ? handleEdit : undefined} />
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

export default SiteList;

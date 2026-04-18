import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const OperatorManagement = () => {
  const { user } = useAuth();
  const [operators, setOperators] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchOperators(); }, []);

  const fetchOperators = async () => {
    try {
      const { data } = await api.get('/operators');
      setOperators(data.data);
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/operators/${editingId}`, { name });
      } else {
        await api.post('/operators', { name });
      }
      fetchOperators();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving operator');
    }
  };

  const handleEdit = (operator) => {
    setEditingId(operator._id);
    setName(operator.name);
    setIsModalOpen(true);
  };

  const handleDelete = async (operator) => {
    if (window.confirm('Are you sure you want to delete this operator?')) {
      try {
        await api.delete(`/operators/${operator._id}`);
        fetchOperators();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete operator');
      }
    }
  };

  const resetForm = () => { setName(''); setEditingId(null); };

  const columns = [
    { key: 'name', label: 'Operator Name' },
    ...(user?.role === 'superadmin' ? [{ key: 'adminId', label: 'Admin', render: (val) => val?.name || '-' }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Machine Operators</h1>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            onExcel={() => exportToExcel(operators, [{key:'name',label:'Operator Name'}], 'operators')}
            onPdf={() => exportToPdf(operators, [{key:'name',label:'Operator Name'}], 'Operators List', 'operators')}
          />
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Add Operator</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={operators} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingId ? 'Edit Operator' : 'Add Operator'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Operator Name" name="name" value={name} onChange={e => setName(e.target.value)} required />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-bold">
            {editingId ? 'Update' : 'Create'} Operator
          </button>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default OperatorManagement;

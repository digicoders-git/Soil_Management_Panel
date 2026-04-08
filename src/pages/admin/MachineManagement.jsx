import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const MachineManagement = () => {
  const [types, setTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  const [typeForm, setTypeForm] = useState({ name: '', category: 'soil_sampling', description: '', brand: '', model: '' });
  const [unitForm, setUnitForm] = useState({ machineTypeId: '', serialNumber: '', purchaseCost: '', purchaseDate: '', condition: 'good' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typeRes, unitRes, catRes] = await Promise.all([
        api.get('/machine-types'),
        api.get('/machine-units'),
        api.get('/machine-categories'),
      ]);
      setTypes(typeRes.data.data);
      setUnits(unitRes.data.data);
      setCategories(catRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/machine-types', typeForm);
      setIsTypeModalOpen(false);
      setTypeForm({ name: '', category: 'soil_sampling', description: '', brand: '', model: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving machine type:', error);
      alert(error.response?.data?.message || 'Error saving type');
    }
  };

  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/machine-units', unitForm);
      setIsUnitModalOpen(false);
      setUnitForm({ machineTypeId: '', serialNumber: '', purchaseCost: '', purchaseDate: '', condition: 'good' });
      fetchData();
    } catch (error) {
      console.error('Error saving machine unit:', error);
      alert(error.response?.data?.message || 'Error saving unit');
    }
  };

  const typeColumns = [
    { key: 'name', label: 'Machine Type' },
    { key: 'category', label: 'Category' },
    { key: 'brand', label: 'Brand', render: (val) => val || '-' },
    { key: 'model', label: 'Model', render: (val) => val || '-' },
    { key: 'description', label: 'Description' },
  ];

  const unitColumns = [
    { key: 'serialNumber', label: 'Serial No.' },
    { key: 'machineTypeId', label: 'Type', render: (val) => val?.name || '-' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'condition', label: 'Condition' },
    { key: 'currentSiteId', label: 'Current Site', render: (val) => val?.name || '-' },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Machine Management</h1>
        <div className="space-x-4">
          <button onClick={() => setIsTypeModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Add Type</button>
          <button onClick={() => setIsUnitModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Unit</button>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Machine Types</h2>
          <div className="bg-white rounded-lg shadow">
            <DataTable columns={typeColumns} data={types} />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Machine Units</h2>
          <div className="bg-white rounded-lg shadow">
            <DataTable columns={unitColumns} data={units} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} title="Add Machine Type">
        <form onSubmit={handleTypeSubmit}>
          <FormInput label="Name" name="name" value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} required />
          <FormInput label="Brand" name="brand" value={typeForm.brand} onChange={e => setTypeForm({ ...typeForm, brand: e.target.value })} />
          <FormInput label="Model" name="model" value={typeForm.model} onChange={e => setTypeForm({ ...typeForm, model: e.target.value })} />
          <FormInput label="Category" type="select" name="category" value={typeForm.category} onChange={e => setTypeForm({ ...typeForm, category: e.target.value })} options={categories.map(c => ({ value: c.name, label: c.name }))} required />
          <FormInput label="Description" type="textarea" name="description" value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg mt-4">Save Type</button>
        </form>
      </Modal>

      <Modal isOpen={isUnitModalOpen} onClose={() => setIsUnitModalOpen(false)} title="Add Machine Unit">
        <form onSubmit={handleUnitSubmit}>
          <FormInput label="Machine Type" type="select" name="machineTypeId" value={unitForm.machineTypeId} onChange={e => setUnitForm({ ...unitForm, machineTypeId: e.target.value })}
            options={[...types.map(t => ({ value: t._id, label: t.name }))]} required />
          <FormInput label="Serial Number" name="serialNumber" value={unitForm.serialNumber} onChange={e => setUnitForm({ ...unitForm, serialNumber: e.target.value })} required />
          <FormInput label="Purchase Cost (₹)" type="number" name="purchaseCost" value={unitForm.purchaseCost} onChange={e => setUnitForm({ ...unitForm, purchaseCost: e.target.value })} required />
          <FormInput label="Purchase Date" type="date" name="purchaseDate" value={unitForm.purchaseDate} onChange={e => setUnitForm({ ...unitForm, purchaseDate: e.target.value })} />
          <FormInput label="Condition" type="select" name="condition" value={unitForm.condition} onChange={e => setUnitForm({ ...unitForm, condition: e.target.value })} options={[
            { value: 'good', label: 'Good' }, { value: 'damaged', label: 'Damaged' }, { value: 'maintenance', label: 'Under Maintenance' }
          ]} />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4">Save Unit</button>
        </form>
      </Modal>

    </DashboardLayout>
  );
};

export default MachineManagement;

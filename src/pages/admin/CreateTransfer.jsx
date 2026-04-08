import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FormInput from '../../components/FormInput';
import api from '../../services/api';

const CreateTransfer = () => {
  const navigate = useNavigate();
  const [machines, setmachines] = useState([]);
  const [sites, setSites] = useState([]);
  const [formData, setFormData] = useState({
    machineId: '',
    fromLocationType: '',
    fromLocationId: '',
    toLocationType: '',
    toLocationId: '',
    quantity: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [machinesRes, sitesRes] = await Promise.all([
        api.get('/machines'),
        api.get('/sites'),
      ]);
      setmachines(machinesRes.data.data);
      setSites(sitesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/movements', formData);
      navigate('/admin/movements');
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert(error.response?.data?.message || 'Error creating transfer');
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Machine Transfer</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <FormInput
            label="Select Machine"
            type="select"
            name="machineId"
            value={formData.machineId}
            onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
            options={machines.map(m => ({ value: m._id, label: `${m.name} (${m.code})` }))}
            required
          />

          <FormInput
            label="From Location Type"
            type="select"
            name="fromLocationType"
            value={formData.fromLocationType}
            onChange={(e) => setFormData({ ...formData, fromLocationType: e.target.value, fromLocationId: '' })}
            options={[
              { value: 'store', label: 'Store' },
              { value: 'site', label: 'Site' },
            ]}
            required
          />

          {formData.fromLocationType === 'site' && (
            <FormInput
              label="From Site"
              type="select"
              name="fromLocationId"
              value={formData.fromLocationId}
              onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
              options={sites.map(s => ({ value: s._id, label: s.name }))}
              required
            />
          )}

          <FormInput
            label="To Location Type"
            type="select"
            name="toLocationType"
            value={formData.toLocationType}
            onChange={(e) => setFormData({ ...formData, toLocationType: e.target.value, toLocationId: '' })}
            options={[
              { value: 'store', label: 'Store' },
              { value: 'site', label: 'Site' },
              { value: 'repair', label: 'Repair' },
            ]}
            required
          />

          {formData.toLocationType === 'site' && (
            <FormInput
              label="To Site"
              type="select"
              name="toLocationId"
              value={formData.toLocationId}
              onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
              options={sites.map(s => ({ value: s._id, label: s.name }))}
              required
            />
          )}

          <FormInput
            label="Quantity"
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            required
          />

          <FormInput
            label="Notes"
            type="textarea"
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Create Transfer
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/movements')}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateTransfer;

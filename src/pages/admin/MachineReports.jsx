import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const MachineReports = () => {
  const [machines, setmachines] = useState([]);

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const { data } = await api.get('/machine-units?status=repair');
      setmachines(data.data);
    } catch (error) {
      console.error('Error fetching repair machines:', error);
    }
  };

  const handleMarkFixed = async (machineUnitId) => {
    if (window.confirm('Mark this machine as Fixed and Available?')) {
      try {
        await api.post('/repairs/mark-fixed', { machineUnitId });
        fetchRepairs();
        alert('Machine marked as fixed!');
      } catch (error) {
        console.error('Error fixing machine:', error);
        alert(error.response?.data?.message || 'Error occurred');
      }
    }
  };

  const columns = [
    { key: 'serialNumber', label: 'Serial No.' },
    { key: 'machineTypeId', label: 'Machine Type', render: (val) => val?.name || '-' },
    { key: 'category', label: 'Category', render: (_, item) => item.machineTypeId?.category || '-' },
    { key: 'condition', label: 'Condition' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'updatedAt', label: 'Last Updated', render: (val) => new Date(val).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Repair Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {machines.map((item) => (
                <tr key={item._id}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleMarkFixed(item._id)} className="text-green-600 hover:text-green-900 font-semibold px-3 py-1 bg-green-50 rounded">
                      Mark as Fixed
                    </button>
                  </td>
                </tr>
              ))}
              {machines.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-4 text-center text-gray-500 text-sm">
                    No machines currently in repair.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MachineReports;

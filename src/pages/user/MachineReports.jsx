import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';

const MachineReports = () => {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data } = await api.get('/reports');
      setReports(data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const columns = [
    { key: 'siteId', label: 'Site', render: (val) => val?.name || '-' },
    { key: 'machineUnitId', label: 'Machine', render: (val) => val ? `${val.machineTypeId?.name} (SN: ${val.serialNumber})` : '-' },
    { key: 'issue', label: 'Issue' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'repairCost', label: 'Repair Cost', render: (val) => val ? `₹${val.toLocaleString()}` : '-' },
    { key: 'createdAt', label: 'Report Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Machine Reports</h1>

      <div className="bg-white rounded-lg shadow">
        {reports.length > 0 ? (
          <DataTable columns={columns} data={reports} />
        ) : (
          <EmptyState message="No machine reports" />
        )}
      </div>
    </DashboardLayout>
  );
};

export default MachineReports;

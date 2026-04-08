import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const SiteList = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);

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

  const columns = [
    { key: 'name', label: 'Site Name' },
    { key: 'address', label: 'Address' },
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
        <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
        <button
          onClick={() => navigate('/admin/create-site')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Site
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={sites} onView={handleView} />
      </div>
    </DashboardLayout>
  );
};

export default SiteList;

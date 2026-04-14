import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import DataTable from '../../components/DataTable';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    totalEstimatedCost: 0,
    totalGivenAmount: 0,
    totalExpenses: 0,
    machinesAvailable: 0,
    machinesInRepair: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshUser();
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentActivity()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const fetchStats = async () => {
    try {
      const [sites, installments, expenses, machines] = await Promise.all([
        api.get('/sites'),
        api.get('/installments'),
        api.get('/expenses'),
        api.get('/machines'),
      ]);

      const activeSites = sites.data.data.filter(s => !['completed', 'cancelled'].includes(s.status));
      const totalEstimatedCost = sites.data.data.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);
      const totalGivenAmount = installments.data.data.reduce((sum, i) => sum + i.amount, 0);
      const totalExpenses = expenses.data.data.reduce((sum, e) => sum + e.amount, 0);
      const availablemachines = machines.data.data.filter(m => m.status === 'available');
      const repairmachines = machines.data.data.filter(m => m.status === 'repair');

      setStats({
        totalSites: sites.data.data.length,
        activeSites: activeSites.length,
        totalEstimatedCost,
        totalGivenAmount,
        totalExpenses,
        machinesAvailable: availablemachines.length,
        machinesInRepair: repairmachines.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const { data } = await api.get('/expenses?limit=5');
      setRecentActivity(data.data || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const activityColumns = [
    {
      key: 'siteId', label: 'Site', render: (val) => (
        <span className="font-semibold text-gray-900">{val?.name || '-'}</span>
      )
    },
    {
      key: 'category', label: 'Category', render: (val) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{val}</span>
      )
    },
    {
      key: 'amount', label: 'Amount', render: (val) => (
        <span className="text-indigo-600 font-bold">₹{val.toLocaleString()}</span>
      )
    },
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/admin/reports')}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Download Report
          </button>
          <button 
            onClick={() => navigate('/admin/create-site')}
            className="px-3 py-2 bg-indigo-600 rounded-xl text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
          >
            + New Site
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-10">
        <DashboardCard
          title="Total Sites"
          value={stats.totalSites}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <DashboardCard
          title="Active Sites"
          value={stats.activeSites}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <DashboardCard
          title="Total Budget"
          value={`₹${(stats.totalEstimatedCost / 100000).toFixed(1)}L`}
          color="purple"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        />
        <DashboardCard
          title="Expenses"
          value={`₹${(stats.totalExpenses / 1000).toFixed(1)}K`}
          color="red"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>



      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Transactions</h2>
          <button className="text-indigo-600 font-semibold text-sm hover:text-indigo-700">View All Transactions</button>
        </div>
        <DataTable columns={activityColumns} data={recentActivity} />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

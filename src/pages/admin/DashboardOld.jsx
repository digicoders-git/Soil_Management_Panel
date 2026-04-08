import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    moneyGiven: 0,
    totalExpenses: 0,
    machinesAvailable: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [sites, installments, expenses, machines] = await Promise.all([
        api.get('/sites'),
        api.get('/installments'),
        api.get('/expenses'),
        api.get('/machines'),
      ]);

      const activeSites = sites.data.data.filter(s => s.status === 'active');
      const moneyGiven = installments.data.data.reduce((sum, i) => sum + i.amount, 0);
      const totalExpenses = expenses.data.data.reduce((sum, e) => sum + e.amount, 0);
      const availablemachines = machines.data.data.filter(m => m.status === 'available');

      setStats({
        totalSites: sites.data.data.length,
        activeSites: activeSites.length,
        moneyGiven,
        totalExpenses,
        machinesAvailable: availablemachines.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Total Sites"
          value={stats.totalSites}
          color="blue"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <DashboardCard
          title="Active Sites"
          value={stats.activeSites}
          color="green"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <DashboardCard
          title="Money Given"
          value={`₹${stats.moneyGiven.toLocaleString()}`}
          color="purple"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <DashboardCard
          title="Total Expenses"
          value={`₹${stats.totalExpenses.toLocaleString()}`}
          color="red"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <DashboardCard
          title="machines Available"
          value={stats.machinesAvailable}
          color="indigo"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

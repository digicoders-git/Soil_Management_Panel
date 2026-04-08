import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const UserDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSites: 0,
    activeSites: 0,
    totalReceived: 0,
    totalExpense: 0,
    remainingBalance: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [activeSites, setActiveSites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    };
    fetchData();
  }, []);

  const fetchStats = async () => {
    try {
      const [sites, installments, expenses] = await Promise.all([
        api.get('/sites'),
        api.get('/installments'),
        api.get('/expenses'),
      ]);

      const activeSitesList = sites.data.data.filter(s => !['completed', 'cancelled'].includes(s.status));
      const totalReceived = installments.data.data.reduce((sum, i) => sum + i.amount, 0);
      const totalExpense = expenses.data.data.reduce((sum, e) => sum + e.amount, 0);

      setStats({
        totalSites: sites.data.data.length,
        activeSites: activeSitesList.length,
        totalReceived,
        totalExpense,
        remainingBalance: totalReceived - totalExpense,
      });

      setActiveSites(activeSitesList.slice(0, 3));
      setRecentExpenses(expenses.data.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Site Incharge Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your assigned sites and track daily expenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <DashboardCard
          title="Assigned Sites"
          value={stats.totalSites}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <DashboardCard
          title="Money Received"
          value={`₹${(stats.totalReceived / 1000).toFixed(1)}K`}
          color="indigo"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <DashboardCard
          title="Balance"
          value={`₹${(stats.remainingBalance / 1000).toFixed(1)}K`}
          color={stats.remainingBalance >= 0 ? 'green' : 'red'}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">Recent Expenses</h2>
            <button onClick={() => navigate('/user/expenses')} className="text-indigo-600 text-sm font-semibold hover:text-indigo-700">View All</button>
          </div>
          <div className="space-y-4">
            {recentExpenses.map((expense, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all duration-200">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{expense.category}</p>
                    <p className="text-xs text-gray-500">{expense.description}</p>
                  </div>
                </div>
                <span className="text-rose-600 font-bold">₹{expense.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-gray-900">My Priority Sites</h2>
            <button onClick={() => navigate('/user/sites')} className="text-indigo-600 text-sm font-semibold hover:text-indigo-700">Manage Sites</button>
          </div>
          <div className="space-y-4">
            {activeSites.map((site) => (
              <div
                key={site._id}
                className="p-5 border border-gray-100 rounded-3xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/user/sites/${site._id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{site.name}</h3>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-lg">Active</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{site.address}</p>
                <div className="flex items-center text-xs font-semibold text-indigo-600">
                  Enter Work Update
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';
import * as XLSX from 'xlsx';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    users: [], sites: [], expenses: [], machines: [], funds: [], installments: [], dailyUpdates: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [usersRes, sitesRes, expensesRes, machinesRes, fundsRes, installmentsRes, updatesRes] = await Promise.all([
        api.get('/users'),
        api.get('/sites'),
        api.get('/expenses'),
        api.get('/machine-units'),
        api.get('/admin-funds'),
        api.get('/installments'),
        api.get('/daily-updates'),
      ]);
      setData({
        users: usersRes.data.data || [],
        sites: sitesRes.data.data || [],
        expenses: expensesRes.data.data || [],
        machines: machinesRes.data.data || [],
        funds: fundsRes.data.data || [],
        installments: installmentsRes.data.data || [],
        dailyUpdates: updatesRes.data.data || [],
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center h-64 text-lg font-bold text-gray-500">Loading...</div></DashboardLayout>;

  const { users, sites, expenses, machines, funds, installments, dailyUpdates } = data;

  const admins = users.filter(u => u.role === 'admin');
  const supervisors = users.filter(u => u.role === 'user');
  const activeSites = sites.filter(s => !['completed', 'cancelled', 'closed'].includes(s.status));
  const completedSites = sites.filter(s => s.status === 'completed');
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFunds = funds.reduce((sum, f) => sum + f.amount, 0);
  const totalInstallments = installments.reduce((sum, i) => sum + i.amount, 0);
  const availableMachines = machines.filter(m => m.status === 'available');
  const assignedMachines = machines.filter(m => m.status === 'assigned');
  const balance = totalInstallments - totalExpenses;

  // Site-wise progress from daily updates
  const siteProgress = sites.map(site => {
    const siteUpdates = dailyUpdates.filter(u => (u.siteId?._id || u.siteId) === site._id);
    const totalProgress = siteUpdates.reduce((sum, u) => sum + (Number(u.progress) || 0), 0);
    const siteInstallments = installments.filter(i => (i.siteId?._id || i.siteId) === site._id);
    const siteExpenses = expenses.filter(e => (e.siteId?._id || e.siteId) === site._id);
    const given = siteInstallments.reduce((sum, i) => sum + i.amount, 0);
    const spent = siteExpenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      ...site,
      progress: Math.min(totalProgress, 100),
      given,
      spent,
      balance: given - spent,
    };
  });

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(users.map(u => ({ Name: u.name, Email: u.email, Role: u.role, Status: u.isActive ? 'Active' : 'Inactive' }))), 'Users');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sites.map(s => ({ Name: s.name, Status: s.status, 'Est. Cost': s.estimatedCost, 'Start Date': s.startDate ? new Date(s.startDate).toLocaleDateString() : '' }))), 'Sites');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses.map(e => ({ Amount: e.amount, Category: e.category, Description: e.description, Site: e.siteId?.name || '' }))), 'Expenses');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(installments.map(i => ({ Amount: i.amount, Site: i.siteId?.name || '', Supervisor: i.receivedBy?.name || '', Note: i.note || '' }))), 'Installments');
    XLSX.writeFile(wb, `superadmin-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text('SuperAdmin Report', 14, y); y += 8;
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y); y += 10;
    const rows = [
      ['Total Admins', admins.length], ['Total Supervisors', supervisors.length],
      ['Total Sites', sites.length], ['Active Sites', activeSites.length], ['Completed Sites', completedSites.length],
      ['Total Machines', machines.length], ['Available Machines', availableMachines.length],
      ['Total Installments', `Rs ${totalInstallments.toLocaleString()}`],
      ['Total Expenses', `Rs ${totalExpenses.toLocaleString()}`],
      ['Balance', `Rs ${balance.toLocaleString()}`],
    ];
    rows.forEach(([k, v]) => { doc.text(`${k}: ${v}`, 14, y); y += 7; });
    y += 5;
    doc.setFont(undefined, 'bold'); doc.text('Site-wise Summary', 14, y); y += 7;
    doc.setFont(undefined, 'normal');
    siteProgress.forEach(s => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${s.name} | Status: ${s.status} | Progress: ${s.progress}% | Given: Rs${s.given} | Spent: Rs${s.spent}`, 14, y);
      y += 6;
    });
    doc.save(`superadmin-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SuperAdmin Dashboard</h1>
          <p className="text-gray-500 mt-1">Global overview of all system data.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Excel
          </button>
          <button onClick={exportToPdf} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Export PDF
          </button>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-gray-700">System Live</span>
          </div>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Admins"
          value={admins.length}
          color="purple"
          onClick={() => navigate('/superadmin/admins')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <DashboardCard
          title="Total Supervisors"
          value={supervisors.length}
          color="indigo"
          onClick={() => navigate('/admin/supervisorManagement')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <DashboardCard
          title="Active Sites"
          value={`${activeSites.length} / ${sites.length}`}
          color="blue"
          onClick={() => navigate('/admin/sites')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <DashboardCard
          title="Available Machines"
          value={`${availableMachines.length} / ${machines.length}`}
          color="green"
          onClick={() => navigate('/admin/machines/units')}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/admin/installments')}>
          <p className="text-sm opacity-80 mb-1">Total Installments Given</p>
          <p className="text-4xl font-extrabold">₹{totalInstallments.toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-2">Click to manage installments</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-lg transition-all" onClick={() => navigate('/admin/expenses-monitor')}>
          <p className="text-sm opacity-80 mb-1">Total Expenses</p>
          <p className="text-4xl font-extrabold">₹{totalExpenses.toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-2">Click to view expenses</p>
        </div>
        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-red-500'} rounded-2xl p-6 text-white`}>
          <p className="text-sm opacity-80 mb-1">Current Balance</p>
          <p className="text-4xl font-extrabold">₹{balance.toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-2">Installments - Expenses</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Manage Admins', path: '/superadmin/admins', color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { label: 'Dispatch Funds', path: '/superadmin/funds', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'All Sites', path: '/admin/sites', color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Machine Units', path: '/admin/machines/units', color: 'bg-orange-50 text-orange-700 border-orange-100' },
        ].map(({ label, path, color }) => (
          <button key={path} onClick={() => navigate(path)} className={`p-4 rounded-2xl border font-bold text-sm hover:shadow-md transition-all active:scale-95 ${color}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Site-wise Progress Cards */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Site-wise Progress & Financials</h2>
          <button onClick={() => navigate('/admin/sites')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">View All →</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {siteProgress.map(site => (
            <div
              key={site._id}
              onClick={() => navigate(`/admin/sites/${site._id}`)}
              className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{site.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">
                    {Array.isArray(site.userId) && site.userId.length > 0
                      ? site.userId.map(u => u.name).join(', ')
                      : 'No supervisor'}
                  </p>
                </div>
                <StatusBadge status={site.status} />
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Work Progress</span>
                  <span className="font-bold text-gray-700">{site.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${site.progress >= 90 ? 'bg-green-500' : site.progress >= 50 ? 'bg-blue-500' : 'bg-orange-400'}`}
                    style={{ width: `${site.progress}%` }}
                  />
                </div>
              </div>

              {/* Financial Mini Summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Given</p>
                  <p className="text-xs font-bold text-green-600">₹{site.given.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Spent</p>
                  <p className="text-xs font-bold text-red-600">₹{site.spent.toLocaleString()}</p>
                </div>
                <div className={`${site.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg p-2`}>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className={`text-xs font-bold ${site.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>₹{site.balance.toLocaleString()}</p>
                </div>
              </div>

              <p className="text-xs text-indigo-400 text-right mt-3 group-hover:underline">View Details →</p>
            </div>
          ))}
          {siteProgress.length === 0 && (
            <p className="text-gray-400 text-sm col-span-full py-8 text-center">No sites found.</p>
          )}
        </div>
      </div>

      {/* Admin-wise Fund Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Admin-wise Fund Dispatch</h2>
          <button onClick={() => navigate('/superadmin/funds')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">Manage →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Admin</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Total Funds Received</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Sites</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map(admin => {
                const adminFunds = funds.filter(f => (f.adminId?._id || f.adminId) === admin._id);
                const adminFundTotal = adminFunds.reduce((sum, f) => sum + f.amount, 0);
                const adminSites = sites.filter(s => (s.adminId?._id || s.adminId) === admin._id);
                return (
                  <tr key={admin._id} onClick={() => navigate('/superadmin/admins')} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 font-semibold text-gray-800">{admin.name}</td>
                    <td className="px-6 py-4 text-green-600 font-bold">₹{adminFundTotal.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{adminSites.length} sites</td>
                  </tr>
                );
              })}
              {admins.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No admins found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default SuperAdminDashboard;

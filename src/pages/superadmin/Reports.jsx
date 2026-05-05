import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DashboardCard from '../../components/DashboardCard';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';

const Reports = () => {
  const [summary, setSummary] = useState({ totalRevenue: 0, totalExpenses: 0, totalInstallments: 0, netProfit: 0 });
  const [expenses, setExpenses] = useState([]);
  const [installments, setInstallments] = useState([]);

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    try {
      const [expRes, instRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/installments'),
      ]);
      const expData = expRes.data.data;
      const instData = instRes.data.data;
      const totalExpenses = expData.reduce((sum, e) => sum + e.amount, 0);
      const totalInstallments = instData.reduce((sum, i) => sum + i.amount, 0);
      setExpenses(expData);
      setInstallments(instData);
      setSummary({ totalRevenue: totalInstallments, totalExpenses, totalInstallments, netProfit: totalInstallments - totalExpenses });
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const expenseColumns = [
    { key: 'siteId', label: 'Site' },
    { key: 'amount', label: 'Amount' },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date' },
  ];

  const installmentColumns = [
    { key: 'siteId', label: 'Site' },
    { key: 'receivedBy', label: 'Supervisor' },
    { key: 'amount', label: 'Amount' },
    { key: 'note', label: 'Note' },
    { key: 'date', label: 'Date' },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex gap-2">
          <ExportButtons
            onExcel={() => {
              const combined = [
                ...expenses.map(e => ({
                  ...e,
                  type: 'Expense',
                  supervisor: e.userId?.name || '-',
                  siteName: e.siteId?.name || '-',
                  expense_amt: e.amount,
                  advance_amt: 0
                })),
                ...installments.map(i => ({
                  ...i,
                  type: 'Advance',
                  supervisor: i.receivedBy?.name || '-',
                  siteName: i.siteId?.name || '-',
                  expense_amt: 0,
                  advance_amt: i.amount,
                  description: i.note
                }))
              ].sort((a, b) => new Date(b.date) - new Date(a.date));

              exportToExcel(combined, [
                { key: 'siteName', label: 'Site' },
                { key: 'date', label: 'Date' },
                { key: 'supervisor', label: 'Supervisor' },
                { key: 'type', label: 'Type' },
                { key: 'advance_amt', label: 'Advance Given' },
                { key: 'expense_amt', label: 'Expense Amount' },
                { key: 'category', label: 'Category' },
                { key: 'description', label: 'Description/Note' },
              ], 'reports');
            }}
            onPdf={() => {
              const combined = [
                ...expenses.map(e => ({ ...e, type: 'Expense', supervisor: e.userId?.name || '-' })),
                ...installments.map(i => ({ ...i, type: 'Advance', supervisor: i.receivedBy?.name || '-', description: i.note }))
              ].sort((a, b) => new Date(b.date) - new Date(a.date));

              exportToPdf(combined, [
                { key: 'siteId', label: 'Site' },
                { key: 'date', label: 'Date' },
                { key: 'supervisor', label: 'Supervisor' },
                { key: 'type', label: 'Type' },
                { key: 'amount', label: 'Amount' },
              ], 'Reports & Analytics', 'reports');
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Revenue"
          value={`₹${summary.totalRevenue.toLocaleString()}`}
          color="green"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
        />
        <DashboardCard
          title="Total Expenses"
          value={`₹${summary.totalExpenses.toLocaleString()}`}
          color="red"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}
        />
        <DashboardCard
          title="Total Installments"
          value={`₹${summary.totalInstallments.toLocaleString()}`}
          color="blue"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <DashboardCard
          title="Net Profit"
          value={`₹${summary.netProfit.toLocaleString()}`}
          color="purple"
          icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
        <p className="text-gray-600">Detailed analytics and charts will be displayed here.</p>
      </div>
    </DashboardLayout>
  );
};

export default Reports;

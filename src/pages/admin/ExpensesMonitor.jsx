import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import FormInput from '../../components/FormInput';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';

const ExpensesMonitor = () => {
  const [expenses, setExpenses] = useState([]);
  const [sites, setSites] = useState([]);
  const [filters, setFilters] = useState({
    siteId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchSites();
    fetchExpenses();
  }, []);

  const fetchSites = async () => {
    try {
      const { data } = await api.get('/sites');
      setSites(data.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/expenses');
      setExpenses(data.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    if (filters.siteId && expense.siteId?._id !== filters.siteId) return false;
    if (filters.startDate && new Date(expense.date) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(expense.date) > new Date(filters.endDate)) return false;
    return true;
  });

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const columns = [
    { key: 'siteId', label: 'Site', render: (val) => val?.name || '-' },
    { key: 'userId', label: 'supervisor', render: (val) => val?.name || '-' },
    { key: 'amount', label: 'Amount', render: (val) => `₹${val.toLocaleString()}` },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Expenses Monitor</h1>
        <ExportButtons
          onExcel={() => exportToExcel(filteredExpenses, [{key:'siteId',label:'Site'},{key:'userId',label:'Supervisor'},{key:'amount',label:'Amount'},{key:'category',label:'Category'},{key:'description',label:'Description'},{key:'date',label:'Date'}], 'expenses')}
          onPdf={() => exportToPdf(filteredExpenses, [{key:'siteId',label:'Site'},{key:'userId',label:'Supervisor'},{key:'amount',label:'Amount'},{key:'category',label:'Category'},{key:'date',label:'Date'}], 'Expenses Report', 'expenses')}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            label="Filter by Site"
            type="select"
            name="siteId"
            value={filters.siteId}
            onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}
            options={sites.map(s => ({ value: s._id, label: s.name }))}
          />
          <FormInput
            label="Start Date"
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <FormInput
            label="End Date"
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        <button
          onClick={() => setFilters({ siteId: '', startDate: '', endDate: '' })}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-lg font-semibold mb-2">Total Expense</h2>
        <p className="text-3xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={filteredExpenses} />
      </div>
    </DashboardLayout>
  );
};

export default ExpensesMonitor;

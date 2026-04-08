import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const SiteWork = () => {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [machines, setmachines] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
  });

  const [reportForm, setReportForm] = useState({
    machineId: '',
    issue: '',
  });

  useEffect(() => {
    fetchSiteData();
  }, [id]);

  const fetchSiteData = async () => {
    try {
      const [siteRes, machinesRes, expensesRes] = await Promise.all([
        api.get(`/sites/${id}`),
        api.get(`/site-machines?siteId=${id}`),
        api.get(`/expenses?siteId=${id}`),
      ]);

      setSite(siteRes.data.data);
      setmachines(machinesRes.data.data || []);
      setExpenses(expensesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching site data:', error);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', { ...expenseForm, siteId: id });
      setExpenseForm({ amount: '', category: '', description: '' });
      fetchSiteData();
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports', { ...reportForm, siteId: id });
      setReportForm({ machineId: '', issue: '' });
      alert('Machine issue reported successfully');
    } catch (error) {
      console.error('Error reporting issue:', error);
    }
  };

  const handleReturnMachine = async (machineAssignment) => {
    if (window.confirm('Mark this machine as returned?')) {
      try {
        await api.put(`/site-machines/${machineAssignment._id}/return`);
        fetchSiteData();
      } catch (error) {
        console.error('Error returning machine:', error);
      }
    }
  };

  const expenseColumns = [
    { key: 'amount', label: 'Amount', render: (val) => `₹${val.toLocaleString()}` },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  if (!site) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{site.name} - Work Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Add Daily Expense</h2>
          <form onSubmit={handleExpenseSubmit}>
            <FormInput
              label="Amount"
              type="number"
              name="amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
            />
            <FormInput
              label="Category"
              type="select"
              name="category"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              options={[
                { value: 'labour', label: 'Labour' },
                { value: 'transport', label: 'Transport' },
                { value: 'food', label: 'Food' },
                { value: 'repair', label: 'Repair' },
                { value: 'other', label: 'Other' },
              ]}
              required
            />
            <FormInput
              label="Description"
              type="textarea"
              name="description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Add Expense
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Report Machine Issue</h2>
          <form onSubmit={handleReportSubmit}>
            <FormInput
              label="Select Machine"
              type="select"
              name="machineId"
              value={reportForm.machineId}
              onChange={(e) => setReportForm({ ...reportForm, machineId: e.target.value })}
              options={machines.map(m => ({ value: m.machineId?._id, label: m.machineId?.name }))}
              required
            />
            <FormInput
              label="Issue Description"
              type="textarea"
              name="issue"
              value={reportForm.issue}
              onChange={(e) => setReportForm({ ...reportForm, issue: e.target.value })}
              required
            />
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
            >
              Report Issue
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Assigned machines</h2>
        <div className="space-y-3">
          {machines.filter(m => m.status === 'assigned').map((machine) => (
            <div key={machine._id} className="flex justify-between items-center border-b pb-3">
              <div>
                <p className="font-medium">{machine.machineId?.name}</p>
                <p className="text-sm text-gray-600">Quantity: {machine.quantity}</p>
                <StatusBadge status={machine.status} />
              </div>
              <button
                onClick={() => handleReturnMachine(machine)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mark Returned
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Expense History</h2>
        </div>
        <DataTable columns={expenseColumns} data={expenses} />
      </div>
    </DashboardLayout>
  );
};

export default SiteWork;

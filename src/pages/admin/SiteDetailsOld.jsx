import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';

const SiteDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [site, setSite] = useState(null);
  const [machines, setmachines] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchSiteDetails();
  }, [id]);

  const fetchSiteDetails = async () => {
    try {
      const [siteRes, machinesRes, installmentsRes, expensesRes, reportsRes] = await Promise.all([
        api.get(`/sites/${id}`),
        api.get(`/site-machines?siteId=${id}`),
        api.get(`/installments?siteId=${id}`),
        api.get(`/expenses?siteId=${id}`),
        api.get(`/reports?siteId=${id}`),
      ]);

      setSite(siteRes.data.data);
      setmachines(machinesRes.data.data || []);
      setInstallments(installmentsRes.data.data || []);
      setExpenses(expensesRes.data.data || []);
      setReports(reportsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching site details:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'machines', label: 'machines Assigned' },
    { id: 'installments', label: 'Installments' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'reports', label: 'Machine Reports' },
  ];

  const machineColumns = [
    { key: 'machineId', label: 'Machine', render: (val) => val?.name || '-' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'assignedDate', label: 'Assigned Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  const installmentColumns = [
    { key: 'amount', label: 'Amount', render: (val) => `₹${val.toLocaleString()}` },
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'note', label: 'Note' },
  ];

  const expenseColumns = [
    { key: 'amount', label: 'Amount', render: (val) => `₹${val.toLocaleString()}` },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  const reportColumns = [
    { key: 'machineId', label: 'Machine', render: (val) => val?.name || '-' },
    { key: 'issue', label: 'Issue' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'repairCost', label: 'Repair Cost', render: (val) => val ? `₹${val.toLocaleString()}` : '-' },
  ];

  if (!site) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{site.name}</h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{site.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Cost</p>
              <p className="font-medium">₹{site.estimatedCost?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <StatusBadge status={site.status} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium">{new Date(site.startDate).toLocaleDateString()}</p>
            </div>
            {site.notes && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="font-medium">{site.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'machines' && (
        <div className="bg-white rounded-lg shadow">
          {machines.length > 0 ? (
            <DataTable columns={machineColumns} data={machines} />
          ) : (
            <EmptyState message="No machines assigned" />
          )}
        </div>
      )}

      {activeTab === 'installments' && (
        <div className="bg-white rounded-lg shadow">
          {installments.length > 0 ? (
            <DataTable columns={installmentColumns} data={installments} />
          ) : (
            <EmptyState message="No installments given" />
          )}
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-lg shadow">
          {expenses.length > 0 ? (
            <DataTable columns={expenseColumns} data={expenses} />
          ) : (
            <EmptyState message="No expenses recorded" />
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow">
          {reports.length > 0 ? (
            <DataTable columns={reportColumns} data={reports} />
          ) : (
            <EmptyState message="No machine reports" />
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default SiteDetails;

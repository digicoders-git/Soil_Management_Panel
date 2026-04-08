import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Tabs from '../../components/Tabs';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SiteWork = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [site, setSite] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [reports, setReports] = useState([]);
  const [settlement, setSettlement] = useState(null);
  const [operatorAssignments, setOperatorAssignments] = useState([]);
  const [operators, setOperators] = useState([]);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [operatorForm, setOperatorForm] = useState({ operatorId: '', startDate: '', endDate: '' });
  const [siteMachines, setSiteMachines] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [repairModal, setRepairModal] = useState({ isOpen: false, reportId: '', cost: '' });
  const [assignOperatorModal, setAssignOperatorModal] = useState({ isOpen: false, machineId: '' });
  const [isCreateOperatorOpen, setIsCreateOperatorOpen] = useState(false);
  const [newOperatorName, setNewOperatorName] = useState('');
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: '',
    description: '',
  });

  const [updateForm, setUpdateForm] = useState({
    workDescription: '',
    progress: '',
    notes: '',
  });

  const [reportForm, setReportForm] = useState({
    machineId: '',
    issue: '',
    estimatedCost: '',
  });

  const [settlementForm, setSettlementForm] = useState({
    returnAmount: '',
    notes: '',
  });

  useEffect(() => {
    fetchSiteData();
  }, [id]);

  const fetchSiteData = async () => {
    try {
      const [siteRes, expensesRes, installmentsRes, updatesRes, reportsRes, settlementRes, operatorRes, machinesRes] = await Promise.all([
        api.get(`/sites/${id}`),
        api.get(`/expenses?siteId=${id}`),
        api.get(`/installments?siteId=${id}`),
        api.get(`/daily-updates?siteId=${id}`),
        api.get(`/reports?siteId=${id}`),
        api.get(`/site-settlements?siteId=${id}`),
        api.get(`/operator-assignments?siteId=${id}`),
        api.get(`/machine-units?assignedUserId=${user._id}`),
      ]);

      setSite(siteRes.data.data);
      setExpenses(expensesRes.data.data || []);
      setInstallments(installmentsRes.data.data || []);
      setDailyUpdates(updatesRes.data.data || []);
      setReports(reportsRes.data.data || []);
      setSettlement(settlementRes.data.data?.[0] || null);
      setOperatorAssignments(operatorRes.data.data || []);
      setSiteMachines(machinesRes.data.data || []);
      const opRes = await api.get('/operators');
      setOperators(opRes.data.data || []);
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

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/daily-updates', { ...updateForm, siteId: id });
      setUpdateForm({ workDescription: '', progress: '', notes: '' });
      fetchSiteData();
    } catch (error) {
      console.error('Error submitting daily update:', error);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reports', {
        siteId: id,
        machineUnitId: reportForm.machineId,
        issue: reportForm.issue,
        estimatedCost: reportForm.estimatedCost,
      });
      setReportForm({ machineId: '', issue: '', estimatedCost: '' });
      alert('Machine issue reported. It is now marked for repair.');
      fetchSiteData();
    } catch (error) {
      console.error('Error reporting issue:', error);
    }
  };

  const handleMarkCompleted = async () => {
    if (window.confirm('Mark this site as completed?')) {
      try {
        await api.put(`/sites/${id}`, { status: 'completed' });
        fetchSiteData();
      } catch (error) {
        console.error('Error marking site as completed:', error);
      }
    }
  };

  const handleFinalSubmit = async () => {
    try {
      await api.post('/site-settlements', {
        siteId: id,
        returnAmount: settlementForm.returnAmount,
        notes: settlementForm.notes,
      });
      setIsConfirmModalOpen(false);
      alert('Settlement submitted for admin approval');
      fetchSiteData();
    } catch (error) {
      console.error('Error submitting settlement:', error);
    }
  };

  const handleMarkDead = async (reportId) => {
    if (window.confirm('Mark this machine as completely dead/scrapped? It will be removed from circulation.')) {
      try {
        await api.put(`/reports/${reportId}`, { status: 'dead' });
        fetchSiteData();
      } catch (error) {
        console.error('Error marking machine dead:', error);
      }
    }
  };

  const submitRepair = async () => {
    if (!repairModal.cost || isNaN(repairModal.cost)) {
      alert('Please enter a valid repair cost');
      return;
    }
    try {
      // 1. Mark report as fixed
      await api.put(`/reports/${repairModal.reportId}`, {
        status: 'fixed',
        repairCost: Number(repairModal.cost)
      });
      // 2. Add expense for repair
      await api.post('/expenses', {
        siteId: id,
        amount: Number(repairModal.cost),
        category: 'repair',
        description: 'Machine Repair log generated'
      });

      setRepairModal({ isOpen: false, reportId: '', cost: '' });
      alert('Machine marked as repaired and expense added successfully!');
      fetchSiteData();
    } catch (error) {
      console.error('Error repairing machine:', error);
      alert('Failed to update repair status.');
    }
  };

  const handleSaveOperatorAssignment = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await api.put(`/operator-assignments/${editingAssignment._id}`, operatorForm);
      } else {
        await api.post('/operator-assignments', { ...operatorForm, siteId: id });
      }
      setIsOperatorModalOpen(false);
      setEditingAssignment(null);
      setOperatorForm({ operatorId: '', startDate: '', endDate: '' });
      fetchSiteData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving.');
    }
  };

  const handleDeleteOperatorAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this operator work period?')) return;
    try {
      await api.delete(`/operator-assignments/${assignmentId}`);
      fetchSiteData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  const handleAssignOperatorToMachine = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/machine-units/${assignOperatorModal.machineId}/operator`, {
        operatorId: assignOperatorModal.operatorId,
        siteId: id
      });
      setAssignOperatorModal({ isOpen: false, machineId: '', operatorId: '' });
      fetchSiteData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error assigning operator.');
    }
  };

  const handleCreateOperator = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/operators', { name: newOperatorName });
      setOperators(prev => [...prev, data.data]);
      setNewOperatorName('');
      setIsCreateOperatorOpen(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating operator.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'machines', label: 'Machines' },
    { id: 'operators', label: 'Operators' },
    { id: 'updates', label: 'Daily Work' },
    { id: 'expense', label: 'Daily Expense' },
    { id: 'report', label: 'Report Issue' },
    { id: 'settlement', label: 'Settlement' },
  ];

  const expenseColumns = [
    { key: 'amount', label: 'Amount', render: (val) => `₹${val.toLocaleString()}` },
    { key: 'category', label: 'Category' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  const updateColumns = [
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'workDescription', label: 'Work Done' },
    { key: 'progress', label: 'Progress (%)', render: (val) => `${val}%` },
    { key: 'notes', label: 'Notes' },
  ];

  if (!site) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  const totalGiven = installments.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSettlementReturn = settlement && settlement.status === 'approved' ? (settlement.returnAmount || 0) : 0;
  const balance = totalGiven - totalExpense - totalSettlementReturn;
  const totalProgress = dailyUpdates.reduce((sum, update) => sum + (Number(update.progress) || 0), 0);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
        {!['completed', 'cancelled', 'closed'].includes(site.status) && (
          totalProgress >= 90 ? (
            <button
              onClick={handleMarkCompleted}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow"
            >
              Mark as Completed
            </button>
          ) : (
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
              Reach 90% progress to complete
            </span>
          )
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{site.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <StatusBadge status={site.status} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium">{new Date(site.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Work Progress</p>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${Math.min(totalProgress, 100)}%` }}></div>
                </div>
                <span className="text-sm font-medium">{totalProgress}%</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Budget Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Estimated Cost</p>
                <p className="text-xl font-bold text-blue-600">₹{site.estimatedCost?.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Given</p>
                <p className="text-xl font-bold text-green-600">₹{totalGiven.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Work Expense</p>
                <p className="text-xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Returned to Admin</p>
                <p className="text-xl font-bold text-indigo-600">₹{totalSettlementReturn.toLocaleString()}</p>
              </div>
              <div className={`${balance >= 0 ? 'bg-green-50' : 'bg-red-50'} p-4 rounded-lg`}>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'machines' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {siteMachines.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {siteMachines.map(m => (
                  <tr key={m._id}>
                    <td className="px-6 py-4 text-sm font-medium">{m.machineTypeId?.name}</td>
                    <td className="px-6 py-4 text-sm">{m.serialNumber}</td>
                    <td className="px-6 py-4 text-sm capitalize">{m.condition}</td>
                    <td className="px-6 py-4 text-sm">{m.currentSiteId?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm">{m.operatorId?.name || <span className="text-gray-400 text-xs">Not Assigned</span>}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        m.status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                        m.status === 'repair' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>{m.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setAssignOperatorModal({ isOpen: true, machineId: m._id, operatorId: m.operatorId?._id || '' })}
                        className="text-indigo-600 hover:text-indigo-900 font-semibold text-xs"
                      >
                        {m.operatorId ? 'Change Operator' : 'Assign Operator'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">No machines assigned to you.</div>
          )}
        </div>
      )}

      {activeTab === 'operators' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => { setIsOperatorModalOpen(true); setEditingAssignment(null); setOperatorForm({ operatorId: '', startDate: '', endDate: '' }); }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add Operator Work Period
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            {operatorAssignments.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {operatorAssignments.map(a => (
                    <tr key={a._id}>
                      <td className="px-6 py-4 text-sm font-medium">{a.operatorId?.name}</td>
                      <td className="px-6 py-4 text-sm">{a.machineUnitId ? `SN: ${a.machineUnitId.serialNumber}` : <span className="text-gray-400 text-xs">Site Level</span>}</td>
                      <td className="px-6 py-4 text-sm">{new Date(a.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm">{a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        {a.endDate && new Date(a.endDate) < new Date()
                          ? <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Completed</span>
                          : <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => { setEditingAssignment(a); setOperatorForm({ operatorId: a.operatorId?._id, startDate: a.startDate?.slice(0, 10), endDate: a.endDate?.slice(0, 10) || '' }); setIsOperatorModalOpen(true); }}
                          className="text-blue-600 hover:text-blue-900 font-semibold mr-3"
                        >Edit</button>
                        <button
                          onClick={() => handleDeleteOperatorAssignment(a._id)}
                          className="text-red-600 hover:text-red-900 font-semibold"
                        >Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">No operator work periods recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'updates' && (
        <div>
          {!['completed', 'cancelled', 'closed'].includes(site.status) && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Submit Daily Work Update</h2>
              <form onSubmit={handleUpdateSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormInput
                    label="Work Description"
                    type="textarea"
                    name="workDescription"
                    value={updateForm.workDescription}
                    onChange={(e) => setUpdateForm({ ...updateForm, workDescription: e.target.value })}
                    required
                  />
                  <FormInput
                    label="Progress (%)"
                    type="number"
                    name="progress"
                    value={updateForm.progress}
                    onChange={(e) => setUpdateForm({ ...updateForm, progress: e.target.value })}
                    required
                  />
                  <FormInput
                    label="Additional Notes"
                    type="textarea"
                    name="notes"
                    value={updateForm.notes}
                    onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Submit Update
                </button>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Work History</h2>
            </div>
            <DataTable columns={updateColumns} data={dailyUpdates} />
          </div>
        </div>
      )}

      {activeTab === 'expense' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Add Daily Expense</h2>
            <form onSubmit={handleExpenseSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  name="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Expense
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">Expense History</h2>
              <p className="text-sm text-gray-600">Total: ₹{totalExpense.toLocaleString()}</p>
            </div>
            <DataTable columns={expenseColumns} data={expenses} />
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Report Machine Issue</h2>
          <form onSubmit={handleReportSubmit}>
            <FormInput
              label="Select Machine"
              type="select"
              name="machineId"
              value={reportForm.machineId}
              onChange={(e) => setReportForm({ ...reportForm, machineId: e.target.value })}
              options={[
                { value: '', label: 'Select a Machine' },
              ]}
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
            <FormInput
              label="Estimated Repair Cost (₹)"
              type="number"
              name="estimatedCost"
              value={reportForm.estimatedCost}
              onChange={(e) => setReportForm({ ...reportForm, estimatedCost: e.target.value })}
              required
            />
            <button
              type="submit"
              className="mt-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
            >
              Report Issue
            </button>
          </form>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Reported Issues</h3>
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report._id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-red-600">Machine: {report.machineUnitId?.machineTypeId?.name} (SN: {report.machineUnitId?.serialNumber})</p>
                      <p className="text-sm text-gray-700 mt-1">{report.issue}</p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  {report.status !== 'fixed' && report.status !== 'dead' && (
                    <div className="flex space-x-3 mt-4 pt-3 border-t border-gray-200">
                      {report.status === 'approved' ? (
                        <button
                          onClick={() => setRepairModal({ isOpen: true, reportId: report._id, cost: report.estimatedCost || '' })}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-semibold"
                        >
                          Mark Repaired (Enter Final Cost)
                        </button>
                      ) : (
                        <p className="text-gray-500 text-sm mt-2 italic flex-1">
                          {report.status === 'rejected' ? 'Repair rejected.' : 'Wait for Admin to approve repair...'}
                        </p>
                      )}

                      {report.status !== 'rejected' && (
                        <button
                          onClick={() => handleMarkDead(report._id)}
                          className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-black"
                        >
                          Mark Dead / Scrap
                        </button>
                      )}
                    </div>
                  )}

                  {report.estimatedCost > 0 && report.status !== 'fixed' && (
                    <p className="text-sm font-semibold text-orange-600 mt-2">
                      Estimated Cost: ₹{report.estimatedCost}
                    </p>
                  )}

                  {report.status === 'fixed' && report.repairCost > 0 && (
                    <p className="text-sm font-semibold text-green-700 mt-2">
                      Repaired (Cost: ₹{report.repairCost})
                    </p>
                  )}
                </div>
              ))}
              {reports.length === 0 && (
                <p className="text-gray-500 text-sm">No machine issues reported on this site.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Estimated Cost</p>
                <p className="text-xl font-bold text-blue-600">₹{site.estimatedCost?.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Installment</p>
                <p className="text-xl font-bold text-green-600">₹{totalGiven.toLocaleString()}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Expense</p>
                <p className="text-xl font-bold text-red-600">₹{totalExpense.toLocaleString()}</p>
              </div>
              <div className={`${balance >= 0 ? 'bg-green-100' : 'bg-red-100'} p-4 rounded-lg border-2 ${balance >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                <p className="text-sm text-gray-600 font-semibold">Remaining Balance</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ₹{balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {(totalProgress < 90 && site.status !== 'completed') ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <h3 className="text-lg font-medium text-slate-800 mb-1">Settlement Locked</h3>
              <p>Please reach at least 90% work progress to initiate Final Settlement.</p>
            </div>
          ) : (
            <>

              {balance > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Return Remaining Balance</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Return</label>
                      <input
                        type="number"
                        min="0"
                        max={balance}
                        value={settlementForm.returnAmount}
                        onChange={e => {
                          const val = Math.min(Number(e.target.value), balance);
                          setSettlementForm({ ...settlementForm, returnAmount: val });
                        }}
                        placeholder={`Max: ₹${balance.toLocaleString()}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">Max returnable: ₹{balance.toLocaleString()}</p>
                    </div>
                    <FormInput
                      label="Notes"
                      type="textarea"
                      name="notes"
                      value={settlementForm.notes}
                      onChange={(e) => setSettlementForm({ ...settlementForm, notes: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
              )}

              {settlement ? (
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Settlement Submitted</h2>
                    <StatusBadge status={settlement.status} />
                  </div>
                  <p className="text-gray-600 mb-2">You have submitted the final settlement. Waiting for Admin approval.</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm"><span className="font-semibold">Returned Amount:</span> ₹{settlement.returnAmount}</p>
                    <p className="text-sm"><span className="font-semibold">Notes:</span> {settlement.notes || 'None'}</p>
                  </div>
                  {settlement.returnedmachines && settlement.returnedmachines.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">Returned machines:</h3>
                      <ul className="space-y-2">
                        {settlement.returnedmachines.map(m => (
                          <li key={m._id} className="text-sm bg-gray-50 p-2 rounded flex justify-between items-center border">
                            <span>{m.machineTypeId?.name} (SN: {m.serialNumber})</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold
                              ${m.condition === 'good' ? 'bg-green-100 text-green-800' :
                                m.condition === 'damaged' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              {m.condition}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {settlement.status === 'approved' && (
                    <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
                      <strong>Success!</strong> Admin has approved this settlement. No further action is required.
                    </div>
                  )}
                  {settlement.status === 'rejected' && (
                    <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200">
                      <strong>Rejected!</strong> Admin rejected your settlement. Please check with the admin or submit a new one.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={site.status !== 'completed'}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                  >
                    Submit for Admin Approval
                  </button>
                  {site.status !== 'completed' && (
                    <p className="text-sm text-gray-500 mt-2 text-center">Site must be marked as completed first</p>
                  )}
                </div>
              )}
            </>
          )}

          <Modal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            title="Confirm Settlement Submission"
          >
            <div className="space-y-4">
              <p className="text-gray-700">Are you sure you want to submit this settlement for admin approval?</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Return Amount: <span className="font-semibold">₹{settlementForm.returnAmount || 0}</span></p>
                <p className="text-sm text-gray-600">Remaining Balance: <span className="font-semibold">₹{balance.toLocaleString()}</span></p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleFinalSubmit}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Confirm Submit
                </button>
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>

          {/* Repair Cost Modal */}
          <Modal
            isOpen={repairModal.isOpen}
            onClose={() => setRepairModal({ isOpen: false, reportId: '', cost: '' })}
            title="Repair Machine & Log Expense"
          >
            <div className="space-y-4">
              <p className="text-gray-700 text-sm">
                Enter the cost of repairing the machine. This will automatically log a Daily Expense.
              </p>
              <FormInput
                label="Total Repair Cost (₹)"
                type="number"
                value={repairModal.cost}
                onChange={(e) => setRepairModal({ ...repairModal, cost: e.target.value })}
                placeholder="e.g. 5000"
                required
              />
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={submitRepair}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Submit Repair Cost
                </button>
                <button
                  onClick={() => setRepairModal({ isOpen: false, reportId: '', cost: '' })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      <Modal isOpen={isOperatorModalOpen} onClose={() => { setIsOperatorModalOpen(false); setEditingAssignment(null); }} title={editingAssignment ? 'Edit Work Period' : 'Add Operator Work Period'}>
        <form onSubmit={handleSaveOperatorAssignment}>
          <FormInput
            label="Select Operator"
            type="select"
            name="operatorId"
            value={operatorForm.operatorId}
            onChange={(e) => setOperatorForm({ ...operatorForm, operatorId: e.target.value })}
            options={operators.map(o => ({ value: o._id, label: o.name }))}
            required
          />
          <FormInput
            label="Start Date"
            type="date"
            name="startDate"
            value={operatorForm.startDate}
            onChange={(e) => setOperatorForm({ ...operatorForm, startDate: e.target.value })}
            required
          />
          <FormInput
            label="End Date (optional)"
            type="date"
            name="endDate"
            value={operatorForm.endDate}
            onChange={(e) => setOperatorForm({ ...operatorForm, endDate: e.target.value })}
          />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 mt-4">
            {editingAssignment ? 'Update' : 'Save'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={assignOperatorModal.isOpen} onClose={() => setAssignOperatorModal({ isOpen: false, machineId: '', operatorId: '' })} title="Assign Operator to Machine">
        <form onSubmit={handleAssignOperatorToMachine}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Operator</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={assignOperatorModal.operatorId}
              onChange={e => setAssignOperatorModal(p => ({ ...p, operatorId: e.target.value }))}
              required
            >
              <option value="">-- Select Operator --</option>
              {operators.map(o => (
                <option key={o._id} value={o._id}>{o.name}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOperatorOpen(true)}
            className="w-full mb-3 py-2 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50"
          >
            + Create New Operator
          </button>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-semibold">
            Assign
          </button>
        </form>
      </Modal>

      <Modal isOpen={isCreateOperatorOpen} onClose={() => setIsCreateOperatorOpen(false)} title="Create New Operator">
        <form onSubmit={handleCreateOperator}>
          <FormInput
            label="Operator Name"
            name="name"
            value={newOperatorName}
            onChange={e => setNewOperatorName(e.target.value)}
            required
          />
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">
            Create Operator
          </button>
        </form>
      </Modal>

    </DashboardLayout>
  );
};

export default SiteWork;

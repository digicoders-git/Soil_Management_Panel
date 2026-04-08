import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Tabs from '../../components/Tabs';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import EmptyState from '../../components/EmptyState';
import DeliveryChallan from '../../components/DeliveryChallan';
import api from '../../services/api';

const SiteDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [site, setSite] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [reports, setReports] = useState([]);
  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [supervisors, setsupervisors] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [issupervisorModalOpen, setIssupervisorModalOpen] = useState(false);
  const [selectedsupervisor, setSelectedsupervisor] = useState('');
  const [installmentForm, setInstallmentForm] = useState({ amount: '', note: '' });
  const [operatorAssignments, setOperatorAssignments] = useState([]);
  const [siteMachines, setSiteMachines] = useState([]);
  const [selectedSupervisorTxn, setSelectedSupervisorTxn] = useState(null); // for expense drill-down modal

  // Challan state
  const challanRef = useRef(null);
  const [challanSupervisor, setChallanSupervisor] = useState(null);
  const [challanMachines, setChallanMachines] = useState([]);
  const [machineVerification, setMachineVerification] = useState({}); // { [machineId]: { status: 'returned'|'missing', remark: '' } }
  const [isChallanFormOpen, setIsChallanFormOpen] = useState(false);
  const [isChallanOpen, setIsChallanOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [challanDetails, setChallanDetails] = useState({
    consignorName: 'Arun Soil Lab Private Limited',
    consignorAddress: '636/110, Budh Vihar, Takrohi, Lucknow-227105',
    consignorPincode: '227105',
    consignorGstin: '09AAECA9218M1Z9',
    consignorContact: '0522-2341943',
    consigneeName: '', consigneeAddress: '', consigneePincode: '',
    consigneeGstin: '', consigneeContact: '',
    challanNo: `ASL-${Date.now().toString().slice(-6)}`,
    challanDate: new Date().toLocaleDateString('en-IN'),
    suppliersRef: '', othersRef: '', buyersOrderNo: '', buyersOrderDate: '',
    dispatchDocNo: '', dispatchThrough: '', destination: '',
    vehicle: '', driverName: '', driverContact: '',
  });

  useEffect(() => {
    fetchSiteDetails();
    fetchsupervisors();
    fetchOperatorAssignments();
    fetchSiteMachines();
  }, [id]);

  const fetchSiteDetails = async () => {
    try {
      const [siteRes, installmentsRes, expensesRes, reportsRes, updatesRes, settlementsRes] = await Promise.all([
        api.get(`/sites/${id}`),
        api.get(`/installments?siteId=${id}`),
        api.get(`/expenses?siteId=${id}`),
        api.get(`/reports?siteId=${id}`),
        api.get(`/daily-updates?siteId=${id}`),
        api.get(`/site-settlements?siteId=${id}`)
      ]);

      setSite(siteRes.data.data);
      setInstallments(installmentsRes.data.data || []);
      setExpenses(expensesRes.data.data || []);
      setReports(reportsRes.data.data || []);
      setDailyUpdates(updatesRes.data.data || []);
      setSettlements(settlementsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching site details:', error);
    }
  };

  const fetchsupervisors = async () => {
    try {
      const { data } = await api.get('/users');
      const userList = data.data.filter(u => u.role === 'user');
      setsupervisors(userList);
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const fetchOperatorAssignments = async () => {
    try {
      const { data } = await api.get(`/operator-assignments?siteId=${id}`);
      setOperatorAssignments(data.data || []);
    } catch (error) {
      console.error('Error fetching operator assignments:', error);
    }
  };

  const fetchSiteMachines = async () => {
    try {
      const { data } = await api.get(`/machine-units?currentSiteId=${id}`);
      setSiteMachines(data.data || []);
    } catch (error) {
      console.error('Error fetching site machines:', error);
    }
  };

  const handleAssignsupervisor = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/sites/${id}/incharge`, { userId: selectedsupervisor });
      setIssupervisorModalOpen(false);
      setSelectedsupervisor('');
      fetchSiteDetails();
    } catch (error) {
      alert(error.response?.data?.message || 'Error assigning incharge.');
    }
  };

  const handleRemoveIncharge = async (userId) => {
    if (!window.confirm('Remove this site incharge?')) return;
    try {
      await api.delete(`/sites/${id}/incharge/${userId}`);
      fetchSiteDetails();
    } catch (error) {
      console.error('Error removing incharge:', error);
    }
  };

  const handleAddInstallment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/installments', {
        ...installmentForm,
        siteId: id,
        receivedBy: site.userId?.[0]?._id || site.userId?.[0]
      });
      setIsInstallmentModalOpen(false);
      setInstallmentForm({ amount: '', note: '' });
      fetchSiteDetails();
    } catch (error) {
      console.error('Error adding installment:', error);
    }
  };

  const handleApproveRepair = async (report) => {
    if (window.confirm('Approve repair and the estimated cost for this machine?')) {
      try {
        await api.put(`/reports/${report._id}`, { status: 'approved' });
        fetchSiteDetails();
      } catch (error) {
        console.error('Error approving repair:', error);
      }
    }
  };

  const handleRejectRepair = async (report) => {
    if (window.confirm('Reject this repair request?')) {
      try {
        await api.put(`/reports/${report._id}`, { status: 'rejected' });
        fetchSiteDetails();
      } catch (error) {
        console.error('Error rejecting repair:', error);
      }
    }
  };

  const handleMarkFixed = async (report) => {
    if (window.confirm('Mark this machine as fixed?')) {
      try {
        await api.put(`/reports/${report._id}`, { status: 'fixed' });
        fetchSiteDetails();
      } catch (error) {
        console.error('Error marking as fixed:', error);
      }
    }
  };

  const handleMarkCompleted = async () => {
    if (window.confirm('Are you sure the site work is finished?')) {
      try {
        await api.put(`/sites/${id}`, { status: 'completed', endDate: new Date() });
        fetchSiteDetails();
      } catch (error) {
        console.error('Error completing site:', error);
      }
    }
  };

  const handleOpenChallan = (supervisor) => {
    const supervisorMachines = siteMachines.filter(m => m.assignedUserId?._id === supervisor._id);
    setChallanSupervisor(supervisor);
    setChallanMachines(supervisorMachines);
    const initVerification = {};
    supervisorMachines.forEach(m => {
      initVerification[m._id] = { status: 'returned', remark: '' };
    });
    setMachineVerification(initVerification);
    setChallanDetails(prev => ({
      ...prev,
      consigneeName: supervisor.name,
      consigneeContact: supervisor.phone || '',
      challanNo: `ASL-${Date.now().toString().slice(-6)}`,
      challanDate: new Date().toLocaleDateString('en-IN'),
    }));
  };

  const handleChallanFormSubmit = (e) => {
    e.preventDefault();
    setIsChallanFormOpen(false);
    // Only returned machines go in challan
    const returnedMachines = challanMachines.filter(m => machineVerification[m._id]?.status === 'returned');
    setChallanMachines(returnedMachines);
    setIsChallanOpen(true);
  };

  const PREVIEW_WIDTH = 800;
  const renderPageToCanvas = (imgSrc, texts) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.naturalWidth / PREVIEW_WIDTH;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const fontSize = Math.round(12 * scale);
      ctx.font = `${fontSize}px "Courier New", Courier, monospace`;
      ctx.fillStyle = '#000000';
      texts.forEach(({ x, y, text, align, wrap }) => {
        ctx.textAlign = align || 'left';
        const str = String(text ?? '');
        if (wrap && str.length > 0) {
          const mid = Math.ceil(str.length / 2);
          let splitIdx = str.lastIndexOf(' ', mid);
          if (splitIdx === -1) splitIdx = mid;
          ctx.fillText(str.slice(0, splitIdx).trim(), x * scale, y * scale);
          ctx.fillText(str.slice(splitIdx).trim(), x * scale, (y + 14) * scale);
        } else {
          ctx.fillText(str, x * scale, y * scale);
        }
      });
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = imgSrc;
  });

  const handleSavePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const cd = challanDetails;
      const today = cd.challanDate || new Date().toLocaleDateString('en-IN');
      const challanNo = cd.challanNo || `ASL-${Date.now().toString().slice(-6)}`;

      const grouped = Object.values(
        challanMachines.reduce((acc, m) => {
          const key = m.machineTypeId?._id || m._id;
          if (!acc[key]) acc[key] = { ...m, quantity: 1, totalCost: m.purchaseCost || 0 };
          else { acc[key].quantity += 1; acc[key].totalCost += m.purchaseCost || 0; }
          return acc;
        }, {})
      );
      const page1Rows = grouped.slice(0, 12);
      const page2Rows = grouped.slice(12);
      const rowStartY = 432;
      const rowHeight = 18;
      const totalQty = grouped.reduce((s, m) => s + m.quantity, 0);
      const totalAmt = grouped.reduce((s, m) => s + (m.totalCost || 0), 0);
      const igst = Math.round(totalAmt * 0.18 * 100) / 100;
      const netAmount = Math.round((totalAmt + igst) * 100) / 100;

      const totalsTexts = (baseY) => [
        { x: 447, y: baseY, text: totalQty, align: 'center' },
        { x: 682, y: baseY, text: totalAmt.toFixed(2), align: 'center' },
        { x: 152, y: baseY + 16, text: 'IGST 18%' },
        { x: 682, y: baseY + 16, text: igst.toFixed(2), align: 'center' },
        { x: 152, y: baseY + 32, text: 'Net Amount' },
        { x: 682, y: baseY + 32, text: netAmount.toFixed(2), align: 'center' },
      ];

      const page1Texts = [
        { x: 150, y: 265, text: cd.consignorName },
        { x: 150, y: 280, text: cd.consignorAddress, wrap: true },
        { x: 150, y: 315, text: cd.consignorPincode },
        { x: 150, y: 332, text: cd.consignorGstin },
        { x: 150, y: 350, text: cd.consignorContact },
        { x: 150, y: 370, text: cd.consigneeName },
        { x: 150, y: 385, text: cd.consigneeAddress },
        { x: 150, y: 400, text: cd.consigneePincode },
        { x: 150, y: 415, text: cd.consigneeGstin },
        { x: 150, y: 425, text: cd.consigneeContact },
        { x: 520, y: 265, text: challanNo },
        { x: 645, y: 274, text: today },
        { x: 500, y: 293, text: cd.suppliersRef },
        { x: 645, y: 300, text: cd.othersRef },
        { x: 505, y: 333, text: cd.buyersOrderNo },
        { x: 645, y: 333, text: cd.buyersOrderDate },
        { x: 515, y: 372, text: cd.dispatchDocNo },
        { x: 520, y: 400, text: cd.dispatchThrough },
        { x: 645, y: 400, text: cd.destination },
        { x: 460, y: 424, text: cd.vehicle },
        { x: 480, y: 442, text: cd.driverName },
        { x: 495, y: 460, text: cd.driverContact },
        ...page1Rows.flatMap((m, i) => {
          const y = rowStartY + i * rowHeight + 65;
          return [
            { x: 115, y, text: i + 1, align: 'center' },
            { x: 152, y, text: m.machineTypeId?.name || '-' },
            { x: 447, y, text: m.quantity, align: 'center' },
            { x: 572, y, text: m.purchaseCost || '-', align: 'center' },
            { x: 682, y, text: m.totalCost || '-', align: 'center' },
          ];
        }),
        ...(page2Rows.length === 0 ? totalsTexts(rowStartY + page1Rows.length * rowHeight + 65 + 4) : []),
      ];

      const canvas1 = await renderPageToCanvas('/539_page-0001.jpg', page1Texts);
      const pdf = new jsPDF({
        orientation: canvas1.width > canvas1.height ? 'landscape' : 'portrait',
        unit: 'px', format: [canvas1.width, canvas1.height], hotfixes: ['px_scaling'],
      });
      pdf.addImage(canvas1.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, canvas1.width, canvas1.height);

      if (page2Rows.length > 0) {
        const page2Texts = [
          ...page2Rows.flatMap((m, i) => {
            const y = 120 + i * rowHeight;
            return [
              { x: 88, y, text: 12 + i + 1, align: 'center' },
              { x: 150, y, text: m.machineTypeId?.name || '-' },
              { x: 438, y, text: m.quantity, align: 'center' },
              { x: 58, y, text: m.purchaseCost || '', align: 'center' },
              { x: 605, y, text: m.totalCost || '', align: 'center' },
            ];
          }),
          ...totalsTexts(120 + page2Rows.length * rowHeight + 4),
        ];
        const canvas2 = await renderPageToCanvas('/539_page-0002.jpg', page2Texts);
        pdf.addPage([canvas2.width, canvas2.height]);
        pdf.addImage(canvas2.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, canvas2.width, canvas2.height);
      }

      pdf.save(`challan-${challanSupervisor?.name}-${challanNo}.pdf`);

      // Save exit challan record to backend
      const allSupervisorMachines = siteMachines.filter(m => m.assignedUserId?._id === challanSupervisor?._id);
      await api.post('/movements/exit-challan', {
        siteId: id,
        supervisorId: challanSupervisor?._id,
        challanNo,
        machines: allSupervisorMachines.map(m => ({
          machineUnitId: m._id,
          machineTypeName: m.machineTypeId?.name || '',
          serialNumber: m.serialNumber || '',
          status: machineVerification[m._id]?.status || 'returned',
          remark: machineVerification[m._id]?.remark || ''
        }))
      });
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF save karne mein error aaya.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleApproveSettlement = async (settlementId) => {
    if (window.confirm('Approve this settlement? machines will be officially returned/damaged and refund recorded.')) {
      try {
        await api.put(`/site-settlements/${settlementId}`, { status: 'approved' });
        fetchSiteDetails();
        alert('Settlement approved successfully.');
      } catch (error) {
        console.error('Error approving settlement:', error);
        alert('Failed to approve settlement');
      }
    }
  };

  const handleRejectSettlement = async (settlementId) => {
    if (window.confirm('Reject this settlement? User will have to submit it again.')) {
      try {
        await api.put(`/site-settlements/${settlementId}`, { status: 'rejected' });
        fetchSiteDetails();
        alert('Settlement rejected.');
      } catch (error) {
        console.error('Error rejecting settlement:', error);
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'machines', label: 'Machines' },
    { id: 'operators', label: 'Operators' },
    { id: 'updates', label: 'Daily Work' },
    { id: 'installments', label: 'Installments' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'settlements', label: 'Settlements' },
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
    { key: 'machineUnitId', label: 'Machine', render: (val) => val ? `${val.machineTypeId?.name} (SN: ${val.serialNumber})` : '-' },
    { key: 'issue', label: 'Issue' },
    { key: 'estimatedCost', label: 'Est. Cost', render: (val) => val ? `₹${val.toLocaleString()}` : '-' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
    { key: 'repairCost', label: 'Final Cost', render: (val) => val ? `₹${val.toLocaleString()}` : '-' },
  ];

  const updateColumns = [
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
    { key: 'workDescription', label: 'Work Description' },
    { key: 'progress', label: 'Progress (%)', render: (val) => `${val}%` },
    { key: 'notes', label: 'Notes' },
  ];

  if (!site) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  const totalGiven = installments.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSettlementReturn = settlements.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.returnAmount || 0), 0);
  const balance = totalGiven - totalExpense - totalSettlementReturn;
  const totalProgress = dailyUpdates.reduce((sum, update) => sum + (Number(update.progress) || 0), 0);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{site.name}</h1>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{site.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Site Incharge</p>
              {site.userId && site.userId.length > 0 ? (
                <div>
                  <ul className="space-y-1 mb-2">
                    {site.userId.map(u => (
                      <li key={u._id} className="flex items-center justify-between">
                        <span className="font-medium">{u.name}</span>
                        <button
                          onClick={() => handleRemoveIncharge(u._id)}
                          className="ml-3 text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setIssupervisorModalOpen(true)}
                    className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-lg hover:bg-yellow-600"
                  >
                    + Add Incharge
                  </button>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-red-500 mb-1">Not Assigned</p>
                  <button
                    onClick={() => setIssupervisorModalOpen(true)}
                    className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-lg hover:bg-yellow-600"
                  >
                    Assign Site Incharge
                  </button>
                </div>
              )}
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
            {['created', 'machines_assigned', 'supervisor_assigned', 'active', 'in_progress'].includes(site.status) && (
              <div>
                <p className="text-sm text-gray-600">Action</p>
                <button
                  onClick={handleMarkCompleted}
                  className="mt-1 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
                >
                  Mark as Completed
                </button>
              </div>
            )}
            {site.userId?.length > 0 && ['completed', 'closed'].includes(site.status) && (
              <div>
                <p className="text-sm text-gray-600">Exit Challan</p>
                <button
                  onClick={() => setIsChallanFormOpen(true)}
                  className="mt-1 flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Download Exit Challan
                </button>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Cost Summary</h3>
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
                <p className="text-sm text-gray-600">Returned in Settlement</p>
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

          {site.notes && (
            <div className="border-t pt-6 mt-6">
              <p className="text-sm text-gray-600">Notes</p>
              <p className="font-medium">{site.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (() => {
        // Har supervisor ke liye given, spent, balance calculate karo
        const supervisorStats = (site.userId || []).map(sup => {
          const given = installments
            .filter(i => i.receivedBy?._id === sup._id || i.receivedBy === sup._id)
            .reduce((s, i) => s + i.amount, 0);
          const spent = expenses
            .filter(e => e.userId?._id === sup._id || e.userId === sup._id)
            .reduce((s, e) => s + e.amount, 0);
          const settlementReturn = settlements
            .filter(s => s.status === 'approved' && (s.userId?._id === sup._id || s.userId === sup._id))
            .reduce((s, st) => s + (st.returnAmount || 0), 0);
          const balance = given - spent - settlementReturn;
          return { sup, given, spent, settlementReturn, balance };
        });

        return (
          <div className="space-y-4">
            {supervisorStats.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">No supervisors assigned.</div>
            ) : supervisorStats.map(({ sup, given, spent, settlementReturn, balance }) => (
              <div
                key={sup._id}
                className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition-shadow border border-transparent hover:border-indigo-100"
                onClick={() => setSelectedSupervisorTxn(sup._id)}
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{sup.name}</p>
                    <p className="text-xs text-gray-400">{sup.phone || sup.email || ''}</p>
                  </div>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    balance > 0 ? 'bg-green-100 text-green-700' :
                    balance < 0 ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {balance >= 0 ? '+' : ''}₹{balance.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Given</p>
                    <p className="font-bold text-green-600">₹{given.toLocaleString()}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Spent</p>
                    <p className="font-bold text-red-500">₹{spent.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${ balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <p className="text-xs text-gray-500 mb-1">Balance</p>
                    <p className={`font-bold ${ balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>₹{Math.abs(balance).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-indigo-500 mt-2 text-right font-medium">Click to view expense history →</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Supervisor Expense Drill-down Modal */}
      {selectedSupervisorTxn && (() => {
        const sup = (site.userId || []).find(u => u._id === selectedSupervisorTxn);
        const supInstallments = installments.filter(i => i.receivedBy?._id === selectedSupervisorTxn || i.receivedBy === selectedSupervisorTxn);
        const supExpenses = expenses.filter(e => e.userId?._id === selectedSupervisorTxn || e.userId === selectedSupervisorTxn);
        const given = supInstallments.reduce((s, i) => s + i.amount, 0);
        const spent = supExpenses.reduce((s, e) => s + e.amount, 0);
        const balance = given - spent;
        return (
          <Modal isOpen={true} onClose={() => setSelectedSupervisorTxn(null)} title={`${sup?.name} — Transaction History`}>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Given</p>
                  <p className="font-bold text-green-600">₹{given.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="font-bold text-red-500">₹{spent.toLocaleString()}</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className={`font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{balance >= 0 ? '+' : '-'}₹{Math.abs(balance).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Installments Received</p>
                {supInstallments.length > 0 ? (
                  <div className="space-y-2">
                    {supInstallments.map(i => (
                      <div key={i._id} className="flex justify-between items-center px-3 py-2 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">₹{i.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{i.note || '—'}</p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(i.date || i.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">No installments.</p>}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expenses</p>
                {supExpenses.length > 0 ? (
                  <div className="space-y-2">
                    {supExpenses.map(e => (
                      <div key={e._id} className="flex justify-between items-center px-3 py-2 bg-red-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-800">₹{e.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{e.category} — {e.description || '—'}</p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(e.date || e.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-400">No expenses.</p>}
              </div>
            </div>
          </Modal>
        );
      })()}

      {activeTab === 'machines' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {siteMachines.length > 0 ? (() => {
            const grouped = Object.values(
              siteMachines.reduce((acc, m) => {
                const key = (m.machineTypeId?._id || m._id) + '_' + (m.assignedUserId?._id || '');
                if (!acc[key]) acc[key] = { ...m, quantity: 1, serialNumbers: [m.serialNumber] };
                else { acc[key].quantity += 1; acc[key].serialNumbers.push(m.serialNumber); }
                return acc;
              }, {})
            );
            return (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Machine Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Nos.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {grouped.map(m => (
                    <tr key={m._id}>
                      <td className="px-6 py-4 text-sm font-medium">{m.machineTypeId?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{m.quantity}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{m.serialNumbers.join(', ')}</td>
                      <td className="px-6 py-4 text-sm">{m.assignedUserId?.name || '—'}</td>
                      <td className="px-6 py-4 text-sm capitalize">{m.condition || '—'}</td>
                      <td className="px-6 py-4 text-sm"><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })() : (
            <EmptyState message="No machines assigned to this site" />
          )}
        </div>
      )}

      {activeTab === 'operators' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {operatorAssignments.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {operatorAssignments.map(a => (
                  <tr key={a._id}>
                    <td className="px-6 py-4 text-sm font-medium">{a.operatorId?.name}</td>
                    <td className="px-6 py-4 text-sm">{new Date(a.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      {a.endDate && new Date(a.endDate) < new Date()
                        ? <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Completed</span>
                        : <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Active</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">No operator work periods recorded yet.</div>
          )}
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="bg-white rounded-lg shadow">
          {dailyUpdates.length > 0 ? (
            <DataTable columns={updateColumns} data={dailyUpdates} />
          ) : (
            <EmptyState message="No daily work updates recorded yet" />
          )}
        </div>
      )}

      {activeTab === 'installments' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setIsInstallmentModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Installment
            </button>
          </div>
          <div className="bg-white rounded-lg shadow">
            {installments.length > 0 ? (
              <DataTable columns={installmentColumns} data={installments} />
            ) : (
              <EmptyState message="No installments given" />
            )}
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-lg shadow">
          {expenses.length > 0 ? (
            <>
              <div className="p-4 border-b bg-gray-50">
                <p className="text-lg font-semibold">Total Expenses: ₹{totalExpense.toLocaleString()}</p>
              </div>
              <DataTable columns={expenseColumns} data={expenses} />
            </>
          ) : (
            <EmptyState message="No expenses recorded" />
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow">
          {reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {reportColumns.map(col => (
                      <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col.label}</th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report._id}>
                      {reportColumns.map(col => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                          {col.render ? col.render(report[col.key], report) : report[col.key]}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {report.status === 'reported' && (
                            <>
                              <button
                                onClick={() => handleApproveRepair(report)}
                                className="text-blue-600 hover:text-blue-900 font-semibold"
                              >
                                Approve
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleRejectRepair(report)}
                                className="text-red-600 hover:text-red-900 font-semibold"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {report.status === 'approved' && (
                            <span className="text-gray-500 italic">Waiting for User</span>
                          )}
                          {(report.status === 'fixed' || report.status === 'dead' || report.status === 'rejected') && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="No machine reports" />
          )}
        </div>
      )}

      {activeTab === 'settlements' && (
        <div className="bg-white rounded-lg shadow">
          {settlements.length > 0 ? (
            <div className="p-6 space-y-6">
              {settlements.map((settlement) => (
                <div key={settlement._id} className="border rounded-lg p-6 bg-gray-50 relative">
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={settlement.status} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Settlement Request</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium text-gray-800">Submitted By:</span> {settlement.userId?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium text-gray-800">Return Amount:</span> ₹{settlement.returnAmount}
                  </p>
                  <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap">
                    <span className="font-medium text-gray-800">Notes:</span><br />{settlement.notes || 'None'}
                  </p>

                  <h4 className="font-medium text-md mb-2">Machine Conditions Reported:</h4>
                  {settlement.returnedmachines && settlement.returnedmachines.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 mb-4">
                      {settlement.returnedmachines.map((m) => {
                        return (
                          <li key={m._id} className="text-sm">
                            <span className="font-medium">{m.machineTypeId?.name} (SN: {m.serialNumber}):</span> {m.condition}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No specific machine conditions reported.</p>
                  )}

                  {settlement.status === 'pending' && (
                    <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleApproveSettlement(settlement._id)}
                        className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
                      >
                        Approve & Process Returns
                      </button>
                      <button
                        onClick={() => handleRejectSettlement(settlement._id)}
                        className="px-6 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {settlement.status === 'approved' && (
                    <p className="mt-4 pt-4 border-t border-gray-200 text-sm text-green-700 font-semibold">
                      This settlement has been approved and all returns/refunds have been processed.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No settlements requested yet." />
          )}
        </div>
      )}

      {/* Challan Form Modal */}
      <Modal isOpen={isChallanFormOpen} onClose={() => { setIsChallanFormOpen(false); setChallanSupervisor(null); setChallanMachines([]); setMachineVerification({}); }} title="Exit Challan">
        <form onSubmit={handleChallanFormSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">

          {/* Step 1: Supervisor Select */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Select Supervisor <span className="text-red-500">*</span></label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={challanSupervisor?._id || ''}
              onChange={e => {
                const sup = site.userId.find(u => u._id === e.target.value);
                if (sup) handleOpenChallan(sup);
              }}
            >
              <option value="">-- Select Supervisor --</option>
              {site.userId.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Machine Verification - turant supervisor ke neeche */}
          {challanSupervisor && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Machines — {challanSupervisor.name}</p>
                <div className="flex gap-3 text-xs font-semibold">
                  <span className="text-green-600">✓ {Object.values(machineVerification).filter(v => v.status !== 'missing').length} Returned</span>
                  <span className="text-red-500">✗ {Object.values(machineVerification).filter(v => v.status === 'missing').length} Missing</span>
                </div>
              </div>
              {challanMachines.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {challanMachines.map(m => {
                    const isReturned = machineVerification[m._id]?.status !== 'missing';
                    return (
                      <div key={m._id} className={`px-4 py-3 transition-colors ${isReturned ? 'bg-white' : 'bg-red-50'}`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isReturned}
                            onChange={e => setMachineVerification(prev => ({
                              ...prev,
                              [m._id]: { status: e.target.checked ? 'returned' : 'missing', remark: e.target.checked ? '' : prev[m._id]?.remark || '' }
                            }))}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 cursor-pointer flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{m.machineTypeId?.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{m.serialNumber}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                            isReturned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}>
                            {isReturned ? 'Returned' : 'Missing'}
                          </span>
                        </label>
                        {!isReturned && (
                          <input
                            type="text"
                            placeholder="Remark (reason for missing)..."
                            className="w-full mt-2 px-3 py-1.5 text-xs border border-red-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                            value={machineVerification[m._id]?.remark || ''}
                            onChange={e => setMachineVerification(prev => ({ ...prev, [m._id]: { ...prev[m._id], remark: e.target.value } }))}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-400">No machines assigned to this supervisor on this site.</p>
              )}
            </div>
          )}

          {/* Step 3: Challan Details - sirf tab dikhein jab supervisor select ho */}
          {challanSupervisor && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Consignor Details</p>
              {[['consignorName','Company Name'],['consignorAddress','Address'],['consignorPincode','Pincode'],['consignorGstin','GSTIN'],['consignorContact','Contact']].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={challanDetails[key]} onChange={e => setChallanDetails(p => ({ ...p, [key]: e.target.value }))} required />
                </div>
              ))}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Consignee Details</p>
              {[['consigneeName','Name'],['consigneeAddress','Address'],['consigneePincode','Pincode'],['consigneeGstin','GSTIN'],['consigneeContact','Contact']].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={challanDetails[key]} onChange={e => setChallanDetails(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Challan Info</p>
              {[['challanNo','Challan No.'],['challanDate','Date'],['suppliersRef',"Supplier's Ref"],['othersRef','Others Ref'],['buyersOrderNo',"Buyer's Order No."],['buyersOrderDate',"Buyer's Order Date"],['dispatchDocNo','Dispatch Doc No.'],['dispatchThrough','Dispatch Through'],['destination','Destination'],['vehicle','Vehicle'],['driverName','Driver Name'],['driverContact','Driver Contact']].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={challanDetails[key]} onChange={e => setChallanDetails(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </>
          )}

          <button type="submit" disabled={!challanSupervisor} className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold mt-2">Preview Challan</button>
        </form>
      </Modal>

      {/* Challan Preview */}
      {isChallanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 overflow-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-xl font-bold">Exit Challan — {challanSupervisor?.name}</h2>
                <div className="flex space-x-3">
                  <button onClick={handleSavePdf} disabled={isGeneratingPdf} className={`px-4 py-2 rounded-lg font-semibold text-white ${isGeneratingPdf ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                    {isGeneratingPdf ? 'Generating...' : 'Save as PDF'}
                  </button>
                  <button onClick={() => setIsChallanOpen(false)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold">Close</button>
                </div>
              </div>
              <DeliveryChallan ref={challanRef} incharge={challanSupervisor} machines={challanMachines} challanDetails={challanDetails} />
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={issupervisorModalOpen} onClose={() => setIssupervisorModalOpen(false)} title="Assign supervisor">
        <form onSubmit={handleAssignsupervisor}>
          <FormInput
            label="Select supervisor"
            type="select"
            name="userId"
            value={selectedsupervisor}
            onChange={(e) => setSelectedsupervisor(e.target.value)}
            options={supervisors.map(s => ({ value: s._id, label: s.name }))}
            required
          />
          <button type="submit" className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 mt-4">
            Assign supervisor
          </button>
        </form>
      </Modal>

      <Modal isOpen={isInstallmentModalOpen} onClose={() => setIsInstallmentModalOpen(false)} title="Add Installment">
        <form onSubmit={handleAddInstallment}>
          <FormInput
            label="Amount"
            type="number"
            name="amount"
            value={installmentForm.amount}
            onChange={(e) => setInstallmentForm({ ...installmentForm, amount: e.target.value })}
            required
          />
          <FormInput
            label="Note"
            type="textarea"
            name="note"
            value={installmentForm.note}
            onChange={(e) => setInstallmentForm({ ...installmentForm, note: e.target.value })}
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Add Installment
          </button>
        </form>
      </Modal>

    </DashboardLayout>
  );
};

export default SiteDetails;

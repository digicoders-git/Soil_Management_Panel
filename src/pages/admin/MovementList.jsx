import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import DeliveryChallan from '../../components/DeliveryChallan';
import api from '../../services/api';

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

const MovementList = () => {
  const [movements, setMovements] = useState([]);
  const [exitChallans, setExitChallans] = useState([]);
  const [activeTab, setActiveTab] = useState('movements');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ machineUnitId: '', toLocationType: 'supervisor', toLocationId: '', notes: '' });
  const [machineUnits, setMachineUnits] = useState([]);
  const [sites, setSites] = useState([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Challan states
  const challanRef = useRef(null);
  const [isChallanFormOpen, setIsChallanFormOpen] = useState(false);
  const [isChallanOpen, setIsChallanOpen] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [supervisorMachines, setSupervisorMachines] = useState([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState([]);
  const [challanDetails, setChallanDetails] = useState({
    consignorName: 'Arun Soil Lab Private Limited',
    consignorAddress: '636/110, Budh Vihar, Takrohi, Lucknow-227105',
    consignorPincode: '227105',
    consignorGstin: '09AAECA9218M1Z9',
    consignorContact: '0522-2341943',
    challanNo: `ASL-${Date.now().toString().slice(-6)}`,
    challanDate: new Date().toLocaleDateString('en-IN'),
    suppliersRef: '',
    othersRef: '',
    buyersOrderNo: '',
    buyersOrderDate: '',
    dispatchDocNo: '',
    dispatchThrough: '',
    destination: '',
    vehicle: '',
    driverName: '',
    driverContact: '',
  });

  useEffect(() => {
    fetchMovements();
    fetchExitChallans();
    fetchUnitsAndSites();
    fetchSupervisors();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data } = await api.get('/movements');
      setMovements(data.data);
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const fetchExitChallans = async () => {
    try {
      const { data } = await api.get('/movements/exit-challans');
      setExitChallans(data.data || []);
    } catch (error) {
      console.error('Error fetching exit challans:', error);
    }
  };

  const fetchUnitsAndSites = async () => {
    try {
      const [unitsRes, sitesRes] = await Promise.all([
        api.get('/machine-units'),
        api.get('/sites')
      ]);
      setMachineUnits(unitsRes.data.data.filter(u => u.status === 'available' || u.status === 'assigned'));
      setSites(sitesRes.data.data.filter(s => ['created', 'machines_assigned', 'supervisor_assigned', 'active', 'in_progress'].includes(s.status)));
    } catch (error) {
      console.error('Error fetching units/sites', error);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const { data } = await api.get('/users');
      setSupervisors((data.data || []).filter(u => u.role === 'user'));
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  };

  const handleSupervisorChange = async (supId) => {
    setSelectedSupervisorId(supId);
    setSupervisorMachines([]);
    setSelectedMachineIds([]);
    if (!supId) return;
    try {
      const { data } = await api.get(`/machine-units/incharge/${supId}`);
      const allMachines = data.data || [];
      setSupervisorMachines(allMachines);

      // Auto-select machines jinki is supervisor se return movement pending hai
      const pendingReturnIds = movements
        .filter(mv =>
          mv.status === 'pending' &&
          mv.toLocationType === 'store' &&
          mv.assignedUserId?._id === supId || mv.machineUnitId?.assignedUserId === supId
        )
        .map(mv => mv.machineUnitId?._id)
        .filter(Boolean);

      // Fallback: agar assignedUserId match na ho toh machine list se match karo
      const machineIds = allMachines.map(m => m._id);
      const pendingFromMovements = movements
        .filter(mv =>
          mv.status === 'pending' &&
          mv.toLocationType === 'store' &&
          machineIds.includes(mv.machineUnitId?._id)
        )
        .map(mv => mv.machineUnitId?._id)
        .filter(Boolean);

      const autoSelect = [...new Set([...pendingReturnIds, ...pendingFromMovements])];
      setSelectedMachineIds(autoSelect.length > 0 ? autoSelect : machineIds);
    } catch (error) {
      console.error('Error fetching supervisor machines:', error);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const unit = machineUnits.find(u => u._id === requestForm.machineUnitId);
      if (!unit) return alert('Invalid unit');

      const payload = {
        machineUnitId: requestForm.machineUnitId,
        fromLocationType: unit.currentSiteId ? 'site' : (unit.assignedUserId ? 'supervisor' : 'store'),
        fromLocationId: unit.currentSiteId?._id || null,
        toLocationType: requestForm.toLocationType,
        toLocationId: requestForm.toLocationType === 'site' ? requestForm.toLocationId : null,
        assignedUserId: requestForm.toLocationType === 'supervisor' ? requestForm.toLocationId : null,
        notes: requestForm.notes,
      };

      const res = await api.post('/movements', payload);
      await api.put(`/movements/${res.data.data._id}/approve`);

      setIsRequestModalOpen(false);
      setRequestForm({ machineUnitId: '', toLocationType: 'supervisor', toLocationId: '', notes: '' });
      fetchMovements();
      fetchUnitsAndSites();
      alert('Movement completed successfully');
    } catch (error) {
      console.error('Error requesting movement:', error);
      alert(error.response?.data?.message || 'Error occurred');
    }
  };

  const handleApprove = async (movementId) => {
    if (window.confirm('Approve this movement?')) {
      try {
        await api.put(`/movements/${movementId}/approve`);
        fetchMovements();
      } catch (error) {
        console.error('Error approving:', error);
        alert(error.response?.data?.message || 'Error occurred');
      }
    }
  };

  const handleDelete = async (movementId) => {
    if (window.confirm('Are you sure you want to delete this movement record?')) {
      try {
        await api.delete(`/movements/${movementId}`);
        fetchMovements();
      } catch (error) {
        console.error('Error deleting:', error);
        alert(error.response?.data?.message || 'Error occurred');
      }
    }
  };

  const handleChallanFormSubmit = (e) => {
    e.preventDefault();
    if (!selectedSupervisorId) return alert('Please select a supervisor');
    setIsChallanFormOpen(false);
    setIsChallanOpen(true);
  };

  const selectedMachines = supervisorMachines.filter(m => selectedMachineIds.includes(m._id));
  const selectedSupervisor = supervisors.find(s => s._id === selectedSupervisorId);

  const handleSavePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const cd = challanDetails;
      const today = cd.challanDate || new Date().toLocaleDateString('en-IN');
      const challanNo = cd.challanNo || `ASL-${Date.now().toString().slice(-6)}`;

      const grouped = Object.values(
        selectedMachines.reduce((acc, m) => {
          const key = m.machineTypeId?._id || m.machineTypeId || m._id;
          if (!acc[key]) acc[key] = { ...m, quantity: 1, totalCost: m.purchaseCost || 0 };
          else { acc[key].quantity += 1; acc[key].totalCost += m.purchaseCost || 0; }
          return acc;
        }, {})
      );
      const page1Rows = grouped.slice(0, 12);
      const page2Rows = grouped.slice(12);
      const rowStartY = 432;
      const rowHeight = 18;

      const totalQty  = grouped.reduce((s, m) => s + m.quantity, 0);
      const totalAmt  = grouped.reduce((s, m) => s + (m.totalCost || 0), 0);
      const igst      = Math.round(totalAmt * 0.18 * 100) / 100;
      const netAmount = Math.round((totalAmt + igst) * 100) / 100;

      const totalsTexts = (baseY) => [
        { x: 447, y: baseY,      text: totalQty, align: 'center' },
        { x: 682, y: baseY,      text: totalAmt.toFixed(2), align: 'center' },
        // { x: 152, y: baseY + 16, text: 'IGST 18%' },
        { x: 682, y: baseY + 16, text: igst.toFixed(2), align: 'center' },
        // { x: 152, y: baseY + 32, text: 'Net Amount' },
        { x: 682, y: baseY + 32, text: netAmount.toFixed(2), align: 'center' },
      ];

      const page1Texts = [
        { x: 150, y: 265, text: cd.consignorName || '' },
        { x: 150, y: 280, text: cd.consignorAddress || '', wrap: true },
        { x: 150, y: 315, text: cd.consignorPincode || '' },
        { x: 150, y: 332, text: cd.consignorGstin || '' },
        { x: 150, y: 350, text: cd.consignorContact || '' },
        { x: 150, y: 370, text: selectedSupervisor?.name || '' },
        { x: 150, y: 385, text: selectedSupervisor?.email || '' },
        { x: 150, y: 425, text: '245624' },
        { x: 520, y: 265, text: challanNo },
        { x: 645, y: 274, text: today },
        { x: 500, y: 293, text: cd.suppliersRef || '' },
        { x: 645, y: 300, text: cd.othersRef || '' },
        { x: 505, y: 333, text: cd.buyersOrderNo || '' },
        { x: 645, y: 333, text: cd.buyersOrderDate || '' },
        { x: 515, y: 372, text: cd.dispatchDocNo || '' },
        { x: 520, y: 400, text: cd.dispatchThrough || '' },
        { x: 645, y: 400, text: cd.destination || '' },
        { x: 460, y: 424, text: cd.vehicle || '' },
        { x: 480, y: 442, text: cd.driverName || '' },
        { x: 495, y: 460, text: cd.driverContact || '' },
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
        ...(page2Rows.length === 0 ? totalsTexts(rowStartY + page1Rows.length * rowHeight + 65 + 113) : []),
      ];

      const canvas1 = await renderPageToCanvas('/539_page-0002.jpg', page1Texts);
      const pdf = new jsPDF({
        orientation: canvas1.width > canvas1.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas1.width, canvas1.height],
        hotfixes: ['px_scaling'],
      });
      pdf.addImage(canvas1.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, canvas1.width, canvas1.height);

      if (page2Rows.length > 0) {
        const page2Texts = page2Rows.flatMap((m, i) => {
          const y = 120 + i * rowHeight;
          return [
            { x: 88,  y, text: 12 + i + 1, align: 'center' },
            { x: 150, y, text: m.machineTypeId?.name || '-' },
            { x: 438, y, text: m.quantity, align: 'center' },
            { x: 58,  y, text: m.purchaseCost || '', align: 'center' },
            { x: 605, y, text: m.totalCost || '', align: 'center' },
          ];
        });
        const p2TotalsY = 120 + page2Rows.length * rowHeight + 4;
        page2Texts.push(...totalsTexts(p2TotalsY));
        const canvas2 = await renderPageToCanvas('/539_page-0002.jpg', page2Texts);
        pdf.addPage([canvas2.width, canvas2.height]);
        pdf.addImage(canvas2.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, canvas2.width, canvas2.height);
      }

      pdf.save(`challan-${challanNo}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF save karne mein error aaya.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const columns = [
    { key: 'machineUnitId', label: 'Machine', render: (val) => `${val?.machineTypeId?.name} - ${val?.serialNumber}` },
    { key: 'fromLocationType', label: 'From' },
    { key: 'toLocationType', label: 'To' },
    { key: 'assignedUserId', label: 'Supervisor', render: (val) => val?.name || '-' },
    { key: 'movementDate', label: 'Moved On', render: (val) => val ? new Date(val).toLocaleDateString() : '-' },
    { key: 'notes', label: 'Notes' }
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stocks Movements</h1>
        <div className="flex gap-2">
          {/* <button onClick={() => setIsRequestModalOpen(true)} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Request Movement</button> */}
          <button onClick={() => setIsChallanFormOpen(true)} className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">Download Challan</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-200">
        {[['movements', 'Movement History'], ['exitChallans', 'Exit Challan History']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'movements' && (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">{column.label}</th>
                  ))}
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((item) => (
                  <tr key={item._id}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {column.render ? column.render(item[column.key], item) : item[column.key]}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <div className="flex justify-end gap-3">
                        {item.status === 'pending' && (
                          <button onClick={() => handleApprove(item._id)} className="font-semibold text-green-600 hover:text-green-900">Approve</button>
                        )}
                        <button onClick={() => handleDelete(item._id)} className="font-semibold text-red-600 hover:text-red-900">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'exitChallans' && (
        <div className="space-y-4">
          {exitChallans.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-white rounded-lg shadow">No exit challans generated yet.</div>
          ) : exitChallans.map(ec => (
            <div key={ec._id} className="p-5 bg-white rounded-lg shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">Challan No: <span className="text-indigo-600">{ec.exitChallan?.challanNo}</span></p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Supervisor: <span className="font-medium text-gray-700">{ec.exitChallan?.supervisorId?.name || ec.assignedUserId?.name || '—'}</span>
                    {' · '} Site: <span className="font-medium text-gray-700">{ec.exitChallan?.siteId?.name || '—'}</span>
                    {' · '} {ec.exitChallan?.generatedAt ? new Date(ec.exitChallan.generatedAt).toLocaleDateString('en-IN') : '—'}
                  </p>
                </div>
                <div className="flex gap-3 text-sm font-semibold">
                  <span className="text-green-600">{ec.exitChallan?.machines?.filter(m => m.status === 'returned').length || 0} Returned</span>
                  <span className="text-red-600">{ec.exitChallan?.machines?.filter(m => m.status === 'missing').length || 0} Missing</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Machine</th>
                      <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Serial No.</th>
                      <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ec.exitChallan?.machines?.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{m.machineTypeName}</td>
                        <td className="px-4 py-2 font-mono text-xs">{m.serialNumber}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            m.status === 'returned' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>{m.status}</span>
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">{m.remark || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Movement Modal */}
      {/* <Modal isOpen={isRequestModalOpen} onClose={() => { setIsRequestModalOpen(false); setRequestForm({ machineUnitId: '', toLocationType: 'supervisor', toLocationId: '', notes: '' }); }} title="Request Movement">
        <form onSubmit={handleRequestSubmit}>
          <FormInput
            label="Machine Unit"
            type="select"
            name="machineUnitId"
            value={requestForm.machineUnitId}
            onChange={(e) => setRequestForm({ ...requestForm, machineUnitId: e.target.value })}
            options={machineUnits.map(u => ({ value: u._id, label: `${u.machineTypeId?.name} (${u.serialNumber}) - ${u.status}` }))}
            required
          />
          <FormInput
            label="Transfer To"
            type="select"
            name="toLocationType"
            value={requestForm.toLocationType}
            onChange={(e) => setRequestForm({ ...requestForm, toLocationType: e.target.value, toLocationId: '' })}
            options={[
              { value: 'supervisor', label: 'Supervisor' },
              { value: 'site', label: 'Site' },
              { value: 'store', label: 'Store' },
              { value: 'repair', label: 'Repair' }
            ]}
            required
          />
          {requestForm.toLocationType === 'supervisor' && (
            <FormInput
              label="Select Supervisor"
              type="select"
              name="toLocationId"
              value={requestForm.toLocationId}
              onChange={(e) => setRequestForm({ ...requestForm, toLocationId: e.target.value })}
              options={supervisors.map(s => ({ value: s._id, label: s.name }))}
              required
            />
          )}
          {requestForm.toLocationType === 'site' && (
            <FormInput
              label="Select Site"
              type="select"
              name="toLocationId"
              value={requestForm.toLocationId}
              onChange={(e) => setRequestForm({ ...requestForm, toLocationId: e.target.value })}
              options={sites.map(s => ({ value: s._id, label: s.name }))}
              required
            />
          )}
          <FormInput label="Notes" name="notes" value={requestForm.notes} onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })} />
          <button type="submit" className="w-full py-2 mt-4 text-white bg-blue-600 rounded-lg">Submit Request</button>
        </form>
      </Modal> */}

      {/* Challan Details Form Modal */}
      <Modal isOpen={isChallanFormOpen} onClose={() => { setIsChallanFormOpen(false); setSelectedSupervisorId(''); setSupervisorMachines([]); setSelectedMachineIds([]); }} title="Delivery Challan Details">
        <form onSubmit={handleChallanFormSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">

          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Consignor Details</p>
          {[
            { label: 'Company Name', key: 'consignorName' },
            { label: 'Address', key: 'consignorAddress' },
            { label: 'Pincode', key: 'consignorPincode' },
            { label: 'GSTIN', key: 'consignorGstin' },
            { label: 'Contact', key: 'consignorContact' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block mb-1 text-xs font-medium text-gray-600">{label}</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={challanDetails[key]}
                onChange={e => setChallanDetails(p => ({ ...p, [key]: e.target.value }))}
                required
              />
            </div>
          ))}

          <p className="pt-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Challan Info</p>
          {[
            { label: 'Challan No.', key: 'challanNo' },
            { label: 'Date', key: 'challanDate' },
            { label: "Supplier's Ref", key: 'suppliersRef' },
            { label: 'Others Ref', key: 'othersRef' },
            { label: "Buyer's Order No.", key: 'buyersOrderNo' },
            { label: "Buyer's Order Date", key: 'buyersOrderDate' },
            { label: 'Dispatch Doc No.', key: 'dispatchDocNo' },
            { label: 'Dispatch Through', key: 'dispatchThrough' },
            { label: 'Destination', key: 'destination' },
            { label: 'Vehicle', key: 'vehicle' },
            { label: 'Driver Name', key: 'driverName' },
            { label: 'Driver Contact No.', key: 'driverContact' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block mb-1 text-xs font-medium text-gray-600">{label}</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={challanDetails[key]}
                onChange={e => setChallanDetails(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}

          <p className="pt-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Supervisor & Machines</p>
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-600">Select Supervisor <span className="text-red-500">*</span></label>
            <select
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedSupervisorId}
              onChange={e => handleSupervisorChange(e.target.value)}
              required
            >
              <option value="">-- Select Supervisor --</option>
              {supervisors.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {supervisorMachines.length > 0 && (
            <div>
              <label className="block mb-2 text-xs font-medium text-gray-600">Machines (auto-selected: pending return)</label>
              <div className="p-3 space-y-2 overflow-y-auto border border-gray-200 rounded-lg max-h-48 bg-gray-50">
                {supervisorMachines.map(m => (
                  <label key={m._id} className={`flex items-start p-2 rounded-lg border cursor-pointer transition-colors ${selectedMachineIds.includes(m._id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 mt-0.5 text-indigo-600 border-gray-300 rounded cursor-pointer"
                      checked={selectedMachineIds.includes(m._id)}
                      onChange={e => {
                        setSelectedMachineIds(prev =>
                          e.target.checked ? [...prev, m._id] : prev.filter(id => id !== m._id)
                        );
                      }}
                    />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{m.machineTypeId?.name}</p>
                      <p className="text-xs text-gray-500">Serial: <span className="font-mono">{m.serialNumber}</span></p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-right text-gray-500">{selectedMachineIds.length} selected</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium mt-2"
          >
            Preview Challan
          </button>
        </form>
      </Modal>

      {/* Challan Preview */}
      {isChallanOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-60">
          <div className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Delivery Challan Preview</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSavePdf}
                    disabled={isGeneratingPdf}
                    className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors ${isGeneratingPdf ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {isGeneratingPdf ? 'Generating...' : 'Save as PDF'}
                  </button>
                  <button
                    onClick={() => setIsChallanOpen(false)}
                    className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Close
                  </button>
                </div>
              </div>
              <DeliveryChallan ref={challanRef} incharge={selectedSupervisor} machines={selectedMachines} challanDetails={challanDetails} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MovementList;

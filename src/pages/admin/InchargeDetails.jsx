import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import DeliveryChallan from '../../components/DeliveryChallan';
import api from '../../services/api';

const InchargeDetails = () => {
  const { id } = useParams();
  const [incharge, setIncharge] = useState(null);
  const [machines, setMachines] = useState([]);
  const [availableMachines, setAvailableMachines] = useState([]);
  const [operators, setOperators] = useState([]);
  const challanRef = useRef(null);
  const [isChallanOpen, setIsChallanOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isChallanFormOpen, setIsChallanFormOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [assignForm, setAssignForm] = useState({ unitIds: [], operatorId: '', quantity: 1 });
  const [challanDetails, setChallanDetails] = useState({
    consignorName: 'Arun Soil Lab Private Limited',
    consignorAddress: '636/110, Budh Vihar, Takrohi, Lucknow-227105',
    consignorPincode: '227105',
    consignorGstin: '09AAECA9218M1Z9',
    consignorContact: '0522-2341943',
    consigneeName: '',
    consigneeAddress: '',
    consigneePincode: '',
    consigneeGstin: '',
    consigneeContact: '',
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
    gstType: 'igst',
    gstRate: '18',
  });

  useEffect(() => {
    fetchIncharge();
    fetchMachines();
    fetchAvailableMachines();
    fetchOperators();
  }, [id]);

  const fetchIncharge = async () => {
    try {
      const { data } = await api.get(`/users/${id}`);
      setIncharge(data.data);
    } catch (error) {
      console.error('Error fetching incharge:', error);
    }
  };

  const fetchMachines = async () => {
    try {
      const { data } = await api.get(`/machine-units/incharge/${id}`);
      setMachines(data.data || []);
      // console.log(data.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchAvailableMachines = async () => {
    try {
      const { data } = await api.get('/machine-units/available');
      setAvailableMachines(data.data || []);
    } catch (error) {
      console.error('Error fetching available machines:', error);
    }
  };

  const fetchOperators = async () => {
    try {
      const { data } = await api.get('/operators');
      setOperators(data.data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const handleDownloadChallan = () => {
    setIsChallanFormOpen(true);
  };

  const handleChallanFormSubmit = async (e) => {
    e.preventDefault();
    setIsChallanFormOpen(false);
    setIsChallanOpen(true);

    try {
      const challanNo = challanDetails.challanNo || `ASL-${Date.now().toString().slice(-6)}`;
      
      // machines state se latest data lo
      const { data } = await api.get(`/machine-units/incharge/${id}`);
      const latestMachines = data.data || [];

      if (latestMachines.length === 0) {
        console.warn('No machines found for this supervisor');
        return;
      }

      const payload = {
        supervisorId: id,
        challanNo,
        machines: latestMachines.map(m => ({
          machineUnitId: m._id,
          machineTypeName: m.machineTypeId?.name || '',
          serialNumber: m.serialNumber || '',
          status: 'returned',
          remark: ''
        }))
      };

      const res = await api.post('/movements/exit-challan', payload);
      console.log('Challan history saved:', res.data);
    } catch (err) {
      console.error('Error saving challan history:', err.response?.data || err.message);
    }
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
          // split at nearest space around midpoint
          let splitIdx = str.lastIndexOf(' ', mid);
          if (splitIdx === -1) splitIdx = mid;
          const line1 = str.slice(0, splitIdx).trim();
          const line2 = str.slice(splitIdx).trim();
          ctx.fillText(line1, x * scale, y * scale);
          ctx.fillText(line2, x * scale, (y + 14) * scale);
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
        machines.reduce((acc, m) => {
          const key = m.machineTypeId?._id || m.machineTypeId || m._id;
          const cost = Number(m.purchaseCost) || 0;
          if (!acc[key]) acc[key] = { ...m, quantity: 1, totalCost: cost };
          else { acc[key].quantity += 1; acc[key].totalCost += cost; }
          return acc;
        }, {})
      );
      const page1Rows = grouped.slice(0, 12);
      const page2Rows = grouped.slice(12);
      const rowStartY = 432;
      const rowHeight = 18;

      const totalQty  = grouped.reduce((s, m) => s + m.quantity, 0);
      const totalAmt  = grouped.reduce((s, m) => s + (m.totalCost || 0), 0);
      const gstType = cd.gstType || 'igst';
      const gstRate = Number(cd.gstRate || 18) / 100;
      const cgst = gstType === 'cgst_sgst' ? Math.round(totalAmt * (gstRate / 2) * 100) / 100 : 0;
      const sgst = gstType === 'cgst_sgst' ? Math.round(totalAmt * (gstRate / 2) * 100) / 100 : 0;
      const igst = gstType === 'igst' ? Math.round(totalAmt * gstRate * 100) / 100 : 0;
      const netAmount = Math.round((totalAmt + (gstType === 'none' ? 0 : gstType === 'cgst_sgst' ? cgst + sgst : igst)) * 100) / 100;

      const totalsTexts = (baseY) => [
        { x: 447, y: baseY, text: totalQty, align: 'center' },
        { x: 682, y: baseY, text: totalAmt.toFixed(2), align: 'center' },
        ...(gstType === 'igst' ? [
          { x: 152, y: baseY + 16, text: `IGST ${cd.gstRate || 18}%` },
          { x: 682, y: baseY + 16, text: igst.toFixed(2), align: 'center' },
          { x: 152, y: baseY + 32, text: 'Net Amount' },
          { x: 682, y: baseY + 32, text: netAmount.toFixed(2), align: 'center' },
        ] : gstType === 'cgst_sgst' ? [
          { x: 152, y: baseY + 16, text: `CGST ${Number(cd.gstRate || 18) / 2}%` },
          { x: 682, y: baseY + 16, text: cgst.toFixed(2), align: 'center' },
          { x: 152, y: baseY + 32, text: `SGST ${Number(cd.gstRate || 18) / 2}%` },
          { x: 682, y: baseY + 32, text: sgst.toFixed(2), align: 'center' },
          { x: 152, y: baseY + 48, text: 'Net Amount' },
          { x: 682, y: baseY + 48, text: netAmount.toFixed(2), align: 'center' },
        ] : [
          { x: 152, y: baseY + 16, text: 'Net Amount' },
          { x: 682, y: baseY + 16, text: netAmount.toFixed(2), align: 'center' },
        ]),
      ];

      const page1Texts = [
        { x: 150, y: 265, text: cd.consignorName || '' },
        { x: 150, y: 280, text: cd.consignorAddress || '', wrap: true },
        { x: 150, y: 315, text: cd.consignorPincode || '' },
        { x: 150, y: 332, text: cd.consignorGstin || '' },
        { x: 150, y: 350, text: cd.consignorContact || '' },
        { x: 150, y: 370, text: cd.consigneeName || incharge?.name || '' },
        { x: 150, y: 385, text: cd.consigneeAddress || '' },
        { x: 150, y: 400, text: cd.consigneePincode || '' },
        { x: 150, y: 415, text: cd.consigneeGstin || '' },
        { x: 150, y: 425, text: cd.consigneeContact || '' },
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
          const unitCost = Number(m.purchaseCost) || 0;
          const totalCost = Number(m.totalCost) || 0;
          return [
            { x: 115, y, text: i + 1, align: 'center' },
            { x: 152, y, text: m.machineTypeId?.name || '-' },
            { x: 447, y, text: m.quantity, align: 'center' },
            { x: 572, y, text: unitCost || '-', align: 'center' },
            { x: 682, y, text: totalCost || '-', align: 'center' },
          ];
        }),
        // totals on page 1 only if no page 2
        ...(page2Rows.length === 0 ? totalsTexts(rowStartY + page1Rows.length * rowHeight + 65 + 4) : []),
      ];

      const canvas1 = await renderPageToCanvas('/539_page-0001.jpg', page1Texts);
      const imgData1 = canvas1.toDataURL('image/jpeg', 1.0);

      // PDF size = exact canvas size (1px = 1pt)
      const pdf = new jsPDF({
        orientation: canvas1.width > canvas1.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas1.width, canvas1.height],
        hotfixes: ['px_scaling'],
      });
      pdf.addImage(imgData1, 'JPEG', 0, 0, canvas1.width, canvas1.height);

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
        // totals on page 2
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

  const handleAssignMachine = async (e) => {
    e.preventDefault();
    try {
      if (assignForm.unitIds.length === 0) return alert('Select at least one unit');

      await Promise.all(assignForm.unitIds.map(unitId =>
        api.post('/movements', {
          machineUnitId: unitId,
          fromLocationType: 'store',
          toLocationType: 'supervisor',
          notes: 'Pre-assigned to supervisor by admin',
          operatorId: assignForm.operatorId,
          assignedUserId: id,
          quantity: assignForm.quantity
        }).then(res => api.put(`/movements/${res.data.data._id}/approve`))
      ));

      setIsAssignModalOpen(false);
      setAssignForm({ unitIds: [], operatorId: '', quantity: 1 });
      fetchMachines();
      fetchAvailableMachines();
      alert('Machines assigned to supervisor successfully!');
    } catch (error) {
      console.error('Error assigning machine:', error);
      alert(error.response?.data?.message || 'Error occurred');
    }
  };

  const handleReturnMachine = async (machine) => {
    if (window.confirm(`Return this machine (${machine.serialNumber}) to store?`)) {
      try {
        const res = await api.post('/movements', {
          machineUnitId: machine._id,
          fromLocationType: machine.status === 'assigned' ? 'site' : 'supervisor',
          fromLocationId: machine.currentSiteId?._id || null,
          toLocationType: 'store',
          notes: 'Returned from supervisor'
        });
        await api.put(`/movements/${res.data.data._id}/approve`);
        fetchMachines();
        fetchAvailableMachines();
        alert('Machine returned successfully');
      } catch (error) {
        console.error('Error returning machine:', error);
        alert(error.response?.data?.message || 'Error occurred');
      }
    }
  };

  const handleBulkUnassign = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to return ${selectedIds.length} machines to store?`)) return;
    
    try {
      await Promise.all(selectedIds.map(async (id) => {
        const machine = machines.find(m => m._id === id);
        if (!machine) return;
        const res = await api.post('/movements', {
          machineUnitId: id,
          fromLocationType: machine.status === 'assigned' ? 'site' : 'supervisor',
          fromLocationId: machine.currentSiteId?._id || null,
          toLocationType: 'store',
          notes: 'Bulk returned from supervisor'
        });
        await api.put(`/movements/${res.data.data._id}/approve`);
      }));
      setSelectedIds([]);
      fetchMachines();
      fetchAvailableMachines();
      alert('Selected machines returned successfully');
    } catch (error) {
      console.error('Error in bulk unassign:', error);
      alert('Failed to return some machines');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const machineColumns = [
    { key: 'machineTypeId', label: 'Stock Type', render: (val) => val?.name || '-' },
    { key: 'quantity', label: 'Qty', render: (val) => <span className="font-semibold text-indigo-600">{val}</span> },
    { key: 'serialNumbers', label: 'Serial Nos.', render: (val) => <span className="text-xs font-mono text-gray-500">{Array.isArray(val) ? val.join(', ') : val}</span> },
    { key: 'currentSiteId', label: 'Current Site', render: (val) => val?.name || <span className="text-gray-400">Not at site</span> },
    { key: 'condition', label: 'Condition' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ];

  const groupedMachines = Object.values(
    machines.reduce((acc, m) => {
      const key = m.machineTypeId?._id || m._id;
      if (!acc[key]) acc[key] = { ...m, quantity: 1, serialNumbers: [m.serialNumber] };
      else { acc[key].quantity += 1; acc[key].serialNumbers.push(m.serialNumber); }
      return acc;
    }, {})
  );

  if (!incharge) return <DashboardLayout><div className="p-6">Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{incharge.name}</h1>
        <p className="text-gray-500 text-sm mt-1">{incharge.email} {incharge.phone ? `• ${incharge.phone}` : ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Stocks</p>
          <p className="text-2xl font-bold text-indigo-600">{machines.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-2xl font-bold text-green-600">{machines.filter(m => m.status === 'available').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">In Repair</p>
          <p className="text-2xl font-bold text-red-600">{machines.filter(m => m.status === 'repair').length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Assigned Stocks</h2>
        <div className="flex space-x-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkUnassign}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
            >
              Unassign Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Assign Stock
          </button>
          <button
            onClick={handleDownloadChallan}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            Download Challan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {machines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={machines.length > 0 && selectedIds.length === machines.length}
                      onChange={() => setSelectedIds(selectedIds.length === machines.length ? [] : machines.map(m => m._id))}
                    />
                  </th>
                  {machineColumns.map(col => (
                    <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{col.label}</th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {machines.map((machine) => (
                  <tr key={machine._id} className={selectedIds.includes(machine._id) ? 'bg-indigo-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(machine._id)}
                        onChange={() => toggleSelect(machine._id)}
                      />
                    </td>
                    {machineColumns.map(col => (
                      <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                        {col.render ? col.render(machine[col.key], machine) : machine[col.key]}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(machine.status === 'assigned' || machine.status === 'available') && (
                        <button
                          onClick={() => handleReturnMachine(machine)}
                          className="text-red-600 hover:text-red-900 font-semibold"
                        >
                          Unassign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No machines assigned to this incharge" />
        )}
      </div>

      <Modal isOpen={isAssignModalOpen} onClose={() => { setIsAssignModalOpen(false); setAssignForm({ unitIds: [], operatorId: '' }); setSearchTerm(''); }} title="Assign Machine Units">
        <form onSubmit={handleAssignMachine}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name or serial no..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Units to Assign</label>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg p-3 bg-gray-50">
                {availableMachines.filter(m =>
                  m.machineTypeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  m.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                ).length > 0 ? availableMachines.filter(m =>
                  m.machineTypeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  m.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(m => (
                  <label key={m._id} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${assignForm.unitIds.includes(m._id) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                        checked={assignForm.unitIds.includes(m._id)}
                        onChange={(e) => {
                          const newSelection = e.target.checked
                            ? [...assignForm.unitIds, m._id]
                            : assignForm.unitIds.filter(uid => uid !== m._id);
                          setAssignForm({ ...assignForm, unitIds: newSelection });
                        }}
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className={`text-sm font-medium ${assignForm.unitIds.includes(m._id) ? 'text-indigo-900' : 'text-gray-900'}`}>{m.machineTypeId?.name}</p>
                      <p className={`text-xs ${assignForm.unitIds.includes(m._id) ? 'text-indigo-700' : 'text-gray-500'}`}>
                        Serial: <span className="font-mono">{m.serialNumber}</span> • Cond: <span className="capitalize">{m.condition}</span>
                      </p>
                    </div>
                  </label>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">No matching machines found.</p>
                )}
              </div>
            </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign Operator <span className="text-red-500">*</span></label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={assignForm.operatorId}
              onChange={e => setAssignForm({ ...assignForm, operatorId: e.target.value })}
              required
            >
              <option value="">-- Select Operator --</option>
              {operators.map(op => (
                <option key={op._id} value={op._id}>{op.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={assignForm.quantity}
              onChange={e => setAssignForm({ ...assignForm, quantity: Number(e.target.value) })}
              required
            />
          </div>
          <button
            type="submit"
            disabled={assignForm.unitIds.length === 0 || !assignForm.operatorId}
            className={`w-full py-2.5 rounded-lg font-medium text-white shadow-sm transition-colors ${assignForm.unitIds.length === 0 || !assignForm.operatorId ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            Confirm Assignment
          </button>
        </form>
      </Modal>

      {/* Challan Details Form Modal */}
      <Modal isOpen={isChallanFormOpen} onClose={() => setIsChallanFormOpen(false)} title="Delivery Challan Details">
        <form onSubmit={handleChallanFormSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Consignor Details</p>
          {[
            { label: 'Company Name', key: 'consignorName' },
            { label: 'Address', key: 'consignorAddress' },
            { label: 'Pincode', key: 'consignorPincode' },
            { label: 'GSTIN', key: 'consignorGstin' },
            { label: 'Contact', key: 'consignorContact' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={challanDetails[key]}
                onChange={e => setChallanDetails(p => ({ ...p, [key]: e.target.value }))}
                required
              />
            </div>
          ))}

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Consignee Details</p>
          {[
            { label: 'Consignee Name', key: 'consigneeName' },
            { label: 'Address', key: 'consigneeAddress' },
            { label: 'Pincode', key: 'consigneePincode' },
            { label: 'GSTIN', key: 'consigneeGstin' },
            { label: 'Contact', key: 'consigneeContact' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={challanDetails[key]}
                onChange={e => setChallanDetails(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Challan Info</p>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={challanDetails[key]}
                onChange={e => setChallanDetails(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">GST Details</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">GST Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={challanDetails.gstType}
              onChange={e => setChallanDetails(p => ({ ...p, gstType: e.target.value }))}
            >
              <option value="igst">IGST (Inter-state)</option>
              <option value="cgst_sgst">CGST + SGST (Intra-state)</option>
              <option value="none">No GST</option>
            </select>
          </div>
          {challanDetails.gstType !== 'none' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GST Rate (%)</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={challanDetails.gstRate}
                onChange={e => setChallanDetails(p => ({ ...p, gstRate: e.target.value }))}
              >
                {['0','5','12','18','28'].map(r => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
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

      {isChallanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 overflow-auto">
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-xl font-bold">Delivery Challan Preview</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={handleSavePdf}
                    disabled={isGeneratingPdf}
                    className={`px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
                      isGeneratingPdf
                        ? 'bg-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isGeneratingPdf ? 'Generating...' : 'Save as PDF'}
                  </button>
                  <button
                    onClick={() => setIsChallanOpen(false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <DeliveryChallan ref={challanRef} incharge={incharge} machines={machines} challanDetails={challanDetails} />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InchargeDetails;

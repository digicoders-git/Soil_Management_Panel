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
  const [assignedSites, setAssignedSites] = useState([]);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [selectedMachineForUnassign, setSelectedMachineForUnassign] = useState(null);
  const [selectedSiteForUnassign, setSelectedSiteForUnassign] = useState('');
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
    fetchAssignedSites();
  }, [id]);

  const fetchAssignedSites = async () => {
    try {
      const { data } = await api.get(`/sites?userId=${id}`);
      setAssignedSites(data.data || []);
    } catch (error) {
      console.error('Error fetching assigned sites:', error);
    }
  };

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
      await import('jspdf-autotable');

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

      const totalQty  = grouped.reduce((s, m) => s + m.quantity, 0);
      const totalAmt  = grouped.reduce((s, m) => s + (m.totalCost || 0), 0);
      const gstType = cd.gstType || 'igst';
      const gstRate = Number(cd.gstRate || 18) / 100;
      const cgst = gstType === 'cgst_sgst' ? Math.round(totalAmt * (gstRate / 2) * 100) / 100 : 0;
      const sgst = gstType === 'cgst_sgst' ? Math.round(totalAmt * (gstRate / 2) * 100) / 100 : 0;
      const igst = gstType === 'igst' ? Math.round(totalAmt * gstRate * 100) / 100 : 0;
      const netAmount = Math.round((totalAmt + (gstType === 'none' ? 0 : gstType === 'cgst_sgst' ? cgst + sgst : igst)) * 100) / 100;

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ARUN SOIL LAB PRIVATE LIMITED', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('DELIVERY CHALLAN', pageWidth / 2, 28, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text('Consignor:', 14, 40);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cd.consignorName || 'Arun Soil Lab', 14, 45);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cd.consignorAddress || '', 14, 50, { maxWidth: 80 });
      
      pdf.text('Consignee:', 14, 75);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cd.consigneeName || incharge?.name || '', 14, 80);
      pdf.setFont('helvetica', 'normal');
      pdf.text(cd.consigneeAddress || '', 14, 85, { maxWidth: 80 });

      const rightX = 120;
      pdf.text(`Challan No: ${challanNo}`, rightX, 40);
      pdf.text(`Date of issue: ${today}`, rightX, 45);
      pdf.text(`Supplier's Ref: ${cd.suppliersRef || ''}`, rightX, 50);
      pdf.text(`Other Ref: ${cd.othersRef || ''}`, rightX, 55);
      pdf.text(`Buyer's Order No: ${cd.buyersOrderNo || ''}`, rightX, 60);
      pdf.text(`Order Date: ${cd.buyersOrderDate || ''}`, rightX, 65);
      pdf.text(`Dispatch Doc No: ${cd.dispatchDocNo || ''}`, rightX, 70);
      pdf.text(`Dispatch Through: ${cd.dispatchThrough || ''}`, rightX, 75);
      pdf.text(`Destination: ${cd.destination || ''}`, rightX, 80);

      const tableColumn = ["Sr. No.", "Equipments", "Quantity", "Rate", "Amount"];
      const tableRows = [];

      grouped.forEach((m, i) => {
        const unitCost = Number(m.purchaseCost) || 0;
        const totalCost = Number(m.totalCost) || 0;
        tableRows.push([
          i + 1,
          m.machineTypeId?.name || '-',
          m.quantity,
          unitCost.toFixed(2),
          totalCost.toFixed(2)
        ]);
      });

      pdf.autoTable({
        startY: 100,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { textColor: [0, 0, 0] }
      });

      let finalY = pdf.lastAutoTable.finalY;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Totals', 14, finalY + 10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Quantity: ${totalQty}`, 14, finalY + 15);
      pdf.text(`Total Amount: ${totalAmt.toFixed(2)}`, 14, finalY + 20);
      
      let nextY = finalY + 25;
      if (gstType === 'igst') {
        pdf.text(`IGST (${cd.gstRate || 18}%): ${igst.toFixed(2)}`, 14, nextY);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Net Amount: ${netAmount.toFixed(2)}`, 14, nextY + 5);
      } else if (gstType === 'cgst_sgst') {
        pdf.text(`CGST (${Number(cd.gstRate || 18) / 2}%): ${cgst.toFixed(2)}`, 14, nextY);
        pdf.text(`SGST (${Number(cd.gstRate || 18) / 2}%): ${sgst.toFixed(2)}`, 14, nextY + 5);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Net Amount: ${netAmount.toFixed(2)}`, 14, nextY + 10);
      } else {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Net Amount: ${netAmount.toFixed(2)}`, 14, nextY);
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
      if (assignForm.unitIds.length === 0) return alert('Select at least one machine type');

      let finalUnitIds = [];

      for (const typeId of assignForm.unitIds) {
        const availableOfThisType = availableMachines.filter(m => (m.machineTypeId?._id || m.machineTypeId) === typeId);
        
        if (availableOfThisType.length < assignForm.quantity) {
          const typeName = availableOfThisType[0]?.machineTypeId?.name || 'Unknown Type';
          return alert(`Not enough units available for ${typeName}! You requested ${assignForm.quantity}, but only ${availableOfThisType.length} are available.`);
        }
        
        const selectedIds = availableOfThisType.slice(0, assignForm.quantity).map(m => m._id);
        finalUnitIds.push(...selectedIds);
      }

      await Promise.all(finalUnitIds.map(unitId =>
        api.post('/movements', {
          machineUnitId: unitId,
          fromLocationType: 'store',
          toLocationType: 'supervisor',
          notes: 'Pre-assigned to supervisor by admin',
          operatorId: assignForm.operatorId,
          assignedUserId: id
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

  const handleReturnMachine = (machine) => {
    setSelectedMachineForUnassign(machine);
    setSelectedSiteForUnassign(machine.currentSiteId?._id || '');
    setIsUnassignModalOpen(true);
  };

  const confirmReturnMachine = async () => {
    if (!selectedMachineForUnassign) return;
    
    try {
      const res = await api.post('/movements', {
        machineUnitId: selectedMachineForUnassign._id,
        fromLocationType: selectedSiteForUnassign ? 'site' : 'supervisor',
        fromLocationId: selectedSiteForUnassign || null,
        toLocationType: 'store',
        notes: `Returned from supervisor. ${selectedSiteForUnassign ? 'Removed from site.' : ''}`
      });
      await api.put(`/movements/${res.data.data._id}/approve`);
      
      setIsUnassignModalOpen(false);
      setSelectedMachineForUnassign(null);
      setSelectedSiteForUnassign('');
      
      fetchMachines();
      fetchAvailableMachines();
      alert('Machine returned successfully');
    } catch (error) {
      console.error('Error returning machine:', error);
      alert(error.response?.data?.message || 'Error occurred');
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
    { key: 'quantity', label: 'Qty', render: (val, obj) => <span className="font-semibold text-indigo-600">{val || obj.quantity || 1}</span> },
    { key: 'serialNumber', label: 'Serial No.', render: (val, obj) => <span className="text-xs font-mono text-gray-500">{val || obj.serialNumbers?.join(', ') || '-'}</span> },
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
                {
                  Object.values(availableMachines.reduce((acc, m) => {
                    const key = m.machineTypeId?._id || m.machineTypeId;
                    if (!acc[key]) {
                      acc[key] = {
                        typeId: key,
                        name: m.machineTypeId?.name || 'Unknown',
                        count: 1
                      };
                    } else {
                      acc[key].count += 1;
                    }
                    return acc;
                  }, {}))
                  .filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .length > 0 ? (
                    Object.values(availableMachines.reduce((acc, m) => {
                      const key = m.machineTypeId?._id || m.machineTypeId;
                      if (!acc[key]) {
                        acc[key] = {
                          typeId: key,
                          name: m.machineTypeId?.name || 'Unknown',
                          count: 1
                        };
                      } else {
                        acc[key].count += 1;
                      }
                      return acc;
                    }, {}))
                    .filter(group => group.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(group => (
                      <label key={group.typeId} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${assignForm.unitIds.includes(group.typeId) ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <div className="flex-shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                            checked={assignForm.unitIds.includes(group.typeId)}
                            onChange={(e) => {
                              const newSelection = e.target.checked
                                ? [...assignForm.unitIds, group.typeId]
                                : assignForm.unitIds.filter(uid => uid !== group.typeId);
                              setAssignForm({ ...assignForm, unitIds: newSelection });
                            }}
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className={`text-sm font-medium ${assignForm.unitIds.includes(group.typeId) ? 'text-indigo-900' : 'text-gray-900'}`}>{group.name}</p>
                          <p className={`text-xs ${assignForm.unitIds.includes(group.typeId) ? 'text-indigo-700' : 'text-gray-500'}`}>
                            Available in stock: <span className="font-semibold">{group.count}</span>
                          </p>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No matching machines found.</p>
                  )
                }
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

      <Modal 
        isOpen={isUnassignModalOpen} 
        onClose={() => { setIsUnassignModalOpen(false); setSelectedMachineForUnassign(null); }} 
        title="Unassign Machine"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Machine Details:</p>
            <p className="font-bold text-gray-900">{selectedMachineForUnassign?.machineTypeId?.name}</p>
            <p className="text-xs font-mono text-gray-500">Serial: {selectedMachineForUnassign?.serialNumber}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Site to Unassign From <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedSiteForUnassign}
              onChange={e => setSelectedSiteForUnassign(e.target.value)}
            >
              <option value="">-- No Specific Site (With Supervisor) --</option>
              {assignedSites.map(site => (
                <option key={site._id} value={site._id}>
                  {site.name} ({site.address?.slice(0, 20)}...)
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2 italic">
              Note: The machine will be returned to the main store.
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => { setIsUnassignModalOpen(false); setSelectedMachineForUnassign(null); }}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={confirmReturnMachine}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
            >
              Confirm Unassign
            </button>
          </div>
        </div>
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

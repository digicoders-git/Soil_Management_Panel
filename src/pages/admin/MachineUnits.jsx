import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import StatusBadge from '../../components/StatusBadge';
import api from '../../services/api';

const MachineUnits = () => {
    const [types, setTypes] = useState([]);
    const [units, setUnits] = useState([]);

    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [unitForm, setUnitForm] = useState({ machineTypeId: '', serialNumber: '', purchaseCost: '', purchaseDate: '', condition: 'good', quantity: 1 });
    const [amcDocument, setAmcDocument] = useState(null);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [typeRes, unitRes] = await Promise.all([
                api.get('/machine-types'),
                api.get('/machine-units')
            ]);
            setTypes(typeRes.data.data);
            setUnits(unitRes.data.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleUnitSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = new FormData();
            Object.entries(unitForm).forEach(([k, v]) => payload.append(k, v));
            if (amcDocument) payload.append('amcDocument', amcDocument);

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            if (editingId) {
                await api.put(`/machine-units/${editingId}`, payload, config);
            } else {
                await api.post('/machine-units', payload, config);
            }
            setIsUnitModalOpen(false);
            setUnitForm({ machineTypeId: '', serialNumber: '', purchaseCost: '', purchaseDate: '', condition: 'good', quantity: 1 });
            setAmcDocument(null);
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error('Error saving machine unit:', error);
            alert(error.response?.data?.message || 'Error saving unit');
        }
    };

    const handleEdit = (unit) => {
        setEditingId(unit._id);
        setUnitForm({
            machineTypeId: unit.machineTypeId?._id || unit.machineTypeId || '',
            serialNumber: unit.serialNumber,
            purchaseCost: unit.purchaseCost || '',
            purchaseDate: unit.purchaseDate ? new Date(unit.purchaseDate).toISOString().split('T')[0] : '',
            condition: unit.condition || 'good',
            quantity: unit.quantity || 1
        });
        setAmcDocument(null);
        setIsUnitModalOpen(true);
    };

    const handleDelete = async (unit) => {
        if (window.confirm('Are you sure you want to delete this machine unit?')) {
            try {
                await api.delete(`/machine-units/${unit._id}`);
                fetchData();
            } catch (error) {
                console.error('Error deleting machine unit:', error);
                alert(error.response?.data?.message || 'Failed to delete machine unit');
            }
        }
    };

    const unitColumns = [
        { key: 'serialNumber', label: 'Serial No.' },
        { key: 'machineTypeId', label: 'Type', render: (val) => val?.name || '-' },
        { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
        { key: 'condition', label: 'Condition' },
        {
            key: 'amcDocument', label: 'AMC', render: (val) => val
                ? <a href={`${import.meta.env.VITE_API_URL}/${val}`} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">View</a>
                : <span className="text-gray-400 text-sm">-</span>
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Stocks Units</h1>
                <button onClick={() => setIsUnitModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Unit</button>
            </div>

            <div className="bg-white rounded-lg shadow">
                <DataTable columns={unitColumns} data={units} onEdit={handleEdit} onDelete={handleDelete} />
            </div>

            <Modal isOpen={isUnitModalOpen} onClose={() => { setIsUnitModalOpen(false); setEditingId(null); setAmcDocument(null); setUnitForm({ machineTypeId: '', serialNumber: '', purchaseCost: '', purchaseDate: '', condition: 'good', quantity: 1 }); }} title={editingId ? "Edit Machine Unit" : "Add Machine Unit"}>
                <form onSubmit={handleUnitSubmit}>
                    <FormInput label="Machine Type" type="select" name="machineTypeId" value={unitForm.machineTypeId} onChange={e => setUnitForm({ ...unitForm, machineTypeId: e.target.value })}
                        options={[...types.map(t => ({ value: t._id, label: t.name }))]} required />
                    <FormInput label="Serial Number" name="serialNumber" value={unitForm.serialNumber} onChange={e => setUnitForm({ ...unitForm, serialNumber: e.target.value })} required />
                    {!editingId && <FormInput label="Quantity" type="number" name="quantity" value={unitForm.quantity} onChange={e => setUnitForm({ ...unitForm, quantity: e.target.value })} min={1} />}
                    <FormInput label="Purchase Cost (₹)" type="number" name="purchaseCost" value={unitForm.purchaseCost} onChange={e => setUnitForm({ ...unitForm, purchaseCost: e.target.value })} required />
                    <FormInput label="Purchase Date" type="date" name="purchaseDate" value={unitForm.purchaseDate} onChange={e => setUnitForm({ ...unitForm, purchaseDate: e.target.value })} />
                    <FormInput label="Condition" type="select" name="condition" value={unitForm.condition} onChange={e => setUnitForm({ ...unitForm, condition: e.target.value })} options={[
                        { value: 'good', label: 'Good' }, { value: 'damaged', label: 'Damaged' }, { value: 'maintenance', label: 'Under Maintenance' }
                    ]} />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">AMC Document <span className="text-gray-400 font-normal">(optional)</span></label>
                        <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                            amcDocument ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                        }`}>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setAmcDocument(e.target.files[0] || null)} />
                            {amcDocument ? (
                                <div className="flex flex-col items-center gap-1 px-4 text-center">
                                    <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span className="text-sm font-medium text-blue-600 truncate max-w-[200px]">{amcDocument.name}</span>
                                    <span className="text-xs text-gray-400">{(amcDocument.size / 1024).toFixed(1)} KB — click to change</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-gray-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    <span className="text-sm font-medium">Click to upload</span>
                                    <span className="text-xs">PDF, JPG, PNG up to 5MB</span>
                                </div>
                            )}
                        </label>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg mt-4">{editingId ? 'Update' : 'Save'} Unit</button>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default MachineUnits;

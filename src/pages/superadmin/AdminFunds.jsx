import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';

const AdminFunds = () => {
    const [funds, setFunds] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        adminId: '',
        amount: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchFunds();
        fetchAdmins();
    }, []);

    const fetchFunds = async () => {
        try {
            const { data } = await api.get('/admin-funds');
            setFunds(data.data);
        } catch (error) {
            console.error('Error fetching funds:', error);
        }
    };

    const fetchAdmins = async () => {
        try {
            const { data } = await api.get('/users');
            setAdmins(data.data.filter(u => u.role === 'admin'));
        } catch (error) {
            console.error('Error fetching admins:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin-funds', formData);
            fetchFunds();
            setIsModalOpen(false);
            setFormData({ adminId: '', amount: '', notes: '' });
        } catch (error) {
            console.error('Error adding fund:', error);
            alert(error.response?.data?.message || 'Error adding fund');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'adminId',
            label: 'Admin',
            render: (val) => val?.name || 'Unknown'
        },
        {
            key: 'amount',
            label: 'Amount',
            render: (val) => `₹${val?.toLocaleString()}`
        },
        { key: 'notes', label: 'Notes' },
        {
            key: 'createdAt',
            label: 'Date',
            render: (val) => new Date(val).toLocaleString()
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Admin Fund Management</h1>
                <div className="flex gap-2">
                  <ExportButtons
                    onExcel={() => exportToExcel(funds, columns, 'admin-funds')}
                    onPdf={() => exportToPdf(funds, columns, 'Admin Fund Management', 'admin-funds')}
                  />
                  <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-sm">
                    Add Funds to Admin
                  </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <DataTable columns={columns} data={funds} />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Transfer Funds to Admin"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Admin</label>
                        <select
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.adminId}
                            onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                            required
                        >
                            <option value="">-- Select Admin --</option>
                            {admins.map(admin => (
                                <option key={admin._id} value={admin._id}>{admin.name} ({admin.email})</option>
                            ))}
                        </select>
                    </div>
                    <FormInput
                        label="Amount (₹)"
                        type="number"
                        name="amount"
                        placeholder="Enter amount"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        required
                        min="1"
                    />
                    <FormInput
                        label="Notes"
                        name="notes"
                        placeholder="Reason for transfer"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 font-bold transition-colors"
                    >
                        {loading ? 'Processing...' : 'Confirm Transfer'}
                    </button>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default AdminFunds;

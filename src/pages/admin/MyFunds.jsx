import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';

const MyFunds = () => {
    const [funds, setFunds] = useState([]);
    const [totalFunds, setTotalFunds] = useState(0);

    useEffect(() => {
        fetchFunds();
    }, []);

    const fetchFunds = async () => {
        try {
            const { data } = await api.get('/admin-funds');
            setFunds(data.data);
            const total = data.data.reduce((sum, f) => sum + (f.amount || 0), 0);
            setTotalFunds(total);
        } catch (error) {
            console.error('Error fetching funds:', error);
        }
    };

    const columns = [
        {
            key: 'amount',
            label: 'Amount',
            render: (val) => (
                <span className="font-bold text-indigo-600">₹{val?.toLocaleString()}</span>
            )
        },
        { key: 'notes', label: 'Notes', render: (val) => val || '-' },
        {
            key: 'createdAt',
            label: 'Date & Time',
            render: (val) => new Date(val).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Received Funds</h1>
                    <p className="text-gray-500 mt-1">View all funds allocated to you by Super Admin.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-indigo-700 font-bold shadow-sm">
                        Total Received: ₹{totalFunds.toLocaleString()}
                    </div>
                    <ExportButtons
                        onExcel={() => exportToExcel(funds, columns, 'my-received-funds')}
                        onPdf={() => exportToPdf(funds, columns, 'My Received Funds', 'my-received-funds')}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <DataTable columns={columns} data={funds} />
            </div>
            
            {funds.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-3xl mt-6 border border-dashed border-gray-200">
                    <p className="text-gray-400">No funds received yet.</p>
                </div>
            )}
        </DashboardLayout>
    );
};

export default MyFunds;

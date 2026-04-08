import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import api from '../../services/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Allmachines = () => {
    const [types, setTypes] = useState([]);
    const [units, setUnits] = useState([]);
    const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'new' | 'old'
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');

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

    const availableYears = useMemo(() => {
        const years = units.map(u => new Date(u.purchaseDate || u.createdAt).getFullYear());
        return [...new Set(years)].sort((a, b) => b - a);
    }, [units]);

    const filteredUnits = useMemo(() => {
        return units.filter(u => {
            // New/Old filter
            if (stockFilter === 'new' && !u.isNew) return false;
            if (stockFilter === 'old' && u.isNew) return false;

            // Month/Year filter based on purchaseDate
            const date = new Date(u.purchaseDate || u.createdAt);
            if (selectedYear && date.getFullYear() !== parseInt(selectedYear)) return false;
            if (selectedMonth && date.getMonth() !== parseInt(selectedMonth)) return false;

            return true;
        });
    }, [units, stockFilter, selectedMonth, selectedYear]);

    const summary = useMemo(() => {
        return types.map(type => {
            const typeUnits = filteredUnits.filter(u => u.machineTypeId && u.machineTypeId._id === type._id);
            if (typeUnits.length === 0) return null;
            const availableUnits = typeUnits.filter(u => u.status === 'available').length;
            const assignedUnits = typeUnits.filter(u => u.status === 'assigned').length;
            const repairUnits = typeUnits.filter(u => u.status === 'repair').length;
            return {
                _id: type._id,
                name: type.name,
                category: type.category,
                totalQuantity: typeUnits.length,
                availableQuantity: availableUnits,
                assignedQuantity: assignedUnits,
                repairQuantity: repairUnits,
            };
        }).filter(Boolean);
    }, [types, filteredUnits]);

    const columns = [
        { key: 'name', label: 'Stock Type' },
        { key: 'category', label: 'Category', render: (val) => val ? val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-' },
        { key: 'totalQuantity', label: 'Total' },
        { key: 'availableQuantity', label: 'Available', render: (val) => <span className="font-semibold text-green-600">{val}</span> },
        { key: 'assignedQuantity', label: 'Assigned', render: (val) => <span className="font-semibold text-blue-600">{val}</span> },
        { key: 'repairQuantity', label: 'In Repair', render: (val) => <span className="font-semibold text-red-500">{val}</span> },
    ];

    const clearFilters = () => {
        setSelectedMonth('');
        setSelectedYear('');
        setStockFilter('all');
    };

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">All Stocks Overview</h1>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-4 items-center">
                {/* New / Old tabs */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                    {['all', 'new', 'old'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStockFilter(f)}
                            className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${stockFilter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                            {f === 'all' ? 'All Stock' : f === 'new' ? 'New Stock' : 'Old Stock'}
                        </button>
                    ))}
                </div>

                {/* Month filter */}
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    <option value="">All Months</option>
                    {MONTHS.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                    ))}
                </select>

                {/* Year filter */}
                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    <option value="">All Years</option>
                    {availableYears.map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>

                {(stockFilter !== 'all' || selectedMonth || selectedYear) && (
                    <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium">
                        Clear Filters
                    </button>
                )}

                <span className="ml-auto text-sm text-gray-500">{filteredUnits.length} units matched</span>
            </div>

            <div className="bg-white rounded-lg shadow">
                {summary.length > 0
                    ? <DataTable columns={columns} data={summary} />
                    : <div className="p-8 text-center text-gray-400">No stock found for selected filters.</div>
                }
            </div>
        </DashboardLayout>
    );
};

export default Allmachines;

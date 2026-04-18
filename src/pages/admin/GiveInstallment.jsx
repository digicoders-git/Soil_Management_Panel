import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FormInput from '../../components/FormInput';
import DataTable from '../../components/DataTable';
import { ExportButtons, exportToExcel, exportToPdf } from '../../utils/exportUtils';
import api from '../../services/api';

const GiveInstallment = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [siteSupervisors, setSiteSupervisors] = useState([]);
  const [filterSiteId, setFilterSiteId] = useState('all');
  const [formData, setFormData] = useState({ siteId: '', receivedBy: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    fetchSites();
    fetchInstallments();
  }, []);

  const fetchSites = async () => {
    try {
      const { data } = await api.get('/sites');
      setSites(data.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const fetchInstallments = async () => {
    try {
      const { data } = await api.get('/installments');
      setInstallments(data.data);
    } catch (error) {
      console.error('Error fetching installments:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'siteId') {
      const selectedSite = sites.find(s => s._id === value);
      const supervisors = selectedSite?.userId || [];
      setSiteSupervisors(Array.isArray(supervisors) ? supervisors : [supervisors].filter(Boolean));
      setFormData({ ...formData, siteId: value, receivedBy: '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.receivedBy) return alert('Please select a supervisor.');
    try {
      await api.post('/installments', formData);
      setFormData({ siteId: '', receivedBy: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });
      setSiteSupervisors([]);
      fetchInstallments();
    } catch (error) {
      console.error('Error creating installment:', error);
      alert(error.response?.data?.message || 'Error creating installment.');
    }
  };

  const columns = [
    { key: 'siteId', label: 'Site', render: (val) => val?.name || '-' },
    { key: 'receivedBy', label: 'Supervisor', render: (val) => val?.name || '-' },
    { key: 'amount', label: 'Amount', render: (val) => `₹${val.toLocaleString()}` },
    { key: 'note', label: 'Note' },
    { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
  ];

  // Per-site totals
  const siteStats = sites.map(site => {
    const siteInstallments = installments.filter(i =>
      (i.siteId?._id || i.siteId) === site._id
    );
    const total = siteInstallments.reduce((sum, i) => sum + i.amount, 0);
    return { ...site, totalGiven: total, count: siteInstallments.length };
  }).filter(s => s.totalGiven > 0);

  const grandTotal = installments.reduce((sum, i) => sum + i.amount, 0);

  const filteredInstallments = filterSiteId === 'all'
    ? installments
    : installments.filter(i => (i.siteId?._id || i.siteId) === filterSiteId);

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Give Installment</h1>
        <ExportButtons
          onExcel={() => exportToExcel(filteredInstallments, [{key:'siteId',label:'Site'},{key:'receivedBy',label:'Supervisor'},{key:'amount',label:'Amount'},{key:'note',label:'Note'},{key:'date',label:'Date'}], 'installments')}
          onPdf={() => exportToPdf(filteredInstallments, [{key:'siteId',label:'Site'},{key:'receivedBy',label:'Supervisor'},{key:'amount',label:'Amount'},{key:'date',label:'Date'}], 'Installments Report', 'installments')}
        />
      </div>

      {/* Grand Total Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 mb-6 text-white flex justify-between items-center shadow-lg">
        <div>
          <p className="text-sm opacity-80">Total Installments Given (All Sites)</p>
          <p className="text-3xl font-extrabold">₹{grandTotal.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">Sites with Installments</p>
          <p className="text-3xl font-extrabold">{siteStats.length}</p>
        </div>
      </div>

      {/* Per-Site Stats Cards */}
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Site-wise Installment Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {siteStats.length > 0 ? siteStats.map(site => (
          <div
            key={site._id}
            onClick={() => navigate(`/admin/sites/${site._id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 truncate mb-1">{site.name}</p>
            <p className="text-2xl font-bold text-blue-600">₹{site.totalGiven.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">
              {Array.isArray(site.userId) && site.userId.length > 0
                ? site.userId.map(u => u.name).join(', ')
                : 'No supervisor'}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                site.status === 'completed' ? 'bg-green-100 text-green-700' :
                site.status === 'active' || site.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>{site.status}</span>
              <span className="text-xs text-blue-500 group-hover:underline">View Details →</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{site.count} installment{site.count !== 1 ? 's' : ''}</p>
          </div>
        )) : (
          <p className="text-gray-400 text-sm col-span-full py-4">No installments given yet. Give your first installment above.</p>
        )}
      </div>

      {/* Form + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">New Installment</h2>
          <form onSubmit={handleSubmit}>
            <FormInput
              label="Select Site"
              type="select"
              name="siteId"
              value={formData.siteId}
              onChange={handleChange}
              options={sites.map(s => ({ value: s._id, label: s.name }))}
              required
            />
            {formData.siteId && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Supervisor <span className="text-red-500">*</span>
                </label>
                {siteSupervisors.length > 0 ? (
                  <select
                    name="receivedBy"
                    value={formData.receivedBy}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Supervisor --</option>
                    {siteSupervisors.map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">No supervisor assigned to this site.</p>
                )}
              </div>
            )}
            <FormInput label="Amount" type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="Enter amount" required />
            <FormInput label="Date" type="date" name="date" value={formData.date} onChange={handleChange} required />
            <FormInput label="Note" type="textarea" name="note" value={formData.note} onChange={handleChange} placeholder="Additional notes" />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Give Installment
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Installments</h2>
          <div className="overflow-y-auto max-h-96">
            {installments.slice(0, 6).map((inst, idx) => (
              <div key={idx} className="border-b py-3 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">{inst.siteId?.name}</span>
                  <span className="text-green-600 font-semibold text-sm">₹{inst.amount.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-500">To: {inst.receivedBy?.name || '-'}</p>
                <p className="text-xs text-gray-400">{new Date(inst.date).toLocaleDateString()}</p>
              </div>
            ))}
            {installments.length === 0 && <p className="text-gray-400 text-sm">No installments yet.</p>}
          </div>
        </div>
      </div>

      {/* Filter + Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">All Installments</h2>
          <select
            value={filterSiteId}
            onChange={e => setFilterSiteId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Sites</option>
            {sites.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
        <DataTable columns={columns} data={filteredInstallments} />
      </div>
    </DashboardLayout>
  );
};

export default GiveInstallment;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';

const MySites = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [enrichedSites, setEnrichedSites] = useState([]);

  useEffect(() => {
    fetchMySites();
  }, []);

  const fetchMySites = async () => {
    try {
      const [sitesRes, installmentsRes, expensesRes] = await Promise.all([
        api.get('/sites'),
        api.get('/installments'),
        api.get('/expenses'),
      ]);

      const sitesData = sitesRes.data.data;
      const installments = installmentsRes.data.data;
      const expenses = expensesRes.data.data;

      const enriched = sitesData.map(site => {
        const siteInstallments = installments.filter(i => i.siteId?._id === site._id || i.siteId === site._id);
        const siteExpenses = expenses.filter(e => e.siteId?._id === site._id || e.siteId === site._id);
        
        const totalGiven = siteInstallments.reduce((sum, i) => sum + i.amount, 0);
        const totalExpense = siteExpenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingBalance = totalGiven - totalExpense;

        return {
          ...site,
          totalGiven,
          totalExpense,
          remainingBalance,
        };
      });

      setEnrichedSites(enriched);
      setSites(sitesData);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sites</h1>

      {enrichedSites.length === 0 ? (
        <EmptyState message="No sites assigned to you" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedSites.map((site) => (
            <div
              key={site._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                  <StatusBadge status={site.status} />
                </div>
                <p className="text-sm text-gray-600 mb-4">{site.address}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Estimated Cost:</span>
                    <span className="font-semibold">₹{site.estimatedCost?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Given:</span>
                    <span className="font-semibold text-green-600">₹{site.totalGiven.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Expense:</span>
                    <span className="font-semibold text-red-600">₹{site.totalExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-gray-600 font-medium">Remaining Balance:</span>
                    <span className={`font-bold ${site.remainingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{site.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/user/sites/${site._id}`)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MySites;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';

const MySites = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);

  useEffect(() => {
    fetchMySites();
  }, []);

  const fetchMySites = async () => {
    try {
      const { data } = await api.get('/sites');
      setSites(data.data);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Sites</h1>

      {sites.length === 0 ? (
        <EmptyState message="No sites assigned to you" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div
              key={site._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/user/sites/${site._id}`)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                  <StatusBadge status={site.status} />
                </div>
                <p className="text-sm text-gray-600 mb-2">{site.address}</p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500">Estimated Cost</p>
                    <p className="text-lg font-semibold text-blue-600">
                      ₹{site.estimatedCost?.toLocaleString()}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MySites;

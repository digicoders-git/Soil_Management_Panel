import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password && formData.password !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match' });
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };
      if (formData.password) updateData.password = formData.password;

      const { data } = await api.put('/auth/profile', updateData);
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        setFormData({ ...formData, password: '', confirmPassword: '' });
        refreshUser();
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error updating profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-gray-500 mt-1">Update your personal information and password.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-gray-50/50"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-gray-50/50"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-gray-50/50"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="md:col-span-2">
                <hr className="my-4 border-gray-100" />
                <h3 className="text-lg font-bold text-gray-900 mb-4">Change Password</h3>
                <p className="text-sm text-gray-500 mb-4 italic">Leave blank if you don't want to change the password.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-gray-50/50"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none bg-gray-50/50"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;

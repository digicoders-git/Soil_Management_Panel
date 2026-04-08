import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import FormInput from '../../components/FormInput';
import api from '../../services/api';

const CreateSite = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    estimatedCost: '',
    startDate: '',
    notes: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sites', formData);
      navigate('/admin/sites');
    } catch (error) {
      console.error('Error creating site:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create New Site</h1>
          <p className="mt-2 text-sm text-slate-500">Fill in the details below to initialize a new site for soil testing and operations.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-semibold text-slate-800">Site Information</h2>
            <p className="text-sm text-slate-500 mt-1">Provide the geographical and administrative details.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
              <div className="md:col-span-2">
                <FormInput
                  label="Site Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Green Valley Expansion Project"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <FormInput
                  label="Site Address & Location Details"
                  type="textarea"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, Landmark, City, Pincode"
                  required
                />
              </div>

              <div>
                <FormInput
                  label="Estimated Cost (₹)"
                  type="number"
                  name="estimatedCost"
                  value={formData.estimatedCost}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <FormInput
                  label="Project Start Date"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <FormInput
                  label="Additional Notes / Scope of Work"
                  type="textarea"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Describe the soil testing objective or specific instructions..."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/sites')}
                className="px-6 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 transition-all duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2 -ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Publish New Site
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateSite;

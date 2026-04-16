import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import api from '../../services/api';

const MachineTypes = () => {
    const [types, setTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedTypeIds, setSelectedTypeIds] = useState([]);
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [typeForm, setTypeForm] = useState({ name: '', category: '', description: '', brand: '', model: '' });
    const [categoryForm, setCategoryForm] = useState({ name: '' });
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/machine-types');
            setTypes(res.data.data);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/machine-categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleTypeSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTypeId) {
                await api.put(`/machine-types/${editingTypeId}`, typeForm);
            } else {
                await api.post('/machine-types', typeForm);
            }
            setIsTypeModalOpen(false);
            setTypeForm({ name: '', category: '', description: '', brand: '', model: '' });
            setEditingTypeId(null);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving type');
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategoryId) {
                await api.put(`/machine-categories/${editingCategoryId}`, categoryForm);
            } else {
                await api.post('/machine-categories', categoryForm);
            }
            setIsCategoryModalOpen(false);
            setCategoryForm({ name: '' });
            setEditingCategoryId(null);
            fetchCategories();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving category');
        }
    };

    const handleEditType = (type) => {
        setEditingTypeId(type._id);
        setTypeForm({ name: type.name, category: type.category, description: type.description || '', brand: type.brand || '', model: type.model || '' });
        setIsTypeModalOpen(true);
    };

    const handleDeleteType = async (type) => {
        if (window.confirm('Delete this machine type?')) {
            try {
                await api.delete(`/machine-types/${type._id}`);
                fetchData();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete');
            }
        }
    };

    const handleBulkDeleteTypes = async () => {
        if (!selectedTypeIds.length) return;
        if (!window.confirm(`Delete ${selectedTypeIds.length} selected types?`)) return;
        try {
            await Promise.all(selectedTypeIds.map(id => api.delete(`/machine-types/${id}`)));
            setSelectedTypeIds([]);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete some types');
        }
    };

    const toggleTypeSelect = (id) => setSelectedTypeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const toggleSelectAllTypes = () => setSelectedTypeIds(prev => prev.length === types.length ? [] : types.map(t => t._id));

    const handleEditCategory = (cat) => {
        setEditingCategoryId(cat._id);
        setCategoryForm({ name: cat.name });
        setIsCategoryModalOpen(true);
    };

    const handleDeleteCategory = async (cat) => {
        if (window.confirm('Delete this category?')) {
            try {
                await api.delete(`/machine-categories/${cat._id}`);
                fetchCategories();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to delete');
            }
        }
    };

    const typeColumns = [
        { key: 'name', label: 'Machine Type' },
        { key: 'category', label: 'Category' },
        { key: 'brand', label: 'Brand', render: (val) => val || '-' },
        { key: 'model', label: 'Model', render: (val) => val || '-' },
        { key: 'description', label: 'Description', render: (val) => val || '-' },
    ];

    const categoryColumns = [
        { key: 'name', label: 'Category Name' },
        { key: 'createdAt', label: 'Created', render: (val) => new Date(val).toLocaleDateString() },
    ];

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Stocks Types</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                    >
                        + Add Category
                    </button>
                    <button
                        onClick={() => { setEditingTypeId(null); setTypeForm({ name: '', category: '', description: '', brand: '', model: '' }); setIsTypeModalOpen(true); }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                    >
                        + Add Type
                    </button>
                </div>
            </div>

            {/* Categories Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Categories</h2>
                <div className="flex flex-wrap gap-2">
                    {categories.length > 0 ? categories.map(cat => (
                        <div key={cat._id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm">
                            <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                            <button onClick={() => handleEditCategory(cat)} className="text-blue-400 hover:text-blue-600 text-xs">✏️</button>
                            <button onClick={() => handleDeleteCategory(cat)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </div>
                    )) : (
                        <p className="text-sm text-gray-400">No categories yet. Add one above.</p>
                    )}
                </div>
            </div>

            {/* Types Table */}
            <div className="bg-white rounded-lg shadow">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 cursor-pointer"
                            checked={types.length > 0 && selectedTypeIds.length === types.length}
                            onChange={toggleSelectAllTypes}
                        />
                        <span className="text-sm text-gray-500">{selectedTypeIds.length > 0 ? `${selectedTypeIds.length} selected` : `${types.length} types`}</span>
                    </div>
                    {selectedTypeIds.length > 0 && (
                        <button onClick={handleBulkDeleteTypes} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                            Delete Selected ({selectedTypeIds.length})
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr>
                                <th className="px-4 py-3"></th>
                                {typeColumns.map(col => (
                                    <th key={col.key} className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{col.label}</th>
                                ))}
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {types.map(type => (
                                <tr key={type._id} className={selectedTypeIds.includes(type._id) ? 'bg-red-50' : 'hover:bg-gray-50/50'}>
                                    <td className="px-4 py-4">
                                        <input type="checkbox" className="w-4 h-4 cursor-pointer"
                                            checked={selectedTypeIds.includes(type._id)}
                                            onChange={() => toggleTypeSelect(type._id)}
                                        />
                                    </td>
                                    {typeColumns.map(col => (
                                        <td key={col.key} className="px-6 py-4 text-sm text-gray-600">
                                            {col.render ? col.render(type[col.key]) : type[col.key]}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4">
                                        <div className="flex gap-3">
                                            <button onClick={() => handleEditType(type)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button onClick={() => handleDeleteType(type)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {types.length === 0 && (
                                <tr><td colSpan={typeColumns.length + 2} className="px-6 py-12 text-center text-gray-400">No types found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Type Modal */}
            <Modal
                isOpen={isTypeModalOpen}
                onClose={() => { setIsTypeModalOpen(false); setEditingTypeId(null); setTypeForm({ name: '', category: '', description: '', brand: '', model: '' }); }}
                title={editingTypeId ? 'Edit Machine Type' : 'Add Machine Type'}
            >
                <form onSubmit={handleTypeSubmit}>
                    <FormInput label="Name" name="name" value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} required />
                    <FormInput label="Brand" name="brand" value={typeForm.brand} onChange={e => setTypeForm({ ...typeForm, brand: e.target.value })} />
                    <FormInput label="Model" name="model" value={typeForm.model} onChange={e => setTypeForm({ ...typeForm, model: e.target.value })} />
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                        <select
                            value={typeForm.category}
                            onChange={e => setTypeForm({ ...typeForm, category: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        {categories.length === 0 && (
                            <p className="text-xs text-orange-500 mt-1">No categories found. <button type="button" onClick={() => { setIsTypeModalOpen(false); setIsCategoryModalOpen(true); }} className="underline font-semibold">Add a category first</button></p>
                        )}
                    </div>
                    <FormInput label="Description" type="textarea" name="description" value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg mt-2 hover:bg-indigo-700">
                        {editingTypeId ? 'Update' : 'Save'} Type
                    </button>
                </form>
            </Modal>

            {/* Add/Edit Category Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => { setIsCategoryModalOpen(false); setEditingCategoryId(null); setCategoryForm({ name: '' }); }}
                title={editingCategoryId ? 'Edit Category' : 'Add Category'}
            >
                <form onSubmit={handleCategorySubmit}>
                    <FormInput
                        label="Category Name"
                        name="name"
                        value={categoryForm.name}
                        onChange={e => setCategoryForm({ name: e.target.value })}
                        placeholder="e.g. Heavy Machinery"
                        required
                    />
                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold">
                        {editingCategoryId ? 'Update' : 'Add'} Category
                    </button>
                </form>
            </Modal>
        </DashboardLayout>
    );
};

export default MachineTypes;

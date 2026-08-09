import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Power,
  Phone,
  Mail,
  MapPin,
  X,
  RefreshCw,
} from 'lucide-react';

const SuppliersPage = () => {
  const { isAdmin } = useContext(AuthContext);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/suppliers?search=${search}`);
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name) {
      setModalError('Supplier name is required.');
      return;
    }

    try {
      setSaving(true);
      if (editingSupplier) {
        await API.put(`/suppliers/${editingSupplier._id}`, formData);
      } else {
        await API.post('/suppliers', formData);
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (supplier) => {
    if (!window.confirm(`Toggle active status for supplier '${supplier.name}'?`)) return;
    try {
      await API.patch(`/suppliers/${supplier._id}/status`);
      fetchSuppliers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle supplier status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <Building2 className="w-6 h-6 text-orange-500 mr-2.5" />
            LPG Bulk Suppliers Directory
          </h1>
          <p className="text-sm text-slate-400">Manage supplier profiles and delivery contact information</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={fetchSuppliers}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
            Loading suppliers...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No suppliers found. Click "Add New Supplier" to create your first supplier profile.
          </div>
        ) : (
          suppliers.map((supplier) => (
            <div
              key={supplier._id}
              className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-white leading-tight">{supplier.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      supplier.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {supplier.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  {supplier.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}

                  {supplier.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}

                  {supplier.address && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      <span>{supplier.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(supplier)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Edit supplier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(supplier)}
                    className={`p-1.5 rounded-lg transition ${
                      supplier.isActive
                        ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                    title={supplier.isActive ? 'Deactivate supplier' : 'Activate supplier'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
            </h3>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bulk Energy Ghana Ltd"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+233 24 123 4567"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="orders@supplier.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Physical / Depot Address
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Industrial Port Area, Tema"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/20 transition"
                >
                  {saving ? 'Saving...' : editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;

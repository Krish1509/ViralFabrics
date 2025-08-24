'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  PlusIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Order, Mill, MillInputFormData } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';

interface MillInputFormProps {
  order: Order | null;
  mills: Mill[];
  onClose: () => void;
  onSuccess: () => void;
  onAddMill: () => void;
  onRefreshMills: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function MillInputForm({ 
  order, 
  mills, 
  onClose, 
  onSuccess, 
  onAddMill, 
  onRefreshMills 
}: MillInputFormProps) {
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState<MillInputFormData>({
    orderId: order?.orderId || '',
    mill: '',
    millDate: '',
    chalanNo: '',
    greighMtr: '',
    pcs: '',
    notes: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [showAddMillModal, setShowAddMillModal] = useState(false);
  const [addMillForm, setAddMillForm] = useState({
    name: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    email: ''
  });

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        orderId: order.orderId,
        mill: '',
        millDate: '',
        chalanNo: '',
        greighMtr: '',
        pcs: '',
        notes: ''
      });
      setErrors({});
    }
  }, [order]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.mill) {
      newErrors.mill = 'Mill is required';
    }

    if (!formData.millDate) {
      newErrors.millDate = 'Mill date is required';
    }

    if (!formData.chalanNo?.trim()) {
      newErrors.chalanNo = 'Chalan number is required';
    }

    if (!formData.greighMtr || parseFloat(formData.greighMtr) <= 0) {
      newErrors.greighMtr = 'Valid greigh meters is required';
    }

    if (!formData.pcs || parseInt(formData.pcs) <= 0) {
      newErrors.pcs = 'Valid number of pieces is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mill-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrors({ submit: data.message || 'Failed to create mill input' });
      }
    } catch (error) {
      console.error('Error creating mill input:', error);
      setErrors({ submit: 'Failed to create mill input' });
    } finally {
      setSaving(false);
    }
  };

  // Handle add new mill
  const handleAddMill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addMillForm)
      });

      const data = await response.json();
      if (data.success) {
        setShowAddMillModal(false);
        setAddMillForm({ name: '', contactPerson: '', contactPhone: '', address: '', email: '' });
        onRefreshMills();
        // Set the new mill as selected
        setFormData(prev => ({ ...prev, mill: data.data._id }));
      } else {
        setErrors({ addMill: data.message || 'Failed to add mill' });
      }
    } catch (error) {
      console.error('Error adding mill:', error);
      setErrors({ addMill: 'Failed to add mill' });
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}>
              <BuildingOfficeIcon className={`h-6 w-6 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Add Mill Input
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Order: {order.orderId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className={`p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-red-900/20 border-red-500/30 text-red-400'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  {errors.submit}
                </div>
              </div>
            )}

            {/* Order Information */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Order Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Order ID
                  </label>
                  <input
                    type="text"
                    value={order.orderId}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Order Type
                  </label>
                  <input
                    type="text"
                    value={order.orderType || 'Not specified'}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Mill Input Details */}
            <div className="space-y-4">
              <h4 className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Mill Input Details
              </h4>

              {/* Mill Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Mill Name *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.mill}
                    onChange={(e) => setFormData({ ...formData, mill: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                      errors.mill
                        ? isDarkMode
                          ? 'border-red-500 bg-white/10 text-white'
                          : 'border-red-500 bg-white text-gray-900'
                        : isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select Mill</option>
                    {mills.map((mill) => (
                      <option key={mill._id} value={mill._id}>
                        {mill.name}
                      </option>
                    ))}
                    <option value="add_new">➕ Add New Mill</option>
                  </select>
                  {formData.mill === 'add_new' && (
                    <button
                      type="button"
                      onClick={() => setShowAddMillModal(true)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        isDarkMode
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      Add Mill
                    </button>
                  )}
                </div>
                {errors.mill && (
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {errors.mill}
                  </p>
                )}
              </div>

              {/* Mill Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Mill Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.millDate}
                    onChange={(e) => setFormData({ ...formData, millDate: e.target.value })}
                    className={`w-full px-3 py-2 pl-10 rounded-lg border transition-colors ${
                      errors.millDate
                        ? isDarkMode
                          ? 'border-red-500 bg-white/10 text-white'
                          : 'border-red-500 bg-white text-gray-900'
                        : isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                  <CalendarIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                {errors.millDate && (
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {errors.millDate}
                  </p>
                )}
              </div>

              {/* Chalan Number */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Chalan Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.chalanNo}
                    onChange={(e) => setFormData({ ...formData, chalanNo: e.target.value })}
                    placeholder="Enter chalan number"
                    className={`w-full px-3 py-2 pl-10 rounded-lg border transition-colors ${
                      errors.chalanNo
                        ? isDarkMode
                          ? 'border-red-500 bg-white/10 text-white'
                          : 'border-red-500 bg-white text-gray-900'
                        : isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                  <DocumentTextIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                {errors.chalanNo && (
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {errors.chalanNo}
                  </p>
                )}
              </div>

              {/* Greigh Mtr and PCS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Greigh Meters *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.greighMtr}
                      onChange={(e) => setFormData({ ...formData, greighMtr: e.target.value })}
                      min="0"
                      step="0.01"
                      placeholder="Enter meters"
                      className={`w-full px-3 py-2 pl-10 rounded-lg border transition-colors ${
                        errors.greighMtr
                          ? isDarkMode
                            ? 'border-red-500 bg-white/10 text-white'
                            : 'border-red-500 bg-white text-gray-900'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                    <BeakerIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </div>
                  {errors.greighMtr && (
                    <p className={`text-sm mt-1 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {errors.greighMtr}
                    </p>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Number of Pieces *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.pcs}
                      onChange={(e) => setFormData({ ...formData, pcs: e.target.value })}
                      min="1"
                      placeholder="Enter pieces"
                      className={`w-full px-3 py-2 pl-10 rounded-lg border transition-colors ${
                        errors.pcs
                          ? isDarkMode
                            ? 'border-red-500 bg-white/10 text-white'
                            : 'border-red-500 bg-white text-gray-900'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    />
                    <PlusIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </div>
                  {errors.pcs && (
                    <p className={`text-sm mt-1 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {errors.pcs}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Enter any additional notes"
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-300 bg-white/10 hover:bg-white/20'
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 ${
                  saving
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4" />
                    <span>Add Mill Input</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Add Mill Modal */}
        {showAddMillModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${
              isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
            }`}>
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Add New Mill
                </h3>
                <button
                  onClick={() => setShowAddMillModal(false)}
                  className={`p-2 rounded-full transition-colors ${
                    isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-white/10' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleAddMill} className="p-6 space-y-4">
                {errors.addMill && (
                  <div className={`p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-red-900/20 border-red-500/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {errors.addMill}
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Mill Name *
                  </label>
                  <input
                    type="text"
                    value={addMillForm.name}
                    onChange={(e) => setAddMillForm({ ...addMillForm, name: e.target.value })}
                    required
                    placeholder="Enter mill name"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={addMillForm.contactPerson}
                    onChange={(e) => setAddMillForm({ ...addMillForm, contactPerson: e.target.value })}
                    placeholder="Enter contact person name"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={addMillForm.contactPhone}
                    onChange={(e) => setAddMillForm({ ...addMillForm, contactPhone: e.target.value })}
                    placeholder="Enter contact phone"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Address
                  </label>
                  <textarea
                    value={addMillForm.address}
                    onChange={(e) => setAddMillForm({ ...addMillForm, address: e.target.value })}
                    rows={2}
                    placeholder="Enter mill address"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={addMillForm.email}
                    onChange={(e) => setAddMillForm({ ...addMillForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMillModal(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isDarkMode
                        ? 'text-gray-300 bg-white/10 hover:bg-white/20'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Add Mill
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

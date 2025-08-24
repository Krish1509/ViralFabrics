'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Order, MillOutputFormData } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';

interface MillOutputFormProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function MillOutputForm({ 
  order, 
  onClose, 
  onSuccess 
}: MillOutputFormProps) {
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState<MillOutputFormData>({
    orderId: order?.orderId || '',
    recdDate: '',
    millBillNo: '',
    finishedMtr: '',
    millRate: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        orderId: order.orderId,
        recdDate: '',
        millBillNo: '',
        finishedMtr: '',
        millRate: ''
      });
      setErrors({});
    }
  }, [order]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.recdDate) {
      newErrors.recdDate = 'Received date is required';
    }

    if (!formData.millBillNo?.trim()) {
      newErrors.millBillNo = 'Mill bill number is required';
    }

    if (!formData.finishedMtr || parseFloat(formData.finishedMtr) <= 0) {
      newErrors.finishedMtr = 'Valid finished meters is required';
    }

    if (!formData.millRate || parseFloat(formData.millRate) <= 0) {
      newErrors.millRate = 'Valid mill rate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/mill-outputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          recdDate: formData.recdDate,
          millBillNo: formData.millBillNo.trim(),
          finishedMtr: parseFloat(formData.finishedMtr),
          millRate: parseFloat(formData.millRate)
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setErrors({ submit: result.error || 'Failed to create mill output' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof MillOutputFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-2xl mx-auto ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md border border-gray-700' : 'bg-white/95 backdrop-blur-md border border-gray-200'} rounded-xl shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
            <DocumentTextIcon className="w-6 h-6 mr-2 text-blue-500" />
            Add Mill Output
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${
              isDarkMode 
                ? 'hover:bg-gray-700/50 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-gradient-to-br from-transparent to-gray-50/30 dark:to-gray-700/20">
          {/* Order No (Auto) - Full Width */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Order No
            </label>
            <input
              type="text"
              value={order.orderId}
              disabled
              className={`w-full px-4 py-3 border rounded-xl bg-gradient-to-r ${
                isDarkMode 
                  ? 'border-gray-600/50 text-gray-400 bg-gray-700/50' 
                  : 'border-gray-300/50 text-gray-500 bg-gray-50/50'
              } font-mono text-sm`}
            />
          </div>

          {/* Two Column Grid for Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RECD DATE */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                RECD DATE <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.recdDate}
                  onChange={(e) => handleInputChange('recdDate', e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700/80 border-gray-600/50 text-white placeholder-gray-400 hover:border-gray-500/50' 
                      : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 hover:border-gray-400/50'
                  } ${errors.recdDate ? 'border-red-500 ring-red-500/50' : ''}`}
                />
                <CalendarIcon className={`absolute left-4 top-3.5 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              {errors.recdDate && (
                <p className="mt-2 text-sm text-red-500 flex items-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  {errors.recdDate}
                </p>
              )}
            </div>

            {/* Mill Bill No */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Mill Bill No <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.millBillNo}
                  onChange={(e) => handleInputChange('millBillNo', e.target.value)}
                  placeholder="Enter mill bill number"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700/80 border-gray-600/50 text-white placeholder-gray-400 hover:border-gray-500/50' 
                      : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 hover:border-gray-400/50'
                  } ${errors.millBillNo ? 'border-red-500 ring-red-500/50' : ''}`}
                />
                <DocumentTextIcon className={`absolute left-4 top-3.5 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              {errors.millBillNo && (
                <p className="mt-2 text-sm text-red-500 flex items-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  {errors.millBillNo}
                </p>
              )}
            </div>

            {/* Finished Mtr */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                Finished Mtr <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                value={formData.finishedMtr}
                onChange={(e) => handleInputChange('finishedMtr', e.target.value)}
                placeholder="Enter finished meters"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700/80 border-gray-600/50 text-white placeholder-gray-400 hover:border-gray-500/50' 
                    : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 hover:border-gray-400/50'
                } ${errors.finishedMtr ? 'border-red-500 ring-red-500/50' : ''}`}
              />
              {errors.finishedMtr && (
                <p className="mt-2 text-sm text-red-500 flex items-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  {errors.finishedMtr}
                </p>
              )}
            </div>

            {/* Mill Rate */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Mill Rate <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                value={formData.millRate}
                onChange={(e) => handleInputChange('millRate', e.target.value)}
                placeholder="Enter mill rate"
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700/80 border-gray-600/50 text-white placeholder-gray-400 hover:border-gray-500/50' 
                    : 'bg-white/80 border-gray-300/50 text-gray-900 placeholder-gray-500 hover:border-gray-400/50'
                } ${errors.millRate ? 'border-red-500 ring-red-500/50' : ''}`}
              />
              {errors.millRate && (
                <p className="mt-2 text-sm text-red-500 flex items-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  {errors.millRate}
                </p>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className={`p-4 border rounded-xl ${isDarkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 border rounded-xl font-semibold transition-all duration-200 hover:scale-105 ${
                isDarkMode 
                  ? 'border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:border-gray-500/50' 
                  : 'border-gray-300/50 text-gray-700 hover:bg-gray-50/50 hover:border-gray-400/50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Save Mill Output
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

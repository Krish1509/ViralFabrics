'use client';

import { useState } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { 
  XMarkIcon, 
  TruckIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DispatchFormProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DispatchForm({ orderId, onClose, onSuccess }: DispatchFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orderId: orderId,
    dispatchDate: '',
    billNo: '',
    finishMtr: '',
    saleRate: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.dispatchDate) {
      newErrors.dispatchDate = 'Dispatch date is required';
    }

    if (!formData.billNo.trim()) {
      newErrors.billNo = 'Bill number is required';
    }

    if (!formData.finishMtr) {
      newErrors.finishMtr = 'Finish meters is required';
    } else if (isNaN(Number(formData.finishMtr)) || Number(formData.finishMtr) < 0) {
      newErrors.finishMtr = 'Finish meters must be a valid positive number';
    }

    if (!formData.saleRate) {
      newErrors.saleRate = 'Sale rate is required';
    } else if (isNaN(Number(formData.saleRate)) || Number(formData.saleRate) < 0) {
      newErrors.saleRate = 'Sale rate must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: formData.orderId,
          dispatchDate: formData.dispatchDate,
          billNo: formData.billNo.trim(),
          finishMtr: Number(formData.finishMtr),
          saleRate: Number(formData.saleRate)
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setErrors({ submit: data.error || 'Failed to create dispatch record' });
      }
    } catch (error) {
      console.error('Error creating dispatch:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const calculateTotal = () => {
    const finishMtr = Number(formData.finishMtr) || 0;
    const saleRate = Number(formData.saleRate) || 0;
    return finishMtr * saleRate;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      } max-h-[95vh] overflow-hidden`}>
        
        {/* Header */}
        <div className={`relative p-6 border-b ${
          isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800' : 'border-gray-200 bg-gradient-to-r from-white to-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-orange-600 to-red-600' 
                  : 'bg-gradient-to-br from-orange-500 to-red-500'
              }`}>
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Add Dispatch Record
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Create a new dispatch record for Order #{orderId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkMode
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Order ID (Read-only) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Order No
              </label>
              <div className={`px-4 py-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-300' 
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}>
                {orderId}
              </div>
            </div>

            {/* Dispatch Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <CalendarIcon className="h-4 w-4 inline mr-2" />
                Dispatch Date
              </label>
              <input
                type="date"
                value={formData.dispatchDate}
                onChange={(e) => handleInputChange('dispatchDate', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.dispatchDate
                    ? 'border-red-500 focus:border-red-500'
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-orange-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                }`}
                required
              />
              {errors.dispatchDate && (
                <p className="mt-1 text-sm text-red-500">{errors.dispatchDate}</p>
              )}
            </div>

            {/* Bill No */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <DocumentTextIcon className="h-4 w-4 inline mr-2" />
                Bill No
              </label>
              <input
                type="text"
                value={formData.billNo}
                onChange={(e) => handleInputChange('billNo', e.target.value)}
                placeholder="Enter bill number"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.billNo
                    ? 'border-red-500 focus:border-red-500'
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-orange-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                }`}
                required
              />
              {errors.billNo && (
                <p className="mt-1 text-sm text-red-500">{errors.billNo}</p>
              )}
            </div>

            {/* Finish Meters */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <ArrowPathIcon className="h-4 w-4 inline mr-2" />
                Finish Mtr
              </label>
              <input
                type="number"
                value={formData.finishMtr}
                onChange={(e) => handleInputChange('finishMtr', e.target.value)}
                placeholder="Enter finish meters"
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.finishMtr
                    ? 'border-red-500 focus:border-red-500'
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-orange-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                }`}
                required
              />
              {errors.finishMtr && (
                <p className="mt-1 text-sm text-red-500">{errors.finishMtr}</p>
              )}
            </div>

            {/* Sale Rate */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <CurrencyDollarIcon className="h-4 w-4 inline mr-2" />
                Sale Rate (₹)
              </label>
              <input
                type="number"
                value={formData.saleRate}
                onChange={(e) => handleInputChange('saleRate', e.target.value)}
                placeholder="Enter sale rate"
                min="0"
                step="0.01"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  errors.saleRate
                    ? 'border-red-500 focus:border-red-500'
                    : isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-orange-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                }`}
                required
              />
              {errors.saleRate && (
                <p className="mt-1 text-sm text-red-500">{errors.saleRate}</p>
              )}
            </div>

            {/* Total Value Preview */}
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Total Value:
                </span>
                <span className={`text-lg font-bold ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>
                  ₹{calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className={`p-4 rounded-lg border border-red-500 ${
                isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
              }`}>
                <p className="text-sm text-red-500">{errors.submit}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-3 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                } text-white font-medium`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Dispatch'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

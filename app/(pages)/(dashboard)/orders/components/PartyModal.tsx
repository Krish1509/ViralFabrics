'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { PartyFormData } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';

interface PartyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PartyModal({ onClose, onSuccess }: PartyModalProps) {
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState<PartyFormData>({
    name: '',
    contactName: '',
    contactPhone: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof PartyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Party name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Party name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Party name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Party name cannot exceed 100 characters';
    }

    // Contact name validation
    if (formData.contactName && formData.contactName.trim().length > 50) {
      newErrors.contactName = 'Contact name cannot exceed 50 characters';
    }

    // Contact phone validation
    if (formData.contactPhone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.contactPhone.replace(/\s/g, ''))) {
        newErrors.contactPhone = 'Please enter a valid phone number';
      } else if (formData.contactPhone.trim().length > 20) {
        newErrors.contactPhone = 'Contact phone cannot exceed 20 characters';
      }
    }

    // Address validation
    if (formData.address && formData.address.trim().length > 200) {
      newErrors.address = 'Address cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrors({ submit: 'Authentication token not found. Please login again.' });
        return;
      }

      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
      } else {
        setErrors({ submit: data.message || 'Failed to create party' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while creating the party' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b transition-colors duration-300 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Add New Party</h2>
          <button
            onClick={onClose}
            className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Party Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Party Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter party name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter contact name"
              />
              {errors.contactName && (
                <p className="mt-1 text-sm text-red-600">{errors.contactName}</p>
              )}
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter contact phone"
              />
              {errors.contactPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter address"
                rows={3}
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

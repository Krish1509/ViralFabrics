'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

interface QualityModalProps {
  onClose: () => void;
  onSuccess: (newQualityName?: string, newQualityData?: any) => void;
}

export default function QualityModal({ onClose, onSuccess }: QualityModalProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [formData, setFormData] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Quality name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Quality name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Quality name cannot exceed 100 characters';
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
      const response = await fetch('/api/qualities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(formData.name.trim(), data.data);
      } else {
        setErrors({ submit: data.message || 'Failed to create quality' });
      }
    } catch (error) {
      console.error('Error creating quality:', error);
      setErrors({ submit: 'Failed to create quality. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
        <div className="relative w-full max-w-md mx-4 rounded-lg shadow-2xl transition-colors duration-300 bg-white border border-gray-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
      <div className={`relative w-full max-w-md mx-4 rounded-lg shadow-2xl transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
          isDarkMode ? 'border-slate-600' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold transition-colors duration-300 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Add New Quality
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors duration-300 ${
              isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quality Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-gray-700'
            }`}>
              Quality Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                errors.name ? 'border-red-500' : isDarkMode ? 'border-slate-600 bg-slate-700 text-white' : 'border-gray-300'
              }`}
              placeholder="Enter quality name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-slate-600 text-white hover:bg-slate-600' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Quality'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

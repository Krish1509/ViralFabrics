'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '../../hooks/useDarkMode';
import QualityModal from './QualityModal';
import { 
  XMarkIcon, 
  TruckIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface AdditionalQualityMtr {
  quality: string;
  finishMtr: string;
}

interface DispatchItem {
  id: string;
  dispatchDate: string;
  billNo: string;
  quality: string;
  finishMtr: string;
  additionalQualityMtr: AdditionalQualityMtr[];
}

interface DispatchFormProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Quality {
  _id: string;
  name: string;
}

// EnhancedDropdown Component
interface EnhancedDropdownProps {
  options: Quality[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onSelect: (quality: Quality) => void;
  isDarkMode: boolean;
  error?: string;
  onAddNew: () => void;
  onDelete: (quality: Quality) => void;
  itemIndex: string; // Changed to string for additional items
  recentlyAddedId?: string | null;
}

function EnhancedDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchValue,
  onSearchChange,
  showDropdown,
  onToggleDropdown,
  onSelect,
  isDarkMode,
  error,
  onAddNew,
  onDelete,
  itemIndex,
  recentlyAddedId
}: EnhancedDropdownProps) {
  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onToggleDropdown}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
            error
              ? isDarkMode
                ? 'border-red-500 bg-gray-800 text-white'
                : 'border-red-500 bg-white text-gray-900'
              : isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
          }`}
        />
        <button
          type="button"
          onClick={onToggleDropdown}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showDropdown && (
        <div className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-auto ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-2">
            <button
              type="button"
              onClick={onAddNew}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-blue-400 hover:bg-gray-700' 
                  : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              + Add New Quality
            </button>
          </div>
          
          {options.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-600">
              {options.map((quality) => (
                <div
                  key={quality._id}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer transition-colors duration-200 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSelect(quality)}
                >
                  <span className={`text-sm ${
                    recentlyAddedId === quality._id
                      ? 'font-semibold text-green-600 dark:text-green-400'
                      : isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {quality.name}
                    {recentlyAddedId === quality._id && ' ✓'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(quality);
                    }}
                    className={`p-1 rounded-full transition-colors duration-200 ${
                      isDarkMode 
                        ? 'text-red-400 hover:bg-red-900/20' 
                        : 'text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className={`text-sm mt-1 ${
          isDarkMode ? 'text-red-400' : 'text-red-600'
        }`}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function DispatchForm({ orderId, onClose, onSuccess }: DispatchFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [activeQualityDropdown, setActiveQualityDropdown] = useState<string | null>(null);
  const [currentQualitySearch, setCurrentQualitySearch] = useState('');
  const [qualitySearchStates, setQualitySearchStates] = useState<Record<string, string>>({});
  const [recentlyAddedQuality, setRecentlyAddedQuality] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    orderId: orderId,
    dispatchItems: [
      {
        id: 'item1',
        dispatchDate: '',
        billNo: '',
        quality: '',
        finishMtr: '',
        additionalQualityMtr: [] as AdditionalQualityMtr[],
      },
    ] as DispatchItem[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch qualities on component mount
  useEffect(() => {
    const fetchQualities = async () => {
      try {
        const response = await fetch('/api/qualities');
        const data = await response.json();
        if (data.success) {
          setQualities(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching qualities:', error);
      }
    };

    fetchQualities();
  }, []);

  // Update quality search states when form data changes
  useEffect(() => {
    formData.dispatchItems.forEach((item, index) => {
      if (item.quality) {
        const selectedQuality = qualities.find(q => q._id === item.quality);
        if (selectedQuality) {
          setQualitySearchStates(prev => ({
            ...prev,
            [`${index}`]: selectedQuality.name
          }));
        }
      }
      item.additionalQualityMtr.forEach((additional, aIndex) => {
        if (additional.quality) {
          const selectedQuality = qualities.find(q => q._id === additional.quality);
          if (selectedQuality) {
            setQualitySearchStates(prev => ({
              ...prev,
              [`${index}_additional_${aIndex}`]: selectedQuality.name
            }));
          }
        }
      });
    });
  }, [formData.dispatchItems, qualities]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    formData.dispatchItems.forEach((item, index) => {
      if (!item.dispatchDate) {
        newErrors[`dispatchDate_${item.id}`] = 'Dispatch date is required';
      }
      if (!item.billNo.trim()) {
        newErrors[`billNo_${item.id}`] = 'Bill number is required';
      }
      if (!item.quality) {
        newErrors[`quality_${item.id}`] = 'Quality is required';
      }
      if (!item.finishMtr) {
        newErrors[`finishMtr_${item.id}`] = 'Finish meters is required';
      } else if (isNaN(Number(item.finishMtr)) || Number(item.finishMtr) < 0) {
        newErrors[`finishMtr_${item.id}`] = 'Finish meters must be a valid positive number';
      }

      item.additionalQualityMtr.forEach((additional, aIndex) => {
        if (!additional.quality) {
          newErrors[`quality_${item.id}_additional_${aIndex}`] = 'Quality is required';
        }
        if (!additional.finishMtr) {
          newErrors[`finishMtr_${item.id}_additional_${aIndex}`] = 'Finish meters is required';
        } else if (isNaN(Number(additional.finishMtr)) || Number(additional.finishMtr) < 0) {
          newErrors[`finishMtr_${item.id}_additional_${aIndex}`] = 'Finish meters must be a valid positive number';
        }
      });
    });

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
          dispatchItems: formData.dispatchItems.map(item => ({
            dispatchDate: item.dispatchDate,
            billNo: item.billNo.trim(),
            quality: item.quality,
            finishMtr: Number(item.finishMtr),
            additionalQualityMtr: item.additionalQualityMtr.map(additional => ({
              quality: additional.quality,
              finishMtr: Number(additional.finishMtr),
            })),
          })),
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

  const updateDispatchItem = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dispatchItems: prev.dispatchItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
    // Clear error when user starts typing
    if (errors[`${field}_${id}`]) {
      setErrors(prev => ({ ...prev, [`${field}_${id}`]: '' }));
    }
  };

  const updateAdditionalQualityMtr = (itemId: string, index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dispatchItems: prev.dispatchItems.map(item => 
        item.id === itemId ? {
          ...item,
          additionalQualityMtr: item.additionalQualityMtr.map((additional, aIndex) =>
            aIndex === index ? { ...additional, [field]: value } : additional
          ),
        } : item
      ),
    }));
    // Clear error when user starts typing
    if (errors[`${field}_${itemId}_additional_${index}`]) {
      setErrors(prev => ({ ...prev, [`${field}_${itemId}_additional_${index}`]: '' }));
    }
  };

  const addDispatchItem = () => {
    setFormData(prev => ({
      ...prev,
      dispatchItems: [...prev.dispatchItems, {
        id: `item${prev.dispatchItems.length + 1}`,
        dispatchDate: '',
        billNo: '',
        quality: '',
        finishMtr: '',
        additionalQualityMtr: [],
      }],
    }));
    setErrors(prev => ({ ...prev, submit: '' })); // Clear previous submit error
  };

  const removeDispatchItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      dispatchItems: prev.dispatchItems.filter(item => item.id !== id),
    }));
    // Clear errors for removed items
    Object.keys(errors).forEach(key => {
      if (key.startsWith(`dispatchDate_${id}`) || key.startsWith(`billNo_${id}`) || key.startsWith(`quality_${id}`) || key.startsWith(`finishMtr_${id}`)) {
        setErrors(prev => ({ ...prev, [key]: '' }));
      }
    });
    Object.keys(errors).forEach(key => {
      if (key.startsWith(`dispatchDate_${id}_additional_0`) || key.startsWith(`billNo_${id}_additional_0`) || key.startsWith(`quality_${id}_additional_0`) || key.startsWith(`finishMtr_${id}_additional_0`)) {
        setErrors(prev => ({ ...prev, [key]: '' }));
      }
    });
  };

  const addAdditionalQualityMtr = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      dispatchItems: prev.dispatchItems.map(item => 
        item.id === itemId ? {
          ...item,
          additionalQualityMtr: [...item.additionalQualityMtr, { quality: '', finishMtr: '' }],
        } : item
      ),
    }));
  };

  const removeAdditionalQualityMtr = (itemId: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      dispatchItems: prev.dispatchItems.map(item => 
        item.id === itemId ? {
          ...item,
          additionalQualityMtr: item.additionalQualityMtr.filter((_, aIndex) => aIndex !== index),
        } : item
      ),
    }));
    // Clear errors for removed additional items
    Object.keys(errors).forEach(key => {
      if (key.startsWith(`quality_${itemId}_additional_${index}`) || key.startsWith(`finishMtr_${itemId}_additional_${index}`)) {
        setErrors(prev => ({ ...prev, [key]: '' }));
      }
    });
  };

  const calculateTotal = () => {
    return formData.dispatchItems.reduce((sum, item) => {
      const itemTotal = (Number(item.finishMtr) || 0) * (Number(item.quality) || 0);
      const additionalTotal = item.additionalQualityMtr.reduce((addSum, additional) => {
        return addSum + (Number(additional.finishMtr) || 0) * (Number(additional.quality) || 0);
      }, 0);
      return sum + itemTotal + additionalTotal;
    }, 0);
  };

  const handleDeleteQuality = (quality: Quality) => {
    setQualities(prev => prev.filter(q => q._id !== quality._id));
    setRecentlyAddedQuality(null); // Clear recently added if deleted
    // Update form data to reflect deletion
    formData.dispatchItems.forEach(item => {
      item.quality = qualities.find(q => q._id === item.quality)?._id || '';
      item.additionalQualityMtr.forEach(additional => {
        additional.quality = qualities.find(q => q._id === additional.quality)?._id || '';
      });
    });
    setErrors({}); // Clear all errors as qualities might have changed
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#374151' : '#f3f4f6'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#3b82f6' : '#60a5fa'};
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#2563eb' : '#3b82f6'};
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`relative w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-xl shadow-2xl ${
          isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        }`}>
        {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
            <div className="flex items-center space-x-4">
              {/* Order ID Display */}
              <div className={`px-3 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-orange-900/30 text-orange-300 border border-orange-700' 
                  : 'bg-orange-100 text-orange-700 border border-orange-200'
              }`}>
                <span className="text-sm font-medium">Order ID:</span>
                <span className="ml-2 text-lg font-bold">{formData.orderId}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <TruckIcon className="h-8 w-8 text-orange-500" />
                <h2 className="text-2xl font-bold">Add Dispatch</h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                isDarkMode 
                    ? 'bg-orange-900/30 text-orange-300 border border-orange-700' 
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}>
                  {formData.dispatchItems.length} Item{formData.dispatchItems.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
        </div>

        {/* Form */}
          <form onSubmit={handleSubmit} className={`overflow-y-auto max-h-[calc(95vh-140px)] custom-scrollbar ${
            isDarkMode 
              ? 'scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-800' 
              : 'scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-gray-100'
          }`}>
            <div className="p-6 space-y-8 pb-24">
              {/* Error Display */}
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

              {/* Order No (Auto) - Full Width */}
              

              {/* Dispatch Items */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Dispatch Items</h3>
                </div>

                <div className="space-y-6">
                  {formData.dispatchItems.map((item, itemIndex) => (
                    <div key={item.id} className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Dispatch Date */}
            <div>
                          <label className={`block text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                            Dispatch Date <span className="text-red-500">*</span>
              </label>
                          <div className="relative">
              <input
                type="date"
                              value={item.dispatchDate}
                              onChange={(e) => updateDispatchItem(item.id, 'dispatchDate', e.target.value)}
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                                errors[`dispatchDate_${item.id}`]
                                  ? isDarkMode
                                    ? 'border-red-500 bg-gray-800 text-white'
                                    : 'border-red-500 bg-white text-gray-900'
                    : isDarkMode
                                    ? 'border-gray-600 bg-gray-800 text-white hover:border-gray-500'
                                    : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                              }`}
                            />
                            <CalendarIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                          </div>
                          {errors[`dispatchDate_${item.id}`] && (
                            <p className={`text-sm mt-1 ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                              {errors[`dispatchDate_${item.id}`]}
                            </p>
              )}
            </div>

            {/* Bill No */}
            <div>
                          <label className={`block text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                            Bill No <span className="text-red-500">*</span>
              </label>
                          <div className="relative">
              <input
                type="text"
                              value={item.billNo}
                              onChange={(e) => updateDispatchItem(item.id, 'billNo', e.target.value)}
                placeholder="Enter bill number"
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                                errors[`billNo_${item.id}`]
                                  ? isDarkMode
                                    ? 'border-red-500 bg-gray-800 text-white'
                                    : 'border-red-500 bg-white text-gray-900'
                    : isDarkMode
                                    ? 'border-gray-600 bg-gray-800 text-white hover:border-gray-500'
                                    : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                              }`}
                            />
                            <DocumentTextIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                          </div>
                          {errors[`billNo_${item.id}`] && (
                            <p className={`text-sm mt-1 ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                              {errors[`billNo_${item.id}`]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quality & Meters Section */}
                      <div className={`mt-6 p-4 rounded-xl border ${
                        isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-200'
                      }`}>
                        <h6 className={`text-sm font-semibold mb-4 flex items-center ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Quality & Meters
                        </h6>
                        
                        <div className="space-y-4">
                          {/* Q1 and M1 Fields (Always visible) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Quality Q1 <span className="text-red-500">*</span>
                              </label>
                              <EnhancedDropdown
                                options={qualities}
                                value={item.quality}
                                onChange={(value) => updateDispatchItem(item.id, 'quality', value)}
                                placeholder="Select Quality"
                                searchValue={qualitySearchStates[`${itemIndex}`] || ''}
                                onSearchChange={(value) => setQualitySearchStates(prev => ({ ...prev, [`${itemIndex}`]: value }))}
                                showDropdown={activeQualityDropdown === `${itemIndex}`}
                                onToggleDropdown={() => setActiveQualityDropdown(activeQualityDropdown === `${itemIndex}` ? null : `${itemIndex}`)}
                                onSelect={(quality) => {
                                  updateDispatchItem(item.id, 'quality', quality._id);
                                  setQualitySearchStates(prev => ({ ...prev, [`${itemIndex}`]: quality.name }));
                                  setActiveQualityDropdown(null);
                                }}
                                isDarkMode={isDarkMode}
                                error={errors[`quality_${item.id}`]}
                                onAddNew={() => setShowQualityModal(true)}
                                onDelete={(quality) => handleDeleteQuality(quality)}
                                itemIndex={`${itemIndex}`}
                                recentlyAddedId={recentlyAddedQuality}
                              />
                            </div>
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Finish Mtr M1 <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={item.finishMtr}
                                onChange={(e) => updateDispatchItem(item.id, 'finishMtr', e.target.value)}
                                placeholder="Enter finish meters"
                                step="0.01"
                                min="0"
                                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                                  errors[`finishMtr_${item.id}`]
                                    ? isDarkMode
                                      ? 'border-red-500 bg-gray-800 text-white'
                                      : 'border-red-500 bg-white text-gray-900'
                                    : isDarkMode
                                      ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                                      : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                                }`}
                              />
                              {errors[`finishMtr_${item.id}`] && (
                                <p className={`text-sm mt-1 ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>
                                  {errors[`finishMtr_${item.id}`]}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Additional Fields (Q2, M2, Q3, M3, etc.) */}
                          {item.additionalQualityMtr.map((additional, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Quality Q{index + 2} <span className="text-red-500">*</span>
                                </label>
                                <EnhancedDropdown
                                  options={qualities}
                                  value={additional.quality}
                                  onChange={(value) => updateAdditionalQualityMtr(item.id, index, 'quality', value)}
                                  placeholder="Select Quality"
                                  searchValue={qualitySearchStates[`${itemIndex}_additional_${index}`] || ''}
                                  onSearchChange={(value) => setQualitySearchStates(prev => ({ ...prev, [`${itemIndex}_additional_${index}`]: value }))}
                                  showDropdown={activeQualityDropdown === `${itemIndex}_additional_${index}`}
                                  onToggleDropdown={() => setActiveQualityDropdown(activeQualityDropdown === `${itemIndex}_additional_${index}` ? null : `${itemIndex}_additional_${index}`)}
                                  onSelect={(quality) => {
                                    updateAdditionalQualityMtr(item.id, index, 'quality', quality._id);
                                    setQualitySearchStates(prev => ({ ...prev, [`${itemIndex}_additional_${index}`]: quality.name }));
                                    setActiveQualityDropdown(null);
                                  }}
                                  isDarkMode={isDarkMode}
                                  error={errors[`quality_${item.id}_additional_${index}`]}
                                  onAddNew={() => setShowQualityModal(true)}
                                  onDelete={(quality) => handleDeleteQuality(quality)}
                                  itemIndex={`${itemIndex}_additional_${index}`}
                                  recentlyAddedId={recentlyAddedQuality}
                                />
                              </div>
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Finish Mtr M{index + 2} <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  value={additional.finishMtr}
                                  onChange={(e) => updateAdditionalQualityMtr(item.id, index, 'finishMtr', e.target.value)}
                                  placeholder="Enter finish meters"
                                  step="0.01"
                                  min="0"
                                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                                    isDarkMode
                                      ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' 
                                      : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                                  }`}
                                />
                                {errors[`finishMtr_${item.id}_additional_${index}`] && (
                                  <p className={`text-sm mt-1 ${
                                    isDarkMode ? 'text-red-400' : 'text-red-600'
                                  }`}>
                                    {errors[`finishMtr_${item.id}_additional_${index}`]}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => removeAdditionalQualityMtr(item.id, index)}
                                  className={`p-2 rounded-lg text-red-500 hover:bg-red-50 ${
                                    isDarkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                                  }`}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add More Quality & Meters Button */}
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => addAdditionalQualityMtr(item.id)}
                            className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300' 
                                : 'bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-700'
                            }`}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add More Quality & Meters
                          </button>
                        </div>
                      </div>

                      {/* Remove Item Button */}
                      {formData.dispatchItems.length > 1 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeDispatchItem(item.id)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                              isDarkMode 
                                ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white' 
                                : 'border-red-300 text-red-600 hover:bg-red-500 hover:text-white'
                            }`}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
              )}
            </div>
                  ))}
                  
                  {/* Add Item Card */}
                  <div className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    isDarkMode 
                      ? 'border-gray-600 bg-gray-800/50 hover:border-orange-500 hover:bg-gray-800' 
                      : 'border-gray-300 bg-gray-50/50 hover:border-orange-400 hover:bg-gray-50'
                  }`} onClick={addDispatchItem}>
                    <div className="flex items-center justify-center space-x-3 py-4">
                      <div className={`p-2 rounded-full ${
                        isDarkMode 
                          ? 'bg-orange-600/20 text-orange-400' 
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        <PlusIcon className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <h4 className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Add New Dispatch Item
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Sticky Submit Button */}
          <div className={`sticky bottom-0 left-0 right-0 p-6 border-t shadow-lg ${
            isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className={`px-8 py-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className={`px-10 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-orange-600 hover:bg-orange-700 shadow-lg' 
                      : 'bg-orange-500 hover:bg-orange-600 shadow-lg'
                }`}
              >
                {loading ? 'Saving...' : 'Add Dispatch'}
              </button>
            </div>
        </div>
      </div>
    </div>
    </>
  );
}

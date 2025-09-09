'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Order } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';

// Enhanced Dropdown Component (copied from MillOutputForm)
interface EnhancedDropdownProps {
  options: any[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onSelect: (option: any) => void;
  isDarkMode: boolean;
  error?: string;
  recentlyAddedId?: string;
  qualities?: any[];
}

const EnhancedDropdown: React.FC<EnhancedDropdownProps> = ({
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
  recentlyAddedId,
  qualities
}) => {
  // Helper function to get quality ID
  const getQualityId = (quality: any) => {
    return quality?._id || quality?.id || quality;
  };
  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchValue || (value && qualities ? qualities.find(q => getQualityId(q) === value)?.name || '' : '')}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onToggleDropdown}
          placeholder={placeholder}
          className={`w-full px-4 py-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error
              ? isDarkMode
                ? 'border-red-500 bg-gray-800 text-white'
                : 'border-red-500 bg-white text-gray-900'
              : isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Clear button */}
          {(searchValue || (value && qualities ? qualities.find(q => getQualityId(q) === value)?.name : '')) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange('');
                onChange('');
              }}
              className={`p-1 rounded transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          {/* Dropdown toggle button */}
          <button
            type="button"
            onClick={onToggleDropdown}
            className={`p-1 rounded transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className={`w-5 h-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      
      {showDropdown && (
        <div className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-300'
        }`}>
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option._id || option.id}
                onClick={() => onSelect(option)}
                className={`px-4 py-3 cursor-pointer transition-colors border-b ${
                  isDarkMode 
                    ? 'border-gray-700 hover:bg-gray-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                } ${
                  recentlyAddedId === (option._id || option.id)
                    ? isDarkMode 
                      ? 'bg-blue-900/30 text-blue-300' 
                      : 'bg-blue-50 text-blue-700'
                    : isDarkMode 
                      ? 'text-white' 
                      : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option.name}</span>
                  {recentlyAddedId === (option._id || option.id) && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode 
                        ? 'bg-blue-700 text-blue-200' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      New
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className={`px-4 py-3 text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No options found. Try adjusting your search.
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
};


interface DispatchSubItem {
  id: string;
  finishMtr: string;
  saleRate: string;
  quality: string;
}

interface DispatchFormData {
  orderId: string;
  dispatchItems: DispatchItem[];
}

interface DispatchItem {
  id: string;
  dispatchDate: string;
  billNo: string;
  finishMtr: string;
  saleRate: string;
  quality: string;
  subItems?: DispatchSubItem[];
}

interface DispatchFormProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
  isEditing?: boolean;
  existingDispatches?: any[];
  qualities?: any[];
}

interface ValidationErrors {
  [key: string]: string;
}

export default function DispatchForm({ 
  order, 
  onClose, 
  onSuccess,
  isEditing = false,
  existingDispatches = [],
  qualities = []
}: DispatchFormProps) {
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState<DispatchFormData>({
    orderId: order?.orderId || '',
    dispatchItems: [{
      id: '1',
        dispatchDate: '',
        billNo: '',
        finishMtr: '',
      saleRate: '',
      quality: '',
      subItems: [{
        id: '1_1',
        finishMtr: '',
        saleRate: '',
        quality: ''
      }]
    }]
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  
  // Quality dropdown state
  const [activeQualityDropdown, setActiveQualityDropdown] = useState<{ itemId: string } | null>(null);
  const [qualitySearchStates, setQualitySearchStates] = useState<{ [key: string]: string }>({});
  const [currentQualitySearch, setCurrentQualitySearch] = useState('');
  const [recentlyAddedQuality, setRecentlyAddedQuality] = useState<string | null>(null);

  // Load existing dispatches when editing
  useEffect(() => {
    if (isEditing && existingDispatches.length > 0) {
      loadExistingDispatches();
    }
  }, [isEditing, existingDispatches]);

  // Reset form when order changes (but not when editing)
  useEffect(() => {
    if (order && !isEditing) {
      setFormData({
        orderId: order.orderId,
        dispatchItems: [{
          id: '1',
          dispatchDate: '',
          billNo: '',
          finishMtr: '',
          saleRate: '',
          quality: '',
          subItems: [{
            id: '1_1',
            finishMtr: '',
            saleRate: '',
            quality: ''
          }]
        }]
      });
      setErrors({});
    }
  }, [order?.orderId, isEditing]);

  // Function to load existing dispatches
  const loadExistingDispatches = async () => {
    console.log('loadExistingDispatches called with:', { order, existingDispatches });
    
    if (!order || existingDispatches.length === 0) {
      console.log('Early return - no order or existing dispatches');
      return;
    }
    
    setLoadingExistingData(true);
    try {
      // Group dispatches by dispatchDate and billNo
      const groupedDispatches = existingDispatches.reduce((groups: any, dispatch: any) => {
        const key = `${dispatch.dispatchDate}_${dispatch.billNo}`;
        if (!groups[key]) {
          groups[key] = {
            dispatchDate: dispatch.dispatchDate,
            billNo: dispatch.billNo,
            subItems: []
          };
        }
        groups[key].subItems.push({
          id: `${groups[key].subItems.length + 1}_${groups[key].subItems.length + 1}`,
          finishMtr: dispatch.finishMtr.toString(),
          saleRate: dispatch.saleRate.toString(),
          quality: dispatch.quality?._id || dispatch.quality || ''
        });
        return groups;
      }, {});

      // Convert grouped data to individual dispatch items
      const newFormData = {
        orderId: order.orderId,
        dispatchItems: Object.values(groupedDispatches).map((group: any, index: number) => ({
          id: (index + 1).toString(),
          dispatchDate: group.dispatchDate,
          billNo: group.billNo,
          finishMtr: '',
          saleRate: '',
          quality: '',
          subItems: group.subItems
        }))
      };
      
      console.log('New form data to be set:', newFormData);
      setFormData(newFormData);
      console.log('Form data set successfully');
      } catch (error) {
      console.error('Error loading existing dispatches:', error);
    } finally {
      setLoadingExistingData(false);
    }
  };

  // Add new dispatch item
  const addDispatchItem = () => {
    const newId = (formData.dispatchItems.length + 1).toString();
    setFormData({
      ...formData,
      dispatchItems: [
        ...formData.dispatchItems,
        {
          id: newId,
          dispatchDate: '',
          billNo: '',
          finishMtr: '',
          saleRate: '',
          quality: '',
          subItems: [{
            id: `${newId}_1`,
            finishMtr: '',
            saleRate: '',
            quality: ''
          }]
        }
      ]
    });
    
    // Scroll to the newly added item after a short delay
    setTimeout(() => {
      const newItemElement = document.getElementById(`dispatch-item-${newId}`);
      if (newItemElement) {
        newItemElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  // Remove dispatch item
  const removeDispatchItem = (itemId: string) => {
    if (formData.dispatchItems.length > 1) {
      setFormData({
        ...formData,
        dispatchItems: formData.dispatchItems.filter(item => item.id !== itemId)
      });
    }
  };

  // Update dispatch item
  const updateDispatchItem = (itemId: string, field: keyof DispatchItem, value: string) => {
    setFormData({
      ...formData,
      dispatchItems: formData.dispatchItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  // Add sub-item to dispatch item
  const addSubItem = (itemId: string) => {
    setFormData({
      ...formData,
      dispatchItems: formData.dispatchItems.map(item => {
        if (item.id === itemId) {
          const newSubId = `${itemId}_${(item.subItems?.length || 0) + 1}`;
          return {
            ...item,
            subItems: [
              ...(item.subItems || []),
              {
                id: newSubId,
                finishMtr: '',
                saleRate: '',
                quality: ''
              }
            ]
          };
        }
        return item;
      })
    });
  };

  // Remove sub-item from dispatch item
  const removeSubItem = (itemId: string, subItemId: string) => {
    setFormData({
      ...formData,
      dispatchItems: formData.dispatchItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            subItems: (item.subItems || []).filter(sub => sub.id !== subItemId)
          };
        }
        return item;
      })
    });
  };

  // Update sub-item
  const updateSubItem = (itemId: string, subItemId: string, field: keyof DispatchSubItem, value: string) => {
    console.log('DispatchForm: updateSubItem called with:', { itemId, subItemId, field, value });
    setFormData(prevFormData => {
      const newFormData = {
        ...prevFormData,
        dispatchItems: prevFormData.dispatchItems.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              subItems: (item.subItems || []).map(sub =>
                sub.id === subItemId ? { ...sub, [field]: value } : sub
              )
            };
          }
          return item;
        })
      };
      console.log('DispatchForm: updateSubItem new form data:', newFormData);
      return newFormData;
    });
  };

  // Quality helper functions
  const getQualityId = (quality: any) => {
    return quality?._id || quality?.id || quality;
  };

  const getFilteredQualities = (itemId: string) => {
    const searchTerm = qualitySearchStates[itemId] || '';
    if (!searchTerm.trim()) {
      return qualities || [];
    }
    return (qualities || []).filter(quality =>
      quality.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleQualitySelect = (itemId: string, quality: any) => {
    const qualityId = getQualityId(quality);
    updateDispatchItem(itemId, 'quality', qualityId);
    setQualitySearchStates(prev => ({ ...prev, [itemId]: quality.name }));
    setCurrentQualitySearch(quality.name);
    setActiveQualityDropdown(null);
  };

  // Handle quality select for sub-items
  const handleSubItemQualitySelect = (itemId: string, subItemId: string, quality: any) => {
    console.log('DispatchForm: Quality selected:', quality);
    console.log('DispatchForm: Quality ID:', getQualityId(quality));
    console.log('DispatchForm: Quality name:', quality.name);
    const qualityId = getQualityId(quality);
    console.log('DispatchForm: Setting quality ID:', qualityId);
    updateSubItem(itemId, subItemId, 'quality', qualityId);
    setQualitySearchStates(prev => ({ ...prev, [subItemId]: quality.name }));
    setCurrentQualitySearch(quality.name);
    setActiveQualityDropdown(null);
    
    // Debug: Check if the quality was actually set
    setTimeout(() => {
      const currentFormData = formData;
      const currentItem = currentFormData.dispatchItems.find(item => item.id === itemId);
      const currentSubItem = currentItem?.subItems?.find(sub => sub.id === subItemId);
      console.log('DispatchForm: After setting quality, subItem quality value:', currentSubItem?.quality);
    }, 100);
  };

  // Clear quality search when dropdown is closed
  const handleQualityDropdownToggle = (itemId: string) => {
    if (activeQualityDropdown?.itemId === itemId) {
      setActiveQualityDropdown(null);
      setCurrentQualitySearch('');
    } else {
      setActiveQualityDropdown({ itemId });
      setCurrentQualitySearch(qualitySearchStates[itemId] || '');
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    formData.dispatchItems.forEach((item, itemIndex) => {
      // Validate dispatch item fields
      if (!item.dispatchDate) {
        newErrors[`dispatchDate_${item.id}`] = 'Dispatch date is required';
      }

      if (!item.billNo?.trim()) {
        newErrors[`billNo_${item.id}`] = 'Bill number is required';
      }

      // Validate sub-items (main quality & finish items)
      (item.subItems || []).forEach((subItem, subIndex) => {
        if (!subItem.finishMtr || parseFloat(subItem.finishMtr) <= 0) {
          newErrors[`finishMtr_${subItem.id}`] = 'Valid finish meters is required';
        }

        if (!subItem.saleRate || parseFloat(subItem.saleRate) <= 0) {
          newErrors[`saleRate_${subItem.id}`] = 'Valid sale rate is required';
        }

        if (!subItem.quality?.trim()) {
          newErrors[`quality_${subItem.id}`] = 'Quality is required';
        }
      });
    });

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
      if (isEditing && existingDispatches.length > 0) {
        // Update existing dispatches
        await updateExistingDispatches();
      } else {
        // Create new dispatches
        await createNewDispatches();
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error handling dispatch:', error);
      setErrors({ submit: 'Failed to handle dispatch' });
    } finally {
      setSaving(false);
    }
  };

  // Function to create new dispatches
  const createNewDispatches = async () => {
    const allDispatchPromises: Promise<any>[] = [];

    formData.dispatchItems.forEach((item) => {
      // Create dispatches for sub-items only
      (item.subItems || []).forEach((subItem) => {
        const subDispatchData = {
          orderId: formData.orderId,
          dispatchDate: item.dispatchDate,
          billNo: item.billNo.trim(),
          finishMtr: parseFloat(subItem.finishMtr),
          saleRate: parseFloat(subItem.saleRate),
          quality: subItem.quality
        };

        console.log('DispatchForm: Sending dispatch data:', subDispatchData);
        console.log('DispatchForm: Quality value:', subItem.quality);
        console.log('DispatchForm: Quality type:', typeof subItem.quality);

        allDispatchPromises.push(
          fetch('/api/dispatch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subDispatchData)
          }).then(response => response.json())
        );
      });
    });

    // Wait for all dispatches to be created
    const results = await Promise.all(allDispatchPromises);
    
    // Check if all were successful
    const allSuccessful = results.every((result: any) => result.success);
    
    if (!allSuccessful) {
      const errorMessages = results
        .filter((result: any) => !result.success)
        .map((result: any) => result.message || result.error)
        .join(', ');
      throw new Error(`Failed to create some dispatches: ${errorMessages}`);
    }
  };

  // Function to update existing dispatches
  const updateExistingDispatches = async () => {
    // First delete existing dispatches for this order
    const deletePromises = existingDispatches.map((dispatch: any) =>
      fetch(`/api/dispatch/${dispatch._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    );

    await Promise.all(deletePromises);

    // Then create new ones with updated data
    await createNewDispatches();
  };

  if (!order) {
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
          {/* Loading Overlay for Loading Existing Data */}
          {loadingExistingData && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm">Loading existing dispatches...</p>
              </div>
            </div>
          )}

          {/* Loading Overlay for Saving */}
          {saving && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
              <div className={`p-6 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-3 text-sm font-medium">Saving dispatch data...</p>
                <p className="mt-1 text-xs text-gray-500">Please wait while we process your data</p>
              </div>
            </div>
          )}

        {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
            <div className="flex items-center space-x-4">
              {/* Order ID Display */}
              <div className={`px-3 py-2 rounded-lg ${
                isDarkMode 
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                <span className="text-sm font-medium">Order ID:</span>
                <span className="ml-2 text-lg font-bold">{formData.orderId}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                <h2 className="text-2xl font-bold">
                  {isEditing ? 'Edit Dispatch' : 'Add Dispatch'}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                isDarkMode 
                    ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
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
              ? 'scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-800' 
              : 'scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100'
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


              {/* Dispatch Items */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Dispatch Items</h3>
                </div>

                <div className="space-y-6">
                  {formData.dispatchItems.map((item, itemIndex) => (
                    <div key={item.id} id={`dispatch-item-${item.id}`} className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="mb-6">
                        <h4 className={`text-lg font-semibold mb-4 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Dispatch Item #{itemIndex + 1}
                        </h4>
                        
                        {/* All 5 fields in 3-3 layout */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors[`dispatchDate_${item.id}`]
                                  ? isDarkMode
                                    ? 'border-red-500 bg-gray-800 text-white'
                                    : 'border-red-500 bg-white text-gray-900'
                    : isDarkMode
                                    ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
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

                        {/* Bill Number */}
            <div>
                          <label className={`block text-sm font-medium mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                            Bill Number <span className="text-red-500">*</span>
              </label>
                          <div className="relative">
              <input
                type="text"
                              value={item.billNo}
                              onChange={(e) => updateDispatchItem(item.id, 'billNo', e.target.value)}
                placeholder="Enter bill number"
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors[`billNo_${item.id}`]
                                  ? isDarkMode
                                    ? 'border-red-500 bg-gray-800 text-white'
                                    : 'border-red-500 bg-white text-gray-900'
                    : isDarkMode
                                    ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
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

                    
                      </div>


                      {/* Quality & Finish Items Section */}
                      <div className={`mt-6 p-4 rounded-xl border ${
                        isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-200'
                      }`}>
                        <h6 className={`text-sm font-semibold mb-4 flex items-center ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Quality & Finish Items
                        </h6>
                        
                        <div className="space-y-4">
                          {/* Quality & Finish Items */}
                          {(item.subItems || []).map((subItem, subIndex) => (
                            <div key={subItem.id} className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className={`text-sm font-medium ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Quality & Finish Item #{subIndex + 1}
                                </h5>
                                {(item.subItems || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSubItem(item.id, subItem.id)}
                                    className={`p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors ${
                                      isDarkMode ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                                    }`}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Sub-item Quality */}
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Quality <span className="text-red-500">*</span>
                                </label>
                                <EnhancedDropdown
                                  options={getFilteredQualities(subItem.id)}
                                  value={subItem.quality}
                                  onChange={(value) => updateSubItem(item.id, subItem.id, 'quality', value)}
                                  placeholder="Search quality..."
                                  searchValue={activeQualityDropdown?.itemId === subItem.id 
                                    ? currentQualitySearch 
                                    : (qualitySearchStates[subItem.id] || '')}
                                  onSearchChange={(value) => {
                                    if (activeQualityDropdown?.itemId === subItem.id) {
                                      setCurrentQualitySearch(value);
                                    } else {
                                      setQualitySearchStates(prev => ({ ...prev, [subItem.id]: value }));
                                    }
                                  }}
                                  showDropdown={activeQualityDropdown?.itemId === subItem.id}
                                  onToggleDropdown={() => handleQualityDropdownToggle(subItem.id)}
                                  onSelect={(quality) => handleSubItemQualitySelect(item.id, subItem.id, quality)}
                                  isDarkMode={isDarkMode}
                                  error={errors[`quality_${subItem.id}`]}
                                  recentlyAddedId={recentlyAddedQuality || undefined}
                                  qualities={qualities}
                                />
                              </div>

                              {/* Sub-item Finish Meters */}
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Finish Meters <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  value={subItem.finishMtr}
                                  onChange={(e) => updateSubItem(item.id, subItem.id, 'finishMtr', e.target.value)}
                                  placeholder="Enter finish meters"
                                  step="0.01"
                                  min="0"
                                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors[`finishMtr_${subItem.id}`]
                                      ? isDarkMode
                                        ? 'border-red-500 bg-gray-800 text-white'
                                        : 'border-red-500 bg-white text-gray-900'
                                      : isDarkMode
                                        ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                                  }`}
                                />
                                {errors[`finishMtr_${subItem.id}`] && (
                                  <p className={`text-sm mt-1 ${
                                    isDarkMode ? 'text-red-400' : 'text-red-600'
                                  }`}>
                                    {errors[`finishMtr_${subItem.id}`]}
                                  </p>
                                )}
                              </div>

                              {/* Sub-item Sale Rate */}
                              <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Sale Rate <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  value={subItem.saleRate}
                                  onChange={(e) => updateSubItem(item.id, subItem.id, 'saleRate', e.target.value)}
                                  placeholder="Enter sale rate"
                                  step="0.01"
                                  min="0"
                                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    errors[`saleRate_${subItem.id}`]
                                      ? isDarkMode
                                        ? 'border-red-500 bg-gray-800 text-white'
                                        : 'border-red-500 bg-white text-gray-900'
                                      : isDarkMode
                                        ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' 
                                        : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                                  }`}
                                />
                                {errors[`saleRate_${subItem.id}`] && (
                                  <p className={`text-sm mt-1 ${
                                    isDarkMode ? 'text-red-400' : 'text-red-600'
                                  }`}>
                                    {errors[`saleRate_${subItem.id}`]}
                                  </p>
                                )}
                              </div>

                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add More Button for Sub-items */}
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => addSubItem(item.id)}
                          className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300' 
                              : 'bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-700'
                          }`}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add More Quality & Finish
                        </button>
                      </div>

                      {/* Remove Item Button */}
                      {formData.dispatchItems.length > 1 && (
                        <div className="flex justify-end mt-4">
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
                      ? 'border-gray-600 bg-gray-800/50 hover:border-blue-500 hover:bg-gray-800' 
                      : 'border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-gray-50'
                  }`} onClick={addDispatchItem}>
                    <div className="flex items-center justify-center space-x-3 py-4">
                      <div className={`p-2 rounded-full ${
                        isDarkMode 
                          ? 'bg-blue-600/20 text-blue-400' 
                          : 'bg-blue-100 text-blue-600'
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
                disabled={saving}
                onClick={handleSubmit}
                className={`px-10 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${
                  saving 
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' 
                      : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
                }`}
              >
                {saving ? 'Saving...' : isEditing ? 'Update Dispatch' : 'Add Dispatch'}
              </button>
            </div>
            </div>
        </div>
    </div>
    </>
  );
}
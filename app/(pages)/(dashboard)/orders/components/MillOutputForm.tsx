'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon,
  PlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  TrashIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { Order } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';

interface MillOutputItem {
  id: string;
  recdDate: string;
  millBillNo: string;
  finishedMtr: string;
  millRate: string;
  quality: string; // Add quality field
  additionalFinishedMtr: { meters: string; rate: string; quality: string }[]; // Add quality to additional fields
}

interface MillOutputFormData {
  orderId: string;
  millOutputItems: MillOutputItem[];
}

interface MillOutputFormProps {
  order: Order | null;
  qualities: any[]; // Add qualities prop
  onClose: () => void;
  onSuccess: () => void;
  isEditing?: boolean;
  existingMillOutputs?: any[];
}

interface ValidationErrors {
  [key: string]: string;
}

// Enhanced Dropdown Component
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
  recentlyAddedId
}: {
  options: any[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showDropdown: boolean;
  onToggleDropdown: () => void;
  onSelect: (item: any) => void;
  isDarkMode: boolean;
  error?: string;
  recentlyAddedId?: string | null;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (target.closest('.calendar-container') || target.closest('.date-picker')) {
          return;
        }
        onToggleDropdown();
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, onToggleDropdown]);

  // Get selected item name for display
  const selectedItem = options.find(option => (option._id || (option as any).id) === value);
  const displayValue = selectedItem ? selectedItem.name : searchValue;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            const newValue = e.target.value;
            onSearchChange(newValue);
            // Clear selection if user is typing something different
            if (selectedItem && newValue !== selectedItem.name) {
              onChange('');
            }
          }}
          onFocus={() => onToggleDropdown()}
          className={`w-full p-3 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } ${error ? 'border-red-500' : ''} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {searchValue && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSearchChange('');
                onChange('');
              }}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
              }`}
              title="Clear"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          )}
          <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${
            showDropdown ? 'rotate-180' : ''
          } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
      </div>

      {showDropdown && (
        <div className={`absolute z-50 w-full mt-1 rounded-lg border shadow-xl max-h-60 overflow-y-auto ${
          isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          {options.length > 0 ? (
            [...options].sort((a, b) => {
              const aIsRecent = recentlyAddedId === (a._id || (a as any).id);
              const bIsRecent = recentlyAddedId === (b._id || (b as any).id);
              if (aIsRecent && !bIsRecent) return 1;
              if (!aIsRecent && bIsRecent) return -1;
              return a.name.localeCompare(b.name);
            }).map((option, index) => (
              <button
                key={option._id || (option as any).id || `quality-${index}-${option.name}`}
                type="button"
                onClick={() => onSelect(option)}
                className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                } ${value === (option._id || (option as any).id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${
                  recentlyAddedId === (option._id || (option as any).id) ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{option.name}</span>
                      {recentlyAddedId === (option._id || (option as any).id) && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isDarkMode 
                            ? 'bg-green-600 text-white' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {value === (option._id || (option as any).id) && (
                    <CheckIcon className="h-4 w-4 text-blue-500" />
                  )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className={`p-4 text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="flex flex-col items-center space-y-2">
                <MagnifyingGlassIcon className="h-8 w-8 opacity-50" />
                <p className="font-medium">No qualities found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MillOutputForm({ 
  order, 
  qualities,
  onClose, 
  onSuccess,
  isEditing = false,
  existingMillOutputs = []
}: MillOutputFormProps) {
  const { isDarkMode } = useDarkMode();
  
  // Debug logging for qualities prop
  console.log('=== MillOutputForm Debug ===');
  console.log('qualities prop:', qualities);
  console.log('qualities type:', typeof qualities);
  console.log('qualities is array:', Array.isArray(qualities));
  console.log('qualities length:', qualities?.length);
  const [formData, setFormData] = useState<MillOutputFormData>({
    orderId: order?.orderId || '',
    millOutputItems: [{
      id: '1',
    recdDate: '',
    millBillNo: '',
    finishedMtr: '',
      millRate: '',
      quality: '', // Add quality field
      additionalFinishedMtr: []
    }]
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  
  // Quality-related state
  const [activeQualityDropdown, setActiveQualityDropdown] = useState<{ itemId: string; type: 'main' | 'additional'; index?: number } | null>(null);
  const [qualitySearchStates, setQualitySearchStates] = useState<{ [key: string]: string }>({});
  const [currentQualitySearch, setCurrentQualitySearch] = useState('');
  const [recentlyAddedQuality, setRecentlyAddedQuality] = useState<string | null>(null);

  // Load existing mill outputs when editing
  useEffect(() => {
    if (isEditing && existingMillOutputs.length > 0) {
      loadExistingMillOutputs();
    }
  }, [isEditing, existingMillOutputs]);

  // Reset form when order changes (but not when editing)
  useEffect(() => {
    if (order && !isEditing) {
      setFormData({
        orderId: order.orderId,
        millOutputItems: [{
          id: '1',
        recdDate: '',
        millBillNo: '',
        finishedMtr: '',
          millRate: '',
          quality: '', // Add quality field
          additionalFinishedMtr: []
        }]
      });
      setErrors({});
    }
  }, [order?.orderId, isEditing]);

  // Function to load existing mill outputs
  const loadExistingMillOutputs = async () => {
    console.log('loadExistingMillOutputs called with:', { order, existingMillOutputs });
    
    if (!order || existingMillOutputs.length === 0) {
      console.log('Early return - no order or existing outputs');
      return;
    }
    
    setLoadingExistingData(true);
    try {
      // Group mill outputs by bill number and date
      const groupedOutputs = groupMillOutputsByBillAndDate(existingMillOutputs);
      console.log('Grouped outputs:', groupedOutputs);
      
      if (groupedOutputs.length > 0) {
        const newFormData = {
          orderId: order.orderId,
          millOutputItems: groupedOutputs.map((group, index) => ({
            id: (index + 1).toString(),
            recdDate: group.recdDate,
            millBillNo: group.millBillNo,
            finishedMtr: group.mainOutput.finishedMtr.toString(),
            millRate: group.mainOutput.millRate.toString(),
            quality: group.mainOutput.quality || '', // Add quality field
            additionalFinishedMtr: group.additionalOutputs.map((output: any) => ({
              meters: output.finishedMtr.toString(),
              rate: output.millRate.toString(),
              quality: output.quality || '' // Add quality field
            }))
          }))
        };
        
        console.log('New form data to be set:', newFormData);
        setFormData(newFormData);
        console.log('Form data set successfully');
      }
    } catch (error) {
      console.error('Error loading existing mill outputs:', error);
    } finally {
      setLoadingExistingData(false);
    }
  };

  // Helper function to group mill outputs by bill and date
  const groupMillOutputsByBillAndDate = (millOutputs: any[]) => {
    const groups: any[] = [];
    
    millOutputs.forEach((output: any) => {
      const existingGroup = groups.find(group => 
        group.millBillNo === output.millBillNo && group.recdDate === output.recdDate
      );
      
      if (existingGroup) {
        // Add as additional output
        existingGroup.additionalOutputs.push({
          finishedMtr: output.finishedMtr,
          millRate: output.millRate,
          quality: output.quality || ''
        });
      } else {
        // Create new group
        groups.push({
          recdDate: output.recdDate,
          millBillNo: output.millBillNo,
          mainOutput: {
            finishedMtr: output.finishedMtr,
            millRate: output.millRate,
            quality: output.quality || ''
          },
          additionalOutputs: []
        });
      }
    });
    
    return groups;
  };

  // Add new mill output item
  const addMillOutputItem = () => {
    const newId = (formData.millOutputItems.length + 1).toString();
    setFormData({
      ...formData,
      millOutputItems: [
        ...formData.millOutputItems,
        {
          id: newId,
          recdDate: '',
          millBillNo: '',
          finishedMtr: '',
          millRate: '',
          quality: '', // Add quality field
          additionalFinishedMtr: []
        }
      ]
    });
    
    // Scroll to the newly added item after a short delay
    setTimeout(() => {
      const newItemElement = document.getElementById(`mill-output-item-${newId}`);
      if (newItemElement) {
        newItemElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  // Remove mill output item
  const removeMillOutputItem = (itemId: string) => {
    if (formData.millOutputItems.length > 1) {
      setFormData({
        ...formData,
        millOutputItems: formData.millOutputItems.filter(item => item.id !== itemId)
      });
    }
  };

  // Update mill output item
  const updateMillOutputItem = (itemId: string, field: keyof MillOutputItem, value: string) => {
    setFormData({
      ...formData,
      millOutputItems: formData.millOutputItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  // Add additional finished meters and rates
  const addAdditionalFinishedMtr = (itemId: string) => {
    setFormData({
      ...formData,
      millOutputItems: formData.millOutputItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              additionalFinishedMtr: [...item.additionalFinishedMtr, { meters: '', rate: '', quality: '' }]
            }
          : item
      )
    });
  };

  // Remove additional finished meters and rates
  const removeAdditionalFinishedMtr = (itemId: string, index: number) => {
    setFormData({
      ...formData,
      millOutputItems: formData.millOutputItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              additionalFinishedMtr: item.additionalFinishedMtr.filter((_, i) => i !== index)
            }
          : item
      )
    });
  };

  // Update additional finished meters and rates
  const updateAdditionalFinishedMtr = (itemId: string, index: number, field: 'meters' | 'rate' | 'quality', value: string) => {
    setFormData({
      ...formData,
      millOutputItems: formData.millOutputItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              additionalFinishedMtr: item.additionalFinishedMtr.map((additional, i) =>
                i === index ? { ...additional, [field]: value } : additional
              )
            }
          : item
      )
    });
  };

  // Quality helper functions
  const getQualityId = (quality: any) => {
    return quality?._id || quality?.id || quality;
  };

  const getFilteredQualities = (itemId: string, type: 'main' | 'additional', index?: number) => {
    // Debug logging
    console.log('=== getFilteredQualities Debug ===');
    console.log('qualities:', qualities);
    console.log('qualities type:', typeof qualities);
    console.log('qualities is array:', Array.isArray(qualities));
    console.log('qualities length:', qualities?.length);
    
    // Safety check for undefined qualities
    if (!qualities || !Array.isArray(qualities)) {
      console.log('⚠️ QUALITIES IS EMPTY OR NOT ARRAY!');
      return [];
    }
    
    const searchKey = `${itemId}_${type}${index !== undefined ? `_${index}` : ''}`;
    const searchTerm = activeQualityDropdown?.itemId === itemId && activeQualityDropdown?.type === type && activeQualityDropdown?.index === index 
      ? currentQualitySearch 
      : (qualitySearchStates[searchKey] || '');
    
    const filtered = qualities.filter(quality =>
      quality?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const handleQualitySelect = (itemId: string, type: 'main' | 'additional', quality: any, index?: number) => {
    const qualityId = getQualityId(quality);
    const searchKey = `${itemId}_${type}${index !== undefined ? `_${index}` : ''}`;
    
    if (type === 'main') {
      updateMillOutputItem(itemId, 'quality', qualityId);
    } else {
      updateAdditionalFinishedMtr(itemId, index!, 'quality', qualityId);
    }
    
    setQualitySearchStates(prev => ({ ...prev, [searchKey]: quality.name }));
    setCurrentQualitySearch(quality.name);
    setActiveQualityDropdown(null);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    formData.millOutputItems.forEach((item, itemIndex) => {
      if (!item.recdDate) {
        newErrors[`recdDate_${item.id}`] = 'Received date is required';
      }

      if (!item.millBillNo?.trim()) {
        newErrors[`millBillNo_${item.id}`] = 'Mill bill number is required';
      }

      if (!item.finishedMtr || parseFloat(item.finishedMtr) <= 0) {
        newErrors[`finishedMtr_${item.id}`] = 'Valid finished meters is required';
      }

      if (!item.millRate || parseFloat(item.millRate) <= 0) {
        newErrors[`millRate_${item.id}`] = 'Valid mill rate is required';
      }

      if (!item.quality) {
        newErrors[`quality_${item.id}`] = 'Quality is required';
      }

      // Validate additional finished meters and rates
      item.additionalFinishedMtr.forEach((additional, additionalIndex) => {
        if (!additional.meters || parseFloat(additional.meters) <= 0) {
          newErrors[`additionalFinishedMtr_${item.id}_${additionalIndex}_meters`] = 'Valid additional finished meters is required';
        }
        if (!additional.rate || parseFloat(additional.rate) <= 0) {
          newErrors[`additionalFinishedMtr_${item.id}_${additionalIndex}_rate`] = 'Valid additional mill rate is required';
        }
        if (!additional.quality) {
          newErrors[`additionalQuality_${item.id}_${additionalIndex}`] = 'Quality is required';
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
      if (isEditing && existingMillOutputs.length > 0) {
        // Update existing mill outputs
        await updateExistingMillOutputs();
      } else {
        // Create new mill outputs
        await createNewMillOutputs();
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error handling mill output:', error);
      setErrors({ submit: 'Failed to handle mill output' });
    } finally {
      setSaving(false);
    }
  };

  // Function to create new mill outputs
  const createNewMillOutputs = async () => {
    const allMillOutputPromises: Promise<any>[] = [];

    formData.millOutputItems.forEach((item) => {
      // Main mill output
      const millOutputData = {
        orderId: formData.orderId,
        recdDate: item.recdDate,
        millBillNo: item.millBillNo.trim(),
        finishedMtr: parseFloat(item.finishedMtr),
        millRate: parseFloat(item.millRate),
        quality: item.quality // Add quality field
      };

      console.log('Mill Output Data being sent:', millOutputData);
      console.log('Quality field value:', item.quality);
      console.log('Quality field type:', typeof item.quality);

      allMillOutputPromises.push(
        fetch('/api/mill-outputs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(millOutputData)
        }).then(response => response.json())
      );

      // Additional finished meters and rates
      item.additionalFinishedMtr.forEach((additional) => {
        const additionalMillOutputData = {
          orderId: formData.orderId,
          recdDate: item.recdDate,
          millBillNo: item.millBillNo.trim(),
          finishedMtr: parseFloat(additional.meters),
          millRate: parseFloat(additional.rate),
          quality: additional.quality // Add quality field
        };

        console.log('Additional Mill Output Data being sent:', additionalMillOutputData);

        allMillOutputPromises.push(
          fetch('/api/mill-outputs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(additionalMillOutputData)
          }).then(response => response.json())
        );
      });
    });

    // Wait for all mill outputs to be created
    const results = await Promise.all(allMillOutputPromises);
    
    // Check if all were successful
    const allSuccessful = results.every((result: any) => result.success);
    
    if (!allSuccessful) {
      const errorMessages = results
        .filter((result: any) => !result.success)
        .map((result: any) => result.message || result.error)
        .join(', ');
      throw new Error(`Failed to create some mill outputs: ${errorMessages}`);
    }
  };

  // Function to update existing mill outputs
  const updateExistingMillOutputs = async () => {
    // First delete existing mill outputs for this order
    const deletePromises = existingMillOutputs.map((output: any) =>
      fetch(`/api/mill-outputs/${output._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    );

    await Promise.all(deletePromises);

    // Then create new ones with updated data
    await createNewMillOutputs();
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
                <p className="mt-2 text-sm">Loading existing mill outputs...</p>
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
                <p className="mt-3 text-sm font-medium">Saving mill output data...</p>
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
                  {isEditing ? 'Edit Mill Output' : 'Add Mill Output'}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  isDarkMode 
                    ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {formData.millOutputItems.length} Item{formData.millOutputItems.length !== 1 ? 's' : ''}
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

          

              {/* Mill Output Items */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Mill Output Items</h3>
                </div>

                <div className="space-y-6">
                  {formData.millOutputItems.map((item, itemIndex) => (
                    <div key={item.id} id={`mill-output-item-${item.id}`} className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                    }`}>
                      {/* RECD DATE and Mill Bill No - Full Width Horizontal Layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* RECD DATE */}
            <div>
                          <label className={`block text-sm font-medium mb-3 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            RECD DATE <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                              value={item.recdDate}
                              onChange={(e) => updateMillOutputItem(item.id, 'recdDate', e.target.value)}
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors[`recdDate_${item.id}`]
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
                          {errors[`recdDate_${item.id}`] && (
                            <p className={`text-sm mt-1 ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                              {errors[`recdDate_${item.id}`]}
                </p>
              )}
            </div>

            {/* Mill Bill No */}
            <div>
                          <label className={`block text-sm font-medium mb-3 ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Mill Bill No <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                              value={item.millBillNo}
                              onChange={(e) => updateMillOutputItem(item.id, 'millBillNo', e.target.value)}
                  placeholder="Enter mill bill number"
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                errors[`millBillNo_${item.id}`]
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
                          {errors[`millBillNo_${item.id}`] && (
                            <p className={`text-sm mt-1 ${
                              isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                              {errors[`millBillNo_${item.id}`]}
                </p>
              )}
            </div>
          </div>

          {/* Finished Meters & Rates Section */}
          <div className={`mt-6 p-4 rounded-xl border ${
            isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-200'
          }`}>
            <h6 className={`text-sm font-semibold mb-4 flex items-center ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Finished Meters & Rates
            </h6>
            <div className="space-y-4">
              {/* M1 and R1 Fields (Always visible) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quality for M1 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Quality M1 <span className="text-red-500">*</span>
                  </label>
                  <EnhancedDropdown
                    options={getFilteredQualities(item.id, 'main')}
                    value={item.quality}
                    onChange={(value) => updateMillOutputItem(item.id, 'quality', value)}
                    placeholder="Search quality..."
                    searchValue={activeQualityDropdown?.itemId === item.id && activeQualityDropdown?.type === 'main' 
                      ? currentQualitySearch 
                      : (qualitySearchStates[`${item.id}_main`] || '')}
                    onSearchChange={(value) => {
                      if (activeQualityDropdown?.itemId === item.id && activeQualityDropdown?.type === 'main') {
                        setCurrentQualitySearch(value);
                      } else {
                        setQualitySearchStates(prev => ({ ...prev, [`${item.id}_main`]: value }));
                      }
                    }}
                    showDropdown={activeQualityDropdown?.itemId === item.id && activeQualityDropdown?.type === 'main'}
                    onToggleDropdown={() => {
                      if (activeQualityDropdown?.itemId === item.id && activeQualityDropdown?.type === 'main') {
                        setActiveQualityDropdown(null);
                        setCurrentQualitySearch('');
                      } else {
                        setActiveQualityDropdown({ itemId: item.id, type: 'main' });
                        setCurrentQualitySearch(qualitySearchStates[`${item.id}_main`] || '');
                      }
                    }}
                    onSelect={(quality) => handleQualitySelect(item.id, 'main', quality)}
                    isDarkMode={isDarkMode}
                    error={errors[`quality_${item.id}`]}
                    recentlyAddedId={recentlyAddedQuality}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Finished Mtr M1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={item.finishedMtr}
                    onChange={(e) => updateMillOutputItem(item.id, 'finishedMtr', e.target.value)}
                    placeholder="Enter finished meters"
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`finishedMtr_${item.id}`]
                        ? isDarkMode
                          ? 'border-red-500 bg-gray-800 text-white'
                          : 'border-red-500 bg-white text-gray-900'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                    }`}
                  />
                  {errors[`finishedMtr_${item.id}`] && (
                    <p className={`text-sm mt-1 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {errors[`finishedMtr_${item.id}`]}
                    </p>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Mill Rate R1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={item.millRate}
                    onChange={(e) => updateMillOutputItem(item.id, 'millRate', e.target.value)}
                    placeholder="Enter mill rate"
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`millRate_${item.id}`]
                        ? isDarkMode
                          ? 'border-red-500 bg-gray-800 text-white'
                          : 'border-red-500 bg-white text-gray-900'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                          : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                    }`}
                  />
                  {errors[`millRate_${item.id}`] && (
                    <p className={`text-sm mt-1 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {errors[`millRate_${item.id}`]}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Fields (M2, R2, M3, R3, etc.) */}
              {item.additionalFinishedMtr.map((additional, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Quality for Additional Meters */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Quality M{index + 2} <span className="text-red-500">*</span>
                    </label>
                    <EnhancedDropdown
                      options={getFilteredQualities(item.id, 'additional', index)}
                      value={additional.quality}
                      onChange={(value) => updateAdditionalFinishedMtr(item.id, index, 'quality', value)}
                      placeholder="Search quality..."
                      searchValue={activeQualityDropdown?.itemId === item.id && activeQualityDropdown?.type === 'additional' && activeQualityDropdown?.index === index
                        ? currentQualitySearch 
                        : (qualitySearchStates[`${item.id}_additional_${index}`] || '')}
                      onSearchChange={(value) => {
                        if (activeQualityDropdown?.itemId === item.id && activeQualityDropdown?.type === 'additional' && activeQualityDropdown?.index === index) {
                          setCurrentQualitySearch(value);
                        } else {
                          setQualitySearchStates(prev => ({ ...prev, [`${item.id}_additional_${index}`]: value }));
                        }
                      }}
                      showDropdown={activeQualityDropdown?.itemId === item.id && activeQualityDropdown?.type === 'additional' && activeQualityDropdown?.index === index}
                      onToggleDropdown={() => {
                        if (activeQualityDropdown?.itemId === item.id && activeQualityDropdown?.type === 'additional' && activeQualityDropdown?.index === index) {
                          setActiveQualityDropdown(null);
                          setCurrentQualitySearch('');
                        } else {
                          setActiveQualityDropdown({ itemId: item.id, type: 'additional', index });
                          setCurrentQualitySearch(qualitySearchStates[`${item.id}_additional_${index}`] || '');
                        }
                      }}
                      onSelect={(quality) => handleQualitySelect(item.id, 'additional', quality, index)}
                      isDarkMode={isDarkMode}
                      error={errors[`additionalQuality_${item.id}_${index}`]}
                      recentlyAddedId={recentlyAddedQuality}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Finished Mtr M{index + 2} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={additional.meters}
                      onChange={(e) => updateAdditionalFinishedMtr(item.id, index, 'meters', e.target.value)}
                      placeholder="Enter finished meters"
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Mill Rate R{index + 2} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={additional.rate}
                      onChange={(e) => updateAdditionalFinishedMtr(item.id, index, 'rate', e.target.value)}
                      placeholder="Enter mill rate"
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' 
                          : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeAdditionalFinishedMtr(item.id, index)}
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
          </div>

                       {/* Add More Finished Meters & Rates Button */}
                       <div className="mt-4">
                         <button
                           type="button"
                           onClick={() => addAdditionalFinishedMtr(item.id)}
                           className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                             isDarkMode 
                               ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300' 
                               : 'bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-700'
                           }`}
                         >
                           <PlusIcon className="h-4 w-4 mr-2" />
                           Add More Finished Meters & Rates
                         </button>
                       </div>

                       {/* Remove Item Button */}
                      {formData.millOutputItems.length > 1 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeMillOutputItem(item.id)}
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
                  }`} onClick={addMillOutputItem}>
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
                          Add New Mill Output Item
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
                {saving ? 'Saving...' : isEditing ? 'Update Mill Output' : 'Add Mill Output'}
            </button>
          </div>
          </div>
      </div>
    </div>
    </>
  );
}

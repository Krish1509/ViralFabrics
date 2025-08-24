'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  PlusIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Fabric, FabricFormData, QualityName, Weaver, WeaverQualityName } from '@/types/fabric';

interface FabricFormProps {
  fabric?: Fabric | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function FabricForm({ fabric, onClose, onSuccess }: FabricFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [formData, setFormData] = useState<FabricFormData>({
    qualityCode: '',
    qualityName: '',
    weaver: '',
    weaverQualityName: '',
    greighWidth: '',
    finishWidth: '',
    weight: '',
    gsm: '',
    danier: '',
    reed: '',
    pick: '',
    greighRate: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Dropdown data
  const [qualityNames, setQualityNames] = useState<QualityName[]>([]);
  
  // New item creation states
  const [showNewQualityName, setShowNewQualityName] = useState(false);
  const [newQualityName, setNewQualityName] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  
  // Searchable dropdown states
  const [showQualityNameDropdown, setShowQualityNameDropdown] = useState(false);
  const [qualityNameSearch, setQualityNameSearch] = useState('');
  
  // Filter quality names based on search and show "New" first
  const filteredQualityNames = qualityNames
    .filter(name => 
      name.name.toLowerCase().includes(qualityNameSearch.toLowerCase())
    )
    .sort((a, b) => {
      // Show "New" first
      if (a.name.toLowerCase().includes('new')) return -1;
      if (b.name.toLowerCase().includes('new')) return 1;
      return a.name.localeCompare(b.name);
    });

  // Initialize form data
  useEffect(() => {
    if (fabric) {
      setFormData({
        qualityCode: fabric.qualityCode,
        qualityName: fabric.qualityName,
        weaver: fabric.weaver,
        weaverQualityName: fabric.weaverQualityName,
        greighWidth: fabric.greighWidth.toString(),
        finishWidth: fabric.finishWidth.toString(),
        weight: fabric.weight.toString(),
        gsm: fabric.gsm.toString(),
        danier: fabric.danier,
        reed: fabric.reed.toString(),
        pick: fabric.pick.toString(),
        greighRate: fabric.greighRate.toString()
      });
    }
  }, [fabric]);

  // Fetch quality names
  const fetchQualityNames = async () => {
    try {
      const response = await fetch('/api/fabrics/quality-names');
      const data = await response.json();
      if (data.success) {
        setQualityNames(data.data.map((name: string) => ({ _id: name, name })));
      }
    } catch (error) {
      console.error('Error fetching quality names:', error);
    }
  };

  // Fetch weavers based on quality name (no longer needed since weaver is now a text input)
  const fetchWeavers = async (qualityName: string) => {
    // This function is kept for compatibility but no longer needed
    // Weaver is now a simple text input field
  };

  // Fetch weaver quality names (no longer needed since weaver quality name is now a text input)
  const fetchWeaverQualityNames = async (weaver: string) => {
    // This function is kept for compatibility but no longer needed
    // Weaver quality name is now a simple text input field
  };

  // Create new quality name
  const createNewQualityName = async () => {
    if (!newQualityName.trim()) return;
    
    setCreatingNew(true);
    try {
      const response = await fetch('/api/quality-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newQualityName.trim() })
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchQualityNames();
        setFormData(prev => ({ ...prev, qualityName: newQualityName.trim() }));
        setNewQualityName('');
        setShowNewQualityName(false);
        setValidationMessage({ type: 'success', text: 'Quality name created successfully!' });
      } else {
        setValidationMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setValidationMessage({ type: 'error', text: 'Failed to create quality name' });
    } finally {
      setCreatingNew(false);
    }
  };

  // Create new weaver (no longer needed since weaver is now a text input)
  const createNewWeaver = async () => {
    // This function is kept for compatibility but no longer needed
    // Weaver is now a simple text input field
  };

  // Create new weaver quality name (no longer needed since weaver quality name is now a text input)
  const createNewWeaverQualityName = async () => {
    // This function is kept for compatibility but no longer needed
    // Weaver quality name is now a simple text input field
  };

  useEffect(() => {
    fetchQualityNames();
  }, []);

  // useEffect for weaver fetching is no longer needed since weaver is now a text input
  // useEffect(() => {
  //   if (formData.qualityName) {
  //     fetchWeavers(formData.qualityName);
  //   }
  // }, [formData.qualityName]);

  // useEffect for weaver quality names fetching is no longer needed since weaver quality name is now a text input
  // useEffect(() => {
  //   if (formData.weaver) {
  //     fetchWeaverQualityNames(formData.weaver);
  //   }
  // }, [formData.weaver]);

  // Validation
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    if (!formData.qualityCode.trim()) {
      newErrors.qualityCode = 'Quality code is required';
    }

    if (!formData.qualityName.trim()) {
      newErrors.qualityName = 'Quality name is required';
    }

    if (!formData.weaver.trim()) {
      newErrors.weaver = 'Weaver is required';
    }

    if (!formData.weaverQualityName.trim()) {
      newErrors.weaverQualityName = 'Weaver quality name is required';
    }

    // Only validate numeric fields if they have values
    if (formData.greighWidth && parseFloat(formData.greighWidth) <= 0) {
      newErrors.greighWidth = 'Greigh width must be a positive number';
    }

    if (formData.finishWidth && parseFloat(formData.finishWidth) <= 0) {
      newErrors.finishWidth = 'Finish width must be a positive number';
    }

    if (formData.weight && parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Weight must be a positive number';
    }

    if (formData.gsm && parseFloat(formData.gsm) <= 0) {
      newErrors.gsm = 'GSM must be a positive number';
    }

    if (formData.reed && parseFloat(formData.reed) <= 0) {
      newErrors.reed = 'Reed must be a positive number';
    }

    if (formData.pick && parseFloat(formData.pick) <= 0) {
      newErrors.pick = 'Pick must be a positive number';
    }

    if (formData.greighRate && parseFloat(formData.greighRate) <= 0) {
      newErrors.greighRate = 'Greigh rate must be a positive number';
    }

    return newErrors;
  };

  // Handle field changes
  const handleFieldChange = (field: keyof FabricFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear dependent fields when parent field changes
    if (field === 'qualityName') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setValidationMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setLoading(true);
    try {
      const url = fabric ? `/api/fabrics/${fabric._id}` : '/api/fabrics';
      const method = fabric ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setValidationMessage({ 
          type: 'success', 
          text: fabric ? 'Fabric updated successfully!' : 'Fabric created successfully!' 
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setValidationMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      setValidationMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-dismiss validation message
  useEffect(() => {
    if (validationMessage) {
      const timer = setTimeout(() => {
        setValidationMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [validationMessage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.quality-name-dropdown')) {
        setShowQualityNameDropdown(false);
        setQualityNameSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!mounted) return null;

  return (
    <>
             {/* Enhanced Validation Message */}
       {validationMessage && (
         <div className={`fixed top-6 right-6 z-[9999] max-w-md transform transition-all duration-500 ease-in-out animate-slide-in-right`}>
          <div className={`relative p-6 rounded-2xl border-2 shadow-2xl backdrop-blur-sm ${
            validationMessage.type === 'success' 
              ? isDarkMode
                ? 'bg-gradient-to-r from-green-900/90 to-emerald-900/90 border-green-500/50 text-green-100 shadow-green-500/20'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800 shadow-green-200/50'
              : isDarkMode
                ? 'bg-gradient-to-r from-red-900/90 to-rose-900/90 border-red-500/50 text-red-100 shadow-red-500/20'
                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800 shadow-red-200/50'
          }`}>
            <div className="relative flex items-start space-x-4">
              <div className={`flex-shrink-0 p-3 rounded-xl ${
                validationMessage.type === 'success'
                  ? isDarkMode
                    ? 'bg-green-500/20 border border-green-400/30'
                    : 'bg-green-100 border border-green-200'
                  : isDarkMode
                    ? 'bg-red-500/20 border border-red-400/30'
                    : 'bg-red-100 border border-red-200'
              }`}>
                {validationMessage.type === 'success' ? (
                  <CheckIcon className={`h-6 w-6 ${
                    isDarkMode ? 'text-green-300' : 'text-green-600'
                  }`} />
                ) : (
                  <ExclamationTriangleIcon className={`h-6 w-6 ${
                    isDarkMode ? 'text-red-300' : 'text-red-600'
                  }`} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-bold mb-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {validationMessage.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className={`text-sm leading-relaxed ${
                  isDarkMode 
                    ? validationMessage.type === 'success' ? 'text-green-200' : 'text-red-200'
                    : validationMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validationMessage.text}
                </p>
              </div>
              
              <button
                onClick={() => setValidationMessage(null)}
                className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                  validationMessage.type === 'success'
                    ? isDarkMode
                      ? 'text-green-300 hover:bg-green-500/20 hover:text-green-200'
                      : 'text-green-600 hover:bg-green-100 hover:text-green-700'
                    : isDarkMode
                      ? 'text-red-300 hover:bg-red-500/20 hover:text-red-200'
                      : 'text-red-600 hover:bg-red-100 hover:text-red-700'
                }`}
                title="Close notification"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className={`relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-xl shadow-2xl ${
          isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${
                isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
              }`}>
                <PlusIcon className={`h-6 w-6 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {fabric ? 'Edit Fabric' : 'Add New Fabric'}
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {fabric ? 'Update fabric specifications' : 'Create a new fabric entry'}
                </p>
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
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-140px)]">
            <div className="p-6 space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quality Code */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Quality Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.qualityCode}
                    onChange={(e) => handleFieldChange('qualityCode', e.target.value)}
                    placeholder="e.g., 1001 - WL"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.qualityCode ? 'border-red-500' : ''}`}
                  />
                  {errors.qualityCode && (
                    <p className="text-red-500 text-sm mt-2">{errors.qualityCode}</p>
                  )}
                </div>

                                 {/* Quality Name */}
                 <div>
                   <label className="block text-sm font-medium mb-3">
                     Quality Name <span className="text-red-500">*</span>
                   </label>
                   <div className="relative">
                     <div className="relative">
                       <input
                         type="text"
                         value={formData.qualityName}
                         onChange={(e) => handleFieldChange('qualityName', e.target.value)}
                         onFocus={() => setShowQualityNameDropdown(true)}
                         placeholder="Search or select quality name"
                         className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                           isDarkMode 
                             ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                             : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                         } ${errors.qualityName ? 'border-red-500' : ''}`}
                       />
                       <button
                         type="button"
                         onClick={() => setShowNewQualityName(!showNewQualityName)}
                         className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                           isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                         }`}
                       >
                         <PlusIcon className="h-4 w-4" />
                       </button>
                     </div>
                     
                     {/* Dropdown */}
                     {showQualityNameDropdown && (
                       <div className={`quality-name-dropdown absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
                         isDarkMode 
                           ? 'bg-gray-800 border-gray-600' 
                           : 'bg-white border-gray-300'
                       }`}>
                         <div className="p-2">
                           <input
                             type="text"
                             placeholder="Search quality names..."
                             value={qualityNameSearch}
                             onChange={(e) => setQualityNameSearch(e.target.value)}
                             className={`w-full p-2 rounded border text-sm ${
                               isDarkMode 
                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                 : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                             }`}
                           />
                         </div>
                         <div className="max-h-48 overflow-y-auto custom-scrollbar">
                           {filteredQualityNames.map((name) => (
                             <button
                               key={name._id}
                               type="button"
                               onClick={() => {
                                 handleFieldChange('qualityName', name.name);
                                 setShowQualityNameDropdown(false);
                                 setQualityNameSearch('');
                               }}
                               className={`w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors ${
                                 isDarkMode 
                                   ? 'text-gray-300 hover:bg-gray-700 hover:text-blue-400' 
                                   : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                               } ${formData.qualityName === name.name ? 'bg-blue-100 text-blue-700' : ''}`}
                             >
                               {name.name}
                             </button>
                           ))}
                           {filteredQualityNames.length === 0 && (
                             <div className={`px-3 py-2 text-sm ${
                               isDarkMode ? 'text-gray-400' : 'text-gray-500'
                             }`}>
                               No quality names found
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                  {showNewQualityName && (
                    <div className="mt-2 flex space-x-2">
                      <input
                        type="text"
                        value={newQualityName}
                        onChange={(e) => setNewQualityName(e.target.value)}
                        placeholder="Enter new quality name"
                        className={`flex-1 p-2 rounded border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={createNewQualityName}
                        disabled={creatingNew || !newQualityName.trim()}
                        className={`px-3 py-2 rounded text-sm ${
                          creatingNew || !newQualityName.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {creatingNew ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  )}
                  {errors.qualityName && (
                    <p className="text-red-500 text-sm mt-2">{errors.qualityName}</p>
                  )}
                </div>

                {/* Weaver */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Weaver <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.weaver}
                    onChange={(e) => handleFieldChange('weaver', e.target.value)}
                    placeholder="Enter weaver name"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.weaver ? 'border-red-500' : ''}`}
                  />
                  {errors.weaver && (
                    <p className="text-red-500 text-sm mt-2">{errors.weaver}</p>
                  )}
                </div>

                {/* Weaver Quality Name */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Weaver Quality Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.weaverQualityName}
                    onChange={(e) => handleFieldChange('weaverQualityName', e.target.value)}
                    placeholder="Enter weaver quality name"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.weaverQualityName ? 'border-red-500' : ''}`}
                  />
                  {errors.weaverQualityName && (
                    <p className="text-red-500 text-sm mt-2">{errors.weaverQualityName}</p>
                  )}
                </div>

                {/* Greigh Width */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Greigh Width (inches)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.greighWidth}
                    onChange={(e) => handleFieldChange('greighWidth', e.target.value)}
                    placeholder="e.g., 58.5"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.greighWidth ? 'border-red-500' : ''}`}
                  />
                  {errors.greighWidth && (
                    <p className="text-red-500 text-sm mt-2">{errors.greighWidth}</p>
                  )}
                </div>

                {/* Finish Width */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Finish Width (inches)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.finishWidth}
                    onChange={(e) => handleFieldChange('finishWidth', e.target.value)}
                    placeholder="e.g., 56.0"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.finishWidth ? 'border-red-500' : ''}`}
                  />
                  {errors.finishWidth && (
                    <p className="text-red-500 text-sm mt-2">{errors.finishWidth}</p>
                  )}
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Weight (KG)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => handleFieldChange('weight', e.target.value)}
                    placeholder="e.g., 8.0"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.weight ? 'border-red-500' : ''}`}
                  />
                  {errors.weight && (
                    <p className="text-red-500 text-sm mt-2">{errors.weight}</p>
                  )}
                </div>

                {/* GSM */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    GSM
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.gsm}
                    onChange={(e) => handleFieldChange('gsm', e.target.value)}
                    placeholder="e.g., 72.5"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.gsm ? 'border-red-500' : ''}`}
                  />
                  {errors.gsm && (
                    <p className="text-red-500 text-sm mt-2">{errors.gsm}</p>
                  )}
                </div>

                {/* Danier */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Danier
                  </label>
                  <input
                    type="text"
                    value={formData.danier}
                    onChange={(e) => handleFieldChange('danier', e.target.value)}
                    placeholder="e.g., 55*22D"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.danier ? 'border-red-500' : ''}`}
                  />
                  {errors.danier && (
                    <p className="text-red-500 text-sm mt-2">{errors.danier}</p>
                  )}
                </div>

                {/* Reed */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Reed
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reed}
                    onChange={(e) => handleFieldChange('reed', e.target.value)}
                    placeholder="e.g., 120"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.reed ? 'border-red-500' : ''}`}
                  />
                  {errors.reed && (
                    <p className="text-red-500 text-sm mt-2">{errors.reed}</p>
                  )}
                </div>

                {/* Pick */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Pick
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pick}
                    onChange={(e) => handleFieldChange('pick', e.target.value)}
                    placeholder="e.g., 80"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.pick ? 'border-red-500' : ''}`}
                  />
                  {errors.pick && (
                    <p className="text-red-500 text-sm mt-2">{errors.pick}</p>
                  )}
                </div>

                {/* Greigh Rate */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Greigh Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.greighRate}
                    onChange={(e) => handleFieldChange('greighRate', e.target.value)}
                    placeholder="e.g., 85.50"
                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors.greighRate ? 'border-red-500' : ''}`}
                  />
                  {errors.greighRate && (
                    <p className="text-red-500 text-sm mt-2">{errors.greighRate}</p>
                  )}
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
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
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' 
                      : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
                }`}
              >
                {loading ? 'Saving...' : (fabric ? 'Update Fabric' : 'Create Fabric')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out forwards;
        }
      `}</style>
    </>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { FabricFormData, FabricItem } from '@/types/fabric';

export default function CreateFabricPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Multiple items
  const [formData, setFormData] = useState<FabricFormData>({
    items: [{
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
    }]
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Handle single field changes (for shared Quality Code and Quality Name)
  const handleSingleFieldChange = (field: string, value: string) => {
    // Update all items with the same value
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        [field]: value
      }))
    }));
    
    // Clear error for this field
    if (errors[`items.0.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`items.0.${field}`];
        return newErrors;
      });
    }
  };

  // Handle item field changes
  const handleItemChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      if (!updatedItems[index]) {
        updatedItems[index] = {
          qualityCode: '', qualityName: '',
          weaver: '', weaverQualityName: '',
          greighWidth: '', finishWidth: '', weight: '', gsm: '', danier: '',
          reed: '', pick: '', greighRate: ''
        };
      }
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });

    // Clear error for this field
    const fieldKey = `items.${index}.${field}`;
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        qualityCode: prev.items[0]?.qualityCode || '', // Copy quality code from first item
        qualityName: prev.items[0]?.qualityName || '', // Copy quality name from first item
        weaver: '', // Leave weaver empty for new item
        weaverQualityName: '', // Leave weaver quality name empty for new item
        greighWidth: prev.items[0]?.greighWidth || '',
        finishWidth: prev.items[0]?.finishWidth || '',
        weight: prev.items[0]?.weight || '',
        gsm: prev.items[0]?.gsm || '',
        danier: prev.items[0]?.danier || '',
        reed: prev.items[0]?.reed || '',
        pick: prev.items[0]?.pick || '',
        greighRate: prev.items[0]?.greighRate || ''
      }]
    }));
    
    // Scroll to the newly added item with smooth animation
    setTimeout(() => {
      if (formRef.current) {
        // Get the last item element
        const items = formRef.current.querySelectorAll('[data-item-index]');
        const lastItem = items[items.length - 1];
        
        if (lastItem) {
          // Scroll to the last item with offset for better visibility
          lastItem.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        } else {
          // Fallback: scroll to bottom
          formRef.current.scrollTo({ 
            top: formRef.current.scrollHeight, 
            behavior: 'smooth' 
          });
        }
      }
    }, 100);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Validation
  const validateForm = (): { isValid: boolean; errorCount: number } => {
    const newErrors: {[key: string]: string} = {};

    // Log current values for debugging
    console.log('Current form values:', {
      items: formData.items.map(item => ({
        qualityCode: `"${item.qualityCode}"`,
        qualityName: `"${item.qualityName}"`,
        weaver: `"${item.weaver}"`,
        weaverQualityName: `"${item.weaverQualityName}"`
      }))
    });

    // Validate items
    formData.items.forEach((item, index) => {
      const itemPrefix = `items.${index}`;
      
      if (!item.qualityCode || item.qualityCode.trim() === '') {
        newErrors[`${itemPrefix}.qualityCode`] = 'Quality code is required';
        console.log(`Quality code validation failed for item ${index}:`, item.qualityCode);
      }
      
      if (!item.qualityName || item.qualityName.trim() === '') {
        newErrors[`${itemPrefix}.qualityName`] = 'Quality name is required';
        console.log(`Quality name validation failed for item ${index}:`, item.qualityName);
      }
      
      if (!item.weaver || item.weaver.trim() === '') {
        newErrors[`${itemPrefix}.weaver`] = 'Weaver is required';
        console.log(`Weaver validation failed for item ${index}:`, item.weaver);
      }
      
      if (!item.weaverQualityName || item.weaverQualityName.trim() === '') {
        newErrors[`${itemPrefix}.weaverQualityName`] = 'Weaver quality name is required';
        console.log(`Weaver quality name validation failed for item ${index}:`, item.weaverQualityName);
      }
    });

    setErrors(newErrors);
    
    const errorCount = Object.keys(newErrors).length;
    
    // Log validation results for debugging
    if (errorCount > 0) {
      console.log('Validation errors:', newErrors);
    } else {
      console.log('Form is valid!');
    }
    
    return { isValid: errorCount === 0, errorCount };
  };

  // Form submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Add a small delay to ensure state updates are complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      setMessage({ 
        type: 'error', 
        text: `Please fix ${validationResult.errorCount} validation error${validationResult.errorCount > 1 ? 's' : ''}. Required fields: Quality Code, Quality Name, Weaver, and Weaver Quality Name.` 
      });
      return;
    }

    setLoading(true);
    try {
      // Convert form data to API format
      const apiData = formData.items.map(item => ({
        qualityCode: item.qualityCode,
        qualityName: item.qualityName,
        weaver: item.weaver,
        weaverQualityName: item.weaverQualityName,
        greighWidth: parseFloat(item.greighWidth) || 0,
        finishWidth: parseFloat(item.finishWidth) || 0,
        weight: parseFloat(item.weight) || 0,
        gsm: parseFloat(item.gsm) || 0,
        danier: item.danier,
        reed: parseInt(item.reed) || 0,
        pick: parseInt(item.pick) || 0,
        greighRate: parseFloat(item.greighRate) || 0
      }));

      // Debug: Log the data being sent to API
      console.log('Sending data to API:', JSON.stringify(apiData, null, 2));

      const token = localStorage.getItem('token');
      const response = await fetch('/api/fabrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      
      // Debug: Log the API response
      console.log('API Response:', data);
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Fabric created successfully!' });
        setTimeout(() => {
          // Use normal navigation, user can manually refresh if needed
          router.push('/fabrics');
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      // Alt + N to add new item (avoid browser conflicts)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        addItem();
      }
      // Escape to close
      if (e.key === 'Escape') {
        router.push('/fabrics');
      }
      // F1 to show keyboard shortcuts
      if (e.key === 'F1') {
        e.preventDefault();
        setShowKeyboardShortcuts(!showKeyboardShortcuts);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showKeyboardShortcuts]);

  if (!mounted) return null;

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/fabrics')}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Create New Fabric</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Add multiple fabric items in a single form
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm px-2 py-1 rounded-full ${
                isDarkMode 
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                {formData.items.length} Item{formData.items.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 hover:scale-105 ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400' 
                    : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                }`}
                title="Keyboard Shortcuts (F1)"
              >
                ⌨️ Shortcuts
              </button>
            </div>
          </div>
        </div>
      </div>

             {/* Main Content */}
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-8 mr-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Fabric Creation Form</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Fill in the details below to create new fabric items. You can add multiple items using the "Add Item" button.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg border mb-6 ${
            message.type === 'success'
              ? isDarkMode
                ? 'border-green-500/40 bg-green-900/30 text-green-300'
                : 'border-green-200 bg-green-50 text-green-800'
              : isDarkMode
                ? 'border-red-500/40 bg-red-900/30 text-red-300'
                : 'border-red-200 bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckIcon className="h-5 w-5" />
              ) : (
                <span>⚠️</span>
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Shared Fabric Information */}
          <div className={`p-6 rounded-xl border mb-8 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <h3 className="text-lg font-semibold mb-6">Fabric Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quality Code */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Quality Code <span className="text-red-500">*</span>
                </label>
                <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  This quality code will be used for all fabric items below
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.items[0]?.qualityCode || ''}
                    onChange={(e) => handleSingleFieldChange('qualityCode', e.target.value)}
                    placeholder="e.g., 1001 - WL"
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors['items.0.qualityCode'] ? 
                      isDarkMode 
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : ''}`}
                  />
                  {formData.items[0]?.qualityCode && (
                    <button
                      type="button"
                      onClick={() => handleSingleFieldChange('qualityCode', '')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Clear quality code"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {errors['items.0.qualityCode'] && (
                  <p className="text-red-500 text-sm mt-2">⚠️ {errors['items.0.qualityCode']}</p>
                )}
              </div>

              {/* Quality Name */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Quality Name <span className="text-red-500">*</span>
                </label>
                <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  This quality name will be used for all fabric items below
                </p>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.items[0]?.qualityName || ''}
                    onChange={(e) => handleSingleFieldChange('qualityName', e.target.value)}
                    placeholder="Enter quality name"
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } ${errors['items.0.qualityName'] ? 
                      isDarkMode 
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
                        : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : ''}`}
                  />
                  {formData.items[0]?.qualityName && (
                    <button
                      type="button"
                      onClick={() => handleSingleFieldChange('qualityName', '')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Clear quality name"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {errors['items.0.qualityName'] && (
                  <p className="text-red-500 text-sm mt-2">⚠️ {errors['items.0.qualityName']}</p>
                )}
              </div>
            </div>
          </div>

          {/* Multiple Items Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Fabric Items</h3>
            </div>

            {formData.items.map((item, index) => (
              <div 
                key={index} 
                data-item-index={index}
                className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold">Item {index + 1}</h4>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white' 
                          : 'border-red-300 text-red-600 hover:bg-red-500 hover:text-white'
                      }`}
                      title="Remove Item"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">

                  {/* Weaver */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Weaver <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.weaver}
                        onChange={(e) => handleItemChange(index, 'weaver', e.target.value)}
                        placeholder="Enter weaver name"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } ${errors[`items.${index}.weaver`] ? 
                          isDarkMode 
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : ''}`}
                      />
                      {item.weaver && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'weaver', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear weaver"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {errors[`items.${index}.weaver`] && (
                      <p className="text-red-500 text-sm mt-2">⚠️ {errors[`items.${index}.weaver`]}</p>
                    )}
                  </div>

                  {/* Weaver Quality Name */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Weaver Quality Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.weaverQualityName}
                        onChange={(e) => handleItemChange(index, 'weaverQualityName', e.target.value)}
                        placeholder="Enter weaver quality name"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } ${errors[`items.${index}.weaverQualityName`] ? 
                          isDarkMode 
                            ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
                            : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                          : ''}`}
                      />
                      {item.weaverQualityName && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'weaverQualityName', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear weaver quality name"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {errors[`items.${index}.weaverQualityName`] && (
                      <p className="text-red-500 text-sm mt-2">⚠️ {errors[`items.${index}.weaverQualityName`]}</p>
                    )}
                  </div>

                  {/* Greigh Width */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Greigh Width (inches)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={item.greighWidth}
                        onChange={(e) => handleItemChange(index, 'greighWidth', e.target.value)}
                        placeholder="e.g., 58.5"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {item.greighWidth && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'greighWidth', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear greigh width"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Finish Width */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Finish Width (inches)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={item.finishWidth}
                        onChange={(e) => handleItemChange(index, 'finishWidth', e.target.value)}
                        placeholder="e.g., 56.0"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {item.finishWidth && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'finishWidth', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear finish width"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Weight (KG)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={item.weight}
                        onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                        placeholder="e.g., 8.0"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {item.weight && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'weight', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear weight"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* GSM */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      GSM
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={item.gsm}
                        onChange={(e) => handleItemChange(index, 'gsm', e.target.value)}
                        placeholder="e.g., 72.5"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {item.gsm && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'gsm', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear GSM"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Danier */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Danier
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.danier}
                        onChange={(e) => handleItemChange(index, 'danier', e.target.value)}
                        placeholder="e.g., 55*22D"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {item.danier && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'danier', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear danier"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reed */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Reed
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={item.reed}
                        onChange={(e) => handleItemChange(index, 'reed', e.target.value)}
                        placeholder="e.g., 120"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {item.reed && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'reed', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear reed"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pick */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Pick
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={item.pick}
                        onChange={(e) => handleItemChange(index, 'pick', e.target.value)}
                        placeholder="e.g., 80"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {item.pick && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'pick', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear pick"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Greigh Rate */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Greigh Rate (₹)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={item.greighRate}
                        onChange={(e) => handleItemChange(index, 'greighRate', e.target.value)}
                        placeholder="e.g., 150.00"
                        className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                      />
                      {item.greighRate && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'greighRate', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Clear greigh rate"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Item Card */}
            <div className={`p-4 rounded-xl border-2 border-dashed transition-all duration-200 hover:shadow-lg cursor-pointer ${
              isDarkMode 
                ? 'border-gray-600 bg-gray-800/50 hover:border-blue-500 hover:bg-gray-800' 
                : 'border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-gray-50'
            }`} onClick={addItem}>
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
                    Add New Item
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

             {/* Submit Button */}
       <div className="mt-12 mb-8 flex justify-end space-x-6">
         <button
           type="button"
           onClick={() => router.push('/fabrics')}
           className={`px-10 py-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 font-medium ${
             isDarkMode 
               ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 bg-gray-800 shadow-lg' 
               : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 bg-white shadow-lg'
           }`}
         >
           Cancel
         </button>
         <button
           onClick={handleSubmit}
           disabled={loading}
           className={`px-12 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 flex items-center space-x-3 shadow-xl ${
             loading ? 'opacity-50 cursor-not-allowed' : ''
           } ${
             isDarkMode 
               ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25 text-white' 
               : 'bg-blue-500 hover:bg-blue-600 hover:shadow-blue-500/25 text-white'
           }`}
         >
           {loading ? (
             <>
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
               <span>Saving...</span>
             </>
           ) : (
             <>
               <CheckIcon className="h-6 w-6" />
               <span>Create Fabric{formData.items.length > 1 ? 's' : ''}</span>
             </>
           )}
         </button>
       </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className={`relative max-w-md w-full rounded-xl shadow-2xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                ⌨️ Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className={`p-1 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Submit Form
                </span>
                <kbd className={`px-2 py-1 text-xs rounded ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  Ctrl + Enter
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Add New Item
                </span>
                <kbd className={`px-2 py-1 text-xs rounded ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  Alt + N
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Close Form
                </span>
                <kbd className={`px-2 py-1 text-xs rounded ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  Esc
                </kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Show Shortcuts
                </span>
                <kbd className={`px-2 py-1 text-xs rounded ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  F1
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

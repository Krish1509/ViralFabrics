'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  XMarkIcon,
  PlusIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Fabric, FabricFormData, FabricItem } from '@/types/fabric';

interface FabricFormProps {
  fabric?: Fabric | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnhancedFabricForm({ fabric, onClose, onSuccess }: FabricFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
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

  // Handle field changes
  const handleItemChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      if (!updatedItems[index]) {
        updatedItems[index] = {
          qualityCode: '', qualityName: '', weaver: '', weaverQualityName: '',
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
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };

  // Add/Remove items
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        qualityCode: '', // Each item should have unique quality code
        qualityName: prev.items[0]?.qualityName || '', // Can copy quality name as it can be same
        weaver: '', weaverQualityName: '',
        greighWidth: '', finishWidth: '', weight: '', gsm: '', danier: '',
        reed: '', pick: '', greighRate: ''
      }]
    }));
    
    // Auto-scroll to the new item after a short delay
    setTimeout(() => {
      const newItemIndex = formData.items.length;
      const newItemElement = document.querySelector(`[data-item-index="${newItemIndex}"]`);
      if (newItemElement) {
        newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

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

    formData.items.forEach((item, index) => {
      const itemPrefix = `items.${index}`;
      
      if (!item.qualityCode || item.qualityCode.trim() === '') {
        newErrors[`${itemPrefix}.qualityCode`] = 'Quality code is required';
      }
      
      if (!item.qualityName || item.qualityName.trim() === '') {
        newErrors[`${itemPrefix}.qualityName`] = 'Quality name is required';
      }
      
      if (!item.weaver || item.weaver.trim() === '') {
        newErrors[`${itemPrefix}.weaver`] = 'Weaver is required';
      }
      
      if (!item.weaverQualityName || item.weaverQualityName.trim() === '') {
        newErrors[`${itemPrefix}.weaverQualityName`] = 'Weaver quality name is required';
      }
    });

    setErrors(newErrors);
    const errorCount = Object.keys(newErrors).length;
    return { isValid: errorCount === 0, errorCount };
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add a small delay to ensure state updates are complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      setMessage({ type: 'error', text: `Please fix ${validationResult.errorCount} validation error${validationResult.errorCount > 1 ? 's' : ''}. Required fields: Quality Code, Quality Name, Weaver, and Weaver Quality Name.` });
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

      const token = localStorage.getItem('token');
      const url = fabric ? `/api/fabrics/${fabric._id}` : '/api/fabrics';
      const method = fabric ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', text: fabric ? 'Fabric updated successfully!' : 'Fabric created successfully!' });
        setTimeout(() => {
          onSuccess();
          onClose();
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

  // Initialize form data
  useEffect(() => {
    if (fabric) {
      setFormData({
        items: [{
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
        }]
      });
    }
  }, [fabric]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {fabric ? (
                <PencilIcon className="h-8 w-8 text-blue-500" />
              ) : (
                <PlusIcon className="h-8 w-8 text-green-500" />
              )}
              <h2 className="text-2xl font-bold">{fabric ? 'Edit Fabric' : 'Create New Fabric'}</h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm px-2 py-1 rounded-full ${
                isDarkMode 
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                {formData.items.length} Item{formData.items.length !== 1 ? 's' : ''}
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

        {/* Message */}
        {message && (
          <div className={`p-4 mx-6 mt-4 rounded-lg border ${
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
                <ExclamationTriangleIcon className="h-5 w-5" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="p-6 space-y-8 pb-24">
            {/* Fabric Items */}
                          <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Fabric Items</h3>
                </div>

                              <div className="space-y-6">
                  {formData.items.map((item, index) => (
                    <div 
                      key={index} 
                      data-item-index={index}
                      className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                        isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium">Item {index + 1}</h4>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                            isDarkMode 
                              ? 'text-red-400 hover:bg-red-500/20' 
                              : 'text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                             {/* Quality Code */}
                       <div>
                         <label className="block text-sm font-medium mb-2">
                           Quality Code <span className="text-red-500">*</span>
                         </label>
                         <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                           Each fabric item must have a unique quality code
                         </p>
                        <input
                          type="text"
                          value={item.qualityCode}
                          onChange={(e) => handleItemChange(index, 'qualityCode', e.target.value)}
                          placeholder="e.g., 1001 - WL"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } ${errors[`items.${index}.qualityCode`] ? 
                            isDarkMode 
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
                              : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : ''}`}
                        />
                        {errors[`items.${index}.qualityCode`] && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            {errors[`items.${index}.qualityCode`]}
                          </p>
                        )}
                      </div>

                      {/* Quality Name */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Quality Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.qualityName}
                          onChange={(e) => handleItemChange(index, 'qualityName', e.target.value)}
                          placeholder="Enter quality name"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } ${errors[`items.${index}.qualityName`] ? 
                            isDarkMode 
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
                              : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : ''}`}
                        />
                        {errors[`items.${index}.qualityName`] && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            {errors[`items.${index}.qualityName`]}
                          </p>
                        )}
                      </div>

                      {/* Weaver */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Weaver <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.weaver}
                          onChange={(e) => handleItemChange(index, 'weaver', e.target.value)}
                          placeholder="Enter weaver name"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } ${errors[`items.${index}.weaver`] ? 
                            isDarkMode 
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
                              : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : ''}`}
                        />
                        {errors[`items.${index}.weaver`] && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            {errors[`items.${index}.weaver`]}
                          </p>
                        )}
                      </div>

                      {/* Weaver Quality Name */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Weaver Quality Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.weaverQualityName}
                          onChange={(e) => handleItemChange(index, 'weaverQualityName', e.target.value)}
                          placeholder="Enter weaver quality name"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } ${errors[`items.${index}.weaverQualityName`] ? 
                            isDarkMode 
                              ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
                              : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : ''}`}
                        />
                        {errors[`items.${index}.weaverQualityName`] && (
                          <p className="text-red-500 text-sm mt-2 flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            {errors[`items.${index}.weaverQualityName`]}
                          </p>
                        )}
                      </div>

                      {/* Greigh Width */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Greigh Width (inches)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.greighWidth}
                          onChange={(e) => handleItemChange(index, 'greighWidth', e.target.value)}
                          placeholder="e.g., 58.5"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>

                      {/* Finish Width */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Finish Width (inches)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.finishWidth}
                          onChange={(e) => handleItemChange(index, 'finishWidth', e.target.value)}
                          placeholder="e.g., 56.0"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>

                      {/* Weight */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Weight (KG)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.weight}
                          onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                          placeholder="e.g., 8.0"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>

                      {/* GSM */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          GSM
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={item.gsm}
                          onChange={(e) => handleItemChange(index, 'gsm', e.target.value)}
                          placeholder="e.g., 72.5"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>

                      {/* Danier */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Danier
                        </label>
                        <input
                          type="text"
                          value={item.danier}
                          onChange={(e) => handleItemChange(index, 'danier', e.target.value)}
                          placeholder="e.g., 55*22D"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>

                      {/* Reed */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Reed
                        </label>
                        <input
                          type="number"
                          value={item.reed}
                          onChange={(e) => handleItemChange(index, 'reed', e.target.value)}
                          placeholder="e.g., 120"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>

                      {/* Pick */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Pick
                        </label>
                        <input
                          type="number"
                          value={item.pick}
                          onChange={(e) => handleItemChange(index, 'pick', e.target.value)}
                          placeholder="e.g., 80"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>

                      {/* Greigh Rate */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Greigh Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.greighRate}
                          onChange={(e) => handleItemChange(index, 'greighRate', e.target.value)}
                          placeholder="e.g., 150.00"
                          className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

                  {/* Add Item Button */}
          <div className={`p-6 border-t ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addItem}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                }`}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Another Item
              </button>
            </div>
          </div>

          {/* Sticky Submit Button */}
          <div className={`sticky bottom-0 left-0 right-0 p-6 border-t shadow-lg ${
            isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex space-x-4">
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
                  className={`px-10 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-lg text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 shadow-lg text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-5 w-5" />
                      <span>{fabric ? 'Update Fabric' : 'Create Fabric'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

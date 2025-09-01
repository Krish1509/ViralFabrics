'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  PlusIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Order, Mill } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';

interface MillItem {
  id: string;
  millDate: string;
  chalanNo: string;
  greighMtr: string;
  pcs: string;
  additionalMeters: { meters: string; pieces: string }[];
}

interface MillInputFormData {
  orderId: string;
  mill: string;
  millItems: MillItem[];
}

interface MillInputFormProps {
  order: Order | null;
  mills: Mill[];
  onClose: () => void;
  onSuccess: () => void;
  onAddMill: () => void;
  onRefreshMills: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

export default function MillInputForm({
  order,
  mills,
  onClose,
  onSuccess,
  onAddMill,
  onRefreshMills
}: MillInputFormProps) {
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState<MillInputFormData>({
    orderId: order?.orderId || '',
    mill: '',
    millItems: [{
      id: '1',
      millDate: '',
      chalanNo: '',
      greighMtr: '',
      pcs: '',
      additionalMeters: []
    }],
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [showAddMillModal, setShowAddMillModal] = useState(false);
  const [addMillForm, setAddMillForm] = useState({
    name: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    email: ''
  });

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        orderId: order.orderId,
        mill: '',
        millItems: [{
          id: '1',
          millDate: '',
          chalanNo: '',
          greighMtr: '',
          pcs: '',
          additionalMeters: []
        }],
      });
      setErrors({});
      setSaving(false);
      setShowAddMillModal(false);
      setAddMillForm({
        name: '',
        contactPerson: '',
        contactPhone: '',
        address: '',
        email: ''
      });
    }
  }, [order?.orderId]);

  // Form handlers
  const addMillItem = () => {
    const newId = (formData.millItems.length + 1).toString();
    setFormData({
      ...formData,
      millItems: [
        ...formData.millItems,
        {
          id: newId,
          millDate: '',
          chalanNo: '',
          greighMtr: '',
          pcs: '',
          additionalMeters: []
        }
      ]
    });
  };

  const removeMillItem = (itemId: string) => {
    if (formData.millItems.length > 1) {
      setFormData({
        ...formData,
        millItems: formData.millItems.filter(item => item.id !== itemId)
      });
    }
  };

  const updateMillItem = (itemId: string, field: keyof MillItem, value: string) => {
    setFormData({
      ...formData,
      millItems: formData.millItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    });
  };

  const addAdditionalMeters = (itemId: string) => {
    setFormData({
      ...formData,
      millItems: formData.millItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              additionalMeters: [...item.additionalMeters, { meters: '', pieces: '' }]
            }
          : item
      )
    });
  };

  const removeAdditionalMeters = (itemId: string, index: number) => {
    setFormData({
      ...formData,
      millItems: formData.millItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              additionalMeters: item.additionalMeters.filter((_, i) => i !== index)
            }
          : item
      )
    });
  };

  const updateAdditionalMeters = (itemId: string, index: number, field: 'meters' | 'pieces', value: string) => {
    setFormData({
      ...formData,
      millItems: formData.millItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              additionalMeters: item.additionalMeters.map((additional, i) =>
                i === index ? { ...additional, [field]: value } : additional
              )
            }
          : item
      )
    });
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};

    if (!formData.mill) {
      newErrors.mill = 'Please select a mill';
    }

    formData.millItems.forEach((item, itemIndex) => {
      if (!item.millDate) {
        newErrors[`millDate_${item.id}`] = 'Mill date is required';
      }
      if (!item.chalanNo) {
        newErrors[`chalanNo_${item.id}`] = 'Chalan number is required';
      }
      if (!item.greighMtr) {
        newErrors[`greighMtr_${item.id}`] = 'Greigh meters is required';
      }
      if (!item.pcs) {
        newErrors[`pcs_${item.id}`] = 'Number of pieces is required';
      }

      item.additionalMeters.forEach((additional, additionalIndex) => {
        if (!additional.meters) {
          newErrors[`additionalMeters_${item.id}_${additionalIndex}_meters`] = 'Additional meters is required';
        }
        if (!additional.pieces) {
          newErrors[`additionalMeters_${item.id}_${additionalIndex}_pieces`] = 'Additional pieces is required';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Transform the form data to match backend expectations
      const allMillInputPromises: Promise<any>[] = [];

      formData.millItems.forEach((item) => {
        // Main mill input
        const millInputData = {
          orderId: formData.orderId,
          mill: formData.mill,
          millDate: item.millDate,
          chalanNo: item.chalanNo,
          greighMtr: item.greighMtr,
          pcs: item.pcs,
        };

        allMillInputPromises.push(
          fetch('/api/mill-inputs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(millInputData)
          }).then(response => response.json())
        );

        // Additional meters inputs
        item.additionalMeters.forEach((additional) => {
          const additionalMillInputData = {
            orderId: formData.orderId,
            mill: formData.mill,
            millDate: item.millDate,
            chalanNo: item.chalanNo,
            greighMtr: additional.meters,
            pcs: additional.pieces,
          };

          allMillInputPromises.push(
            fetch('/api/mill-inputs', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(additionalMillInputData)
            }).then(response => response.json())
          );
        });
      });

      // Wait for all mill inputs to be created
      const results = await Promise.all(allMillInputPromises);
      
      // Check if all were successful
      const allSuccessful = results.every((result: any) => result.success);
      
      if (allSuccessful) {
        onSuccess();
        onClose();
      } else {
        const errorMessages = results
          .filter((result: any) => !result.success)
          .map((result: any) => result.message)
          .join(', ');
        setErrors({ submit: `Failed to create some mill inputs: ${errorMessages}` });
      }
    } catch (error) {
      console.error('Error creating mill input:', error);
      setErrors({ submit: 'Failed to create mill input' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddMill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addMillForm.name.trim()) {
      setErrors({ addMill: 'Mill name is required' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addMillForm)
      });

      const data = await response.json();
      if (data.success) {
        onAddMill();
        onRefreshMills();
        setShowAddMillModal(false);
        setAddMillForm({
          name: '',
          contactPerson: '',
          contactPhone: '',
          address: '',
          email: ''
        });
        setErrors({});
      } else {
        setErrors({ addMill: data.message || 'Failed to add mill' });
      }
    } catch (error) {
      console.error('Error adding mill:', error);
      setErrors({ addMill: 'Failed to add mill' });
    }
  };

  if (!order) return null;

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
           <div className="flex items-center space-x-3">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
                <h2 className="text-2xl font-bold">Add Mill Input</h2>
             </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-2 py-1 rounded-full ${
                  isDarkMode 
                    ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {formData.millItems.length} Item{formData.millItems.length !== 1 ? 's' : ''}
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

              {/* Mill Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                  <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                    Mill Name <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.mill}
                    onChange={(e) => setFormData({ ...formData, mill: e.target.value })}
                      className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.mill
                        ? isDarkMode
                            ? 'border-red-500 bg-gray-800 text-white'
                            : 'border-red-500 bg-white text-gray-900'
                        : isDarkMode
                            ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select Mill</option>
                    {mills.map((mill) => (
                      <option key={mill._id} value={mill._id}>
                        {mill.name}
                      </option>
                    ))}
                    <option value="add_new">➕ Add New Mill</option>
                  </select>
                  {formData.mill === 'add_new' && (
                    <button
                      type="button"
                      onClick={() => setShowAddMillModal(true)}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isDarkMode
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      Add Mill
                    </button>
                  )}
                </div>
                {errors.mill && (
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {errors.mill}
                  </p>
                )}
                </div>
              </div>

              {/* Mill Items */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Mill Items</h3>
                </div>

                <div className="space-y-6">
                {formData.millItems.map((item, itemIndex) => (
                    <div key={item.id} className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      {/* Mill Date */}
                      <div>
                          <label className={`block text-sm font-medium mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Mill Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="date"
                            value={item.millDate}
                            onChange={(e) => updateMillItem(item.id, 'millDate', e.target.value)}
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`millDate_${item.id}`]
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
                        {errors[`millDate_${item.id}`] && (
                          <p className={`text-sm mt-1 ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {errors[`millDate_${item.id}`]}
                          </p>
                        )}
                      </div>

                      {/* Chalan Number */}
                      <div>
                          <label className={`block text-sm font-medium mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Chalan Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.chalanNo}
                          onChange={(e) => updateMillItem(item.id, 'chalanNo', e.target.value)}
                          placeholder="Enter chalan number"
                            className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors[`chalanNo_${item.id}`]
                              ? isDarkMode
                                  ? 'border-red-500 bg-gray-800 text-white'
                                  : 'border-red-500 bg-white text-gray-900'
                              : isDarkMode
                                  ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                                  : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                          }`}
                        />
                        {errors[`chalanNo_${item.id}`] && (
                          <p className={`text-sm mt-1 ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {errors[`chalanNo_${item.id}`]}
                          </p>
                        )}
                      </div>

                      {/* Greigh Meters */}
                      <div>
                          <label className={`block text-sm font-medium mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Greigh Meters <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={item.greighMtr}
                            onChange={(e) => updateMillItem(item.id, 'greighMtr', e.target.value)}
                            placeholder="Enter meters"
                            min="0"
                            step="0.01"
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`greighMtr_${item.id}`]
                                ? isDarkMode
                                    ? 'border-red-500 bg-gray-800 text-white'
                                    : 'border-red-500 bg-white text-gray-900'
                                : isDarkMode
                                    ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                            }`}
                          />
                          <BeakerIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        {errors[`greighMtr_${item.id}`] && (
                          <p className={`text-sm mt-1 ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {errors[`greighMtr_${item.id}`]}
                          </p>
                        )}
                      </div>

                      {/* Number of Pieces */}
                      <div>
                          <label className={`block text-sm font-medium mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Number of Pieces <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={item.pcs}
                            onChange={(e) => updateMillItem(item.id, 'pcs', e.target.value)}
                            placeholder="Enter pieces"
                            min="0"
                              className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              errors[`pcs_${item.id}`]
                                ? isDarkMode
                                    ? 'border-red-500 bg-gray-800 text-white'
                                    : 'border-red-500 bg-white text-gray-900'
                                : isDarkMode
                                    ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500'
                                    : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                            }`}
                          />
                          <PlusIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        {errors[`pcs_${item.id}`] && (
                          <p className={`text-sm mt-1 ${
                            isDarkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {errors[`pcs_${item.id}`]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Additional Meters */}
                                         {item.additionalMeters.length > 0 && (
                        <div className={`mt-6 p-4 rounded-xl border ${
                          isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-200'
                       }`}>
                         <h6 className={`text-sm font-semibold mb-4 flex items-center ${
                           isDarkMode ? 'text-gray-300' : 'text-gray-700'
                         }`}>
                           <PlusIcon className="h-4 w-4 mr-2" />
                           Additional Meters & Pieces
                         </h6>
                        <div className="space-y-4">
                          {item.additionalMeters.map((additional, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Greigh Meters M{index + 1} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={additional.meters}
                                    onChange={(e) => updateAdditionalMeters(item.id, index, 'meters', e.target.value)}
                                    placeholder="Enter meters"
                                    min="0"
                                    step="0.01"
                                      className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                      isDarkMode 
                                          ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' 
                                          : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                                    }`}
                                  />
                                  <BeakerIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                </div>
                              </div>
                                <div>
                                <label className={`block text-sm font-medium mb-2 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                    Number of Pieces P{index + 1} <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    value={additional.pieces}
                                    onChange={(e) => updateAdditionalMeters(item.id, index, 'pieces', e.target.value)}
                                    placeholder="Enter pieces"
                                    min="0"
                                      className={`w-full px-4 py-3 pl-12 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                      isDarkMode
                                          ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' 
                                          : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
                                    }`}
                                  />
                                  <PlusIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                </div>
                              </div>
                                <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => removeAdditionalMeters(item.id, index)}
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
                    )}

                    {/* Add More Additional Meters Button */}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => addAdditionalMeters(item.id)}
                          className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                          isDarkMode 
                              ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500 text-gray-300' 
                              : 'bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-700'
                        }`}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add More Meters & Pieces
                      </button>
            </div>

                      {/* Remove Item Button */}
                      {formData.millItems.length > 1 && (
                        <div className="mt-4 flex justify-end">
              <button
                type="button"
                            onClick={() => removeMillItem(item.id)}
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
                  }`} onClick={addMillItem}>
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
                          Add New Mill Item
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
                {saving ? 'Saving...' : 'Add Mill Input'}
              </button>
            </div>
        </div>

        {/* Add Mill Modal */}
        {showAddMillModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              {/* Modal Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                  isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Add New Mill
                </h3>
                <button
                  onClick={() => setShowAddMillModal(false)}
                  className={`p-2 rounded-full transition-colors ${
                    isDarkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleAddMill} className="p-6 space-y-4">
                {errors.addMill && (
                  <div className={`p-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-red-900/20 border-red-500/30 text-red-400'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {errors.addMill}
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                      Mill Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addMillForm.name}
                    onChange={(e) => setAddMillForm({ ...addMillForm, name: e.target.value })}
                    required
                    placeholder="Enter mill name"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={addMillForm.contactPerson}
                    onChange={(e) => setAddMillForm({ ...addMillForm, contactPerson: e.target.value })}
                    placeholder="Enter contact person name"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={addMillForm.contactPhone}
                    onChange={(e) => setAddMillForm({ ...addMillForm, contactPhone: e.target.value })}
                    placeholder="Enter contact phone"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Address
                  </label>
                  <textarea
                    value={addMillForm.address}
                    onChange={(e) => setAddMillForm({ ...addMillForm, address: e.target.value })}
                    rows={2}
                    placeholder="Enter mill address"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={addMillForm.email}
                    onChange={(e) => setAddMillForm({ ...addMillForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMillModal(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isDarkMode
                          ? 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isDarkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Add Mill
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Calendar, Search, Plus, Edit, Trash2, XCircle } from 'lucide-react';
import { Order, Party, Quality, OrderFormData } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';
import QualityModal from './QualityModal';

interface OrderFormProps {
  order?: Order | null;
  parties: Party[];
  qualities: Quality[];
  onClose: () => void;
  onSuccess: () => void;
  onAddParty: () => void;
  onRefreshParties: () => void;
  onAddQuality: (newQualityData?: any) => void;
}

export default function OrderForm({ order, parties, qualities, onClose, onSuccess, onAddParty, onRefreshParties, onAddQuality }: OrderFormProps) {
  const { isDarkMode } = useDarkMode();
  const [formData, setFormData] = useState<OrderFormData>({
    orderType: 'Dying',
    arrivalDate: '',
    party: '',
    contactName: '',
    contactPhone: '',
    poNumber: '',
    styleNo: '',
    poDate: '',
    deliveryDate: '',
    quality: '',
    quantity: 0,
    imageUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [qualitySearch, setQualitySearch] = useState('');
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.quality-dropdown') && !target.closest('.party-dropdown')) {
        setShowQualityDropdown(false);
        setShowPartyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (order) {
      setFormData({
        orderType: order.orderType,
        arrivalDate: order.arrivalDate ? new Date(order.arrivalDate).toISOString().split('T')[0] : '',
        party: typeof order.party === 'string' ? order.party : order.party._id,
        contactName: order.contactName || '',
        contactPhone: order.contactPhone || '',
        poNumber: order.poNumber || '',
        styleNo: order.styleNo || '',
        poDate: order.poDate ? new Date(order.poDate).toISOString().split('T')[0] : '',
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
        quality: typeof order.quality === 'string' ? order.quality : order.quality?._id || '',
        quantity: order.quantity || 0,
        imageUrl: order.imageUrl || ''
      });
      
      // Set search values for dropdowns
      if (typeof order.quality !== 'string' && order.quality) {
        setQualitySearch(order.quality.name);
      }
    }
  }, [order]);

  const filteredParties = parties.filter(party =>
    party.name.toLowerCase().includes(partySearch.toLowerCase())
  );

  const filteredQualities = qualitySearch.trim() 
    ? qualities.filter(quality =>
        quality.name.toLowerCase().includes(qualitySearch.toLowerCase())
      )
    : qualities;





  const selectedQuality = qualities.find(quality => quality._id === formData.quality);

  const handleInputChange = (field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUploading(true);
      
      // Show preview immediately
      setFormData(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
      
      // Upload to Cloudinary
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setErrors({ submit: 'Authentication token not found. Please login again.' });
          return;
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Update form with the Cloudinary URL
          setFormData(prev => ({ ...prev, imageUrl: data.data.url }));
        } else {
          setErrors({ submit: data.message || 'Failed to upload image' });
        }
      } catch (error) {
        setErrors({ submit: 'An error occurred while uploading the image' });
      } finally {
        setImageUploading(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.orderType) newErrors.orderType = 'Order type is required';
    if (!formData.arrivalDate) newErrors.arrivalDate = 'Arrival date is required';
    if (!formData.party) newErrors.party = 'Party is required';

    if (formData.quantity && formData.quantity < 0) {
      newErrors.quantity = 'Quantity must be non-negative';
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

      const url = order ? `/api/orders/${order._id}` : '/api/orders';
      const method = order ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
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
        setErrors({ submit: data.message || 'Failed to save order' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while saving the order' });
    } finally {
      setLoading(false);
    }
  };

  // Delete party function
  const handleDeleteParty = async (partyId: string, partyName: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrors({ submit: 'Authentication token not found. Please login again.' });
        return;
      }

      const response = await fetch(`/api/parties/${partyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

             if (response.ok) {
         // Remove from local state and refresh
         onRefreshParties(); // This will trigger a refresh
         // Clear selection if this party was selected
         if (formData.party === partyId) {
           handleInputChange('party', '');
           setPartySearch('');
         }
       } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Failed to delete party' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while deleting the party' });
    }
  };

  // Delete quality function
  const handleDeleteQuality = async (qualityId: string, qualityName: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setErrors({ submit: 'Authentication token not found. Please login again.' });
        return;
      }

      const response = await fetch(`/api/qualities/${qualityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from local state and refresh
        onAddQuality(); // This will trigger a refresh
        // Clear selection if this quality was selected
        if (formData.quality === qualityId) {
          handleInputChange('quality', '');
          setQualitySearch('');
        }
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Failed to delete quality' });
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred while deleting the quality' });
    }
  };

  const selectedParty = parties.find(p => p._id === formData.party);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b transition-colors duration-300 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {order ? 'Edit Order' : 'Create New Order'}
          </h2>
          <button
            onClick={onClose}
            className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
                             {/* Order Type */}
               <div>
                 <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                   Order Type *
                 </label>
                 <select
                   value={formData.orderType}
                   onChange={(e) => handleInputChange('orderType', e.target.value)}
                   className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                     errors.orderType ? 'border-red-500' : isDarkMode ? 'border-slate-600 bg-slate-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                   }`}
                 >
                   <option value="Dying">Dying</option>
                   <option value="Printing">Printing</option>
                 </select>
                 {errors.orderType && (
                   <p className="mt-1 text-sm text-red-600">{errors.orderType}</p>
                 )}
               </div>

                             {/* Party Selection */}
               <div className="relative party-dropdown">
                 <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                   Party *
                 </label>
                 <div className="relative">
                   <input
                     type="text"
                     placeholder="Search parties..."
                     value={partySearch}
                     onChange={(e) => {
                       setPartySearch(e.target.value);
                       setShowPartyDropdown(true);
                     }}
                     onFocus={() => setShowPartyDropdown(true)}
                     className={`w-full border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                       errors.party ? 'border-red-500' : isDarkMode ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                     }`}
                   />
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                 </div>
                
                                 {showPartyDropdown && (
                   <div className={`party-dropdown absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-auto transition-colors duration-300 ${
                     isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                   }`}>
                     <div className="p-2">
                       <button
                         type="button"
                         onClick={onAddParty}
                         className={`w-full text-left px-3 py-2 text-sm rounded flex items-center transition-colors duration-300 ${
                           isDarkMode ? 'text-blue-400 hover:bg-slate-600' : 'text-blue-600 hover:bg-blue-50'
                         }`}
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Add New Party
                       </button>
                     </div>
                                           {filteredParties.map((party) => (
                        <div
                          key={party._id}
                          className={`flex items-center justify-between px-3 py-2 text-sm border-t transition-colors duration-300 ${
                            isDarkMode ? 'hover:bg-slate-600 border-slate-600' : 'hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('party', party._id);
                              setPartySearch(''); // Clear search field after selection
                              setShowPartyDropdown(false);
                            }}
                            className="flex-1 text-left"
                          >
                            <div className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{party.name}</div>
                            {party.contactName && (
                              <div className={`text-xs transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{party.contactName}</div>
                            )}
                          </button>
                                                     <div className="flex items-center space-x-1 ml-2">
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteParty(party._id, party.name);
                               }}
                               className={`p-1 rounded transition-colors duration-300 ${
                                 isDarkMode ? 'text-red-400 hover:bg-slate-500' : 'text-red-600 hover:bg-red-100'
                               }`}
                               title="Delete party"
                             >
                               <Trash2 className="h-3 w-3" />
                             </button>
                           </div>
                        </div>
                      ))}
                   </div>
                 )}
                
                                 {selectedParty && (
                   <div className={`mt-2 p-2 rounded text-sm transition-colors duration-300 ${
                     isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                   }`}>
                     <div className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedParty.name}</div>
                     {selectedParty.contactName && (
                       <div className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedParty.contactName}</div>
                     )}
                   </div>
                 )}
                
                {errors.party && (
                  <p className="mt-1 text-sm text-red-600">{errors.party}</p>
                )}
              </div>

              {/* Arrival Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arrival Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                    className={`w-full border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.arrivalDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.arrivalDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.arrivalDate}</p>
                )}
              </div>

              {/* PO Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Number
                </label>
                <input
                  type="text"
                  value={formData.poNumber}
                  onChange={(e) => handleInputChange('poNumber', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter PO number"
                />
              </div>

              {/* Style Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Style Number
                </label>
                <input
                  type="text"
                  value={formData.styleNo}
                  onChange={(e) => handleInputChange('styleNo', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter style number"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact name"
                />
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact phone"
                />
              </div>

              {/* PO Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PO Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.poDate}
                    onChange={(e) => handleInputChange('poDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter quantity"
                  min="0"
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>

                             {/* Quality */}
               <div className="relative quality-dropdown">
                 <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                   Quality
                 </label>
                 <div className="relative">
                   <input
                     type="text"
                     placeholder="Search qualities..."
                     value={qualitySearch}
                     onChange={(e) => {
                       setQualitySearch(e.target.value);
                       setShowQualityDropdown(true);
                     }}
                     onFocus={() => setShowQualityDropdown(true)}
                     className={`w-full border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                       errors.quality ? 'border-red-500' : isDarkMode ? 'border-slate-600 bg-slate-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                     }`}
                   />
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                 </div>
                 
                 {showQualityDropdown && (
                   <div className={`quality-dropdown absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-auto transition-colors duration-300 ${
                     isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                   }`}>
                     <div className="p-2">
                       <button
                         type="button"
                         onClick={() => {
                           setShowQualityDropdown(false);
                           setShowQualityModal(true);
                         }}
                         className={`w-full text-left px-3 py-2 text-sm rounded flex items-center transition-colors duration-300 ${
                           isDarkMode ? 'text-green-400 hover:bg-slate-600' : 'text-green-600 hover:bg-green-50'
                         }`}
                       >
                         <Plus className="h-4 w-4 mr-2" />
                         Add New Quality
                       </button>
                     </div>
                                           {filteredQualities.map((quality) => (
                        <div
                          key={quality._id}
                          className={`flex items-center justify-between px-3 py-2 text-sm border-t transition-colors duration-300 ${
                            isDarkMode ? 'hover:bg-slate-600 border-slate-600' : 'hover:bg-gray-100 border-gray-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('quality', quality._id);
                              setQualitySearch(''); // Clear search field after selection
                              setShowQualityDropdown(false);
                            }}
                            className="flex-1 text-left"
                          >
                            <div className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{quality.name}</div>
                          </button>
                                                     <div className="flex items-center space-x-1 ml-2">
                             <button
                               type="button"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDeleteQuality(quality._id, quality.name);
                               }}
                               className={`p-1 rounded transition-colors duration-300 ${
                                 isDarkMode ? 'text-red-400 hover:bg-slate-500' : 'text-red-600 hover:bg-red-100'
                               }`}
                               title="Delete quality"
                             >
                               <Trash2 className="h-3 w-3" />
                             </button>
                           </div>
                        </div>
                      ))}
                     {filteredQualities.length === 0 && (
                       <div className={`px-3 py-2 text-sm text-center transition-colors duration-300 ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-500'
                       }`}>
                         {qualitySearch.trim() ? 'No qualities found' : 'No qualities available'}
                       </div>
                     )}
                   </div>
                 )}
                 
                 {selectedQuality && (
                   <div className={`mt-2 p-2 rounded text-sm transition-colors duration-300 ${
                     isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                   }`}>
                     <div className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedQuality.name}</div>
                   </div>
                 )}
                 
                 {errors.quality && (
                   <p className="mt-1 text-sm text-red-600">{errors.quality}</p>
                 )}
               </div>

                             {/* Image Upload */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Image
                 </label>
                 <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                   <input
                     type="file"
                     accept="image/*"
                     onChange={handleFileChange}
                     className="hidden"
                     id="image-upload"
                     disabled={imageUploading}
                   />
                   <label htmlFor="image-upload" className={`cursor-pointer ${imageUploading ? 'opacity-50' : ''}`}>
                     {imageUploading ? (
                       <div className="mx-auto h-12 w-12 text-blue-500 animate-spin">
                         <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                       </div>
                     ) : (
                       <Upload className="mx-auto h-12 w-12 text-gray-400" />
                     )}
                     <p className="mt-2 text-sm text-gray-600">
                       {imageUploading ? 'Uploading...' : 'Click to upload an image'}
                     </p>
                     <p className="mt-1 text-xs text-gray-500">
                       Max size: 5MB, Supported: JPG, PNG, GIF
                     </p>
                   </label>
                 </div>
                 {formData.imageUrl && (
                   <div className="mt-2 relative">
                     <img
                       src={formData.imageUrl}
                       alt="Preview"
                       className="w-32 h-32 object-cover rounded border"
                     />
                     <button
                       type="button"
                       onClick={() => {
                         setFormData(prev => ({ ...prev, imageUrl: '' }));
                         setSelectedFile(null);
                       }}
                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                       title="Remove image"
                     >
                       <XCircle className="h-4 w-4" />
                     </button>
                     {imageUploading && (
                       <div className="mt-2 text-xs text-blue-600">
                         Uploading to cloud...
                       </div>
                     )}
                   </div>
                 )}
               </div>
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
              {loading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
            </button>
          </div>
        </form>
      </div>

             {/* Quality Modal */}
       {showQualityModal && (
         <QualityModal
           onClose={() => setShowQualityModal(false)}
                        onSuccess={(newQualityName?: string, newQualityData?: any) => {
               setShowQualityModal(false);
               // Immediately add the new quality to the local state
               if (newQualityData) {
                 // Update the qualities prop by calling onAddQuality with the new data
                 onAddQuality(newQualityData);
                 // Clear the search field after creating new quality
                 setQualitySearch('');
                 // Select the new quality
                 handleInputChange('quality', newQualityData._id);
                 // Close the dropdown after selection
                 setShowQualityDropdown(false);
               }
             }}
         />
       )}
    </div>
  );
}

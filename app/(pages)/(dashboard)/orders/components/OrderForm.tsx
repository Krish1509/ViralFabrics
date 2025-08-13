'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Calendar, Search, Plus, Edit, Trash2, XCircle, ChevronDown } from 'lucide-react';
import { Order, Party, Quality, OrderFormData, OrderItem } from '@/types';
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
    items: [{
      quality: '',
      quantity: 0,
      imageUrl: '',
      description: ''
    }]
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [qualitySearch, setQualitySearch] = useState('');
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [activeQualityDropdown, setActiveQualityDropdown] = useState<number | null>(null);
  const [selectedPartyName, setSelectedPartyName] = useState('');
  const [showQualityModal, setShowQualityModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.party-dropdown')) {
        setShowPartyDropdown(false);
      }
      if (!target.closest('.quality-dropdown')) {
        setShowQualityDropdown(false);
        setActiveQualityDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (order) {
      const partyId = typeof order.party === 'string' ? order.party : order.party._id;
      const partyName = typeof order.party === 'string' ? '' : order.party.name || '';
      
      setFormData({
        orderType: order.orderType,
        arrivalDate: order.arrivalDate ? new Date(order.arrivalDate).toISOString().split('T')[0] : '',
        party: partyId,
        contactName: order.contactName || '',
        contactPhone: order.contactPhone || '',
        poNumber: order.poNumber || '',
        styleNo: order.styleNo || '',
        poDate: order.poDate ? new Date(order.poDate).toISOString().split('T')[0] : '',
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
        items: order.items.length > 0 ? order.items.map(item => ({
          quality: typeof item.quality === 'string' ? item.quality : item.quality?._id || '',
          quantity: item.quantity || 0,
          imageUrl: item.imageUrl || '',
          description: item.description || ''
        })) : [{
          quality: '',
          quantity: 0,
          imageUrl: '',
          description: ''
        }]
      });
      
      setSelectedPartyName(partyName);
    }
  }, [order]);

  const filteredParties = parties.filter(party =>
    party.name.toLowerCase().includes(partySearch.toLowerCase())
  );

  const filteredQualities = qualities.filter(quality =>
    quality.name.toLowerCase().includes(qualitySearch.toLowerCase())
  );

  const handleInputChange = (field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        quality: '',
        quantity: 0,
        imageUrl: '',
        description: ''
      }]
    }));
  };

  const removeOrderItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageUpload = async (file: File, itemIndex: number) => {
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        handleItemChange(itemIndex, 'imageUrl', data.imageUrl);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors(prev => ({ ...prev, image: 'Failed to upload image' }));
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const url = order ? `/api/orders/${order._id}` : '/api/orders';
      const method = order ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setErrors(data.errors || { message: data.message });
      }
    } catch (error) {
      setErrors({ message: 'An error occurred while saving the order' });
    } finally {
      setLoading(false);
    }
  };

  const selectedParty = parties.find(p => p._id === formData.party);
  
  // Get the selected quality name for display
  const getSelectedQualityName = (qualityId: string | Quality) => {
    if (typeof qualityId === 'string') {
      const quality = qualities.find(q => q._id === qualityId);
      return quality ? quality.name : '';
    } else {
      return qualityId.name || '';
    }
  };

  // Toggle party dropdown
  const togglePartyDropdown = () => {
    const newState = !showPartyDropdown;
    setShowPartyDropdown(newState);
    if (newState) {
      setPartySearch('');
    }
  };

  // Toggle quality dropdown
  const toggleQualityDropdown = (index: number) => {
    if (activeQualityDropdown === index && showQualityDropdown) {
      setShowQualityDropdown(false);
      setActiveQualityDropdown(null);
    } else {
      setShowQualityDropdown(true);
      setActiveQualityDropdown(index);
      setQualitySearch('');
    }
  };

  // Handle party selection
  const handlePartySelect = (party: Party) => {
    setFormData(prev => ({ ...prev, party: party._id }));
    setSelectedPartyName(party.name);
    setPartySearch('');
    setShowPartyDropdown(false);
  };

  // Handle quality selection
  const handleQualitySelect = (quality: Quality, index: number) => {
    handleItemChange(index, 'quality', quality._id);
    setQualitySearch('');
    setShowQualityDropdown(false);
    setActiveQualityDropdown(null);
  };

  // Clear party selection
  const clearPartySelection = () => {
    setFormData(prev => ({ ...prev, party: '' }));
    setSelectedPartyName('');
    setPartySearch('');
  };

  // Clear quality selection
  const clearQualitySelection = (index: number) => {
    handleItemChange(index, 'quality', '');
    setQualitySearch('');
  };

  // Check if party is in use
  const isPartyInUse = (partyId: string) => {
    return formData.party === partyId;
  };

  // Check if quality is in use
  const isQualityInUse = (qualityId: string) => {
    return formData.items.some(item => item.quality === qualityId);
  };

  // Handle delete party
  const handleDeleteParty = async (partyId: string, partyName: string) => {
    if (isPartyInUse(partyId)) {
      alert(`Cannot delete "${partyName}" because it's currently selected in this order.`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/parties/${partyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onRefreshParties();
        alert(`Party "${partyName}" deleted successfully!`);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete party');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete party. Please try again.');
    }
  };

  // Handle delete quality
  const handleDeleteQuality = async (qualityId: string, qualityName: string) => {
    if (isQualityInUse(qualityId)) {
      alert(`Cannot delete "${qualityName}" because it's currently selected in one or more order items.`);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/qualities/${qualityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onAddQuality(); // This will refresh qualities
        alert(`Quality "${qualityName}" deleted successfully!`);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete quality');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete quality. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto`}>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Order Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Order Type *
              </label>
              <select
                value={formData.orderType}
                onChange={(e) => handleInputChange('orderType', e.target.value)}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                }`}
              >
                <option value="Dying">Dying</option>
                <option value="Printing">Printing</option>
              </select>
            </div>

            {/* Arrival Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Arrival Date *
              </label>
              <input
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                }`}
              />
            </div>

                         {/* Party Selection */}
             <div className="relative party-dropdown">
               <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                 Party *
               </label>
               <div className="relative">
                                   <input
                    type="text"
                    value={formData.party ? selectedPartyName : partySearch}
                    onChange={(e) => setPartySearch(e.target.value)}
                    onClick={() => {
                      if (!showPartyDropdown) {
                        setShowPartyDropdown(true);
                        setPartySearch('');
                      }
                    }}
                    onFocus={() => {
                      if (!showPartyDropdown) {
                        setShowPartyDropdown(true);
                        setPartySearch('');
                      }
                    }}
                    placeholder={formData.party ? "Click to change party..." : "Search parties..."}
                    className={`block w-full px-3 py-2 pr-16 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer transition-all ${
                      isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                    } ${showPartyDropdown ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
                    readOnly={!!formData.party}
                  />
                                   <div className="absolute right-2 top-2 flex space-x-1">
                    {formData.party && (
                      <button
                        type="button"
                        onClick={clearPartySelection}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear selection"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onAddParty}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Add new party"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <ChevronDown 
                      className={`h-4 w-4 text-gray-400 transition-transform ${showPartyDropdown ? 'rotate-180' : ''}`} 
                    />
                  </div>
               </div>
               
               {showPartyDropdown && (
                 <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto ${
                   isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                 }`}>
                   {filteredParties.length > 0 ? (
                     filteredParties.map((party) => (
                                               <div
                          key={party._id}
                          className={`flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            isDarkMode ? 'text-gray-300 hover:bg-slate-600' : 'text-gray-900'
                          } ${formData.party === party._id ? 'bg-blue-50 text-blue-700' : ''}`}
                        >
                          <button
                            type="button"
                            onClick={() => handlePartySelect(party)}
                            className="flex-1 text-left"
                          >
                            {party.name}
                          </button>
                          {!isPartyInUse(party._id) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteParty(party._id, party.name);
                              }}
                              className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                              title="Delete party"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                     ))
                   ) : (
                     <div className="px-4 py-2 text-sm text-gray-500">
                       No parties found. Click + to add a new party.
                     </div>
                   )}
                 </div>
               )}
             </div>

            {/* Contact Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Contact Name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                }`}
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                }`}
              />
            </div>

            {/* PO Number */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                PO Number
              </label>
              <input
                type="text"
                value={formData.poNumber}
                onChange={(e) => handleInputChange('poNumber', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                }`}
              />
            </div>

            {/* Style Number */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Style Number
              </label>
              <input
                type="text"
                value={formData.styleNo}
                onChange={(e) => handleInputChange('styleNo', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                }`}
              />
            </div>

            {/* PO Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                PO Date
              </label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => handleInputChange('poDate', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                }`}
              />
            </div>

            {/* Delivery Date */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Delivery Date
              </label>
              <input
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Order Items Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Order Items
              </h3>
              <button
                type="button"
                onClick={addOrderItem}
                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <Plus className="h-4 w-4 mr-2" />
                + Order Item
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className={`border rounded-lg p-4 mb-4 ${isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Item {index + 1}
                  </h4>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Quality */}
                  <div className="relative quality-dropdown">
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Quality
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.quality ? getSelectedQualityName(item.quality) : qualitySearch}
                        onChange={(e) => setQualitySearch(e.target.value)}
                        onClick={() => {
                          if (!showQualityDropdown || activeQualityDropdown !== index) {
                            setShowQualityDropdown(true);
                            setActiveQualityDropdown(index);
                            setQualitySearch('');
                          }
                        }}
                        onFocus={() => {
                          if (!showQualityDropdown || activeQualityDropdown !== index) {
                            setShowQualityDropdown(true);
                            setActiveQualityDropdown(index);
                            setQualitySearch('');
                          }
                        }}
                        placeholder={item.quality ? "Click to change quality..." : "Search qualities..."}
                        className={`block w-full px-3 py-2 pr-16 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-pointer transition-all ${
                          isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                        } ${showQualityDropdown && activeQualityDropdown === index ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
                        readOnly={!!item.quality}
                      />
                      <div className="absolute right-2 top-2 flex space-x-1">
                        {item.quality && (
                          <button
                            type="button"
                            onClick={() => clearQualitySelection(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Clear selection"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowQualityModal(true)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Add new quality"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <ChevronDown 
                          className={`h-4 w-4 text-gray-400 transition-transform ${showQualityDropdown && activeQualityDropdown === index ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </div>
                    
                    {showQualityDropdown && activeQualityDropdown === index && (
                      <div className={`absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto ${
                        isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                      }`}>
                        {filteredQualities.length > 0 ? (
                          filteredQualities.map((quality) => (
                            <div
                              key={quality._id}
                              className={`flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                isDarkMode ? 'text-gray-300 hover:bg-slate-600' : 'text-gray-900'
                              } ${item.quality === quality._id ? 'bg-blue-50 text-blue-700' : ''}`}
                            >
                              <button
                                type="button"
                                onClick={() => handleQualitySelect(quality, index)}
                                className="flex-1 text-left"
                              >
                                {quality.name}
                              </button>
                              {!isQualityInUse(quality._id) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteQuality(quality._id, quality.name);
                                  }}
                                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                                  title="Delete quality"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No qualities found. Click + to add a new quality.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="0"
                      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                      }`}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                        isDarkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white'
                      }`}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Image
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file, index);
                          }
                        }}
                        className="hidden"
                        id={`image-upload-${index}`}
                      />
                      <label
                        htmlFor={`image-upload-${index}`}
                        className={`cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                          isDarkMode 
                            ? 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </label>
                      {item.imageUrl && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'imageUrl', '')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {item.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={item.imageUrl}
                          alt={`Item ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error Messages */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              {Object.entries(errors).map(([field, message]) => (
                <p key={field} className="text-red-600 text-sm">{message}</p>
              ))}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
            </button>
          </div>
        </form>

        {/* Quality Modal */}
        {showQualityModal && (
          <QualityModal
            onClose={() => setShowQualityModal(false)}
            onSuccess={(newQualityName, newQualityData) => {
              onAddQuality(newQualityData);
              setShowQualityModal(false);
            }}
          />
        )}


      </div>
    </div>
  );
}

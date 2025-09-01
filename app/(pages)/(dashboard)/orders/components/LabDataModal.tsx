'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Hash, CheckCircle, Trash2, Plus, Edit3, BeakerIcon } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { OrderItem } from '@/types';

interface LabData {
  color?: string;
  shade?: string;
  notes?: string;
  imageUrl?: string;
  labSendDate?: string;
  approvalDate?: string;
  sampleNumber?: string;
  labSendNumber?: string;
  status?: string;
  remarks?: string;
}

interface LabDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    orderId: string;
    orderType?: string;
    items: OrderItem[];
  };
  onLabDataUpdate: () => void;
}

export default function LabDataModal({ isOpen, onClose, order, onLabDataUpdate }: LabDataModalProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [labData, setLabData] = useState<LabData>({
    labSendDate: '',
    approvalDate: '',
    sampleNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [localItems, setLocalItems] = useState<OrderItem[]>([]);

  // Initialize local items when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalItems([...order.items]);
      setEditingItemId(null);
      setLabData({
        labSendDate: new Date().toISOString().split('T')[0], // Default to today
        approvalDate: '',
        sampleNumber: ''
      });
      setError('');
    }
  }, [isOpen, order.items]);

  // Load lab data when item is selected for editing
  const handleEditLabData = async (item: OrderItem) => {
    setEditingItemId(item._id || '');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/labs/${order._id}/${item._id || 'item_0'}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success && result.data.labData?.sampleNumber) {
        // Existing lab data found
        setLabData({
          labSendDate: result.data.labData?.labSendDate || new Date().toISOString().split('T')[0],
          approvalDate: result.data.labData?.approvalDate || '',
          sampleNumber: result.data.labData?.sampleNumber || ''
        });
      } else {
        // New lab data - initialize with today's date
        setLabData({
          labSendDate: new Date().toISOString().split('T')[0],
          approvalDate: '',
          sampleNumber: ''
        });
      }
    } catch (err) {
      console.error('Error loading lab data:', err);
      setError('Failed to load lab data. Please try again.');
      // Initialize with today's date even on error
      setLabData({
        labSendDate: new Date().toISOString().split('T')[0],
        approvalDate: '',
        sampleNumber: ''
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save lab data with immediate UI update
  const handleSave = async () => {
    if (!editingItemId) return;

    if (!labData.labSendDate || !labData.sampleNumber) {
      setError('Lab Send Date and Sample Number are required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/labs/${order._id}/${editingItemId || 'item_0'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labSendDate: labData.labSendDate,
          approvalDate: labData.approvalDate || null,
          sampleNumber: labData.sampleNumber
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Immediately update local state for better UX
        setLocalItems(prevItems => 
          prevItems.map(item => 
            item._id === editingItemId 
              ? {
                  ...item,
                  labData: {
                    labSendDate: labData.labSendDate,
                    approvalDate: labData.approvalDate,
                    sampleNumber: labData.sampleNumber,
                    color: '',
                    shade: '',
                    notes: '',
                    imageUrl: '',
                    labSendNumber: '',
                    status: 'sent',
                    remarks: ''
                  }
                }
              : item
          )
        );

        // Close editing mode
        setEditingItemId(null);
        setLabData({
          labSendDate: new Date().toISOString().split('T')[0],
          approvalDate: '',
          sampleNumber: ''
        });

        // Notify parent component
        onLabDataUpdate();
      } else {
        setError(result.message || 'Failed to save lab data');
      }
    } catch (err) {
      console.error('Error saving lab data:', err);
      setError('Failed to save lab data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete lab data with immediate UI update
  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this lab data?')) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/labs/${order._id}/${itemId || 'item_0'}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Immediately update local state
        setLocalItems(prevItems => 
          prevItems.map(item => 
            item._id === itemId 
              ? { ...item, labData: undefined }
              : item
          )
        );

        // Close editing if this was the item being edited
        if (editingItemId === itemId) {
          setEditingItemId(null);
          setLabData({
            labSendDate: new Date().toISOString().split('T')[0],
            approvalDate: '',
            sampleNumber: ''
          });
        }

        // Notify parent component
        onLabDataUpdate();
      } else {
        setError(result.message || 'Failed to delete lab data');
      }
    } catch (err) {
      console.error('Error deleting lab data:', err);
      setError('Failed to delete lab data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear date field
  const clearDate = (field: 'labSendDate' | 'approvalDate') => {
    setLabData(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setLabData({
      labSendDate: new Date().toISOString().split('T')[0],
      approvalDate: '',
      sampleNumber: ''
    });
    setError('');
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        isDarkMode 
          ? 'bg-[#1D293D] text-white border border-white/20' 
          : 'bg-white text-gray-900 border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-b border-white/20' 
            : 'bg-gradient-to-r from-blue-600 to-blue-700 border-b border-gray-200'
        } text-white rounded-t-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <BeakerIcon size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Lab Data Management</h2>
                <p className="text-blue-100 text-sm">
                  Order: {order.orderId} • Type: {order.orderType || 'Not specified'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Items List */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold flex items-center gap-2 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Order Items ({localItems.length})
            </h3>
            
            <div className="grid gap-4">
              {localItems.map((item, index) => (
                <div key={item._id} className={`rounded-xl border overflow-hidden shadow-sm ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/20' 
                    : 'bg-white border-gray-200'
                }`}>
                  {/* Item Header */}
                  <div className={`px-4 py-3 border-b ${
                    isDarkMode 
                      ? 'bg-white/10 border-white/20' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-800'
                          }`}>
                            Item {index + 1}
                          </h4>
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {(typeof item.quality === 'object' ? item.quality?.name : item.quality) || 'No Quality'} • {item.quantity} pcs
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.labData?.sampleNumber && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs">
                            <CheckCircle size={12} />
                            Lab Data
                          </div>
                        )}
                        
                        {item.labData?.sampleNumber ? (
                          <button
                            onClick={() => handleEditLabData(item)}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <Edit3 size={14} />
                            Edit Lab
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEditLabData(item)}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <Plus size={14} />
                            Add Lab
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lab Data Display */}
                  {item.labData?.sampleNumber && (
                    <div className={`p-4 ${
                      isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                    }`}>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className={`font-medium ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Sample:</span>
                          <p className={isDarkMode ? 'text-white' : 'text-gray-800'}>{item.labData.sampleNumber}</p>
                        </div>
                        {item.labData.labSendDate && (
                          <div>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Send Date:</span>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-800'}>{new Date(item.labData.labSendDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {item.labData.approvalDate && (
                          <div>
                            <span className={`font-medium ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>Approval:</span>
                            <p className={isDarkMode ? 'text-white' : 'text-gray-800'}>{new Date(item.labData.approvalDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(item._id || '')}
                            disabled={isLoading}
                            className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lab Data Form (Inline) */}
                  {editingItemId === item._id && (
                    <div className={`p-4 border-t ${
                      isDarkMode 
                        ? 'bg-yellow-900/10 border-yellow-700/30' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-800'
                          }`}>
                            {item.labData?.sampleNumber ? 'Edit Lab Data' : 'Add Lab Data'}
                          </h5>
                          <button
                            onClick={handleCancelEdit}
                            className={`${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-gray-200' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Lab Send Date */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Lab Send Date *
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={labData.labSendDate}
                                onChange={(e) => setLabData(prev => ({ ...prev, labSendDate: e.target.value }))}
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                className={`w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                                  isDarkMode
                                    ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                }`}
                                required
                              />
                              <Calendar size={16} className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            </div>
                          </div>

                          {/* Approval Date */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Approval Date
                            </label>
                            <div className="relative">
                              <input
                                type="date"
                                value={labData.approvalDate}
                                onChange={(e) => setLabData(prev => ({ ...prev, approvalDate: e.target.value }))}
                                onClick={(e) => e.currentTarget.showPicker?.()}
                                className={`w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                                  isDarkMode
                                    ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-ring-blue-500/20'
                                }`}
                              />
                              <Calendar size={16} className={`absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            </div>
                          </div>

                          {/* Sample Number */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Sample Number *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={labData.sampleNumber}
                                onChange={(e) => setLabData(prev => ({ ...prev, sampleNumber: e.target.value }))}
                                placeholder="Enter sample number"
                                className={`w-full px-3 py-2 pl-10 rounded-lg border transition-colors ${
                                  isDarkMode
                                    ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                }`}
                                required
                              />
                              <Hash size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            </div>
                          </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className={`p-3 rounded-lg text-sm ${
                            isDarkMode 
                              ? 'bg-red-900/20 border border-red-800 text-red-400' 
                              : 'bg-red-50 border border-red-200 text-red-600'
                          }`}>
                            {error}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={handleSave}
                            disabled={isLoading || !labData.labSendDate || !labData.sampleNumber}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={16} />
                                {item.labData?.sampleNumber ? 'Update Lab Data' : 'Save Lab Data'}
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className={`px-4 py-2 border rounded-lg font-medium transition-colors ${
                              isDarkMode
                                ? 'border-white/20 text-white hover:bg-white/10'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

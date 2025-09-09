'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Hash, CheckCircle, Trash2, Plus, Edit3, BeakerIcon, Clock, FileText } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';
import { OrderItem } from '@/types';
import { ChevronDownIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

// Custom Date Picker Component
function CustomDatePicker({ 
  value, 
  onChange, 
  placeholder, 
  isDarkMode 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
  isDarkMode: boolean; 
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Format date for display (dd/mm/yyyy)
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  const handleDateSelect = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    onChange(formattedDate);
    setInputValue(formatDateForDisplay(formattedDate));
    setShowCalendar(false);
    setShowMonthPicker(false);
    setShowYearPicker(false);
  };

  const clearDate = () => {
    onChange('');
    setInputValue('');
    setShowCalendar(false);
  };

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(formatDateForDisplay(value));
  }, [value]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node) &&
          dateInputRef.current && !dateInputRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCalendar]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showCalendar) {
      setShowCalendar(false);
    } else if (e.key === 'Escape') {
      setShowCalendar(false);
    } else if (e.key === 'Tab') {
      setShowCalendar(false);
    }
  };

  // Prevent form validation when interacting with calendar
  const handleCalendarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={dateInputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            const value = e.target.value;
            setInputValue(value);
            // Only try to parse if it looks like a complete date
            if (value.length >= 8) {
              // Simple date parsing for dd/mm/yyyy format
              const parts = value.split('/');
              if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const year = parseInt(parts[2]);
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                  onChange(date.toISOString().split('T')[0]);
                }
              }
            } else {
              onChange('');
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="dd/mm/yyyy"
          onFocus={() => setShowCalendar(true)}
          className={`w-full p-3 pr-12 rounded-lg border ${
            isDarkMode 
              ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <button
              type="button"
              onClick={clearDate}
              className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
              isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-500'
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showCalendar && mounted && createPortal(
        <div 
          ref={calendarRef}
          onClick={handleCalendarClick}
          className={`fixed z-[9999999] p-4 rounded-lg border shadow-2xl calendar-container date-picker max-w-sm ${
            isDarkMode ? 'bg-[#1D293D] border-white/20' : 'bg-white border-gray-200'
          }`}
          style={{
            top: dateInputRef.current ? dateInputRef.current.getBoundingClientRect().bottom + 10 : '50%',
            left: dateInputRef.current ? dateInputRef.current.getBoundingClientRect().left : '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
              }}
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              <ChevronDownIcon className="h-4 w-4 transform rotate-90" />
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMonthPicker(!showMonthPicker);
                }}
                className={`px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {monthNames[currentDate.getMonth()]}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowYearPicker(!showYearPicker);
                }}
                className={`px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {currentDate.getFullYear()}
              </button>
            </div>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
              }}
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              <ChevronDownIcon className="h-4 w-4 transform -rotate-90" />
            </button>
          </div>

          {/* Quick Navigation Buttons */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentDate(new Date());
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentDate(new Date(currentDate.getFullYear() + 10, currentDate.getMonth()));
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              +10 Years
            </button>
          </div>

          {/* Month Picker */}
          {showMonthPicker && (
            <div className={`mb-4 p-2 rounded-lg ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              <div className="grid grid-cols-3 gap-1">
                {monthNames.map((month, index) => (
                  <button
                    key={month}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentDate(new Date(currentDate.getFullYear(), index));
                      setShowMonthPicker(false);
                      setShowYearPicker(false);
                    }}
                    className={`p-2 text-sm rounded-lg transition-colors ${
                      index === currentDate.getMonth()
                        ? 'bg-blue-500 text-white'
                        : isDarkMode 
                          ? 'hover:bg-white/10 text-white' 
                          : 'hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Year Picker */}
          {showYearPicker && (
            <div className={`mb-4 p-2 rounded-lg ${
              isDarkMode ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, i) => currentDate.getFullYear() - 5 + i).map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentDate(new Date(year, currentDate.getMonth()));
                      setShowYearPicker(false);
                      setShowMonthPicker(false);
                    }}
                    className={`p-2 text-sm rounded-lg transition-colors ${
                      year === currentDate.getFullYear()
                        ? 'bg-blue-500 text-white'
                        : isDarkMode 
                          ? 'hover:bg-white/10 text-white' 
                          : 'hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className={`text-center text-sm font-medium p-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  day && handleDateSelect(day);
                }}
                disabled={!day}
                className={`p-2 text-sm rounded-lg transition-colors ${
                  !day ? 'invisible' :
                  day.toDateString() === new Date().toDateString() 
                    ? 'bg-blue-500 text-white' :
                  value === day.toISOString().split('T')[0]
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  `hover:bg-gray-200 dark:hover:bg-white/10 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`
                }`}
              >
                {day?.getDate()}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
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
        labSendDate: '', // Empty by default
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
        // New lab data - initialize with empty date
        setLabData({
          labSendDate: '',
          approvalDate: '',
          sampleNumber: ''
        });
      }
    } catch (err) {
      console.error('Error loading lab data:', err);
      setError('Failed to load lab data. Please try again.');
      // Initialize with empty date even on error
      setLabData({
        labSendDate: '',
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
        console.log('LabDataModal: Updating local state with sampleNumber:', labData.sampleNumber);
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
          labSendDate: '',
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
            labSendDate: '',
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
      labSendDate: '',
      approvalDate: '',
      sampleNumber: ''
    });
    setError('');
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
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
                             <CustomDatePicker
                               value={labData.labSendDate || ''}
                               onChange={(value) => setLabData(prev => ({ ...prev, labSendDate: value }))}
                               placeholder="Select lab send date"
                               isDarkMode={isDarkMode}
                             />
                           </div>

                          {/* Approval Date */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Approval Date
                            </label>
                            <CustomDatePicker
                              value={labData.approvalDate || ''}
                              onChange={(value) => setLabData(prev => ({ ...prev, approvalDate: value }))}
                              placeholder="Select approval date"
                              isDarkMode={isDarkMode}
                            />
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

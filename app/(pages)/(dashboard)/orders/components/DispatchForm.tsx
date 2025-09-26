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
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Order } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';
import { createPortal } from 'react-dom';

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
          {Array.isArray(options) && options.length > 0 ? (
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
  quality: string;
  subItems?: DispatchSubItem[];
}

interface DispatchFormProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
  isOpen?: boolean; // Add isOpen prop like LabDataModal
  isEditing?: boolean;
  existingDispatches?: any[];
  qualities?: any[];
}

interface ValidationErrors {
  [key: string]: string;
}

// Custom Date Picker Component (from LabDataModal)
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
  const dateInputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Format date for display (dd/mm/yyyy)
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  // Use the shared date parsing function
  const parseDateFromDisplay = (inputValue: string) => {
    if (!inputValue) return '';
    
    // Handle dd/mm/yyyy format
    const parts = inputValue.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    return '';
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
              const parsedDate = parseDateFromDisplay(value);
              if (parsedDate) {
                onChange(parsedDate);
              }
            } else {
              onChange('');
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="dd/mm/yyyy"
          onFocus={() => setShowCalendar(true)}
          required
          className={`w-full p-3 pr-12 rounded-lg border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
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

      {showCalendar && createPortal(
        <div 
          ref={calendarRef}
          onClick={handleCalendarClick}
          className={`fixed z-[9999999] p-2 rounded-lg border shadow-2xl calendar-container date-picker max-w-xs ${
            isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
          }`}
          style={{
            top: dateInputRef.current ? dateInputRef.current.getBoundingClientRect().bottom - 0 : '50%',
            left: dateInputRef.current ? dateInputRef.current.getBoundingClientRect().left : '50%',
            transform: dateInputRef.current ? 'translateY(0)' : 'translate(-50%, -50%)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
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
          <div className="flex items-center justify-center gap-1 mb-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentDate(new Date());
              }}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Today
            </button>
          </div>

          {/* Month Picker */}
          {showMonthPicker && (
            <div className={`mb-4 p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
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
                          ? 'hover:bg-gray-600 text-white' 
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
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
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
                          ? 'hover:bg-gray-600 text-white' 
                          : 'hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className={`text-center text-xs font-medium p-1 ${
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
                className={`p-1 text-xs rounded-lg transition-colors ${
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

export default function DispatchForm({ 
  order, 
  onClose, 
  onSuccess,
  isOpen = true, // Default to true for backward compatibility
  isEditing = false,
  existingDispatches = [],
  qualities = []
}: DispatchFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [formData, setFormData] = useState<DispatchFormData>({
    orderId: order?.orderId || '',
    dispatchItems: [{
      id: '1',
        dispatchDate: '',
        billNo: '',
        finishMtr: '',
      quality: '',
      subItems: [{
        id: '1_1',
        finishMtr: '',
        quality: ''
      }]
    }]
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  
  // LabDataModal pattern states
  const [hasExistingData, setHasExistingData] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Quality dropdown state
  const [activeQualityDropdown, setActiveQualityDropdown] = useState<{ itemId: string } | null>(null);
  const [qualitySearchStates, setQualitySearchStates] = useState<{ [key: string]: string }>({});
  const [currentQualitySearch, setCurrentQualitySearch] = useState('');
  const [recentlyAddedQuality, setRecentlyAddedQuality] = useState<string | null>(null);

  // Fetch existing dispatch data from API when form opens (LabDataModal pattern)
  useEffect(() => {
    console.log('DispatchForm useEffect triggered:', { isOpen, orderId: order?.orderId });
    
    // Always fetch existing data when form opens, just like LabDataModal
    if (isOpen && order?.orderId) {
      console.log('Form opened, fetching existing dispatch data...');
      // Reset form state first
      setHasExistingData(false);
      setErrors({});
      setSuccessMessage('');
      // Then fetch data
      fetchExistingDispatchData();
    }
  }, [isOpen, order?.orderId]);

  // Function to fetch qualities directly from API
  const fetchQualitiesDirectly = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        return;
      }

      const response = await fetch('/api/qualities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          console.log('Fetched qualities directly from API:', data.data);
          // Note: We can't directly set qualities here as it's a prop, but we can trigger parent refresh
          // This will be handled by the parent component's onRefreshMills function
        } else {
          console.log('No qualities found in API response');
        }
      } else {
        console.log('Failed to fetch qualities from API, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching qualities from API:', error);
    }
  };

  // Function to fetch existing dispatch data from API
  const fetchExistingDispatchData = async () => {
    if (!order?.orderId) {
      console.log('No order ID available for fetching dispatches');
      setHasExistingData(false);
      return;
    }

    setLoadingExistingData(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token available');
        setHasExistingData(false);
        return;
      }

      console.log('Fetching dispatches for order:', order.orderId);
      const response = await fetch(`/api/dispatch?orderId=${order.orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Full API response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data && data.data.dispatches && data.data.dispatches.length > 0) {
          console.log('✅ Found existing dispatches:', data.data.dispatches.length, 'records');
          console.log('Dispatches data:', data.data.dispatches);
          setHasExistingData(true);
          loadExistingDispatchesFromData(data.data.dispatches);
        } else {
          console.log('❌ No existing dispatches found in API response');
          console.log('Response structure:', {
            success: data.success,
            hasData: !!data.data,
            hasDispatches: !!(data.data && data.data.dispatches),
            dispatchesLength: data.data?.dispatches?.length || 0
          });
          setHasExistingData(false);
        }
      } else {
        console.log('❌ Failed to fetch dispatches from API, status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setHasExistingData(false);
      }
    } catch (error) {
      console.error('Error fetching dispatches from API:', error);
      setHasExistingData(false);
    } finally {
      setLoadingExistingData(false);
    }
  };

  // Also fetch qualities directly if not available
  useEffect(() => {
    if (order?.orderId && (!qualities || qualities.length === 0)) {
      console.log('Qualities not available, fetching directly...');
      fetchQualitiesDirectly();
    }
  }, [order?.orderId, qualities]);

  // Note: Removed dependency on isEditing and existingDispatches props
  // Form now fetches data independently from API like LabDataModal

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
          quality: '',
          subItems: [{
            id: '1_1',
            finishMtr: '',
            quality: ''
          }]
        }]
      });
      setErrors({});
    }
  }, [order?.orderId, isEditing]);

  // Function to load existing dispatches from API data (LabDataModal pattern)
  const loadExistingDispatchesFromData = async (dispatchesData: any[]) => {
    console.log('Loading existing dispatches from API data:', { order: order?.orderId, dispatchesData });
    
    if (!order || dispatchesData.length === 0) {
      setHasExistingData(false);
      return;
    }
    
    try {
      // Group dispatches by dispatchDate and billNo
      const groupedDispatches = dispatchesData.reduce((groups: any, dispatch: any) => {
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
          quality: '',
          subItems: group.subItems
        }))
      };
      
      console.log('Setting form data from API:', newFormData);
      setFormData(newFormData);
      setHasExistingData(true);
    } catch (error) {
      console.error('Error loading existing dispatches from API:', error);
      setHasExistingData(false);
    }
  };

  // Function to load existing dispatches from props (LabDataModal pattern)
  const loadExistingDispatches = async () => {
    console.log('Loading existing dispatches from props:', { order: order?.orderId, existingDispatches });
    
    if (!order || existingDispatches.length === 0) {
      setHasExistingData(false);
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
          quality: '',
          subItems: group.subItems
        }))
      };
      
      console.log('Setting form data from props:', newFormData);
      setFormData(newFormData);
      setHasExistingData(true);
    } catch (error) {
      console.error('Error loading existing dispatches from props:', error);
      setHasExistingData(false);
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
          quality: '',
          subItems: [{
            id: `${newId}_1`,
            finishMtr: '',
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
    const qualityId = getQualityId(quality);
    updateSubItem(itemId, subItemId, 'quality', qualityId);
    setQualitySearchStates(prev => ({ ...prev, [subItemId]: quality.name }));
    setCurrentQualitySearch(quality.name);
    setActiveQualityDropdown(null);
    
    // Debug: Check if the quality was actually set
    setTimeout(() => {
      const currentFormData = formData;
      const currentItem = currentFormData.dispatchItems.find(item => item.id === itemId);
      const currentSubItem = currentItem?.subItems?.find(sub => sub.id === subItemId);
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
      if (!item.dispatchDate || item.dispatchDate.trim() === '') {
        newErrors[`dispatchDate_${item.id}`] = 'Dispatch date is required';
      }

      if (!item.billNo || item.billNo.trim() === '') {
        newErrors[`billNo_${item.id}`] = 'Bill number is required';
      }

      // Validate sub-items (main quality & finish items)
      (item.subItems || []).forEach((subItem, subIndex) => {
        if (!subItem.finishMtr || subItem.finishMtr.trim() === '' || parseFloat(subItem.finishMtr) <= 0) {
          newErrors[`finishMtr_${subItem.id}`] = 'Valid finish meters is required';
        }


        if (!subItem.quality || subItem.quality.trim() === '') {
          newErrors[`quality_${subItem.id}`] = 'Quality is required';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission (LabDataModal pattern)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSuccessMessage('');
    setErrors({});

    try {
      if (isEditing && existingDispatches.length > 0) {
        // Update existing dispatches
        await updateExistingDispatches();
      } else {
        // Create new dispatches
        await createNewDispatches();
      }
      
      setSuccessMessage('Dispatch data saved successfully!');
      
      // Show success message and then close after delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      setErrors({ submit: 'Failed to handle dispatch' });
    } finally {
      setSaving(false);
    }
  };

  // Function to create new dispatches
  const createNewDispatches = async () => {
    const token = localStorage.getItem('token');
    const allDispatchPromises: Promise<any>[] = [];

    formData.dispatchItems.forEach((item) => {
      // Create dispatches for sub-items only
      (item.subItems || []).forEach((subItem) => {
        const subDispatchData = {
          orderId: formData.orderId,
          dispatchDate: item.dispatchDate,
          billNo: item.billNo.trim(),
          finishMtr: parseFloat(subItem.finishMtr),
          quality: subItem.quality
        };

        allDispatchPromises.push(
          fetch('/api/dispatch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
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

  // Delete dispatch data (LabDataModal pattern)
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!existingDispatches || existingDispatches.length === 0) return;

    setSaving(true);
    setErrors({});
    setSuccessMessage('');
    setShowDeleteConfirm(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Delete all existing dispatches for this order
      const deletePromises = existingDispatches.map((dispatch: any) =>
        fetch(`/api/dispatch/${dispatch._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);
      
      setSuccessMessage('Dispatch data deleted successfully!');
      setHasExistingData(false);
      
      // Reset form to initial state
      setFormData({
        orderId: order?.orderId || '',
        dispatchItems: [{
          id: '1',
          dispatchDate: '',
          billNo: '',
          finishMtr: '',
          quality: '',
          subItems: [{
            id: '1_1',
            finishMtr: '',
            quality: ''
          }]
        }]
      });
      
      // Close after delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      setErrors({ submit: 'Failed to delete dispatch data' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Function to update existing dispatches
  const updateExistingDispatches = async () => {
    const token = localStorage.getItem('token');
    
    // First delete existing dispatches for this order
    const deletePromises = existingDispatches.map((dispatch: any) =>
      fetch(`/api/dispatch/${dispatch._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      })
    );

    const deleteResults = await Promise.all(deletePromises);
    // Then create new ones with updated data
    await createNewDispatches();
  };

  if (!order) {
    return null;
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
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
                  Dispatch
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
              {/* Success Message */}
              {successMessage && (
                <div className={`p-4 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-green-900/20 border-green-500/30 text-green-400'
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 mr-2" />
                    {successMessage}
                  </div>
                </div>
              )}
              
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
                          <CustomDatePicker
                            value={item.dispatchDate}
                            onChange={(value) => updateDispatchItem(item.id, 'dispatchDate', value)}
                            placeholder="Select dispatch date"
                            isDarkMode={isDarkMode}
                          />
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
                required
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
                                required
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
                {saving ? 'Saving...' : loadingExistingData ? 'Loading...' : (hasExistingData ? 'Update Dispatch' : 'Add Dispatch')}
              </button>
              
              {/* Delete Button - Show only when has existing data */}
              {hasExistingData && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={saving}
                  className={`px-6 py-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                    saving
                      ? 'border-gray-400 text-gray-400 cursor-not-allowed' 
                      : isDarkMode
                        ? 'border-red-500 text-red-400 hover:bg-red-500 hover:text-white' 
                        : 'border-red-300 text-red-600 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <TrashIcon className="h-5 w-5 inline mr-2" />
                  Delete
                </button>
              )}
            </div>
            </div>
        </div>
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className={`relative w-full max-w-md rounded-xl shadow-2xl ${
              isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
            }`}>
              {/* Header */}
              <div className={`flex items-center justify-between p-6 border-b ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg border ${
                    isDarkMode
                      ? 'bg-red-600/20 border-red-500/30'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <TrashIcon className={`h-6 w-6 ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                  </div>
                  <h3 className="text-lg font-semibold">Delete Dispatch Data</h3>
                </div>
                <button
                  onClick={handleCancelDelete}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Are you sure you want to delete all dispatch data for this order? This action cannot be undone.
                  </p>
                  
                  <div className={`p-4 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-red-900/20 border-red-500/30' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className={`h-5 w-5 mr-2 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`} />
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-red-400' : 'text-red-800'
                      }`}>
                        This will permanently remove all dispatch data for this order.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      saving
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : isDarkMode
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg' 
                          : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                    }`}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <TrashIcon className="h-4 w-4" />
                        Delete Dispatch Data
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    disabled={saving}
                    className={`px-6 py-3 border rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                      isDarkMode
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
    </>
  );
}
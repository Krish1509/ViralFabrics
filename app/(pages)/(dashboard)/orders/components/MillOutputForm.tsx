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
import { createPortal } from 'react-dom';

interface MillOutputItem {
  id: string;
  recdDate: string;
  millBillNo: string;
  finishedMtr: string;
  quality: string; // Add quality field
  additionalFinishedMtr: { meters: string; quality: string }[]; // Add quality to additional fields
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
  isOpen?: boolean; // Add isOpen prop like LabDataModal
  isEditing?: boolean;
  existingMillOutputs?: any[];
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
    
    // Handle YYYY-MM-DD format directly to avoid timezone issues
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
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
          // Fix timezone issue by using local date instead of UTC
          const yearStr = String(date.getFullYear());
          const monthStr = String(date.getMonth() + 1).padStart(2, '0');
          const dayStr = String(date.getDate()).padStart(2, '0');
          return `${yearStr}-${monthStr}-${dayStr}`;
        }
      }
    }
    
    return '';
  };

  const handleDateSelect = (date: Date) => {
    // Fix timezone issue by using local date instead of UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
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
  const selectedItem = Array.isArray(options) ? options.find(option => (option._id || (option as any).id) === value) : null;
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
          {Array.isArray(options) && options.length > 0 ? (
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
  isOpen = true, // Default to true for backward compatibility
  isEditing = false,
  existingMillOutputs = []
}: MillOutputFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
  
  console.log('MillOutputForm props:', { 
    order: order?.orderId, 
    qualities: qualities?.length, 
    isEditing, 
    existingMillOutputs: existingMillOutputs?.length 
  });
  
  // Debug logging for qualities prop
  const [formData, setFormData] = useState<MillOutputFormData>({
    orderId: order?.orderId || '',
    millOutputItems: [{
      id: '1',
    recdDate: '',
    millBillNo: '',
    finishedMtr: '',
      quality: '', // Add quality field
      additionalFinishedMtr: []
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
  
  // Quality-related state
  const [activeQualityDropdown, setActiveQualityDropdown] = useState<{ itemId: string; type: 'main' | 'additional'; index?: number } | null>(null);
  const [qualitySearchStates, setQualitySearchStates] = useState<{ [key: string]: string }>({});
  const [currentQualitySearch, setCurrentQualitySearch] = useState('');
  const [recentlyAddedQuality, setRecentlyAddedQuality] = useState<string | null>(null);

  // Load existing mill output data when form opens (smooth pattern like edit order page)
  useEffect(() => {
    console.log('MillOutputForm useEffect triggered:', { isOpen, orderId: order?.orderId, existingMillOutputsLength: existingMillOutputs?.length });
    
    if (isOpen && order?.orderId) {
      console.log('Form opened, loading existing mill output data...');
      // Reset form state first (but don't reset hasExistingData immediately)
      setErrors({});
      setSuccessMessage('');
      
      // Use pre-loaded data if available - show immediately for smooth experience
      if (existingMillOutputs && existingMillOutputs.length > 0) {
        console.log('Using pre-loaded mill output data:', existingMillOutputs);
        loadExistingMillOutputs();
      } else {
        console.log('No pre-loaded data, but showing form immediately and fetching in background...');
        // Don't show loading - show form immediately and fetch in background
        setLoadingExistingData(false);
        // Fetch in background without blocking UI
        fetchExistingMillOutputData();
      }
    }
  }, [isOpen, order?.orderId, existingMillOutputs]);

  // Function to fetch qualities directly from API
  const fetchQualitiesDirectly = async () => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        return;
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout for faster response

      const response = await fetch('/api/qualities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
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
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Qualities fetch was aborted due to timeout');
      } else {
        console.error('Error fetching qualities from API:', error);
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  // Function to fetch existing mill output data from API (smooth pattern)
  const fetchExistingMillOutputData = async () => {
    if (!order?.orderId) {
      console.log('No order ID available for fetching mill outputs');
      setHasExistingData(false);
      return;
    }

    // Don't show loading overlay - fetch in background for smooth experience
    setLoadingExistingData(false);
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token available');
        setHasExistingData(false);
        return;
      }

      console.log('Fetching mill outputs for order:', order.orderId);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout for faster response
      
      const response = await fetch(`/api/mill-outputs?orderId=${order.orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Full API response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data && data.data.millOutputs && data.data.millOutputs.length > 0) {
          console.log('✅ Found existing mill outputs:', data.data.millOutputs.length, 'records');
          console.log('Mill outputs data:', data.data.millOutputs);
          setHasExistingData(true);
          loadExistingMillOutputsFromData(data.data.millOutputs);
        } else {
          console.log('❌ No existing mill outputs found in API response');
          console.log('Response structure:', {
            success: data.success,
            hasData: !!data.data,
            hasMillOutputs: !!(data.data && data.data.millOutputs),
            millOutputsLength: data.data?.millOutputs?.length || 0
          });
          setHasExistingData(false);
        }
      } else {
        console.log('❌ Failed to fetch mill outputs from API, status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setHasExistingData(false);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Mill outputs fetch was aborted due to timeout');
      } else {
        console.error('Error fetching mill outputs from API:', error);
      }
      setHasExistingData(false);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoadingExistingData(false);
    }
  };

  // Also fetch qualities directly if not available (non-blocking)
  useEffect(() => {
    if (order?.orderId && (!qualities || qualities.length === 0)) {
      console.log('Qualities not available, fetching directly...');
      // Use a shorter timeout for faster loading
      const timeout = setTimeout(() => {
        fetchQualitiesDirectly();
      }, 100); // 100ms delay for faster loading
      
      return () => clearTimeout(timeout);
    }
  }, [order?.orderId, qualities]);

  // Update quality search states when qualities are loaded and form data exists
  useEffect(() => {
    if (qualities && qualities.length > 0 && formData.millOutputItems.length > 0 && hasExistingData) {
      console.log('Updating quality search states with loaded qualities');
      const newQualitySearchStates: { [key: string]: string } = {};
      
      formData.millOutputItems.forEach((item) => {
        // Set main quality search state
        if (item.quality) {
          const qualityObj = qualities.find(q => (q._id || q.id) === item.quality);
          if (qualityObj) {
            newQualitySearchStates[`${item.id}_main`] = qualityObj.name;
          }
        }
        
        // Set additional quality search states
        item.additionalFinishedMtr.forEach((additional: any, index: number) => {
          if (additional.quality) {
            const qualityObj = qualities.find(q => (q._id || q.id) === additional.quality);
            if (qualityObj) {
              newQualitySearchStates[`${item.id}_additional_${index}`] = qualityObj.name;
            }
          }
        });
      });
      
      setQualitySearchStates(prev => ({ ...prev, ...newQualitySearchStates }));
    }
  }, [qualities, formData.millOutputItems, hasExistingData]);

  // Note: Removed dependency on isEditing and existingMillOutputs props
  // Form now fetches data independently from API like LabDataModal

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
          quality: '', // Add quality field
          additionalFinishedMtr: []
        }]
      });
      setErrors({});
    }
  }, [order?.orderId, isEditing]);

  // Function to load existing mill outputs from API data (LabDataModal pattern)
  const loadExistingMillOutputsFromData = async (millOutputsData: any[]) => {
    console.log('Loading existing mill outputs from API data:', { order: order?.orderId, millOutputsData });
    
    if (!order || millOutputsData.length === 0) {
      console.log('No order or existing mill outputs found');
      setHasExistingData(false);
      return;
    }
    
    try {
      // Group mill outputs by bill number and date
      const groupedOutputs = groupMillOutputsByBillAndDate(millOutputsData);
      console.log('Grouped outputs from API:', groupedOutputs);
      
      if (groupedOutputs.length > 0) {
        const newFormData = {
          orderId: order.orderId,
          millOutputItems: groupedOutputs.map((group, index) => ({
            id: (index + 1).toString(),
            recdDate: group.recdDate,
            millBillNo: group.millBillNo,
            finishedMtr: (group.mainOutput.finishedMtr || 0).toString(),
            quality: group.mainOutput.quality?._id || group.mainOutput.quality || '', // Extract quality ID
            additionalFinishedMtr: group.additionalOutputs.map((output: any) => ({
              meters: (output.finishedMtr || 0).toString(),
              quality: output.quality?._id || output.quality || '' // Extract quality ID
            }))
          }))
        };
        
        console.log('Setting form data from API:', newFormData);
        setFormData(newFormData);
        setHasExistingData(true);
        
        // Set quality search states for proper display
        const newQualitySearchStates: { [key: string]: string } = {};
        newFormData.millOutputItems.forEach((item) => {
          // Set main quality search state
          if (item.quality) {
            const qualityObj = qualities?.find(q => (q._id || q.id) === item.quality);
            if (qualityObj) {
              newQualitySearchStates[`${item.id}_main`] = qualityObj.name;
            }
          }
          
          // Set additional quality search states
          item.additionalFinishedMtr.forEach((additional: any, index: number) => {
            if (additional.quality) {
              const qualityObj = qualities?.find(q => (q._id || q.id) === additional.quality);
              if (qualityObj) {
                newQualitySearchStates[`${item.id}_additional_${index}`] = qualityObj.name;
              }
            }
          });
        });
        setQualitySearchStates(newQualitySearchStates);
      } else {
        console.log('No grouped outputs found from API');
        setHasExistingData(false);
      }
    } catch (error) {
      console.error('Error loading existing mill outputs from API:', error);
      setHasExistingData(false);
    }
  };

  // Function to load existing mill outputs from props (LabDataModal pattern)
  const loadExistingMillOutputs = async () => {
    console.log('Loading existing mill outputs from props:', { order: order?.orderId, existingMillOutputs });
    
    if (!order || existingMillOutputs.length === 0) {
      console.log('No order or existing mill outputs found');
      setHasExistingData(false);
      return;
    }
    
    setLoadingExistingData(true);
    try {
      // Group mill outputs by bill number and date
      const groupedOutputs = groupMillOutputsByBillAndDate(existingMillOutputs);
      console.log('Grouped outputs from props:', groupedOutputs);
      
      if (groupedOutputs.length > 0) {
        const newFormData = {
          orderId: order.orderId,
          millOutputItems: groupedOutputs.map((group, index) => ({
            id: (index + 1).toString(),
            recdDate: group.recdDate,
            millBillNo: group.millBillNo,
            finishedMtr: (group.mainOutput.finishedMtr || 0).toString(),
            quality: group.mainOutput.quality?._id || group.mainOutput.quality || '', // Extract quality ID
            additionalFinishedMtr: group.additionalOutputs.map((output: any) => ({
              meters: (output.finishedMtr || 0).toString(),
              quality: output.quality?._id || output.quality || '' // Extract quality ID
            }))
          }))
        };
        
        console.log('Setting form data from props:', newFormData);
        setFormData(newFormData);
        setHasExistingData(true);
        
        // Set quality search states for proper display
        const newQualitySearchStates: { [key: string]: string } = {};
        newFormData.millOutputItems.forEach((item) => {
          // Set main quality search state
          if (item.quality) {
            const qualityObj = qualities?.find(q => (q._id || q.id) === item.quality);
            if (qualityObj) {
              newQualitySearchStates[`${item.id}_main`] = qualityObj.name;
            }
          }
          
          // Set additional quality search states
          item.additionalFinishedMtr.forEach((additional: any, index: number) => {
            if (additional.quality) {
              const qualityObj = qualities?.find(q => (q._id || q.id) === additional.quality);
              if (qualityObj) {
                newQualitySearchStates[`${item.id}_additional_${index}`] = qualityObj.name;
              }
            }
          });
        });
        setQualitySearchStates(newQualitySearchStates);
      } else {
        console.log('No grouped outputs found from props');
        setHasExistingData(false);
      }
    } catch (error) {
      console.error('Error loading existing mill outputs from props:', error);
      setHasExistingData(false);
    } finally {
      setLoadingExistingData(false);
    }
  };

  // Helper function to group mill outputs by bill and date
  const groupMillOutputsByBillAndDate = (millOutputs: any[]) => {
    const groups: any[] = [];
    
    // Sort outputs by creation date to ensure consistent ordering
    const sortedOutputs = [...millOutputs].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA.getTime() - dateB.getTime();
    });
    
    sortedOutputs.forEach((output: any, index: number) => {
      const existingGroup = groups.find(group => 
        group.millBillNo === output.millBillNo && group.recdDate === output.recdDate
      );
      
      if (existingGroup) {
        // Add as additional output
        existingGroup.additionalOutputs.push({
          finishedMtr: output.finishedMtr,
          quality: output.quality || ''
        });
      } else {
        // Create new group
        groups.push({
          recdDate: output.recdDate,
          millBillNo: output.millBillNo,
          mainOutput: {
            finishedMtr: output.finishedMtr,
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

  // Add additional finished meters
  const addAdditionalFinishedMtr = (itemId: string) => {
    setFormData({
      ...formData,
      millOutputItems: formData.millOutputItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              additionalFinishedMtr: [...item.additionalFinishedMtr, { meters: '', quality: '' }]
            }
          : item
      )
    });
  };

  // Remove additional finished meters
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

  // Update additional finished meters
  const updateAdditionalFinishedMtr = (itemId: string, index: number, field: 'meters' | 'quality', value: string) => {
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
    console.log('getFilteredQualities called:', { itemId, type, index, qualities });
    // Safety check for undefined qualities
    if (!qualities || !Array.isArray(qualities)) {
      console.log('No qualities available or not an array:', qualities);
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
      if (!item.recdDate || item.recdDate.trim() === '') {
        newErrors[`recdDate_${item.id}`] = 'Received date is required';
      }

      if (!item.millBillNo || item.millBillNo.trim() === '') {
        newErrors[`millBillNo_${item.id}`] = 'Mill bill number is required';
      }

      if (!item.finishedMtr || item.finishedMtr.trim() === '' || parseFloat(item.finishedMtr) <= 0) {
        newErrors[`finishedMtr_${item.id}`] = 'Valid finished meters is required';
      }

      // Mill rate is now optional - no validation required

      if (!item.quality || item.quality.trim() === '') {
        newErrors[`quality_${item.id}`] = 'Quality is required';
      }

      // Validate additional finished meters
      item.additionalFinishedMtr.forEach((additional, additionalIndex) => {
        if (!additional.meters || additional.meters.trim() === '' || parseFloat(additional.meters) <= 0) {
          newErrors[`additionalFinishedMtr_${item.id}_${additionalIndex}_meters`] = 'Valid additional finished meters is required';
        }
        if (!additional.quality || additional.quality.trim() === '') {
          newErrors[`additionalQuality_${item.id}_${additionalIndex}`] = 'Quality is required';
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
      if (isEditing && existingMillOutputs.length > 0) {
        // Update existing mill outputs
        await updateExistingMillOutputs();
      } else {
        // Create new mill outputs
        await createNewMillOutputs();
      }
      
      setSuccessMessage('Mill output data saved successfully!');
      
      // Immediately update local state for better UX (LabDataModal pattern)
      setHasExistingData(true);
      
      // Refresh the local data to show updated state
      await fetchExistingMillOutputData();
      
      // Call onSuccess immediately to update parent state and button text
      onSuccess();
      
      // Don't close automatically - let user see the updated data
      // setTimeout(() => {
      //   onClose();
      // }, 800);
    } catch (error) {
      setErrors({ submit: 'Failed to handle mill output' });
    } finally {
      setSaving(false);
    }
  };

  // Function to create new mill outputs
  const createNewMillOutputs = async () => {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const allMillOutputPromises: Promise<any>[] = [];

    formData.millOutputItems.forEach((item) => {
      // Main mill output
      const millOutputData = {
        orderId: formData.orderId,
        recdDate: item.recdDate,
        millBillNo: item.millBillNo.trim(),
        finishedMtr: parseFloat(item.finishedMtr),
        quality: item.quality // Add quality field
      };

      allMillOutputPromises.push(
        fetch('/api/mill-outputs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
          quality: additional.quality // Add quality field
        };

        allMillOutputPromises.push(
          fetch('/api/mill-outputs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
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

  // Delete mill output data (LabDataModal pattern)
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!existingMillOutputs || existingMillOutputs.length === 0) return;

    setSaving(true);
    setErrors({});
    setSuccessMessage('');
    setShowDeleteConfirm(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Delete all existing mill outputs for this order
      const deletePromises = existingMillOutputs.map((output: any) =>
        fetch(`/api/mill-outputs/${output._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      await Promise.all(deletePromises);
      
      setSuccessMessage('Mill output data deleted successfully!');
      setHasExistingData(false);
      
      // Reset form to initial state
      setFormData({
        orderId: order?.orderId || '',
        millOutputItems: [{
          id: '1',
          recdDate: '',
          millBillNo: '',
          finishedMtr: '',
          quality: '',
          additionalFinishedMtr: []
        }]
      });
      
      // Close after delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      setErrors({ submit: 'Failed to delete mill output data' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Function to update existing mill outputs
  const updateExistingMillOutputs = async () => {
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // First delete existing mill outputs for this order
    const deletePromises = existingMillOutputs.map((output: any) => {
      return fetch(`/api/mill-outputs/${output._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
    });

    try {
      const deleteResults = await Promise.all(deletePromises);
      // Check if all deletions were successful
      const allDeleted = deleteResults.every(result => result.ok);
      if (!allDeleted) {
        }
    } catch (error) {
      // Continue with creating new ones even if deletion fails
    }

    // Then create new ones with updated data
    await createNewMillOutputs();
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
          {/* Loading Overlay removed for smooth experience - form shows immediately */}

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
                  Mill Output
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
              <CustomDatePicker
                value={item.recdDate}
                onChange={(value) => updateMillOutputItem(item.id, 'recdDate', value)}
                placeholder="Select received date"
                isDarkMode={isDarkMode}
              />
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
                              value={item.millBillNo || ''}
                              onChange={(e) => updateMillOutputItem(item.id, 'millBillNo', e.target.value)}
                  placeholder="Enter mill bill number"
                  required
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
                    value={item.finishedMtr || ''}
                    onChange={(e) => updateMillOutputItem(item.id, 'finishedMtr', e.target.value)}
                    placeholder="Enter finished meters"
                    step="0.01"
                    min="0"
                    required
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
              </div>

              {/* Additional Fields (M2, M3, M4, etc.) */}
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
                      required
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
                           Add More Finished Meters
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
                {saving ? 'Saving...' : loadingExistingData ? 'Loading...' : (hasExistingData ? 'Update Mill Output' : 'Add Mill Output')}
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
                <h3 className="text-lg font-semibold">Delete Mill Output Data</h3>
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
                  Are you sure you want to delete all mill output data for this order? This action cannot be undone.
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
                      This will permanently remove all mill output data for this order.
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
                      Delete Mill Output Data
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

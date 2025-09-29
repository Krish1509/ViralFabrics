'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon,
  PlusIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Order, Mill, Quality } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';
import { createPortal } from 'react-dom';

interface MillItem {
  id: string;
  millDate: string;
  chalanNo: string;
  greighMtr: string;
  pcs: string;
  quality: string; // Add quality field
  process: string; // Add process field
  additionalMeters: { meters: string; pieces: string; quality: string; process: string }[]; // Add process to additional meters
}

interface MillInputFormData {
  orderId: string;
  mill: string;
  millItems: MillItem[];
}

interface MillInputFormProps {
  order: Order | null;
  mills: Mill[];
  qualities: Quality[];
  onClose: () => void;
  onSuccess: () => void;
  onAddMill: () => void;
  onRefreshMills: () => void;
  onRefreshQualities?: () => void; // Add quality refresh function
  isOpen?: boolean; // Add isOpen prop like LabDataModal
  isEditing?: boolean;
  existingMillInputs?: any[];
}

interface ValidationErrors {
  [key: string]: string;
}

// Process options
const PROCESS_OPTIONS = [
  'Lot No Greigh',
  'Charkha',
  'Drum',
  'Soflina WR',
  'long jet',
  'setting',
  'In Dyeing',
  'jigar',
  'in printing',
  'loop',
  'washing',
  'Finish',
  'folding',
  'ready to dispatch'
];

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
            top: dateInputRef.current ? dateInputRef.current.getBoundingClientRect().top - 10 : '50%',
            left: dateInputRef.current ? dateInputRef.current.getBoundingClientRect().left : '50%',
            transform: dateInputRef.current ? 'translateY(-100%)' : 'translate(-50%, -50%)'
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
  onAddNew,
  onDelete,
  itemIndex,
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
  onAddNew?: () => void;
  onDelete?: (item: any) => void;
  itemIndex?: number;
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
        // Only close if dropdown is currently open
        if (showDropdown) {
        onToggleDropdown();
        }
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
  
  // Debug: Log quality selection details
  if (placeholder?.includes('quality')) {
    }
  const displayValue = selectedItem ? selectedItem.name : searchValue;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex space-x-2">
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
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className={`px-3 py-3 rounded-lg border-2 border-dashed transition-all duration-200 hover:scale-105 ${
              isDarkMode 
                ? 'border-gray-600 hover:border-blue-500 text-gray-300 hover:text-blue-400' 
                : 'border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600'
            }`}
            title="Add New Mill"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        )}
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
              
              // For process options, maintain the original order (don't sort alphabetically)
              if (placeholder?.toLowerCase().includes('process')) {
                return 0; // Keep original order
              }
              
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
                    {onDelete && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(option);
                        }}
                        className={`p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer ${
                          isDarkMode 
                            ? 'text-gray-400 hover:text-red-400' 
                            : 'text-gray-500 hover:text-red-600'
                        }`}
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </div>
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
                <p className="font-medium">No mills found</p>
                <p className="text-sm">Try adjusting your search or add a new one</p>
                {onAddNew && (
                  <button
                    type="button"
                    onClick={onAddNew}
                    className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <PlusIcon className="h-3 w-3 inline mr-1" />
                    Add New Mill
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MillInputForm({
  order,
  mills,
  qualities,
  onClose,
  onSuccess,
  onAddMill,
  onRefreshMills,
  onRefreshQualities,
  isOpen = true, // Default to true for backward compatibility
  isEditing = false,
  existingMillInputs = []
}: MillInputFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
  
  console.log('MillInputForm props:', { 
    order: order?.orderId, 
    mills: mills?.length, 
    qualities: qualities?.length, 
    isEditing, 
    existingMillInputs: existingMillInputs?.length 
  });

  // Refresh qualities when form is opened
  useEffect(() => {
    if (isOpen && onRefreshQualities) {
      console.log('MillInputForm: Refreshing qualities on form open');
      onRefreshQualities();
    }
  }, [isOpen, onRefreshQualities]);
  
  const [formData, setFormData] = useState<MillInputFormData>({
    orderId: order?.orderId || '',
    mill: '',
    millItems: [{
      id: '1',
      millDate: '',
      chalanNo: '',
      greighMtr: '',
      pcs: '',
      quality: '', // Add quality field
      process: '', // Add process field
      additionalMeters: []
    }],
  });

  // Debug logging
  // Additional debugging for empty mills
  if (mills.length === 0) {
    }
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState('');
  const [showAddMillModal, setShowAddMillModal] = useState(false);
  const [addMillForm, setAddMillForm] = useState({
    name: '',
    contactPerson: '',
    contactPhone: '',
    address: '',
    email: ''
  });
  const [loadingExistingData, setLoadingExistingData] = useState(false);
  const [addingMill, setAddingMill] = useState(false);
  const [millsLoading, setMillsLoading] = useState(false);
  const [localMills, setLocalMills] = useState<Mill[]>([]);
  
  // LabDataModal pattern states
  const [hasExistingData, setHasExistingData] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [localMillInputs, setLocalMillInputs] = useState<any[]>([]);
  
  // Mill-related state
  const [millSearch, setMillSearch] = useState('');
  const [showMillDropdown, setShowMillDropdown] = useState(false);
  const [recentlyAddedMill, setRecentlyAddedMill] = useState<string | null>(null);
  
  // Quality-related state
  const [activeQualityDropdown, setActiveQualityDropdown] = useState<{ itemId: string; type: 'main' | 'additional'; index?: number } | null>(null);
  const [qualitySearchStates, setQualitySearchStates] = useState<{ [key: string]: string }>({});
  const [currentQualitySearch, setCurrentQualitySearch] = useState('');
  const [recentlyAddedQuality, setRecentlyAddedQuality] = useState<string | null>(null);

  // Process-related state
  const [activeProcessDropdown, setActiveProcessDropdown] = useState<{ itemId: string; type: 'main' | 'additional'; index?: number } | null>(null);
  const [processSearchStates, setProcessSearchStates] = useState<{ [key: string]: string }>({});
  const [currentProcessSearch, setCurrentProcessSearch] = useState('');

  // Load mills data when component mounts
  useEffect(() => {
    console.log('MillInputForm mounted, refreshing mills data...');
    console.log('Current mills prop:', mills);
    setMillsLoading(true);
    onRefreshMills();
  }, [onRefreshMills]);

  // Also fetch mills directly if not available (with very short timeout)
  useEffect(() => {
    if (order?.orderId && (!mills || mills.length === 0) && localMills.length === 0) {
      console.log('Mills not available, fetching directly...');
      // Set a very short timeout for mills loading
      const timeout = setTimeout(() => {
        fetchMillsDirectly();
      }, 100); // Reduced to 100ms for faster loading
      
      return () => clearTimeout(timeout);
    }
  }, [order?.orderId, mills, localMills]);


  // Load existing data when form opens or when existingMillInputs prop changes
  useEffect(() => {
    console.log('MillInputForm useEffect triggered:', { 
      isOpen, 
      orderId: order?.orderId, 
      existingMillInputsCount: existingMillInputs?.length,
      isEditing 
    });
    
    if (isOpen && order?.orderId) {
      console.log('Form opened, processing existing mill input data...');
      
      // Reset form state first
      setHasExistingData(false);
      setLocalMillInputs([]);
      setErrors({});
      setSuccessMessage('');
      
      // Initialize form with order ID
      setFormData(prev => ({
        ...prev,
        orderId: order.orderId || ''
      }));
      
      // Process existing data from props first
      if (existingMillInputs && existingMillInputs.length > 0) {
        console.log('✅ Processing existing mill inputs from props:', existingMillInputs.length);
        processExistingMillInputs(existingMillInputs);
      } else {
        console.log('No existing mill inputs from props, skipping API fetch for faster loading');
        // Skip API fetch to make form open faster - data will be loaded when needed
        setHasExistingData(false);
        setLocalMillInputs([]);
      }
    }
  }, [isOpen, order?.orderId, existingMillInputs, isEditing]);

  // Function to fetch mills directly from API
  const fetchMillsDirectly = async () => {
    setMillsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        setMillsLoading(false);
        return;
      }

      // Create AbortController for faster timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // Reduced to 1 second for faster response

      // Optimized API call with caching headers
      const response = await fetch('/api/mills?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=300, stale-while-revalidate=600'
        },
        signal: controller.signal,
        cache: 'force-cache' // Use browser cache for faster loading
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          console.log('Fetched mills directly from API:', data.data.length, 'mills');
          // Update local mills state for immediate display
          setLocalMills(data.data);
          // Also trigger refresh to update the mills prop
          onRefreshMills();
        } else {
          console.log('No mills found in API response');
          setLocalMills([]);
        }
      } else {
        console.log('Failed to fetch mills from API, status:', response.status);
        if (response.status === 401) {
          console.log('Authentication failed, please login again');
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Mills fetch was aborted due to timeout');
      } else {
        console.error('Error fetching mills from API:', error);
      }
    } finally {
      setMillsLoading(false);
    }
  };

  // Function to process existing mill inputs from props
  const processExistingMillInputs = (millInputs: any[]) => {
    console.log('Processing existing mill inputs:', millInputs);
    
    if (millInputs.length === 0) {
      setHasExistingData(false);
      setLocalMillInputs([]);
      return;
    }
    
    // Convert API data to form format
    const processedItems = millInputs.map((input, index) => ({
      id: input._id || `existing-${index}`,
      millDate: input.millDate ? new Date(input.millDate).toISOString().split('T')[0] : '',
      chalanNo: input.chalanNo || '',
      greighMtr: input.greighMtr?.toString() || '',
      pcs: input.pcs?.toString() || '',
      quality: input.quality?._id || input.quality || '',
      process: input.processName || '',
      additionalMeters: (input.additionalMeters || []).map((additional: any, addIndex: number) => ({
        meters: additional.greighMtr?.toString() || '',
        pieces: additional.pcs?.toString() || '',
        quality: additional.quality?._id || additional.quality || '',
        process: additional.processName || ''
      }))
    }));
    
    console.log('Processed mill input items:', processedItems);
    
    // Update form data with existing data
    setFormData(prev => ({
      ...prev,
      mill: millInputs[0]?.mill?._id || millInputs[0]?.mill || '',
      millItems: processedItems
    }));
    
    setLocalMillInputs(millInputs);
    setHasExistingData(true);
    setLoadingExistingData(false);
  };

  // Function to fetch existing mill input data from API
  const fetchExistingMillInputData = async () => {
    if (!order?.orderId) {
      console.log('No order ID available for fetching mill inputs');
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

      console.log('Fetching mill inputs for order:', order.orderId);
      const response = await fetch(`/api/mill-inputs?orderId=${order.orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Full API response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.data && data.data.millInputs && data.data.millInputs.length > 0) {
          console.log('✅ Found existing mill inputs from API:', data.data.millInputs.length, 'records');
          console.log('Mill inputs data:', data.data.millInputs);
          // Use the same processing function
          processExistingMillInputs(data.data.millInputs);
        } else {
          console.log('❌ No existing mill inputs found in API response');
          console.log('Response structure:', {
            success: data.success,
            hasData: !!data.data,
            hasMillInputs: !!(data.data && data.data.millInputs),
            millInputsLength: data.data?.millInputs?.length || 0
          });
          setLocalMillInputs([]);
          setHasExistingData(false);
        }
      } else {
        console.log('❌ Failed to fetch mill inputs from API, status:', response.status);
        const errorText = await response.text();
        console.log('Error response:', errorText);
        setHasExistingData(false);
      }
    } catch (error) {
      console.error('Error fetching mill inputs from API:', error);
      setHasExistingData(false);
    } finally {
      setLoadingExistingData(false);
    }
  };

  // Note: Removed dependency on isEditing and existingMillInputs props
  // Form now fetches data independently from API like LabDataModal

  // Monitor mills array changes and clear loading state
  useEffect(() => {
    console.log('Mills array changed:', mills);
    if (mills.length > 0) {
      console.log('Mills loaded successfully, clearing loading state');
      setMillsLoading(false);
    } else {
      console.log('No mills found, setting timeout to clear loading state');
      // Clear loading state after a timeout even if no mills are found
      const timeout = setTimeout(() => {
        console.log('Timeout reached, clearing loading state');
        setMillsLoading(false);
        // If still no mills after timeout, try to fetch directly
        if (mills.length === 0) {
          console.log('Still no mills after timeout, trying direct fetch...');
          fetchMillsDirectly();
        }
      }, 300); // Reduced to 300ms timeout for faster response
      
      return () => clearTimeout(timeout);
    }
  }, [mills]);

  // Reset form when order changes (but not when editing)
  useEffect(() => {
    if (order && !isEditing) {
      setFormData({
        orderId: order.orderId,
        mill: '',
        millItems: [{
          id: '1',
          millDate: '',
          chalanNo: '',
          greighMtr: '',
          pcs: '',
          quality: '', // Add quality field
          process: '', // Add process field
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
  }, [order?.orderId, isEditing]);

  // Function to load existing mill inputs from API data (LabDataModal pattern)
  const loadExistingMillInputsFromData = async (millInputsData: any[]) => {
    console.log('Loading existing mill inputs from API data:', { order: order?.orderId, millInputsData });
    
    if (!order || millInputsData.length === 0) {
      console.log('No order or existing mill inputs found');
      setHasExistingData(false);
      return;
    }
    
    try {
      // Group mill inputs by mill and chalan number
      const groupedInputs = groupMillInputsByMillAndChalan(millInputsData);
      console.log('Grouped inputs from API:', groupedInputs);
      
      if (groupedInputs.length > 0) {
        const firstGroup = groupedInputs[0];
        const newFormData = {
          orderId: order.orderId,
          mill: firstGroup.millId,
          millItems: groupedInputs.map((group, index) => {
            const mappedItem = {
              id: (index + 1).toString(),
              millDate: group.millDate,
              chalanNo: group.chalanNo,
              greighMtr: group.mainInput.greighMtr.toString(),
              pcs: group.mainInput.pcs.toString(),
              quality: group.mainInput.quality?._id || group.mainInput.quality || '', // Extract quality ID
              process: group.mainInput.processName || '', // Extract process name
              additionalMeters: group.additionalInputs.map((input: any) => {
                return {
                  meters: input.greighMtr.toString(),
                  pieces: input.pcs.toString(),
                  quality: input.quality?._id || input.quality || '', // Extract quality ID
                  process: input.processName || '' // Extract process name
                };
              })
            };
            
            return mappedItem;
          })
        };
        
        console.log('Setting form data from API:', newFormData);
        setFormData(newFormData);
        setHasExistingData(true);
      } else {
        console.log('No grouped inputs found from API');
        setHasExistingData(false);
      }
    } catch (error) {
      console.error('Error loading existing mill inputs from API:', error);
      setHasExistingData(false);
    }
  };

  // Function to load existing mill inputs from props (LabDataModal pattern)
  const loadExistingMillInputs = async () => {
    console.log('Loading existing mill inputs from props:', { order: order?.orderId, existingMillInputs });
    
    if (!order || existingMillInputs.length === 0) {
      console.log('No order or existing mill inputs found');
      setHasExistingData(false);
      return;
    }
    
    setLoadingExistingData(true);
    try {
      // Group mill inputs by mill and chalan number
      const groupedInputs = groupMillInputsByMillAndChalan(existingMillInputs);
      console.log('Grouped inputs from props:', groupedInputs);
      
      if (groupedInputs.length > 0) {
        const firstGroup = groupedInputs[0];
        const newFormData = {
          orderId: order.orderId,
          mill: firstGroup.millId,
          millItems: groupedInputs.map((group, index) => {
            const mappedItem = {
              id: (index + 1).toString(),
              millDate: group.millDate,
              chalanNo: group.chalanNo,
              greighMtr: group.mainInput.greighMtr.toString(),
              pcs: group.mainInput.pcs.toString(),
              quality: group.mainInput.quality?._id || group.mainInput.quality || '', // Extract quality ID
              process: group.mainInput.processName || '', // Extract process name
              additionalMeters: group.additionalInputs.map((input: any) => {
                return {
                  meters: input.greighMtr.toString(),
                  pieces: input.pcs.toString(),
                  quality: input.quality?._id || input.quality || '', // Extract quality ID
                  process: input.processName || '' // Extract process name
                };
              })
            };
            
            return mappedItem;
          })
        };
        
        console.log('Setting form data from props:', newFormData);
        setFormData(newFormData);
        setHasExistingData(true);
      } else {
        console.log('No grouped inputs found from props');
        setHasExistingData(false);
      }
    } catch (error) {
      console.error('Error loading existing mill inputs from props:', error);
      setHasExistingData(false);
    } finally {
      setLoadingExistingData(false);
    }
  };

  // Helper function to group mill inputs by mill and chalan
  const groupMillInputsByMillAndChalan = (millInputs: any[]) => {
    const groups: any[] = [];
    
    millInputs.forEach((input: any, index: number) => {
      const existingGroup = groups.find(group => 
        group.millId === input.mill._id && group.chalanNo === input.chalanNo
      );
      
      if (existingGroup) {
        // Add as additional input
        existingGroup.additionalInputs.push({
          greighMtr: input.greighMtr,
          pcs: input.pcs,
          quality: input.quality || '',
          processName: input.processName || ''
        });
      } else {
        // Create new group with main input and any additional meters from the database
        const additionalInputs: any[] = [];
        
        // Add the main input as the first additional input if it has additional meters
        if (input.additionalMeters && Array.isArray(input.additionalMeters) && input.additionalMeters.length > 0) {
          input.additionalMeters.forEach((additional: any, addIndex: number) => {
            additionalInputs.push({
              greighMtr: additional.greighMtr,
              pcs: additional.pcs,
              quality: additional.quality || '',
              processName: additional.processName || ''
            });
          });
        } else {
          }
        
        // IMPORTANT: If we have additional meters, we need to create a form structure that includes
        // both the main input (M1) and the additional inputs (M2, M3, etc.)
        // The main input should be the first item in the form, and additional meters should be
        // the additional items that get rendered as M2, M3, etc.
        
        groups.push({
          millId: input.mill._id,
          millDate: input.millDate,
          chalanNo: input.chalanNo,
          mainInput: {
            greighMtr: input.greighMtr,
            pcs: input.pcs,
            quality: input.quality || '',
            processName: input.processName || ''
          },
          additionalInputs: additionalInputs
        });
      }
    });
    
    return groups;
  };

  // Helper function to show which orders are using this mill
  const showMillUsage = async (millId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/mill-inputs?millId=${millId}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      const data = await response.json();
      if (data.success && data.data.millInputs) {
        data.data.millInputs.forEach((input: any, index: number) => {
          });
        }
    } catch (error) {
      }
  };

  // Delete mill input data (LabDataModal pattern)
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    setSaving(true);
    setErrors({});
    setSuccessMessage('');
    setShowDeleteConfirm(false);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      // Fetch all mill inputs for this order first
      const response = await fetch(`/api/mill-inputs?orderId=${order?.orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.millInputs && data.data.millInputs.length > 0) {
          // Delete all existing mill inputs for this order
          const deletePromises = data.data.millInputs.map((input: any) =>
            fetch(`/api/mill-inputs/${input._id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
          );

          await Promise.all(deletePromises);
          
      setSuccessMessage('Mill input data deleted successfully!');
      setHasExistingData(false);
      
      // Reset form to initial state
      setFormData({
        orderId: order?.orderId || '',
        mill: '',
        millItems: [{
          id: '1',
          millDate: '',
          chalanNo: '',
          greighMtr: '',
          pcs: '',
          quality: '',
          process: '',
          additionalMeters: []
        }],
      });
      
      // Close after delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
        } else {
          setErrors({ submit: 'No mill input data found to delete' });
        }
      } else {
        setErrors({ submit: 'Failed to fetch mill input data for deletion' });
      }
    } catch (error) {
      setErrors({ submit: 'Failed to delete mill input data' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Simple delete mill function - no confirmations or alerts
  const handleDeleteMill = async (millId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/mills/${millId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        // Clear the selected mill and search
        setFormData(prev => ({ ...prev, mill: '' }));
        setMillSearch('');
        // Refresh mills list
        onRefreshMills();
        } else {
        // This is expected behavior when mill is in use, not an error
        // If the error mentions mill inputs, show more details
        if (data.message && data.message.includes('mill input')) {
          await showMillUsage(millId);
          } else {
          }
      }
    } catch (error) {
      }
  };

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
          quality: '', // Add quality field
          process: '', // Add process field
          additionalMeters: []
        }
      ]
    });
    
    // Scroll to the newly added item after a short delay
    setTimeout(() => {
      const newItemElement = document.getElementById(`mill-item-${newId}`);
      if (newItemElement) {
        newItemElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
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

  // Increment/decrement functions for number inputs
  const incrementValue = (itemId: string, field: 'greighMtr' | 'pcs', step: number = 1) => {
    setFormData({
      ...formData,
      millItems: formData.millItems.map(item => {
        if (item.id === itemId) {
          const currentValue = parseFloat(item[field]) || 0;
          const newValue = currentValue + step;
          return { ...item, [field]: newValue.toString() };
        }
        return item;
      })
    });
  };

  const decrementValue = (itemId: string, field: 'greighMtr' | 'pcs', step: number = 1) => {
    setFormData({
      ...formData,
      millItems: formData.millItems.map(item => {
        if (item.id === itemId) {
          const currentValue = parseFloat(item[field]) || 0;
          const newValue = Math.max(0, currentValue - step);
          return { ...item, [field]: newValue.toString() };
        }
        return item;
      })
    });
  };

  const addAdditionalMeters = (itemId: string) => {
    setFormData({
      ...formData,
      millItems: formData.millItems.map(item =>
        item.id === itemId
          ? {
              ...item,
              additionalMeters: [...item.additionalMeters, { meters: '', pieces: '', quality: '', process: '' }]
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

  const updateAdditionalMeters = (itemId: string, index: number, field: 'meters' | 'pieces' | 'quality' | 'process', value: string) => {
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

  // Quality helper functions
  const getQualityId = (quality: any) => {
    return quality?._id || quality?.id || quality;
  };

  const getFilteredQualities = (itemId: string, type: 'main' | 'additional', index?: number) => {
    // Debug logging
    console.log('MillInputForm getFilteredQualities called:', { itemId, type, index, qualities });
    // Safety check for undefined qualities
    if (!qualities || !Array.isArray(qualities)) {
      console.log('MillInputForm: No qualities available or not an array:', qualities);
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
      updateMillItem(itemId, 'quality', qualityId);
    } else {
      updateAdditionalMeters(itemId, index!, 'quality', qualityId);
    }
    
    setQualitySearchStates(prev => ({ ...prev, [searchKey]: quality.name }));
    setCurrentQualitySearch(quality.name);
    setActiveQualityDropdown(null);
  };

  // Process helper functions
  const getFilteredProcesses = (itemId: string, type: 'main' | 'additional', index?: number) => {
    const searchKey = `${itemId}_${type}${index !== undefined ? `_${index}` : ''}`;
    const searchTerm = activeProcessDropdown?.itemId === itemId && activeProcessDropdown?.type === type && activeProcessDropdown?.index === index 
      ? currentProcessSearch 
      : (processSearchStates[searchKey] || '');
    
    const filtered = PROCESS_OPTIONS.filter(process =>
      process.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered;
  };

  const handleProcessSelect = (itemId: string, type: 'main' | 'additional', process: string, index?: number) => {
    const searchKey = `${itemId}_${type}${index !== undefined ? `_${index}` : ''}`;
    
    if (type === 'main') {
      updateMillItem(itemId, 'process', process);
    } else {
      updateAdditionalMeters(itemId, index!, 'process', process);
    }
    
    setProcessSearchStates(prev => ({ ...prev, [searchKey]: process }));
    setCurrentProcessSearch(process);
    setActiveProcessDropdown(null);
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};

    if (!formData.mill || formData.mill.trim() === '') {
      newErrors.mill = 'Please select a mill';
    }

    formData.millItems.forEach((item, itemIndex) => {
      if (!item.quality || item.quality.trim() === '') {
        newErrors[`quality_${item.id}`] = 'Quality is required';
      }
      if (!item.millDate || item.millDate.trim() === '') {
        newErrors[`millDate_${item.id}`] = 'Mill date is required';
      }
      if (!item.chalanNo || item.chalanNo.trim() === '') {
        newErrors[`chalanNo_${item.id}`] = 'Chalan number is required';
      }
      if (!item.greighMtr || item.greighMtr.trim() === '' || parseFloat(item.greighMtr) <= 0) {
        newErrors[`greighMtr_${item.id}`] = 'Valid greigh meters is required';
      }
      if (!item.pcs || item.pcs.trim() === '' || parseInt(item.pcs) <= 0) {
        newErrors[`pcs_${item.id}`] = 'Valid number of pieces is required';
      }

      item.additionalMeters.forEach((additional, additionalIndex) => {
        if (!additional.quality || additional.quality.trim() === '') {
          newErrors[`additionalQuality_${item.id}_${additionalIndex}`] = 'Quality is required';
        }
        if (!additional.meters || additional.meters.trim() === '' || parseFloat(additional.meters) <= 0) {
          newErrors[`additionalMeters_${item.id}_${additionalIndex}_meters`] = 'Valid additional meters is required';
        }
        if (!additional.pieces || additional.pieces.trim() === '' || parseInt(additional.pieces) <= 0) {
          newErrors[`additionalMeters_${item.id}_${additionalIndex}_pieces`] = 'Valid additional pieces is required';
        }
      });
    });

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (!isValid) {
      console.log('Validation failed:', newErrors);
    }
    
    return isValid;
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setSavingProgress('Preparing data...');
    setSuccessMessage('');
    setErrors({});
    
    try {
      const token = localStorage.getItem('token');
      
      if (hasExistingData) {
        setSavingProgress('Updating existing mill inputs...');
        // Update existing mill inputs
        await updateExistingMillInputs(token);
      } else {
        setSavingProgress('Creating new mill inputs...');
        // Create new mill inputs
        await createNewMillInputs(token);
      }
      
      setSavingProgress('Saving completed successfully!');
      setSuccessMessage('Mill input data saved successfully!');
      
      // Immediately update local state for better UX (LabDataModal pattern)
      setHasExistingData(true);
      
      // Refresh the local data to show updated state
      await fetchExistingMillInputData();
            // Show success message for 1 second, then close
      setTimeout(() => {
        setSuccessMessage('');
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to handle mill input' });
      setSavingProgress('');
    } finally {
      setSaving(false);
    }
  };

  // Function to create new mill inputs (optimized with parallel requests)
  const createNewMillInputs = async (token: string | null) => {
    if (!token) throw new Error('No authentication token');

    // Prepare all requests in parallel
    const requests = formData.millItems.map(async (item) => {
      // Prepare additional meters data
      const additionalMeters = item.additionalMeters
        .filter(additional => additional.meters && additional.pieces && additional.quality)
        .map(additional => ({
          greighMtr: parseFloat(additional.meters),
          pcs: parseInt(additional.pieces),
          quality: additional.quality,
          processName: additional.process || ''
        }));

      // Debug log to see what's being sent
      // Send single request with all data for this item
      const requestBody = {
        orderId: formData.orderId,
        mill: formData.mill,
        millDate: item.millDate,
        chalanNo: item.chalanNo,
        greighMtr: parseFloat(item.greighMtr),
        pcs: parseInt(item.pcs),
        quality: item.quality, // Add quality field
        processName: item.process, // Add process field
        additionalMeters: additionalMeters.length > 0 ? additionalMeters : [],
        notes: ''
      };

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout for faster response

      const response = await fetch('/api/mill-inputs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.message || 'Server error'}`);
      }
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to add mill input');
      }

      return data;
    });

    // Execute all requests in parallel
    try {
      const results = await Promise.all(requests);
      } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while saving mill inputs');
    }
  };

  // Function to update existing mill inputs
  const updateExistingMillInputs = async (token: string | null) => {
    if (!token) throw new Error('No authentication token');
    
    // First fetch all existing mill inputs for this order
    const response = await fetch(`/api/mill-inputs?orderId=${order?.orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data && data.data.millInputs && data.data.millInputs.length > 0) {
        // Delete all existing mill inputs for this order
        const deletePromises = data.data.millInputs.map((input: any) =>
      fetch(`/api/mill-inputs/${input._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    );

    await Promise.all(deletePromises);
      }
    }

    // Then create new ones with updated data
    await createNewMillInputs(token);
  };

  const handleAddMill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addMillForm.name.trim()) {
      setErrors({ addMill: 'Mill name is required' });
      return;
    }

    setAddingMill(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/mills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: addMillForm.name.trim()
        })
      });

      const data = await response.json();
      if (data.success) {
        // Auto-select the newly added mill
        const newMillId = data.data._id;
        const newMillName = data.data.name;
        setFormData(prev => ({ ...prev, mill: newMillId }));
        setMillSearch(newMillName);
        
        // Set recently added indicator
        setRecentlyAddedMill(newMillId);
        
        // Refresh mills list
        onRefreshMills();
        
        // Close modal and show success
        setShowAddMillModal(false);
        // Clear the "recently added" indicator after 3 seconds
        setTimeout(() => {
          setRecentlyAddedMill(null);
        }, 3000);
        
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
      setErrors({ addMill: 'Failed to add mill' });
    } finally {
      setAddingMill(false);
    }
  };

  if (!order) return null;

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
          {loadingExistingData && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-10">
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm">Loading existing mill inputs...</p>
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
                <p className="mt-3 text-sm font-medium">Saving mill input data...</p>
                <p className="mt-1 text-xs text-gray-500">{savingProgress || 'Please wait while we process your data'}</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                </div>
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
                <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
                <h2 className="text-2xl font-bold">
                  Mill Input
                </h2>
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

              {/* Mill Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                  <label className={`block text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                    Mill Name <span className="text-red-500">*</span>
                </label>


                {millsLoading && mills.length === 0 && localMills.length === 0 ? (
                  <div className={`p-4 text-center rounded-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-600'
                  }`}>
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <p className="text-sm">Loading mills...</p>
                    </div>
                  </div>
                ) : mills.length === 0 && localMills.length === 0 ? (
                  <div className={`p-4 text-center rounded-lg border ${
                    isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-400' : 'bg-gray-50 border-gray-300 text-gray-600'
                  }`}>
                    <div className="flex flex-col items-center space-y-3">
                      <p className="text-sm">No mills available</p>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={fetchMillsDirectly}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                              : 'bg-gray-500 hover:bg-gray-600 text-white'
                          }`}
                        >
                          Refresh Mills
                        </button>
                    <button
                      type="button"
                      onClick={() => setShowAddMillModal(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                        Add New Mill
                    </button>
                      </div>
                </div>
                  </div>
                ) : (
                  <div className="relative">
                    <EnhancedDropdown
                      options={localMills.length > 0 ? localMills : mills}
                      value={formData.mill}
                      onChange={(value) => {
                        setFormData({ ...formData, mill: value });
                      }}
                      placeholder="Search mills..."
                      searchValue={millSearch}
                      onSearchChange={setMillSearch}
                      showDropdown={showMillDropdown}
                      onToggleDropdown={() => {
                        // Close any active quality and process dropdowns first
                        setActiveQualityDropdown(null);
                        setCurrentQualitySearch('');
                        setActiveProcessDropdown(null);
                        setCurrentProcessSearch('');
                        // Toggle mill dropdown
                        setShowMillDropdown(!showMillDropdown);
                      }}
                      onSelect={(mill) => {
                        setFormData({ ...formData, mill: mill._id });
                        setMillSearch(mill.name);
                        setShowMillDropdown(false);
                      }}
                      isDarkMode={isDarkMode}
                      error={errors.mill}
                    onAddNew={() => setShowAddMillModal(true)}
                    onDelete={(mill) => {
                      handleDeleteMill(mill._id);
                    }}
                    recentlyAddedId={recentlyAddedMill}
                  />
                  {millsLoading && (mills.length > 0 || localMills.length > 0) && (
                    <div className="absolute top-2 right-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  </div>
                )}
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
                    <div key={item.id} id={`mill-item-${item.id}`} className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                      isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                    }`}>
                      {/* Main Fields Row 1 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Mill Date */}
                        <div>
                          <label className={`block text-sm font-medium mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                            Mill Date <span className="text-red-500">*</span>
                        </label>
                        <CustomDatePicker
                          value={item.millDate}
                          onChange={(value) => updateMillItem(item.id, 'millDate', value)}
                          placeholder="Select mill date"
                          isDarkMode={isDarkMode}
                        />
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
                          required
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
                    </div>

                    {/* Additional Meters & Pieces Section */}
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
                        {/* M1 and P1 Fields (Always visible) */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Quality for M1 */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Quality M1 <span className="text-red-500">*</span>
                            </label>
                              {onRefreshQualities && (
                                <button
                                  type="button"
                                  onClick={onRefreshQualities}
                                  className={`p-1 rounded transition-colors ${
                                    isDarkMode 
                                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                  title="Refresh qualities"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <div className="relative">
                            <EnhancedDropdown
                              options={getFilteredQualities(item.id, 'main')}
                              value={item.quality}
                              onChange={(value) => updateMillItem(item.id, 'quality', value)}
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
                                  // Close mill and process dropdowns if open
                                  setShowMillDropdown(false);
                                  setActiveProcessDropdown(null);
                                  setCurrentProcessSearch('');
                                  
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
                              {item.quality && (
                                <button
                                  type="button"
                                  onClick={() => updateMillItem(item.id, 'quality', '')}
                                  className={`absolute right-8 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-opacity-80 transition-colors ${
                                    isDarkMode 
                                      ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/20' 
                                      : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                                  }`}
                                  title="Clear quality"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Process for M1 */}
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Process M1
                            </label>
                            <div className="relative">
                              <EnhancedDropdown
                                options={getFilteredProcesses(item.id, 'main').map(process => ({ name: process, _id: process }))}
                              value={item.process}
                                onChange={(value) => updateMillItem(item.id, 'process', value)}
                                placeholder="Search process..."
                                searchValue={activeProcessDropdown?.itemId === item.id && activeProcessDropdown?.type === 'main' 
                                  ? currentProcessSearch 
                                  : (processSearchStates[`${item.id}_main`] || '')}
                                onSearchChange={(value) => {
                                  if (activeProcessDropdown?.itemId === item.id && activeProcessDropdown?.type === 'main') {
                                    setCurrentProcessSearch(value);
                                  } else {
                                    setProcessSearchStates(prev => ({ ...prev, [`${item.id}_main`]: value }));
                                  }
                                }}
                                showDropdown={activeProcessDropdown?.itemId === item.id && activeProcessDropdown?.type === 'main'}
                                onToggleDropdown={() => {
                                  // Close mill and quality dropdowns if open
                                  setShowMillDropdown(false);
                                  setActiveQualityDropdown(null);
                                  setCurrentQualitySearch('');
                                  
                                  if (activeProcessDropdown?.itemId === item.id && activeProcessDropdown?.type === 'main') {
                                    setActiveProcessDropdown(null);
                                    setCurrentProcessSearch('');
                                  } else {
                                    setActiveProcessDropdown({ itemId: item.id, type: 'main' });
                                    setCurrentProcessSearch(processSearchStates[`${item.id}_main`] || '');
                                  }
                                }}
                                onSelect={(process) => handleProcessSelect(item.id, 'main', process.name)}
                                isDarkMode={isDarkMode}
                                error={errors[`process_${item.id}`]}
                              />
                              {item.process && (
                                <button
                                  type="button"
                                  onClick={() => updateMillItem(item.id, 'process', '')}
                                  className={`absolute right-8 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-opacity-80 transition-colors ${
                                    isDarkMode 
                                      ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/20' 
                                      : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                                  }`}
                                  title="Clear process"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            {errors[`process_${item.id}`] && (
                              <p className={`text-sm mt-1 ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
                              }`}>
                                {errors[`process_${item.id}`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Greigh Meters M1 <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={item.greighMtr}
                                onChange={(e) => updateMillItem(item.id, 'greighMtr', e.target.value)}
                                placeholder="Enter meters"
                                min="0"
                                step="0.01"
                                required
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
                              Number of Pieces P1 <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={item.pcs}
                                onChange={(e) => updateMillItem(item.id, 'pcs', e.target.value)}
                                placeholder="Enter pieces"
                                min="0"
                                required
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
                        </div>

                        {item.additionalMeters.map((additional, index) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Quality for Additional Meters */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className={`text-sm font-medium ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Quality M{index + 2} <span className="text-red-500">*</span>
                              </label>
                                {onRefreshQualities && (
                                  <button
                                    type="button"
                                    onClick={onRefreshQualities}
                                    className={`p-1 rounded transition-colors ${
                                      isDarkMode 
                                        ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                    title="Refresh qualities"
                                  >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <div className="relative">
                              <EnhancedDropdown
                                options={getFilteredQualities(item.id, 'additional', index)}
                                value={additional.quality}
                                onChange={(value) => updateAdditionalMeters(item.id, index, 'quality', value)}
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
                                    // Close mill and process dropdowns if open
                                    setShowMillDropdown(false);
                                    setActiveProcessDropdown(null);
                                    setCurrentProcessSearch('');
                                    
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
                                {additional.quality && (
                                  <button
                                    type="button"
                                    onClick={() => updateAdditionalMeters(item.id, index, 'quality', '')}
                                    className={`absolute right-8 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-opacity-80 transition-colors ${
                                      isDarkMode 
                                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/20' 
                                        : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                                    }`}
                                    title="Clear quality"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Process for Additional Meters */}
                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Process M{index + 2}
                              </label>
                              <div className="relative">
                                <EnhancedDropdown
                                  options={getFilteredProcesses(item.id, 'additional', index).map(process => ({ name: process, _id: process }))}
                                value={additional.process}
                                  onChange={(value) => updateAdditionalMeters(item.id, index, 'process', value)}
                                  placeholder="Search process..."
                                  searchValue={activeProcessDropdown?.itemId === item.id && activeProcessDropdown?.type === 'additional' && activeProcessDropdown?.index === index
                                    ? currentProcessSearch 
                                    : (processSearchStates[`${item.id}_additional_${index}`] || '')}
                                  onSearchChange={(value) => {
                                    if (activeProcessDropdown?.itemId === item.id && activeProcessDropdown?.type === 'additional' && activeProcessDropdown?.index === index) {
                                      setCurrentProcessSearch(value);
                                    } else {
                                      setProcessSearchStates(prev => ({ ...prev, [`${item.id}_additional_${index}`]: value }));
                                    }
                                  }}
                                  showDropdown={activeProcessDropdown?.itemId === item.id && activeProcessDropdown?.type === 'additional' && activeProcessDropdown?.index === index}
                                  onToggleDropdown={() => {
                                    // Close mill and quality dropdowns if open
                                    setShowMillDropdown(false);
                                    setActiveQualityDropdown(null);
                                    setCurrentQualitySearch('');
                                    
                                    if (activeProcessDropdown?.itemId === item.id && activeProcessDropdown?.type === 'additional' && activeProcessDropdown?.index === index) {
                                      setActiveProcessDropdown(null);
                                      setCurrentProcessSearch('');
                                    } else {
                                      setActiveProcessDropdown({ itemId: item.id, type: 'additional', index });
                                      setCurrentProcessSearch(processSearchStates[`${item.id}_additional_${index}`] || '');
                                    }
                                  }}
                                  onSelect={(process) => handleProcessSelect(item.id, 'additional', process.name, index)}
                                  isDarkMode={isDarkMode}
                                  error={errors[`additionalProcess_${item.id}_${index}`]}
                                />
                                {additional.process && (
                                  <button
                                    type="button"
                                    onClick={() => updateAdditionalMeters(item.id, index, 'process', '')}
                                    className={`absolute right-8 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-opacity-80 transition-colors ${
                                      isDarkMode 
                                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/20' 
                                        : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                                    }`}
                                    title="Clear process"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              {errors[`additionalProcess_${item.id}_${index}`] && (
                                <p className={`text-sm mt-1 ${
                                  isDarkMode ? 'text-red-400' : 'text-red-600'
                                }`}>
                                  {errors[`additionalProcess_${item.id}_${index}`]}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className={`block text-sm font-medium mb-2 ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                Greigh Meters M{index + 2} <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={additional.meters}
                                  onChange={(e) => updateAdditionalMeters(item.id, index, 'meters', e.target.value)}
                                  placeholder="Enter meters"
                                  min="0"
                                  step="0.01"
                                  required
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
                                Number of Pieces P{index + 2} <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={additional.pieces}
                                  onChange={(e) => updateAdditionalMeters(item.id, index, 'pieces', e.target.value)}
                                  placeholder="Enter pieces"
                                  min="0"
                                  required
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
                {saving ? 'Saving...' : loadingExistingData ? 'Loading...' : (hasExistingData ? 'Update Mill Input' : 'Add Mill Input')}
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
                    disabled={addingMill}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      addingMill
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isDarkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {addingMill ? 'Adding...' : 'Add Mill'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                  <h3 className="text-lg font-semibold">Delete Mill Input Data</h3>
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
                    Are you sure you want to delete all mill input data for this order? This action cannot be undone.
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
                        This will permanently remove all mill input data for this order.
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
                        Delete Mill Input Data
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
    </div>
    </>
  );
}

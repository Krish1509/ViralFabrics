'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  XMarkIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  InformationCircleIcon,
  CalendarIcon,
  EyeIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { Order, Party, Quality, OrderFormData, OrderItem } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';
import QualityModal from './QualityModal';
import PartyModal from './PartyModal';

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

interface ValidationErrors {
  [key: string]: string;
}

// Helper function to parse dates from various formats
const parseDateFromInput = (displayValue: string) => {
  if (!displayValue) return '';
  
  // Handle dd/mm/yyyy format specifically (most common)
  const ddMmYyyyMatch = displayValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddMmYyyyMatch) {
    const [, dayStr, monthStr, yearStr] = ddMmYyyyMatch;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    
    // Validate date components properly
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      try {
        const date = new Date(year, month - 1, day);
        // Check if the date is valid (handles leap years, etc.)
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Invalid date
      }
    }
  }
  
  // Handle yyyy-mm-dd format
  const yyyyMmDdMatch = displayValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyyMmDdMatch) {
    const [, yearStr, monthStr, dayStr] = yyyyMmDdMatch;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
      try {
        const date = new Date(year, month - 1, day);
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Invalid date
      }
    }
  }
  
  // Handle partial dd/mm/yyyy (for typing)
  const partialMatch = displayValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{1,4})$/);
  if (partialMatch) {
    const [, dayStr, monthStr, yearStr] = partialMatch;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    
    // Allow partial years (2 digits) and convert to 4 digits
    let fullYear = year;
    if (year < 100) {
      fullYear = year < 50 ? 2000 + year : 1900 + year;
    }
    
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && fullYear >= 1900 && fullYear <= 2100) {
      try {
        const date = new Date(fullYear, month - 1, day);
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === fullYear) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        // Invalid date
      }
    }
  }
  
  // If no valid format found, return empty string to avoid validation errors
  return '';
};

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
  const parseDateFromDisplay = parseDateFromInput;

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
              
              // Allow any characters for free typing
              setInputValue(value);
              
              // Only try to parse if it looks like a complete date
              if (value.length >= 8) {
              const parsedDate = parseDateFromDisplay(value);
              onChange(parsedDate);
              } else {
                // Don't trigger validation for incomplete dates
                onChange('');
              }
            }}
                       onKeyDown={handleKeyDown}
           placeholder="dd/mm/yyyy"
           onFocus={() => setShowCalendar(true)}
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

             {showCalendar && (
         <div 
           ref={calendarRef}
           onClick={handleCalendarClick}
           className={`absolute z-50 mt-1 p-4 rounded-lg border shadow-xl calendar-container date-picker ${
           isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
           }`}
         >
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
              }}
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
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
              className={`px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold ${
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
                className={`px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold ${
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
              className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              <ChevronDownIcon className="h-4 w-4 transform -rotate-90" />
            </button>
          </div>

          {/* Month Picker */}
          {showMonthPicker && (
            <div className="mb-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
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
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
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
            <div className="mb-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
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
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
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
                  `hover:bg-gray-200 dark:hover:bg-gray-700 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`
                }`}
              >
                {day?.getDate()}
              </button>
            ))}
          </div>
        </div>
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
        // Don't auto-close if clicking on calendar or other important elements
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
  const selectedItem = options.find(option => (option._id || (option as any).id) === value);
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
            title="Add New"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className={`absolute z-50 w-full mt-1 rounded-lg border shadow-xl max-h-60 overflow-y-auto ${
          isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          {options.length > 0 ? (
            // Sort options: recently added items last (at bottom), then alphabetically
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
                    {(option.contactName || option.contactPhone) && (
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {option.contactName && <span>{option.contactName}</span>}
                        {option.contactName && option.contactPhone && <span> • </span>}
                        {option.contactPhone && <span>{option.contactPhone}</span>}
                      </div>
                    )}
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
                <p className="font-medium">No options found</p>
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
                    Add New
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}

// Image Upload Component
function ImageUploadSection({
  itemIndex,
  imageUrls,
  onImageUpload,
  onRemoveImage,
  onPreviewImage,
  isDarkMode,
  imageUploading
}: {
  itemIndex: number;
  imageUrls: string[];
  onImageUpload: (file: File, index: number) => void;
  onRemoveImage: (itemIndex: number, imageIndex: number) => void;
  onPreviewImage: (url: string, index: number) => void;
  isDarkMode: boolean;
  imageUploading: { [key: number]: boolean };
}) {
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ensure video plays when camera modal opens
  useEffect(() => {
    if (showCamera && videoRef.current && cameraStream) {
      const video = videoRef.current;
      video.srcObject = cameraStream;
      video.onloadedmetadata = () => {
        video.play().catch(e => {
          console.log('Video play error:', e);
          // Retry after a short delay
          setTimeout(() => {
            video.play().catch(e2 => console.log('Retry video play error:', e2));
          }, 200);
        });
      };
    }
  }, [showCamera, cameraStream]);

  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      return cameras;
    } catch (error) {
      console.error('Error getting cameras:', error);
      return [];
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Get available cameras first
      const cameras = await getAvailableCameras();
      if (cameras.length === 0) {
        setCameraError('No cameras found');
        return;
      }

      // Get current camera device
      const currentCamera = cameras[currentCameraIndex];
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          deviceId: currentCamera ? { exact: currentCamera.deviceId } : undefined,
          facingMode: currentCameraIndex === 0 ? 'environment' : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setCameraStream(stream);
      setShowCamera(true);
      
      // Wait for the modal to render before setting up video
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => {
              console.log('Video play error:', e);
              // Try to play again after a short delay
              setTimeout(() => {
                videoRef.current?.play().catch(e2 => console.log('Retry video play error:', e2));
              }, 100);
            });
          };
        }
      }, 100);
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraError('Camera access denied. Please allow camera access.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCameraError(null);
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    
    // Stop current stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    // Switch to next camera
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    
    // Start new stream
    try {
      const nextCamera = availableCameras[nextIndex];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          deviceId: { exact: nextCamera.deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      setCameraError('Failed to switch camera');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Flip the image back to normal orientation
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onImageUpload(file, itemIndex);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium mb-3">Images</label>
      
      {/* Upload Area */}
      <div className="flex items-center space-x-4 mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImageUpload(file, itemIndex);
          }}
          className="hidden"
          id={`image-upload-${itemIndex}`}
        />
        <label
          htmlFor={`image-upload-${itemIndex}`}
          className={`px-6 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? 'border-gray-600 hover:border-blue-500 text-gray-300 hover:text-blue-400' 
              : 'border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600'
          }`}
        >
          <CloudArrowUpIcon className="h-5 w-5 inline mr-2" />
          Upload Image
        </label>
        
        {/* Camera Button */}
        <button
          type="button"
          onClick={startCamera}
          className={`px-6 py-3 rounded-lg border-2 border-dashed transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? 'border-gray-600 hover:border-green-500 text-gray-300 hover:text-green-400' 
              : 'border-gray-300 hover:border-green-400 text-gray-600 hover:text-green-600'
          }`}
        >
          <PhotoIcon className="h-5 w-5 inline mr-2" />
          Camera
        </button>
        
        {imageUploading[itemIndex] && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Uploading...</span>
          </div>
        )}
      </div>
      
      
                           {/* Image Previews */}
        {imageUrls && imageUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {imageUrls.map((url, imgIndex) => {
              console.log('🔍 Rendering image:', { itemIndex, imgIndex, url });
              return (
              <div key={`${itemIndex}-${imgIndex}-${url}`} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-200 bg-gray-100 dark:bg-gray-700">
                  <img
                    src={url}
                    alt={`Item ${itemIndex + 1} image ${imgIndex + 1}`}
                       className="w-full h-full object-cover"
                                          onError={(e) => {
                         console.error('🔍 Image load error:', { url, error: e });
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                       }}
                       onLoad={(e) => {
                         console.log('🔍 Image loaded successfully:', { url });
                         const target = e.target as HTMLImageElement;
                         if (target) {
                           target.style.opacity = '1';
                         }
                       }}
                       style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                     />
                     
                     {/* Preview Button - Shows on Hover */}
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                       <button
                         type="button"
                         onClick={() => onPreviewImage(url, imgIndex)}
                         className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg hover:scale-110 transition-all duration-200"
                         title="Preview Image"
                       >
                         <EyeIcon className="h-5 w-5" />
                       </button>
                  </div>
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => onRemoveImage(itemIndex, imgIndex)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 hover:scale-110"
                  title="Remove Image"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
              );
            })}
          </div>
        )}

             {/* Camera Modal */}
       {showCamera && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
           <div className={`relative max-w-4xl w-full rounded-xl overflow-hidden ${
             isDarkMode ? 'bg-gray-800' : 'bg-white'
           }`}>
             <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
               <h3 className={`text-lg font-semibold ${
                 isDarkMode ? 'text-white' : 'text-gray-900'
               }`}>📸 Camera</h3>
               <div className="flex items-center space-x-2">
                 {availableCameras.length > 1 && (
                   <button
                     type="button"
                     onClick={switchCamera}
                     className={`p-2 rounded-lg transition-colors ${
                       isDarkMode 
                         ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                         : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                     }`}
                     title="Switch Camera"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                   </button>
                 )}
                 <button
                   type="button"
                   onClick={stopCamera}
                   className={`p-2 rounded-lg transition-colors ${
                     isDarkMode 
                       ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                       : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                   }`}
                 >
                   <XMarkIcon className="w-5 h-5" />
                 </button>
               </div>
             </div>
             
             <div className="p-4">
               {cameraError ? (
                 <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg">
                   <div className="text-center">
                     <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                     </svg>
                     <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{cameraError}</p>
                   </div>
                 </div>
               ) : (
                 <div className="relative">
               <video
                 ref={videoRef}
                 autoPlay
                 playsInline
                 muted
                     className="w-full h-96 object-cover rounded-lg bg-black"
                 style={{ transform: 'scaleX(-1)' }}
               />
               <canvas ref={canvasRef} className="hidden" />
                   
                   {/* Camera Info */}
                   <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                     {availableCameras[currentCameraIndex]?.label || `Camera ${currentCameraIndex + 1}`}
             </div>
             
                   {/* Camera Controls */}
                   <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                     {/* Photo Button */}
               <button
                 type="button"
                 onClick={capturePhoto}
                       className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                     >
                       <div className="w-12 h-12 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center">
                         <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                       </div>
               </button>
                   </div>
                 </div>
               )}
             </div>
             
             <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
               <div className="flex items-center justify-between text-sm">
                 <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                   {availableCameras.length > 0 ? `${currentCameraIndex + 1} of ${availableCameras.length} cameras` : 'No cameras available'}
                 </span>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}

export default function OrderForm({ order, parties, qualities, onClose, onSuccess, onAddParty, onRefreshParties, onAddQuality }: OrderFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [formData, setFormData] = useState<OrderFormData>({
    orderType: undefined,
    status: 'Not selected', // Default to "Not selected" instead of undefined
    arrivalDate: '',
    party: '',
    contactName: '',
    contactPhone: '',
    poNumber: '',
    styleNo: '',
    poDate: '',
    deliveryDate: '',
    weaverSupplierName: '',
    purchaseRate: '',
    items: [{
      quality: '',
      quantity: '', // Always initialize as empty string, never null
      imageUrls: [],
      description: ''
    }]
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [partySearch, setPartySearch] = useState('');
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [qualitySearch, setQualitySearch] = useState('');
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);
  const [activeQualityDropdown, setActiveQualityDropdown] = useState<number | null>(null);
  const [selectedPartyName, setSelectedPartyName] = useState('');
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [imageUploading, setImageUploading] = useState<{ [key: number]: boolean }>({});
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState<{ url: string; index: number } | null>(null);
  const [pendingNewParty, setPendingNewParty] = useState<Party | null>(null);
  const [qualitySearchStates, setQualitySearchStates] = useState<{ [key: number]: string }>({});
  const [recentlyAddedQuality, setRecentlyAddedQuality] = useState<string | null>(null);
  const [recentlyAddedParty, setRecentlyAddedParty] = useState<string | null>(null);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [currentQualitySearch, setCurrentQualitySearch] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  // Helper function to get quality ID (handles both _id and id from API)
  const getQualityId = (quality: any) => {
    return quality._id || quality.id || '';
  };

  // Helper function to get party ID (handles both _id and id from API)
  const getPartyId = (party: any) => {
    return party._id || party.id || '';
  };

  // Delete functions
  const handleDeleteParty = async (party: Party) => {
    try {
      const partyId = getPartyId(party);
      if (!partyId) {
        setValidationMessage({ type: 'error', text: 'Invalid party ID' });
        return;
      }

      const response = await fetch(`/api/parties/${partyId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        // Refresh parties list
        onRefreshParties();
        setValidationMessage({ type: 'success', text: 'Party deleted successfully!' });
      } else {
        setValidationMessage({ type: 'error', text: data.message || 'Failed to delete party' });
      }
    } catch (error) {
      setValidationMessage({ type: 'error', text: 'Failed to delete party' });
    }
  };

  const handleDeleteQuality = async (quality: Quality) => {
    try {
      const qualityId = getQualityId(quality);
      if (!qualityId) {
        setValidationMessage({ type: 'error', text: 'Invalid quality ID' });
        return;
      }

      const response = await fetch(`/api/qualities/${qualityId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        // Refresh qualities list
        onAddQuality(null); // This will trigger a refresh
        setValidationMessage({ type: 'success', text: 'Quality deleted successfully!' });
      } else {
        setValidationMessage({ type: 'error', text: data.message || 'Failed to delete quality' });
      }
    } catch (error) {
      setValidationMessage({ type: 'error', text: 'Failed to delete quality' });
    }
  };

  // Auto-dismiss validation message after 3 seconds
  useEffect(() => {
    if (validationMessage) {
      const timer = setTimeout(() => {
        setValidationMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [validationMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as any);
      }
      // Alt + N to add new item (avoid browser conflicts)
      if (e.altKey && e.key === 'n') {
        e.preventDefault();
        addItem();
      }
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
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

  // Auto-select newly added party
  useEffect(() => {
    if (pendingNewParty) {
      handleFieldChange('party', pendingNewParty._id || '');
      setSelectedPartyName(pendingNewParty.name);
      setPartySearch(pendingNewParty.name);
      setRecentlyAddedParty(pendingNewParty._id || '');
      setPendingNewParty(null);
      
      // Clear the "recently added" indicator after 3 seconds
      setTimeout(() => {
        setRecentlyAddedParty(null);
      }, 3000);
    }
  }, [pendingNewParty]);



  // Update quality search states when qualities change
  useEffect(() => {
    formData.items.forEach((item, index) => {
      if (item.quality) {
        const selectedQuality = qualities.find(q => q._id === item.quality);
        if (selectedQuality) {
          setQualitySearchStates(prev => ({
            ...prev,
            [index]: selectedQuality.name
          }));
        }
      }
    });
  }, [formData.items, qualities]);



  // Initialize form data from existing order
  useEffect(() => {
    if (order) {
      const partyId = typeof order.party === 'string' ? order.party : order.party?._id || '';
      const partyName = typeof order.party === 'string' ? '' : order.party?.name || '';
      
      setFormData({
        orderType: order.orderType,
        status: order.status || 'Not selected', // Default to "Not selected" if status is undefined
        arrivalDate: order.arrivalDate ? new Date(order.arrivalDate).toISOString().split('T')[0] : '',
        party: partyId,
        contactName: order.contactName || '',
        contactPhone: order.contactPhone || '',
        poNumber: order.poNumber || '',
        styleNo: order.styleNo || '',
        poDate: order.poDate ? new Date(order.poDate).toISOString().split('T')[0] : '',
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
        weaverSupplierName: order.weaverSupplierName || '',
        purchaseRate: order.purchaseRate ? String(order.purchaseRate) : '',
                 items: order.items.length > 0 ? order.items.map(item => ({
           quality: typeof item.quality === 'string' ? item.quality : item.quality?._id || '',
           quantity: item.quantity !== undefined && item.quantity !== null && item.quantity !== '' ? String(item.quantity) : '',
           imageUrls: item.imageUrls || [],
           description: item.description || ''
         })) : [{
           quality: '',
           quantity: '', // Always empty string, never null
           imageUrls: [],
           description: ''
         }]
      });
      
      setSelectedPartyName(partyName);
      setFormInitialized(true);
    } else {
      setFormInitialized(true);
    }
    

  }, [order]);

  // Validation function
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    if (!formInitialized) return newErrors;

    if (!formData.orderType) {
      newErrors.orderType = 'Please fill required fields';
    }

    formData.items.forEach((item, index) => {
      if (!item.quality) {
        newErrors[`items.${index}.quality`] = 'Please fill required fields';
      }
      
      // Better quantity validation - handle null, undefined, and empty values safely
      const quantityValue = item.quantity;
      if (quantityValue === null || quantityValue === undefined || quantityValue === '') {
        newErrors[`items.${index}.quantity`] = 'Please fill required fields';
      } else {
        const quantityStr = String(quantityValue).trim();
        if (!quantityStr) {
          newErrors[`items.${index}.quantity`] = 'Please fill required fields';
        } else {
          const quantityNum = parseFloat(quantityStr);
          if (isNaN(quantityNum) || quantityNum <= 0 || !Number.isInteger(quantityNum)) {
            newErrors[`items.${index}.quantity`] = 'Must be a positive whole number';
          }
        }
      }
    });

    return newErrors;
  }, [formData, formInitialized]);

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    console.log('🔍 handleItemChange called:', { index, field, value });
    
    setFormData(prev => {
      const updatedItems = [...prev.items];
      if (!updatedItems[index]) {
        updatedItems[index] = { quality: '', quantity: '', imageUrls: [], description: '' };
      }
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      console.log('🔍 Updated form data:', { ...prev, items: updatedItems });
      return { ...prev, items: updatedItems };
    });

    const errorKey = `items.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  // Add/Remove items
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { quality: '', quantity: '', imageUrls: [], description: '' }] // Always empty string for quantity
    }));
    
    // Scroll to bottom after adding item with smooth animation
    setTimeout(() => {
      if (formRef.current) {
        // Smooth scroll to the very bottom
        formRef.current.scrollTo({ top: formRef.current.scrollHeight, behavior: 'smooth' });
      }
    }, 300);
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Image upload
  const handleImageUpload = async (file: File, itemIndex: number) => {
    setImageUploading(prev => ({ ...prev, [itemIndex]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      console.log('🔍 Upload response:', data);
      
      if (data.success) {
        // Use the correct field name from API response
        const imageUrl = data.imageUrl || data.url;
        console.log('🔍 Using image URL:', imageUrl);
        
        if (!imageUrl) {
          console.error('No image URL in response');
          setValidationMessage({ type: 'error', text: 'Image upload failed: No URL received' });
          return;
        }
        
        setFormData(prev => {
          const updatedItems = [...prev.items];
          if (!updatedItems[itemIndex]) {
            updatedItems[itemIndex] = { quality: '', quantity: '', imageUrls: [], description: '' };
          }
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            imageUrls: [...(updatedItems[itemIndex].imageUrls || []), imageUrl]
          };
          console.log('🔍 Updated form data with image:', updatedItems[itemIndex]);
          return { ...prev, items: updatedItems };
        });
        
        // Show success message
        setValidationMessage({ type: 'success', text: 'Image uploaded successfully!' });
        
        // Force re-render to show the image immediately
        setTimeout(() => {
          setFormData(prev => ({ ...prev }));
        }, 50);
        
        // Additional re-render to ensure image displays
        setTimeout(() => {
          setFormData(prev => ({ ...prev }));
        }, 200);
      } else {
        console.error('Upload failed:', data.message);
        setValidationMessage({ type: 'error', text: data.message || 'Image upload failed. Please try again.' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setValidationMessage({ type: 'error', text: 'Image upload failed. Please try again.' });
    } finally {
      setImageUploading(prev => ({ ...prev, [itemIndex]: false }));
    }
  };

  // Remove image
  const removeImage = (itemIndex: number, imageIndex: number) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        imageUrls: updatedItems[itemIndex].imageUrls?.filter((_, i) => i !== imageIndex) || []
      };
      return { ...prev, items: updatedItems };
    });
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setValidationMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }

    setLoading(true);
    try {
      // Clean and validate dates before submission
      const cleanDate = (dateStr: string | undefined) => {
        if (!dateStr) return undefined;
        // Try to parse any date format and convert to ISO
        const parsed = parseDateFromInput(dateStr);
        return parsed && parsed !== dateStr ? parsed : undefined;
      };

      // Clean and prepare form data - ONLY send fields that have actually changed
      const cleanedFormData: any = {};
      
      // For new orders, include all required fields
      if (!order) {
        cleanedFormData.orderType = formData.orderType;
        // Handle "Not selected" case - convert to undefined for API
        cleanedFormData.status = formData.status === 'Not selected' ? undefined : formData.status;
        cleanedFormData.arrivalDate = cleanDate(formData.arrivalDate);
        cleanedFormData.party = formData.party;
        cleanedFormData.contactName = formData.contactName;
        cleanedFormData.contactPhone = formData.contactPhone;
        cleanedFormData.poNumber = formData.poNumber;
        cleanedFormData.styleNo = formData.styleNo;
        cleanedFormData.weaverSupplierName = formData.weaverSupplierName;
        cleanedFormData.poDate = cleanDate(formData.poDate);
        cleanedFormData.deliveryDate = cleanDate(formData.deliveryDate);
        
        if (formData.purchaseRate && formData.purchaseRate !== '') {
          const rate = parseFloat(formData.purchaseRate);
          if (!isNaN(rate)) {
            cleanedFormData.purchaseRate = rate;
          }
        }
        
        cleanedFormData.items = formData.items.map(item => ({
          quality: item.quality || undefined,
          quantity: item.quantity === '' || item.quantity === null || item.quantity === undefined ? 1 : Number(item.quantity),
          description: item.description || '',
          imageUrls: item.imageUrls || []
        }));
      } else {
        // For existing orders - ONLY include fields that have actually changed
        const changedFields: string[] = [];
        
        // Compare each field individually
        if (formData.orderType !== order.orderType) {
          cleanedFormData.orderType = formData.orderType;
          changedFields.push('orderType');
        }
        
        if (formData.status !== order.status) {
          // Handle "Not selected" case - convert to undefined for API
          cleanedFormData.status = formData.status === 'Not selected' ? undefined : formData.status;
          changedFields.push('status');
        }
        
        // Compare dates properly by normalizing them to YYYY-MM-DD format
        const normalizeDateForComparison = (dateStr: string | undefined) => {
          if (!dateStr) return null;
          try {
            return new Date(dateStr).toISOString().split('T')[0];
          } catch {
            return dateStr;
          }
        };
        
        const existingArrivalDate = normalizeDateForComparison(order.arrivalDate);
        const newArrivalDate = normalizeDateForComparison(formData.arrivalDate);
        
        if (existingArrivalDate !== newArrivalDate) {
          cleanedFormData.arrivalDate = cleanDate(formData.arrivalDate);
          changedFields.push('arrivalDate');
        }
        
        if (formData.party !== order.party) {
          cleanedFormData.party = formData.party;
          changedFields.push('party');
        }
        
        if (formData.contactName !== order.contactName) {
          cleanedFormData.contactName = formData.contactName;
          changedFields.push('contactName');
        }
        
        if (formData.contactPhone !== order.contactPhone) {
          cleanedFormData.contactPhone = formData.contactPhone;
          changedFields.push('contactPhone');
        }
        
        if (formData.poNumber !== order.poNumber) {
          cleanedFormData.poNumber = formData.poNumber;
          changedFields.push('poNumber');
        }
        
        if (formData.styleNo !== order.styleNo) {
          cleanedFormData.styleNo = formData.styleNo;
          changedFields.push('styleNo');
        }
        
        if (formData.weaverSupplierName !== order.weaverSupplierName) {
          cleanedFormData.weaverSupplierName = formData.weaverSupplierName;
          changedFields.push('weaverSupplierName');
        }
        
        const existingPoDate = normalizeDateForComparison(order.poDate);
        const newPoDate = normalizeDateForComparison(formData.poDate);
        
        if (existingPoDate !== newPoDate) {
          cleanedFormData.poDate = cleanDate(formData.poDate);
          changedFields.push('poDate');
        }
        
        const existingDeliveryDate = normalizeDateForComparison(order.deliveryDate);
        const newDeliveryDate = normalizeDateForComparison(formData.deliveryDate);
        
        if (existingDeliveryDate !== newDeliveryDate) {
          cleanedFormData.deliveryDate = cleanDate(formData.deliveryDate);
          changedFields.push('deliveryDate');
        }
        
        const currentRate = order.purchaseRate || 0;
        const newRate = formData.purchaseRate && formData.purchaseRate !== '' ? parseFloat(formData.purchaseRate) : 0;
        if (currentRate !== newRate) {
          cleanedFormData.purchaseRate = newRate;
          changedFields.push('purchaseRate');
        }
        
        // Check if items have changed - more accurate comparison
        const currentItems = order.items || [];
        const newItems = formData.items.map(item => ({
          quality: item.quality || undefined,
          quantity: item.quantity === '' || item.quantity === null || item.quantity === undefined ? 1 : Number(item.quantity),
          description: item.description || '',
          imageUrls: item.imageUrls || []
        }));
        
        // More accurate items comparison
        const itemsChanged = currentItems.length !== newItems.length || 
          currentItems.some((currentItem, index) => {
            const newItem = newItems[index];
            if (!newItem) return true; // Different number of items
            
            const itemChanged = (
              currentItem.quality?.toString() !== newItem.quality?.toString() ||
              currentItem.quantity !== newItem.quantity ||
              currentItem.description !== newItem.description ||
              JSON.stringify(currentItem.imageUrls || []) !== JSON.stringify(newItem.imageUrls || [])
            );
            
            if (itemChanged) {
              console.log(`🔍 Item ${index + 1} changed in frontend:`, {
                quality: { current: currentItem.quality?.toString(), new: newItem.quality?.toString() },
                quantity: { current: currentItem.quantity, new: newItem.quantity },
                description: { current: currentItem.description, new: newItem.description },
                imageUrls: { current: currentItem.imageUrls, new: newItem.imageUrls }
              });
            }
            
            return itemChanged;
          });
        
        console.log('🔍 Items comparison result:', { itemsChanged, currentItemsCount: currentItems.length, newItemsCount: newItems.length });
        
        if (itemsChanged) {
          cleanedFormData.items = newItems;
          changedFields.push('items');
        }
        
        console.log('🔍 Changed fields:', changedFields);
        
        // If no fields changed, don't send update
        if (changedFields.length === 0) {
          console.log('🔍 No changes detected, skipping update');
          setValidationMessage({ type: 'success', text: 'No changes detected' });
          setTimeout(() => {
            onClose();
          }, 1000);
          return;
        }
      }

      console.log('🔍 Form data being submitted:', cleanedFormData);
      console.log('🔍 Original order data:', order);
      console.log('🔍 Current form data:', formData);

      const token = localStorage.getItem('token');
      console.log('🔍 Token available:', !!token);
      const url = order ? `/api/orders/${order._id}` : '/api/orders';
      const method = order ? 'PUT' : 'POST';

      console.log('🔍 Making request to:', url, 'with method:', method);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedFormData)
      });

      console.log('🔍 Response status:', response.status);

      const data = await response.json();
      console.log('🔍 API response:', data);
      if (data.success) {
        setValidationMessage({ type: 'success', text: order ? 'Order updated successfully!' : 'Order created successfully!' });
        
        // Trigger real-time update for Order Activity Log
        if (order?._id) {
          // For order updates
          console.log('🔍 Dispatching orderUpdated event for order:', order._id);
          const event = new CustomEvent('orderUpdated', { 
            detail: { 
              orderId: order._id,
              action: 'order_update',
              timestamp: new Date().toISOString()
            } 
          });
          window.dispatchEvent(event);
        } else if (data.data?._id) {
          // For new order creation
          console.log('🔍 Dispatching orderUpdated event for new order:', data.data._id);
          const event = new CustomEvent('orderUpdated', { 
            detail: { 
              orderId: data.data._id,
              action: 'order_create',
              timestamp: new Date().toISOString()
            } 
          });
          window.dispatchEvent(event);
        }
        
        // Close form immediately after successful submission
        onSuccess();
        onClose();
      } else {
        console.error('🔍 API error:', data.message);
        setValidationMessage({ type: 'error', text: data.message || 'Operation failed' });
      }
    } catch (error) {
      console.error('🔍 Form submission error:', error);
      setValidationMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered parties and qualities with safe filtering
  const filteredParties = parties.filter(party =>
    party?.name?.toLowerCase().includes(partySearch.toLowerCase())
  ).sort((a, b) => {
    // Sort by createdAt in descending order (newest first)
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return dateB.getTime() - dateA.getTime(); // Newest first
  });

  const getFilteredQualities = (itemIndex: number) => {
    // Use the current quality search for the active dropdown, otherwise use the stored search state
    const searchTerm = activeQualityDropdown === itemIndex ? currentQualitySearch : (qualitySearchStates[itemIndex] || '');
    
    const filtered = qualities.filter(quality =>
      quality?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort by createdAt in ascending order (oldest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateA.getTime() - dateB.getTime(); // Oldest first
    });
  };

  if (!mounted) return null;

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
        
        /* Validation Message Animations */
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out forwards;
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
              {order ? (
                <PencilIcon className="h-8 w-8 text-blue-500" />
              ) : (
                <PlusIcon className="h-8 w-8 text-green-500" />
              )}
              <h2 className="text-2xl font-bold">{order ? 'Edit Order' : 'Create New Order'}</h2>
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
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Close (Esc)"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className={`overflow-y-auto max-h-[calc(95vh-140px)] custom-scrollbar ${
          isDarkMode 
            ? 'scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-800' 
            : 'scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100'
        }`}>
          <div className="p-6 space-y-8 pb-24">
            {/* Basic Information - Enhanced Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Order Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                <select
                  value={formData.orderType || ''}
                  onChange={(e) => handleFieldChange('orderType', e.target.value)}
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } ${errors.orderType ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Type</option>
                  <option value="Dying">Dying</option>
                  <option value="Printing">Printing</option>
                </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.orderType && <p className="text-red-500 text-sm mt-2">{errors.orderType}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-3">Status</label>
                <div className="relative">
                <select
                  value={formData.status || 'Not selected'}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="Not selected">Not selected</option>
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Arrival Date */}
              <div>
                <label className="block text-sm font-medium mb-3">Arrival Date</label>
                <CustomDatePicker
                  value={formData.arrivalDate || ''}
                  onChange={(value) => handleFieldChange('arrivalDate', value)}
                  placeholder="Select arrival date"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* PO Date */}
              <div>
                <label className="block text-sm font-medium mb-3">PO Date</label>
                <CustomDatePicker
                  value={formData.poDate || ''}
                  onChange={(value) => handleFieldChange('poDate', value)}
                  placeholder="Select PO date"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-sm font-medium mb-3">Delivery Date</label>
                <CustomDatePicker
                  value={formData.deliveryDate || ''}
                  onChange={(value) => handleFieldChange('deliveryDate', value)}
                  placeholder="Select delivery date"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Party */}
              <div>
                <label className="block text-sm font-medium mb-3">Party</label>
                <EnhancedDropdown
                  options={filteredParties}
                  value={formData.party || ''}
                  onChange={(value) => handleFieldChange('party', value)}
                  placeholder="Search parties..."
                  searchValue={partySearch}
                  onSearchChange={setPartySearch}
                  showDropdown={showPartyDropdown}
                  onToggleDropdown={() => setShowPartyDropdown(!showPartyDropdown)}
                                     onSelect={(party) => {
                     handleFieldChange('party', party._id || '');
                     setSelectedPartyName(party.name);
                     setPartySearch(party.name);
                     setShowPartyDropdown(false);
                   }}
                  isDarkMode={isDarkMode}
                  onAddNew={() => setShowPartyModal(true)}
                  onDelete={(party) => handleDeleteParty(party)}
                  recentlyAddedId={recentlyAddedParty}
                />
              </div>

              {/* Contact Name */}
              <div>
                <label className="block text-sm font-medium mb-3">Contact Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleFieldChange('contactName', e.target.value)}
                    placeholder="Enter contact name"
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {formData.contactName && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('contactName', '')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Clear contact name"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium mb-3">Contact Phone</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                    placeholder="Enter phone number"
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {formData.contactPhone && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('contactPhone', '')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Clear contact phone"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* PO Number */}
              <div>
                <label className="block text-sm font-medium mb-3">PO Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                    placeholder="Enter PO number"
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {formData.poNumber && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('poNumber', '')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Clear PO number"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Style Number */}
              <div>
                <label className="block text-sm font-medium mb-3">Style Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.styleNo}
                    onChange={(e) => handleFieldChange('styleNo', e.target.value)}
                    placeholder="Enter style number"
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {formData.styleNo && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('styleNo', '')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Clear style number"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Weaver / Supplier Name */}
              <div>
                <label className="block text-sm font-medium mb-3">Weaver / Supplier Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.weaverSupplierName}
                    onChange={(e) => handleFieldChange('weaverSupplierName', e.target.value)}
                    placeholder="Enter weaver or supplier name"
                    className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {formData.weaverSupplierName && (
                    <button
                      type="button"
                      onClick={() => handleFieldChange('weaverSupplierName', '')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                      }`}
                      title="Clear weaver supplier name"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Purchase Rate */}
              <div>
                <label className="block text-sm font-medium mb-3">Purchase Rate</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.purchaseRate}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string, valid numbers, and decimal numbers with up to 2 decimal places
                      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                        const numValue = parseFloat(value);
                        if (value === '' || (!isNaN(numValue) && numValue >= 0)) {
                          handleFieldChange('purchaseRate', value);
                        }
                      }
                    }}
                    onKeyPress={(e) => {
                      // Allow numbers, decimal point, backspace, delete, arrow keys
                      if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                      // Prevent multiple decimal points
                      if (e.key === '.' && (e.target as HTMLInputElement).value.includes('.')) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Enter purchase rate"
                    className={`w-full p-3 pr-16 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  {/* Custom Increment/Decrement Buttons */}
                  <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseFloat(String(formData.purchaseRate || '0')) || 0;
                        const newValue = currentValue + 0.01;
                        // Format to 2 decimal places
                        const formattedValue = newValue.toFixed(2);
                        handleFieldChange('purchaseRate', formattedValue);
                      }}
                      className={`w-6 h-6 flex items-center justify-center rounded-t-sm border-b border-gray-300 transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      title="Increase purchase rate by 0.01"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = parseFloat(String(formData.purchaseRate || '0')) || 0;
                        if (currentValue > 0) {
                          const newValue = Math.max(0, currentValue - 0.01);
                          // Format to 2 decimal places
                          const formattedValue = newValue.toFixed(2);
                          handleFieldChange('purchaseRate', formattedValue);
                        }
                      }}
                      className={`w-6 h-6 flex items-center justify-center rounded-b-sm transition-all duration-200 hover:scale-110 ${
                        isDarkMode 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      title="Decrease purchase rate by 0.01"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>



            {/* Order Items */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Order Items</h3>
              </div>

              <div className="space-y-6">
                {formData.items.map((item, index) => (
                  <div key={index} className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
                    isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                      {/* Quality */}
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          Quality <span className="text-red-500">*</span>
                        </label>
                                                 <EnhancedDropdown
                          options={getFilteredQualities(index)}
                           value={item.quality as string}
                           onChange={(value) => handleItemChange(index, 'quality', value)}
                           placeholder="Search quality..."
                          searchValue={activeQualityDropdown === index ? currentQualitySearch : (qualitySearchStates[index] || '')}
                          onSearchChange={(value) => {
                            if (activeQualityDropdown === index) {
                              setCurrentQualitySearch(value);
                            } else {
                              setQualitySearchStates(prev => ({ ...prev, [index]: value }));
                            }
                          }}
                           showDropdown={activeQualityDropdown === index}
                          onToggleDropdown={() => {
                            if (activeQualityDropdown === index) {
                              setActiveQualityDropdown(null);
                              setCurrentQualitySearch('');
                            } else {
                              setActiveQualityDropdown(index);
                              setCurrentQualitySearch(qualitySearchStates[index] || '');
                            }
                          }}
                                                       onSelect={(quality) => {
                            console.log('🔍 Quality selected manually:', { quality, index });
                            handleItemChange(index, 'quality', getQualityId(quality));
                            setQualitySearchStates(prev => ({ ...prev, [index]: quality.name }));
                            setCurrentQualitySearch(quality.name);
                              setActiveQualityDropdown(null);
                            }}
                           isDarkMode={isDarkMode}
                           error={errors[`items.${index}.quality`]}
                           onAddNew={() => {
                             setActiveQualityDropdown(index);
                             setShowQualityModal(true);
                           }}
                          onDelete={(quality) => handleDeleteQuality(quality)}
                          itemIndex={index}
                          recentlyAddedId={recentlyAddedQuality}
                         />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium mb-3">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Only allow empty string or positive whole numbers (no decimals)
                              if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
                                handleItemChange(index, 'quantity', value);
                              }
                            }}
                            onKeyPress={(e) => {
                              // Block all non-numeric keys including decimal point
                              if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                e.preventDefault();
                              }
                              // Specifically block decimal point for whole numbers only
                              if (e.key === '.') {
                                e.preventDefault();
                              }
                            }}
                            placeholder="Enter quantity"
                            className={`w-full p-3 pr-16 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            } ${errors[`items.${index}.quantity`] ? 'border-red-500' : ''}`}
                          />
                          {/* Custom Increment/Decrement Buttons */}
                          <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex flex-col">
                            <button
                              type="button"
                              onClick={() => {
                                const currentValue = parseInt(String(item.quantity || '0')) || 0;
                                handleItemChange(index, 'quantity', String(currentValue + 1));
                              }}
                              className={`w-6 h-6 flex items-center justify-center rounded-t-sm border-b border-gray-300 transition-all duration-200 hover:scale-110 ${
                                isDarkMode 
                                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                              }`}
                              title="Increase quantity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const currentValue = parseInt(String(item.quantity || '0')) || 0;
                                if (currentValue > 1) {
                                  handleItemChange(index, 'quantity', String(currentValue - 1));
                                } else if (currentValue === 1) {
                                  handleItemChange(index, 'quantity', ''); // Clear if 1 and decremented
                                }
                              }}
                              className={`w-6 h-6 flex items-center justify-center rounded-b-sm transition-all duration-200 hover:scale-110 ${
                                isDarkMode 
                                  ? 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                              }`}
                              title="Decrease quantity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {errors[`items.${index}.quantity`] && (
                          <p className="text-red-500 text-sm mt-2">{errors[`items.${index}.quantity`]}</p>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium mb-3">Description</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            placeholder="Enter description"
                            className={`w-full p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                            }`}
                          />
                          {item.description && (
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, 'description', '')}
                              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                                isDarkMode 
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-600' 
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                              }`}
                              title="Clear description"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-end justify-end">
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
                      </div>
                    </div>

                    {/* Images */}
                    <ImageUploadSection
                      itemIndex={index}
                      imageUrls={item.imageUrls || []}
                      onImageUpload={handleImageUpload}
                      onRemoveImage={removeImage}
                      onPreviewImage={(url, imgIndex) => setShowImagePreview({ url, index: imgIndex })}
                      isDarkMode={isDarkMode}
                      imageUploading={imageUploading}
                    />
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
            </div>

            {/* Enhanced Validation Message */}
            {validationMessage && (
              <div className={`fixed top-6 right-6 z-50 max-w-md transform transition-all duration-500 ease-in-out ${
                validationMessage.type === 'success' 
                  ? 'animate-slide-in-right' 
                  : 'animate-slide-in-right'
              }`}>
                <div className={`relative p-6 rounded-2xl border-2 shadow-2xl backdrop-blur-sm ${
                  validationMessage.type === 'success' 
                    ? isDarkMode
                      ? 'bg-gradient-to-r from-green-900/90 to-emerald-900/90 border-green-500/50 text-green-100 shadow-green-500/20'
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-800 shadow-green-200/50'
                    : isDarkMode
                      ? 'bg-gradient-to-r from-red-900/90 to-rose-900/90 border-red-500/50 text-red-100 shadow-red-500/20'
                      : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-800 shadow-red-200/50'
                }`}>
                  {/* Background Pattern */}
                  <div className={`absolute inset-0 rounded-2xl opacity-10 ${
                    validationMessage.type === 'success'
                      ? 'bg-gradient-to-br from-green-400 to-emerald-400'
                      : 'bg-gradient-to-br from-red-400 to-rose-400'
                  }`}></div>
                  
                  <div className="relative flex items-start space-x-4">
                    {/* Icon Container */}
                    <div className={`flex-shrink-0 p-3 rounded-xl ${
                      validationMessage.type === 'success'
                        ? isDarkMode
                          ? 'bg-green-500/20 border border-green-400/30'
                          : 'bg-green-100 border border-green-200'
                        : isDarkMode
                          ? 'bg-red-500/20 border border-red-400/30'
                          : 'bg-red-100 border border-red-200'
                    }`}>
                      {validationMessage.type === 'success' ? (
                        <CheckIcon className={`h-6 w-6 ${
                          isDarkMode ? 'text-green-300' : 'text-green-600'
                        }`} />
                      ) : (
                        <ExclamationTriangleIcon className={`h-6 w-6 ${
                          isDarkMode ? 'text-red-300' : 'text-red-600'
                        }`} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-bold mb-1 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {validationMessage.type === 'success' ? 'Success!' : 'Error'}
                      </h3>
                      <p className={`text-sm leading-relaxed ${
                        isDarkMode 
                          ? validationMessage.type === 'success' ? 'text-green-200' : 'text-red-200'
                          : validationMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {validationMessage.text}
                      </p>
                    </div>
                    
                    {/* Close Button */}
                    <button
                      onClick={() => setValidationMessage(null)}
                      className={`flex-shrink-0 p-2 rounded-xl transition-all duration-200 hover:scale-110 ${
                        validationMessage.type === 'success'
                          ? isDarkMode
                            ? 'text-green-300 hover:bg-green-500/20 hover:text-green-200'
                            : 'text-green-600 hover:bg-green-100 hover:text-green-700'
                          : isDarkMode
                            ? 'text-red-300 hover:bg-red-500/20 hover:text-red-200'
                            : 'text-red-600 hover:bg-red-100 hover:text-red-700'
                      }`}
                      title="Close notification"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className={`absolute bottom-0 left-0 h-1 rounded-b-2xl transition-all duration-300 ${
                    validationMessage.type === 'success'
                      ? isDarkMode ? 'bg-green-400' : 'bg-green-500'
                      : isDarkMode ? 'bg-red-400' : 'bg-red-500'
                  }`} style={{ width: '100%' }}></div>
                </div>
              </div>
            )}
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
              disabled={loading}
              onClick={handleSubmit}
              className={`px-10 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:scale-105 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' 
                    : 'bg-blue-500 hover:bg-blue-600 shadow-lg'
              }`}
            >
              {loading ? 'Saving...' : (order ? 'Update Order' : 'Create Order')}
            </button>
          </div>
        </div>

        {/* Image Preview Modal */}
        {showImagePreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="relative max-w-6xl max-h-[90vh]">
              <img
                src={showImagePreview.url}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                {/* Download Button */}
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = showImagePreview.url;
                    link.download = `image-${showImagePreview.index + 1}.jpg`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                  title="Download Image"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                
                {/* Open in New Tab Button */}
                <button
                  onClick={() => {
                    window.open(showImagePreview.url, '_blank');
                  }}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                  title="Open in New Tab"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                
                {/* Close Button */}
              <button
                onClick={() => setShowImagePreview(null)}
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  title="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              </div>
              
              {/* Image Info */}
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
                <p>Image {showImagePreview.index + 1}</p>
                <p className="text-xs text-gray-300 truncate max-w-xs">{showImagePreview.url}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showQualityModal && (
          <QualityModal
            onClose={() => setShowQualityModal(false)}
            onSuccess={(newQualityName, newQualityData) => {
              console.log('🔍 QualityModal onSuccess called:', { newQualityName, newQualityData, activeQualityDropdown });
              
              // Call the parent's onAddQuality function
              onAddQuality(newQualityData);
              
              // Immediately select the new quality for the active dropdown
              if (newQualityData && activeQualityDropdown !== null) {
                console.log('🔍 Immediately selecting new quality:', newQualityData);
                console.log('🔍 Active dropdown index:', activeQualityDropdown);
                console.log('🔍 Quality ID:', getQualityId(newQualityData));
                
                // Set the quality for the active dropdown
                handleItemChange(activeQualityDropdown, 'quality', getQualityId(newQualityData));
                
                // Update the search state for this specific dropdown
                setQualitySearchStates(prev => ({
                  ...prev,
                  [activeQualityDropdown]: newQualityData.name
                }));
                
                // Update the current quality search
                setCurrentQualitySearch(newQualityData.name);
                
                // Set the recently added indicator
                setRecentlyAddedQuality(getQualityId(newQualityData));
                
                // Close the dropdown immediately
                setActiveQualityDropdown(null);
                
                // Clear the "recently added" indicator after 3 seconds
                setTimeout(() => {
                  setRecentlyAddedQuality(null);
                }, 3000);
                
                // Force a re-render to ensure the selection is displayed
                setTimeout(() => {
                  setFormData(prev => {
                    console.log('🔍 Form data after auto-selection:', prev);
                    return { ...prev };
                  });
                }, 100);
                
                console.log('🔍 Auto-selection completed');
                
                // Show success message
                setValidationMessage({ type: 'success', text: 'New quality added and selected successfully!' });
              } else {
                console.log('🔍 Cannot auto-select - missing data:', { newQualityData, activeQualityDropdown });
              }
              
              setShowQualityModal(false);
            }}
          />
        )}
        {showPartyModal && (
          <PartyModal
            onClose={() => setShowPartyModal(false)}
            onSuccess={(newPartyData) => {
              onRefreshParties();
              if (newPartyData) {
                setPendingNewParty(newPartyData);
                // Show success message
                setValidationMessage({ type: 'success', text: 'New party added and selected successfully!' });
              }
              setShowPartyModal(false);
            }}
          />
        )}



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
    </div>
    </>
  );
}

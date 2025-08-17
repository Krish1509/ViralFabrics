'use client';

import { useState, useEffect, useCallback } from 'react';
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
  InformationCircleIcon
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

export default function OrderForm({ order, parties, qualities, onClose, onSuccess, onAddParty, onRefreshParties, onAddQuality }: OrderFormProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [formData, setFormData] = useState<OrderFormData>({
    orderType: undefined,
    arrivalDate: '',
    party: '',
    contactName: '',
    contactPhone: '',
    poNumber: '',
    styleNo: '',
    poDate: '',
    deliveryDate: '',
    items: []
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
  const [newlyCreatedQuality, setNewlyCreatedQuality] = useState<any>(null);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [validationTimeout, setValidationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [validationProgress, setValidationProgress] = useState(100);
  const [showCameraPreview, setShowCameraPreview] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [activeCameraItem, setActiveCameraItem] = useState<number | null>(null);
  const [showImagePreview, setShowImagePreview] = useState<{ url: string; index: number } | null>(null);

  // Set client-side flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);



  // Clear validation message after 3 seconds with progress bar
  useEffect(() => {
    if (validationMessage) {
      // Clear any existing timeout
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
      
      // Reset progress to 100%
      setValidationProgress(100);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setValidationProgress(prev => {
          if (prev <= 0) {
            clearInterval(progressInterval);
            return 0;
          }
          return prev - 3.33; // Decrease by 3.33% every 100ms (3 seconds total)
        });
      }, 100);
      
      const timeout = setTimeout(() => {
        setValidationMessage(null);
        setValidationProgress(100);
      }, 3000);
      
      setValidationTimeout(timeout);
      
      return () => {
        clearInterval(progressInterval);
        clearTimeout(timeout);
      };
    }
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationMessage]);

  // Check camera availability
  useEffect(() => {
    if (!isClient) return;
    
    const checkCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          });
          stream.getTracks().forEach(track => track.stop());
          setCameraAvailable(true);
        }
      } catch (error) {
        console.log('Camera not available:', error);
        setCameraAvailable(false);
      }
    };
    checkCamera();
  }, [isClient]);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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

  // Reset search when dropdown is closed
  useEffect(() => {
    if (!showPartyDropdown) {
      setPartySearch('');
    }
  }, [showPartyDropdown]);

  useEffect(() => {
    if (!showQualityDropdown) {
      setQualitySearch('');
      // Clear the newly created quality highlight when dropdown is closed
      setNewlyCreatedQuality(null);
    }
  }, [showQualityDropdown]);

  // Initialize form data when editing
  useEffect(() => {
    if (order) {
      const partyId = typeof order.party === 'string' ? order.party : order.party?._id || '';
      const partyName = typeof order.party === 'string' ? '' : order.party?.name || '';
      
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
          quantity: item.quantity !== undefined && item.quantity !== null ? item.quantity : undefined,
          imageUrls: item.imageUrls || [],
          description: item.description || ''
        })) : [{
          quality: '',
          quantity: undefined,
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

  // Custom validation function
  const validateForm = useCallback((): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // Don't validate until form is initialized
    if (!formInitialized) {
      return newErrors;
    }

    // Optional fields validation (only validate if provided)
    if (formData.orderType && !formData.orderType.trim()) {
      newErrors.orderType = 'Order type cannot be empty if provided';
    }

    if (formData.arrivalDate) {
      const arrivalDate = new Date(formData.arrivalDate);
      if (isNaN(arrivalDate.getTime())) {
        newErrors.arrivalDate = 'Invalid arrival date format';
      }
    }

    // Party is optional - no validation needed

    // Contact validation
    if (formData.contactName && formData.contactName.length < 2) {
      newErrors.contactName = 'Contact name must be at least 2 characters';
    }

    if (formData.contactName && formData.contactName.length > 50) {
      newErrors.contactName = 'Contact name cannot exceed 50 characters';
    }

    // Phone number validation
    if (formData.contactPhone && formData.contactPhone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,15}$/;
      if (!phoneRegex.test(formData.contactPhone.replace(/\s/g, ''))) {
        newErrors.contactPhone = 'Please enter a valid phone number';
      }
    }

    // Reference number validation
    if (formData.poNumber && formData.poNumber.length > 50) {
      newErrors.poNumber = 'PO number cannot exceed 50 characters';
    }

    if (formData.styleNo && formData.styleNo.length > 50) {
      newErrors.styleNo = 'Style number cannot exceed 50 characters';
    }

    // Items validation - all fields are optional
    formData.items.forEach((item, index) => {
      // Quality is optional - no validation needed
      // Quantity is optional - no validation needed
      if (item.quantity && item.quantity > 1000000) {
        newErrors[`items.${index}.quantity`] = 'Quantity cannot exceed 1,000,000';
      }
      if (item.description && item.description.length > 500) {
        newErrors[`items.${index}.description`] = 'Description cannot exceed 500 characters';
      }
    });

    return newErrors;
  }, [formData, formInitialized]);

  // Handle field blur for real-time validation
  const handleBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    // Only validate if the field has been touched
    const newErrors = validateForm();
    setErrors(newErrors);
  };

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle item field change
  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));

    // Clear error when user starts typing
    const errorKey = `items.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        quality: '',
        quantity: undefined,
        imageUrls: [], // Changed from imageUrl to imageUrls array
        description: ''
      }]
    }));
  };

  // Remove item
  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handle image upload
  const handleImageUpload = async (file: File, itemIndex: number) => {
    console.log('Image upload started for item:', itemIndex);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setValidationMessage({ type: 'error', text: 'Image size must be less than 10MB' });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setValidationMessage({ type: 'error', text: 'Please select a valid image file' });
      return;
    }

    setImageUploading(true);
    setValidationMessage(null);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      console.log('Uploading to /api/upload...');

      // For now, skip token validation to avoid authentication issues
      // const token = localStorage.getItem('token');
      // if (!token) {
      //   throw new Error('Authentication token not found');
      // }

      const response = await fetch('/api/upload', {
        method: 'POST',
        // headers: {
        //   'Authorization': `Bearer ${token}`,
        // },
        body: uploadFormData,
      });

      console.log('Upload response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Upload response data:', data);
        
        // Add the new image to the existing array
        const currentImages = formData.items[itemIndex]?.imageUrls || [];
        console.log('Current images for item', itemIndex, ':', currentImages);
        
        const updatedImages = [...currentImages, data.imageUrl];
        console.log('Updated images for item', itemIndex, ':', updatedImages);
        
        handleItemChange(itemIndex, 'imageUrls', updatedImages);
        setValidationMessage({ type: 'success', text: 'Image uploaded successfully!' });
      } else {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        setValidationMessage({ type: 'error', text: errorData.message || 'Failed to upload image' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setValidationMessage({ type: 'error', text: 'An error occurred while uploading the image' });
    } finally {
      setImageUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    const files = event.target.files;
    if (files) {
      // Check if it's a camera capture
      const isCameraCapture = event.target.getAttribute('capture') !== null;
      if (isCameraCapture) {
        console.log('Camera capture detected');
      }
      
      // Handle multiple files
      Array.from(files).forEach(file => {
        handleImageUpload(file, itemIndex);
      });
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, itemIndex: number) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          handleImageUpload(file, itemIndex);
        }
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started...');
    console.log('Form data:', formData);
    
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors); // Debug log
      setValidationMessage({ type: 'error', text: 'Please fix the errors below' });
      return;
    }

    setLoading(true);
    setValidationMessage(null);

    try {
      // For now, skip token validation to avoid authentication issues
      // const token = localStorage.getItem('token');
      // if (!token) {
      //   throw new Error('Authentication token not found');
      // }

      const url = order ? `/api/orders/${order._id}` : '/api/orders';
      const method = order ? 'PUT' : 'POST';

      // Clean up form data - convert empty strings to undefined for optional fields
      const cleanedFormData = {
        ...formData,
        orderType: formData.orderType || undefined,
        party: formData.party || undefined,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        poNumber: formData.poNumber || undefined,
        styleNo: formData.styleNo || undefined,
        poDate: formData.poDate || undefined,
        deliveryDate: formData.deliveryDate || undefined,
        arrivalDate: formData.arrivalDate || undefined,
        items: formData.items.map(item => ({
          ...item,
          quality: item.quality || undefined,
          quantity: item.quantity || undefined,
          description: item.description || undefined,
          imageUrls: item.imageUrls || []
        }))
      };

      console.log('Submitting to:', url, 'with method:', method);
      console.log('Request body:', JSON.stringify(cleanedFormData, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedFormData),
      });

      console.log('Form submission response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Form submission success response:', responseData);
        
        setValidationMessage({ 
          type: 'success', 
          text: order ? 'Order updated successfully!' : 'Order created successfully!' 
        });
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('Form submission error response:', errorData);
        setValidationMessage({ 
          type: 'error', 
          text: errorData.message || 'Failed to save order' 
        });
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setValidationMessage({ 
        type: 'error', 
        text: 'An error occurred while saving the order' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter parties based on search
  const filteredParties = parties?.filter(party =>
    party && party.name && typeof party.name === 'string' && 
    (partySearch === '' || party.name.toLowerCase().includes(partySearch.toLowerCase()))
  ) || [];

  // Filter qualities based on search
  const filteredQualities = qualities?.filter(quality =>
    quality && quality.name && typeof quality.name === 'string' && 
    (qualitySearch === '' || quality.name.toLowerCase().includes(qualitySearch.toLowerCase()))
  ) || [];

  // Sort qualities to show newly created quality at the top
  const sortedQualities = [...filteredQualities].sort((a, b) => {
    // If there's a newly created quality, show it first
    if (newlyCreatedQuality && a._id === newlyCreatedQuality._id) return -1;
    if (newlyCreatedQuality && b._id === newlyCreatedQuality._id) return 1;
    return 0;
  });

  // Get error for a specific field
  const getFieldError = (field: string) => {
    return touched.has(field) ? errors[field] : '';
  };

  // Get error for an item field
  const getItemFieldError = (index: number, field: string) => {
    const errorKey = `items.${index}.${field}`;
    return touched.has(errorKey) ? errors[errorKey] : '';
  };

  // Handle camera preview
  const handleCameraPreview = async (itemIndex: number) => {
    try {
      setActiveCameraItem(itemIndex);
      setShowCameraPreview(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setCameraStream(stream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setValidationMessage({ 
        type: 'error', 
        text: 'Unable to access camera. Please check camera permissions.' 
      });
      setShowCameraPreview(false);
      setActiveCameraItem(null);
    }
  };

  // Capture photo from camera preview
  const capturePhoto = () => {
    if (!cameraStream || activeCameraItem === null) return;
    
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleImageUpload(file, activeCameraItem);
          closeCameraPreview();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  // Close camera preview
  const closeCameraPreview = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraPreview(false);
    setActiveCameraItem(null);
  };

  // Get initial dark mode state
  const getInitialDarkMode = () => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('darkMode');
      if (savedMode !== null) {
        return savedMode === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  };

  // Don't render until client-side, mounted, and data is ready
  if (!isClient || !mounted || !parties || !qualities) {
    const loadingDarkMode = getInitialDarkMode();
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2">
        <div className={`w-full max-w-7xl rounded-2xl shadow-2xl ${
          loadingDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
        } max-h-[98vh] overflow-hidden flex items-center justify-center`}>
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className={`text-lg font-medium ${
              loadingDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Loading...
            </span>
          </div>
        </div>
      </div>
    );
  }

     return (
     <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
       <div className={`w-full max-w-8xl rounded-2xl shadow-2xl mx-4 ${
         isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
       } max-h-[98vh] overflow-hidden`}>
                 {/* Enhanced Header */}
         <div className={`flex justify-between items-center p-6 border-b ${
           isDarkMode ? 'border-slate-700' : 'border-gray-200'
         }`}>
           <div className="flex items-center space-x-4">
             <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-lg ${
               isDarkMode 
                 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                 : 'bg-gradient-to-br from-blue-600 to-indigo-700'
             }`}>
               <PencilIcon className="h-6 w-6 text-white" />
             </div>
             <div>
               <h2 className={`text-2xl font-bold mb-1 mx-2 ${
                 isDarkMode ? 'text-white' : 'text-gray-900'
               }`}>
                 {order ? 'Edit Order' : 'Create New Order'}
               </h2>
               <p className={`text-sm ${
                 isDarkMode ? 'text-gray-300' : 'text-gray-500'
               }`}>
                 {order ? `Order ID: ${order.orderId}` : 'Complete order details with enhanced features'}
               </p>
             </div>
           </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
              isDarkMode
                ? 'text-gray-400 hover:bg-white/10 hover:text-gray-300'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

                 {/* Validation Message */}
         {validationMessage && (
           <div className={`mx-8 mt-6 p-6 rounded-xl border-2 ${
             validationMessage.type === 'success'
               ? isDarkMode
                 ? 'bg-green-900/20 border-green-500/50 text-green-400'
                 : 'bg-green-50 border-green-300 text-green-800'
               : isDarkMode
                 ? 'bg-red-900/20 border-red-500/50 text-red-400'
                 : 'bg-red-50 border-red-300 text-red-800'
           }`}>
             <div className="flex items-start">
               {validationMessage.type === 'success' ? (
                 <CheckIcon className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" />
               ) : (
                 <ExclamationTriangleIcon className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" />
               )}
               <div className="flex-1">
                 <div className="flex items-center justify-between">
                   <span className="text-lg font-medium leading-relaxed">{validationMessage.text}</span>
                   <button
                     onClick={() => {
                       setValidationMessage(null);
                       setValidationProgress(100);
                       if (validationTimeout) {
                         clearTimeout(validationTimeout);
                       }
                     }}
                     className={`ml-4 p-1 rounded-full hover:bg-opacity-20 transition-colors ${
                       validationMessage.type === 'success'
                         ? 'hover:bg-green-500'
                         : 'hover:bg-red-500'
                     }`}
                   >
                     <XMarkIcon className="h-4 w-4" />
                   </button>
                 </div>
                 <div className="mt-2 flex items-center space-x-2">
                   <div className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-full h-1">
                     <div className={`h-1 rounded-full transition-all duration-100 ${
                       validationMessage.type === 'success' 
                         ? 'bg-green-500' 
                         : 'bg-red-500'
                     }`} style={{ width: `${validationProgress}%` }}></div>
                   </div>
                   <span className="text-sm text-gray-500 dark:text-gray-400">
                     Auto-hide in {Math.ceil(validationProgress / 33.33)}s
                   </span>
                 </div>
               </div>
             </div>
           </div>
         )}

                 {/* Enhanced Form Content */}
         <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(98vh-200px)] custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* Basic Information - Compact Layout */}
            <div className={`p-6 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 shadow-lg' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <h3 className={`text-xl font-bold mb-4 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <InformationCircleIcon className="h-5 w-5 mr-2 text-blue-500" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Order Type */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Order Type
                  </label>
                  <select
                    value={formData.orderType || ''}
                    onChange={(e) => handleFieldChange('orderType', e.target.value || undefined)}
                    onBlur={() => handleBlur('orderType')}
                    className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                      getFieldError('orderType')
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-white/30'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-gray-400'
                    }`}
                  >
                    <option value="" className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Select Order Type</option>
                    <option value="Dying" className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Dying</option>
                    <option value="Printing" className={isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}>Printing</option>
                  </select>
                  {getFieldError('orderType') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('orderType')}</p>
                  )}
                </div>

                {/* Arrival Date */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Arrival Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) => handleFieldChange('arrivalDate', e.target.value)}
                      onBlur={() => handleBlur('arrivalDate')}
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                        getFieldError('arrivalDate')
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-white/30'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-gray-400'
                      }`}
                    />
                  </div>
                  {getFieldError('arrivalDate') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('arrivalDate')}</p>
                  )}
                </div>

                {/* PO Date */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    PO Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.poDate}
                      onChange={(e) => handleFieldChange('poDate', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                        isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                      }`}
                    />
                  </div>
                </div>

                {/* Delivery Date */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Delivery Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => handleFieldChange('deliveryDate', e.target.value)}
                      onBlur={() => handleBlur('deliveryDate')}
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                        getFieldError('deliveryDate')
                          ? 'border-red-500 bg-red-50'
                          : isDarkMode
                            ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                      }`}
                    />
                  </div>
                  {getFieldError('deliveryDate') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('deliveryDate')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Party and Contact Information - Compact */}
            <div className={`p-6 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 shadow-lg' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <h3 className={`text-xl font-bold mb-4 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <InformationCircleIcon className="h-5 w-5 mr-2 text-green-500" />
                Party & Contact Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Party Selection */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Party
                  </label>
                  <div className="relative party-dropdown">
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search parties..."
                          value={selectedPartyName || partySearch}
                          onChange={(e) => {
                            setPartySearch(e.target.value);
                            // Clear selected party if user starts typing
                            if (e.target.value !== selectedPartyName) {
                              setSelectedPartyName('');
                              handleFieldChange('party', '');
                            }
                          }}
                          onFocus={() => {
                            setShowPartyDropdown(true);
                          }}
                          onClick={() => {
                            setShowPartyDropdown(true);
                          }}
                          className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                            getFieldError('party')
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : isDarkMode
                                ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-white/30'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-gray-400'
                          }`}
                        />
                        <MagnifyingGlassIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPartyModal(true)}
                        className={`px-3 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center hover:scale-105 ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                        }`}
                        title="Add New Party"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {showPartyDropdown && (
                      <div className={`absolute z-50 w-full mt-2 rounded-xl border-2 shadow-2xl ${
                        isDarkMode 
                          ? 'bg-slate-800 border-slate-600 shadow-2xl' 
                          : 'bg-white border-gray-200 shadow-2xl'
                      } max-h-80 overflow-y-auto custom-scrollbar`}>
                        {filteredParties.length > 0 ? (
                          filteredParties.map((party) => (
                            <div key={party?._id || Math.random()} className={`flex items-center justify-between p-3 hover:bg-gray-50 border-b transition-all duration-200 ${
                              isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-100'
                            }`}>
                              <div className="flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (party && party._id && party.name) {
                                      console.log('Party selected:', party.name, 'ID:', party._id);
                                      handleFieldChange('party', party._id);
                                      setSelectedPartyName(party.name);
                                      setPartySearch(party.name);
                                      setShowPartyDropdown(false);
                                      // Clear any party-related errors
                                      setErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors['party'];
                                        return newErrors;
                                      });
                                    }
                                  }}
                                  className={`w-full text-left px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-900 text-sm font-medium transition-all duration-200 ${
                                    isDarkMode 
                                      ? 'text-white hover:bg-slate-600 hover:text-blue-300' 
                                      : 'text-gray-900'
                                  }`}
                                >
                                  <div className="font-semibold truncate">{party?.name || 'Unknown Party'}</div>
                                  {party?.contactName && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      👤 {party.contactName}
                                    </div>
                                  )}
                                  {party?.contactPhone && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      📞 {party.contactPhone}
                                    </div>
                                  )}
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  // Check if party is being used in any orders
                                  if (!party || !party._id || !party.name) {
                                    setValidationMessage({ type: 'error', text: 'Invalid party data' });
                                    return;
                                  }
                                  
                                  // Direct delete without confirmation
                                  try {
                                    const response = await fetch(`/api/parties/${party._id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                    });
                                    
                                    const data = await response.json();
                                    
                                    if (response.ok) {
                                      onRefreshParties();
                                      setValidationMessage({ type: 'success', text: 'Party deleted successfully!' });
                                    } else {
                                      setValidationMessage({ type: 'error', text: data.message || 'Failed to delete party' });
                                    }
                                  } catch (error) {
                                    console.error('Error deleting party:', error);
                                    setValidationMessage({ type: 'error', text: 'Failed to delete party. Please try again.' });
                                  }
                                }}
                                className={`p-2 rounded-lg hover:bg-red-50 flex items-center justify-center transition-all duration-300 ${
                                  isDarkMode 
                                    ? 'text-red-400 hover:bg-red-500/20 hover:scale-110' 
                                    : 'text-red-600 hover:bg-red-50 hover:scale-110'
                                }`}
                                title="Delete Party"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className={`px-6 py-4 text-lg ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            No parties found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {getFieldError('party') && (
                    <p className="mt-1 text-sm text-red-500">{getFieldError('party')}</p>
                  )}
                </div>

                {/* Contact Name */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleFieldChange('contactName', e.target.value)}
                    onBlur={() => handleBlur('contactName')}
                    className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                      getFieldError('contactName')
                        ? 'border-red-500 bg-red-50'
                        : isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter contact name"
                  />
                  {getFieldError('contactName') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('contactName')}</p>
                  )}
                </div>

                {/* Contact Phone */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                    onBlur={() => handleBlur('contactPhone')}
                    className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                      getFieldError('contactPhone')
                        ? 'border-red-500 bg-red-50'
                        : isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {getFieldError('contactPhone') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('contactPhone')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Reference Numbers - Compact */}
            <div className={`p-6 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 shadow-lg' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <h3 className={`text-xl font-bold mb-4 flex items-center ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                <InformationCircleIcon className="h-5 w-5 mr-2 text-purple-500" />
                Reference Numbers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PO Number */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    PO Number
                  </label>
                  <input
                    type="text"
                    value={formData.poNumber}
                    onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                    onBlur={() => handleBlur('poNumber')}
                    className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                      getFieldError('poNumber')
                        ? 'border-red-500 bg-red-50'
                        : isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter PO number"
                  />
                  {getFieldError('poNumber') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('poNumber')}</p>
                  )}
                </div>

                {/* Style Number */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Style Number
                  </label>
                  <input
                    type="text"
                    value={formData.styleNo}
                    onChange={(e) => handleFieldChange('styleNo', e.target.value)}
                    onBlur={() => handleBlur('styleNo')}
                    className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                      getFieldError('styleNo')
                        ? 'border-red-500 bg-red-50'
                        : isDarkMode
                          ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                    }`}
                    placeholder="Enter style number"
                  />
                  {getFieldError('styleNo') && (
                    <p className="mt-1 text-xs text-red-500">{getFieldError('styleNo')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items - Enhanced */}
            <div className={`p-6 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-white/5 border-white/10 shadow-lg' 
                : 'bg-white border-gray-200 shadow-lg'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold flex items-center ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <InformationCircleIcon className="h-5 w-5 mr-2 text-orange-500" />
                  Order Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                    isDarkMode
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                  }`}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Item
                </button>
              </div>

                             <div className="space-y-4">
                 {formData.items.length === 0 ? (
                   <div className={`text-center py-8 rounded-lg border-2 ${
                     isDarkMode 
                       ? 'bg-white/5 border-white/10' 
                       : 'bg-gray-50 border-gray-200'
                   }`}>
                     <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                       No items added yet
                     </p>
                     <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                       Click "Add Item" to start adding order items
                     </p>
                   </div>
                 ) : (
                   formData.items.map((item, index) => (
                  <div key={index} className={`p-4 rounded-lg border-2 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 shadow-md' 
                      : 'bg-gray-50 border-gray-200 shadow-md'
                  }`}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className={`text-lg font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Item {index + 1}
                      </h4>
                                             <button
                         type="button"
                         onClick={() => removeItem(index)}
                         className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                           isDarkMode
                             ? 'text-red-400 hover:bg-red-500/20'
                             : 'text-red-600 hover:bg-red-50'
                         }`}
                       >
                         <TrashIcon className="h-4 w-4" />
                       </button>
                    </div>

                                      

                                                                                       {/* Quality, Quantity, and Description in One Row */}
                       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                         {/* Quality */}
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${
                             isDarkMode ? 'text-gray-300' : 'text-gray-700'
                           }`}>
                             Quality
                           </label>
                           <div className="relative quality-dropdown">
                             <div className="flex space-x-2">
                               <div className="flex-1 relative">
                                 <input
                                   type="text"
                                   placeholder="Search qualities..."
                                   value={(() => {
                                     // If we have a newly created quality and this is the active dropdown, show it immediately
                                     if (newlyCreatedQuality && activeQualityDropdown === index && item.quality === newlyCreatedQuality._id) {
                                       return newlyCreatedQuality.name;
                                     }
                                     // Get the selected quality name for this specific item
                                     const selectedQuality = qualities?.find(q => q._id === item.quality);
                                     return selectedQuality?.name || qualitySearch;
                                   })()}
                                   onChange={(e) => {
                                     setQualitySearch(e.target.value);
                                     // Clear the newly created quality highlight when user types
                                     setNewlyCreatedQuality(null);
                                     // Clear selected quality if user starts typing
                                     const selectedQuality = qualities?.find(q => q._id === item.quality);
                                     if (e.target.value !== selectedQuality?.name) {
                                       handleItemChange(index, 'quality', '');
                                     }
                                   }}
                                   onFocus={() => {
                                     setShowQualityDropdown(true);
                                     setActiveQualityDropdown(index);
                                   }}
                                   onClick={() => {
                                     setShowQualityDropdown(true);
                                     setActiveQualityDropdown(index);
                                   }}
                                   className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                                     getItemFieldError(index, 'quality')
                                       ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                       : isDarkMode
                                         ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-white/30'
                                         : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-gray-400'
                                   }`}
                                 />
                                 <MagnifyingGlassIcon className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                                   isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                 }`} />
                               </div>
                               <button
                                 type="button"
                                 onClick={() => setShowQualityModal(true)}
                                 className={`px-3 py-2 rounded-lg font-semibold transition-all duration-300 hover:scale-105 ${
                                   isDarkMode
                                     ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                                     : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg'
                                 }`}
                               >
                                 <PlusIcon className="h-4 w-4" />
                               </button>
                             </div>
                             {showQualityDropdown && activeQualityDropdown === index && (
                               <div className={`absolute z-50 w-full mt-2 rounded-xl border-2 shadow-2xl ${
                                 isDarkMode 
                                   ? 'bg-slate-800 border-slate-600 shadow-2xl' 
                                   : 'bg-white border-gray-200 shadow-2xl'
                               } max-h-80 overflow-y-auto custom-scrollbar`}>
                                 {sortedQualities.length > 0 ? (
                                   sortedQualities.map((quality) => (
                                     <div key={quality?._id || Math.random()} className={`flex items-center justify-between p-4 hover:bg-gray-50 border-b transition-all duration-200 ${
                                       isDarkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-100'
                                     } ${newlyCreatedQuality && quality._id === newlyCreatedQuality._id ? 
                                       isDarkMode ? 'bg-blue-900/30 border-blue-500/50' : 'bg-blue-50 border-blue-200' 
                                       : ''
                                     }`}>
                                       <button
                                         type="button"
                                         onClick={() => {
                                           if (quality && quality._id && quality.name) {
                                             console.log('Quality selected:', quality.name, 'ID:', quality._id, 'for item:', index);
                                             handleItemChange(index, 'quality', quality._id);
                                             setQualitySearch(quality.name);
                                             setShowQualityDropdown(false);
                                             setActiveQualityDropdown(null);
                                             // Clear the newly created quality highlight
                                             setNewlyCreatedQuality(null);
                                             // Clear any quality-related errors for this item
                                             setErrors(prev => {
                                               const newErrors = { ...prev };
                                               delete newErrors[`items.${index}.quality`];
                                               return newErrors;
                                             });
                                           }
                                         }}
                                         className={`flex-1 text-left px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-900 text-lg font-medium transition-all duration-200 ${
                                           isDarkMode 
                                             ? 'text-white hover:bg-slate-600 hover:text-white font-bold' 
                                             : 'text-gray-900 hover:text-gray-900'
                                         }`}
                                       >
                                         {quality?.name || 'Unknown Quality'}
                                       </button>
                                       <button
                                         type="button"
                                         onClick={async () => {
                                           // Check if quality is being used in any orders
                                           if (!quality || !quality._id || !quality.name) {
                                             setValidationMessage({ type: 'error', text: 'Invalid quality data' });
                                             return;
                                           }
                                           
                                           if (confirm(`Are you sure you want to delete quality "${quality.name}"?`)) {
                                             try {
                                               const response = await fetch(`/api/qualities/${quality._id}`, {
                                                 method: 'DELETE',
                                                 headers: {
                                                   'Content-Type': 'application/json',
                                                 },
                                               });
                                               
                                               const data = await response.json();
                                               
                                               if (response.ok) {
                                                 onAddQuality(); // Refresh qualities
                                                 setValidationMessage({ type: 'success', text: 'Quality deleted successfully!' });
                                               } else {
                                                 setValidationMessage({ type: 'error', text: data.message || 'Failed to delete quality' });
                                               }
                                             } catch (error) {
                                               console.error('Error deleting quality:', error);
                                               setValidationMessage({ type: 'error', text: 'Failed to delete quality. Please try again.' });
                                             }
                                           }
                                         }}
                                         className={`p-2 rounded-lg hover:bg-red-50 flex items-center justify-center transition-all duration-300 ${
                                           isDarkMode 
                                             ? 'text-red-400 hover:bg-red-500/20 hover:scale-110' 
                                             : 'text-red-600 hover:bg-red-50 hover:scale-110'
                                         }`}
                                         title="Delete Quality"
                                       >
                                         <TrashIcon className="h-5 w-5" />
                                       </button>
                                     </div>
                                   ))
                                 ) : (
                                   <div className={`px-6 py-4 text-lg ${
                                     isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                   }`}>
                                     No qualities found
                                   </div>
                                 )}
                               </div>
                             )}
                           </div>
                           {getItemFieldError(index, 'quality') && (
                             <p className="mt-1 text-sm text-red-500">{getItemFieldError(index, 'quality')}</p>
                           )}
                         </div>

                         {/* Quantity */}
                         <div>
                                                       <label className={`block text-sm font-semibold mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Quantity
                            </label>
                           <input
                             type="number"
                             min="1"
                             value={item.quantity || ''}
                             onChange={(e) => {
                               const value = e.target.value;
                               handleItemChange(index, 'quantity', value === '' ? undefined : parseInt(value) || undefined);
                             }}
                             onBlur={() => handleBlur(`items.${index}.quantity`)}
                             className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                               getItemFieldError(index, 'quantity')
                                 ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                 : isDarkMode
                                   ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-white/30'
                                   : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 hover:border-gray-400'
                             }`}
                             placeholder="Enter quantity"
                           />
                           {getItemFieldError(index, 'quantity') && (
                             <p className="mt-1 text-xs text-red-500">{getItemFieldError(index, 'quantity')}</p>
                           )}
                         </div>

                         {/* Description */}
                         <div>
                           <label className={`block text-sm font-semibold mb-2 ${
                             isDarkMode ? 'text-gray-300' : 'text-gray-700'
                           }`}>
                             Description
                           </label>
                           <input
                             type="text"
                             value={item.description}
                             onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                             onBlur={() => handleBlur(`items.${index}.description`)}
                             className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-300 text-sm ${
                               getItemFieldError(index, 'description')
                                 ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                 : isDarkMode
                                   ? 'bg-white/10 border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                                   : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20'
                             }`}
                             placeholder="Enter item description..."
                           />
                           {getItemFieldError(index, 'description') && (
                             <p className="mt-1 text-xs text-red-500">{getItemFieldError(index, 'description')}</p>
                           )}
                         </div>
                       </div>

                       {/* Enhanced Item Image Section */}
                       <div className="mt-6">
                         <label className={`block text-sm font-semibold mb-3 ${
                           isDarkMode ? 'text-gray-300' : 'text-gray-700'
                         }`}>
                           Item Images
                         </label>
                         
                         {/* Upload Options Row - Enhanced */}
                         <div className="flex space-x-3 mb-4">
                           {/* Gallery Upload Button */}
                           <label
                             htmlFor={`image-upload-${index}`}
                             className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 ${
                               isDarkMode
                                 ? 'border-blue-500 hover:border-blue-400 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300'
                                 : 'border-blue-400 hover:border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700'
                             }`}
                             onDragOver={handleDragOver}
                             onDrop={(e) => handleDrop(e, index)}
                             title="Upload from gallery"
                           >
                             <PhotoIcon className="w-5 h-5 mr-2" />
                             <span className="text-sm font-medium">Gallery</span>
                             <input
                               id={`image-upload-${index}`}
                               type="file"
                               className="hidden"
                               accept="image/*"
                               multiple
                               onChange={(e) => handleFileInputChange(e, index)}
                               disabled={imageUploading}
                             />
                           </label>
                           
                           {/* Camera Capture Button */}
                           <button
                             type="button"
                             onClick={() => handleCameraPreview(index)}
                             disabled={!cameraAvailable || imageUploading}
                             className={`flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg transition-all duration-300 hover:scale-105 ${
                               !cameraAvailable || imageUploading
                                 ? 'border-gray-400 bg-gray-100 cursor-not-allowed text-gray-400'
                                 : isDarkMode
                                   ? 'border-emerald-500 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300'
                                   : 'border-emerald-400 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700'
                             }`}
                             title="Capture with camera"
                           >
                             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                             </svg>
                             <span className="text-sm font-medium">Camera</span>
                           </button>
                           
                           {/* Drag & Drop Area */}
                           <div
                             className={`flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed rounded-lg transition-all duration-300 ${
                               isDarkMode
                                 ? 'border-gray-600 hover:border-gray-500 bg-white/5 hover:bg-white/10'
                                 : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                             }`}
                             onDragOver={handleDragOver}
                             onDrop={(e) => handleDrop(e, index)}
                           >
                             <span className={`text-sm ${
                               isDarkMode ? 'text-gray-400' : 'text-gray-500'
                             }`}>
                               Drag & drop images here
                             </span>
                           </div>
                         </div>

                         {/* Upload Progress */}
                         {imageUploading && (
                           <div className={`flex items-center justify-center space-x-2 p-2 rounded-lg border-2 mb-3 ${
                             isDarkMode 
                               ? 'bg-blue-900/20 border-blue-500/30' 
                               : 'bg-blue-50 border-blue-200'
                           }`}>
                             <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                             <span className={`text-xs font-medium ${
                               isDarkMode ? 'text-blue-300' : 'text-blue-700'
                             }`}>
                               Uploading...
                             </span>
                           </div>
                         )}

                         {/* Enhanced Multiple Images Preview */}
                         <div className={`w-full min-h-40 border-2 rounded-xl p-4 ${
                           (item.imageUrls && item.imageUrls.length > 0)
                             ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                             : isDarkMode 
                               ? 'border-gray-600 bg-gray-800/50' 
                               : 'border-gray-300 bg-gray-50'
                         }`}>
                           {item.imageUrls && item.imageUrls.length > 0 ? (
                             <div className="space-y-4">
                               {/* Images Grid - Enhanced */}
                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                 {item.imageUrls.map((imageUrl, imageIndex) => (
                                   <div key={imageIndex} className="relative group">
                                     <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                                       <img
                                         src={imageUrl}
                                         alt={`Item ${index + 1} image ${imageIndex + 1}`}
                                         className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                       />
                                     </div>
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center space-x-2">
                                       <button
                                         type="button"
                                         onClick={() => setShowImagePreview({ url: imageUrl, index })}
                                         className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 hover:scale-110"
                                         title="Preview full image"
                                       >
                                         <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                         </svg>
                                       </button>
                                       <button
                                         type="button"
                                         onClick={() => {
                                           const updatedImages = item.imageUrls?.filter((_, i) => i !== imageIndex) || [];
                                           handleItemChange(index, 'imageUrls', updatedImages);
                                         }}
                                         className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-300 hover:scale-110"
                                         title="Remove image"
                                       >
                                         <XMarkIcon className="h-4 w-4" />
                                       </button>
                                     </div>
                                     {/* Image Number Badge */}
                                     <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                       #{imageIndex + 1}
                                     </div>
                                   </div>
                                 ))}
                               </div>
                               
                               
                               
                               {/* Image Count */}
                               <div className={`text-center text-sm ${
                                 isDarkMode ? 'text-gray-400' : 'text-gray-600'
                               }`}>
                                 {item.imageUrls.length} image{item.imageUrls.length !== 1 ? 's' : ''} uploaded
                               </div>
                             </div>
                           ) : (
                             <div className={`text-center py-12 ${
                               isDarkMode ? 'text-gray-400' : 'text-gray-500'
                             }`}>
                               <PhotoIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                               <p className="text-base font-medium mb-1">No images selected</p>
                               <p className="text-sm">Use the buttons above to upload images</p>
                             </div>
                           )}
                         </div>
                                                </div>
                       </div>
                     ))
                   )}
                 </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex justify-end space-x-4 p-6 border-t-2 ${
            isDarkMode ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 text-base hover:scale-105 ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-white/10'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 text-base ${
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:scale-105 active:scale-95'
              } ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-xl'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-xl'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span className="text-base">{order ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                <span className="text-base">{order ? 'Update Order' : 'Create Order'}</span>
              )}
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
              if (newQualityData && newQualityData._id && newQualityData.name) {
                onAddQuality(newQualityData);
                // Set the newly created quality for highlighting
                setNewlyCreatedQuality(newQualityData);
                // Auto-select the newly created quality for the active item
                if (activeQualityDropdown !== null) {
                  handleItemChange(activeQualityDropdown, 'quality', newQualityData._id);
                  setQualitySearch(newQualityData.name);
                  setValidationMessage({ type: 'success', text: 'Quality created and selected successfully!' });
                }
              } else {
                setValidationMessage({ type: 'error', text: 'Failed to create quality - invalid data received' });
              }
            }}
          />
        )}

                     {/* Party Modal */}
        {showPartyModal && (
          <PartyModal
            onClose={() => setShowPartyModal(false)}
            onSuccess={(newPartyData?: any) => {
              setShowPartyModal(false);
              if (newPartyData && newPartyData._id && newPartyData.name) {
                onRefreshParties();
                // Auto-select the newly created party
                handleFieldChange('party', newPartyData._id);
                setSelectedPartyName(newPartyData.name);
                setPartySearch(newPartyData.name);
                setValidationMessage({ type: 'success', text: 'Party created and selected successfully!' });
              } else {
                setValidationMessage({ type: 'error', text: 'Failed to create party - invalid data received' });
              }
            }}
          />
        )}

        {/* Camera Preview Modal */}
        {showCameraPreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className={`w-full max-w-2xl rounded-2xl shadow-2xl ${
              isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
            } overflow-hidden`}>
              {/* Header */}
              <div className={`flex justify-between items-center p-6 border-b ${
                isDarkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <h3 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  📸 Camera Preview
                </h3>
                <button
                  onClick={closeCameraPreview}
                  className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                    isDarkMode
                      ? 'text-gray-400 hover:bg-white/10 hover:text-gray-300'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Camera Content */}
              <div className="p-6">
                {cameraStream ? (
                  <div className="space-y-6">
                    {/* Video Preview */}
                    <div className="relative">
                      <video
                        id="camera-video"
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover rounded-xl border-2 border-gray-300"
                        ref={(video) => {
                          if (video && cameraStream) {
                            video.srcObject = cameraStream;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-xl pointer-events-none"></div>
                    </div>

                    {/* Instructions */}
                    <div className={`text-center p-4 rounded-xl ${
                      isDarkMode ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`text-lg font-medium ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-800'
                      }`}>
                        Position your item in the camera view
                      </p>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        Make sure the item is clearly visible and well-lit
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={closeCameraPreview}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                          isDarkMode
                            ? 'text-gray-300 hover:bg-white/10'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={capturePhoto}
                        className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                            : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                        }`}
                      >
                        📸 Capture Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className={`text-lg ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Accessing camera...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
                 )}

         {/* Image Preview Modal */}
         {showImagePreview && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
             <div className={`w-full max-w-4xl rounded-2xl shadow-2xl ${
               isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
             } overflow-hidden`}>
               {/* Header */}
               <div className={`flex justify-between items-center p-6 border-b ${
                 isDarkMode ? 'border-slate-700' : 'border-gray-200'
               }`}>
                 <h3 className={`text-2xl font-bold ${
                   isDarkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   📸 Image Preview - Item {showImagePreview.index + 1}
                 </h3>
                 <button
                   onClick={() => setShowImagePreview(null)}
                   className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                     isDarkMode
                       ? 'text-gray-400 hover:bg-white/10 hover:text-gray-300'
                       : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                   }`}
                 >
                   <XMarkIcon className="h-6 w-6" />
                 </button>
               </div>

               {/* Image Content */}
               <div className="p-6">
                 <div className="relative">
                   <img
                     src={showImagePreview.url}
                     alt="Full size preview"
                     className="w-full h-auto max-h-[70vh] object-contain rounded-xl border-2 border-gray-300"
                   />
                   <div className="absolute top-4 right-4 flex space-x-2">
                     <button
                       onClick={() => window.open(showImagePreview.url, '_blank')}
                       className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                         isDarkMode
                           ? 'bg-black/50 text-white hover:bg-black/70'
                           : 'bg-white/80 text-gray-700 hover:bg-white'
                       }`}
                       title="Open in new tab"
                     >
                       <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                       </svg>
                     </button>
                     <button
                       onClick={() => {
                         const link = document.createElement('a');
                         link.href = showImagePreview.url;
                         link.download = `item-${showImagePreview.index + 1}-image.jpg`;
                         link.click();
                       }}
                       className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                         isDarkMode
                           ? 'bg-black/50 text-white hover:bg-black/70'
                           : 'bg-white/80 text-gray-700 hover:bg-white'
                       }`}
                       title="Download image"
                     >
                       <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                     </button>
                   </div> 
                 </div>
               </div>
             </div>
           </div>
         )}
       
     </div>
   );
 }

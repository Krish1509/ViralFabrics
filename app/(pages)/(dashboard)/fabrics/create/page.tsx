'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  CheckIcon,
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { FabricFormData } from '@/types/fabric';

export default function CreateFabricPage() {
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we're in edit mode
  const editId = searchParams?.get('edit');
  const isEditMode = !!editId;
  
  const [formData, setFormData] = useState<FabricFormData>({
    items: [{
      qualityCode: '',
      qualityName: '',
      weaver: '',
      weaverQualityName: '',
      greighWidth: '',
      finishWidth: '',
      weight: '',
      gsm: '',
      danier: '',
      reed: '',
      pick: '',
      greighRate: '',
      images: []
    }]
  });
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState<{ url: string; index: number } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [checkingQualityCode, setCheckingQualityCode] = useState(false);
  const [isQualityCodeValid, setIsQualityCodeValid] = useState(false);
  const [qualityCodeCache, setQualityCodeCache] = useState<{ [key: string]: boolean }>({});
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error' | 'info' | 'warning'; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [originalQualityCode, setOriginalQualityCode] = useState<string>(''); // Track original quality code for edit mode
  const [timeoutCountdown, setTimeoutCountdown] = useState<number>(0); // Track timeout countdown
  const [originalItemCount, setOriginalItemCount] = useState<number>(1); // Track original number of items
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false); // Control dropdown open/close state

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDropdownOpen && !target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Optimized load fabric data for editing - Fast loading with better error handling
  const loadFabricForEdit = useCallback(async () => {
    if (!editId) return;
    
    try {
      setLoading(true);
      // Use a longer timeout for better reliability in edit mode
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30s timeout for better reliability
      
      // Start countdown timer
      const startTime = Date.now();
      const countdownInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setTimeoutCountdown(remaining);
        
        if (remaining <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/fabrics/${editId}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache', // Prevent caching issues
          'Pragma': 'no-cache',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      clearTimeout(timeoutId);
      clearInterval(countdownInterval);
      setTimeoutCountdown(0); // Reset countdown
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const allItems = data.data;
        
        // Set the original quality code for edit mode
        setOriginalQualityCode(data.qualityCode || '');
        
        // Set the original item count for edit mode
        setOriginalItemCount(allItems.length);
        
        // Load ALL items that share the same quality code
        const formattedItems = allItems.map((item: any) => {
          const formattedItem = {
          qualityCode: item.qualityCode || '',
          qualityName: item.qualityName || '',
          weaver: item.weaver || '',
          weaverQualityName: item.weaverQualityName || '',
          greighWidth: item.greighWidth?.toString() || '',
          finishWidth: item.finishWidth?.toString() || '',
          weight: item.weight?.toString() || '',
          gsm: item.gsm?.toString() || '',
          danier: item.danier || '',
          reed: item.reed?.toString() || '',
          pick: item.pick?.toString() || '',
          greighRate: item.greighRate?.toString() || '',
          images: item.images || []
          };
          
          return formattedItem;
        });
        
        setFormData({
          items: formattedItems
        });
        
        showValidationMessage('success', `Loaded ${allItems.length} item(s) for editing!`);
      } else {
        throw new Error(data.message || 'Failed to load fabric data');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        showValidationMessage('error', 'Request timed out after 30 seconds - Please check your connection and try again');
      } else if (error.message.includes('HTTP 404')) {
        showValidationMessage('error', 'Fabric not found - It may have been deleted');
      } else if (error.message.includes('HTTP 500')) {
        showValidationMessage('error', 'Server error - Please try again later');
      } else {
        showValidationMessage('error', `Error loading fabric: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setTimeoutCountdown(0); // Reset countdown
    }
  }, [editId]);

  // Load fabric data for editing
  useEffect(() => {
    if (isEditMode && editId) {
      loadFabricForEdit();
    }
  }, [isEditMode, editId]);

  // Reset validation states when edit mode changes
  useEffect(() => {
    setErrors({});
    setIsQualityCodeValid(false);
    setQualityCodeCache({}); // Clear cache when edit mode changes
  }, [isEditMode]);

  // Reset validation states on component mount
  useEffect(() => {
    setErrors({});
    setIsQualityCodeValid(false);
    setQualityCodeCache({}); // Clear cache on mount
  }, []);
  
  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      setTimeoutCountdown(0);
    };
  }, []);

  // Handle page loading - Faster and smoother
  useEffect(() => {
    // Set mounted immediately to prevent flickering
    setMounted(true);
    
    // Reduce loading time and make it smoother
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 100); // Reduced to 100ms for even faster loading
    return () => clearTimeout(timer);
  }, []);

  // Auto-sync shared fields when items change (only in create mode)
  useEffect(() => {
    if (formData.items.length > 1 && !isEditMode) {
      syncSharedFields();
    }
  }, [formData.items.length, isEditMode]);

  // Function to sync shared fields across all items (ONLY in create mode)
  const syncSharedFields = () => {
    // Don't sync in edit mode - each item should keep its individual data
    if (isEditMode) return;
    
    setFormData(prev => {
      if (prev.items.length === 0) return prev;
      
      const sharedQualityCode = prev.items[0]?.qualityCode || '';
      const sharedQualityName = prev.items[0]?.qualityName || '';
      const sharedImages = prev.items[0]?.images || [];
      
      return {
        ...prev,
        items: prev.items.map(item => ({
          ...item,
          qualityCode: sharedQualityCode,
          qualityName: sharedQualityName,
          // DON'T sync weaver and weaverQualityName - keep them individual
          images: sharedImages // Only sync images across all items
        }))
      };
    });
  };

  // Check if quality code already exists when creating new fabric
  const checkQualityCodeExists = async (qualityCode: string) => {
    if (!qualityCode.trim() || isEditMode) return; // Skip if editing or empty

    // Check cache first for instant response
    const normalizedCode = qualityCode.trim().toLowerCase();
    if (qualityCodeCache.hasOwnProperty(normalizedCode)) {
      const exists = qualityCodeCache[normalizedCode];
      if (exists) {
        // Quality code exists - this is OK, just show info message
        setErrors(prev => ({ ...prev, qualityCode: '' })); // Clear error
        setIsQualityCodeValid(true); // Mark as valid
        showValidationMessage('info', `Quality code "${qualityCode}" exists. You can add new items to this quality code.`);
      } else {
        setErrors(prev => ({ ...prev, qualityCode: '' }));
        setIsQualityCodeValid(true);
      }
      return;
    }
    
    setCheckingQualityCode(true);
    try {
      // Use a more specific endpoint and add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/fabrics?qualityCode=${encodeURIComponent(qualityCode.trim())}&exact=true`, {
        signal: controller.signal,
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Check if the API returned data and if any item has the exact quality code
      if (data.success && data.data && Array.isArray(data.data)) {
        const exactMatch = data.data.find((item: any) => 
          item.qualityCode && item.qualityCode.toString().toLowerCase() === qualityCode.trim().toLowerCase()
        );
        
        if (exactMatch) {
          // Quality code already exists - this is OK, just show info message
          setQualityCodeCache(prev => ({ ...prev, [normalizedCode]: true }));
          setErrors(prev => ({ ...prev, qualityCode: '' })); // Clear error
          setIsQualityCodeValid(true); // Mark as valid
          showValidationMessage('info', `Quality code "${qualityCode}" exists. You can add new items to this quality code.`);
        } else {
          // Quality code is unique, clear any existing error
          setQualityCodeCache(prev => ({ ...prev, [normalizedCode]: false }));
          setErrors(prev => ({ ...prev, qualityCode: '' }));
          setIsQualityCodeValid(true);
        }
      } else {
        // API didn't return expected data structure, assume it's valid
        setQualityCodeCache(prev => ({ ...prev, [normalizedCode]: false }));
        setErrors(prev => ({ ...prev, qualityCode: '' }));
        setIsQualityCodeValid(true);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request timed out, assume it's valid to avoid blocking the user
        setQualityCodeCache(prev => ({ ...prev, [normalizedCode]: false }));
        setErrors(prev => ({ ...prev, qualityCode: '' }));
        setIsQualityCodeValid(true);
      } else {
        // Other error, assume it's valid to avoid blocking the user
        setQualityCodeCache(prev => ({ ...prev, [normalizedCode]: false }));
        setErrors(prev => ({ ...prev, qualityCode: '' }));
        setIsQualityCodeValid(true);
      }
    } finally {
      setCheckingQualityCode(false);
    }
  };

  const handleSharedFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        [field]: value
      }))
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Reset quality code validation state when user starts typing
    if (field === 'qualityCode') {
      setIsQualityCodeValid(false);
      // Clear any cached result for this field to force re-validation
      if (qualityCodeCache[value.trim().toLowerCase()] !== undefined) {
        setQualityCodeCache(prev => {
          const newCache = { ...prev };
          delete newCache[value.trim().toLowerCase()];
          return newCache;
        });
      }
    }
    
    // Check quality code uniqueness after user stops typing (debounced)
    // Only check in create mode, not edit mode (to avoid annoying validations)
    if (field === 'qualityCode' && value.trim() && !isEditMode) {
      // Clear any existing error first
      setErrors(prev => ({ ...prev, qualityCode: '' }));
      
      // Faster debounce - check after 300ms instead of 1000ms
      setTimeout(() => {
        if (value.trim() === formData.items[0]?.qualityCode) {
        checkQualityCodeExists(value);
        }
      }, 300);
    }
    
    // Also clear any item-specific errors for this field
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith('items.') && key.includes(`.${field}`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
    
    // Clear error when user starts typing
    const errorKey = `items.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  // Show validation message with auto-hide
  const showValidationMessage = (type: 'success' | 'error' | 'info' | 'warning', text: string, duration = 4000) => {
    setValidationMessage({ type, text });
    setTimeout(() => {
      setValidationMessage(null);
    }, duration);
  };

  const addItem = () => {
    setFormData(prev => {
      // SHARED FIELDS (copied from first item):
      // - qualityCode: Same across all items
      // - qualityName: Same across all items  
      // - images: Same across all items
      
      // INDIVIDUAL FIELDS (empty for new items):
      // - weaver: Each item has different weaver
      // - weaverQualityName: Each item has different quality name
      // - greighWidth, finishWidth, weight, gsm, danier, reed, pick, greighRate: Individual specs
      
      const sharedQualityCode = prev.items[0]?.qualityCode || '';
      const sharedQualityName = prev.items[0]?.qualityName || '';
      const sharedImages = prev.items[0]?.images || [];
      
      return {
        ...prev,
        items: [...prev.items, {
          qualityCode: sharedQualityCode,
          qualityName: sharedQualityName,
          weaver: '', // Empty field for new item
          weaverQualityName: '', // Empty field for new item
          greighWidth: '', // Empty field for new item
          finishWidth: '', // Empty field for new item
          weight: '', // Empty field for new item
          gsm: '', // Empty field for new item
          danier: '', // Empty field for new item
          reed: '', // Empty field for new item
          pick: '', // Empty field for new item
          greighRate: '', // Empty field for new item
          images: sharedImages // Shared images
        }]
      };
    });
    
    // Clear any existing errors when adding new item
    setErrors({});
    setIsQualityCodeValid(false);
    setQualityCodeCache({}); // Clear cache when adding new items

    // Scroll down smoothly to show the new item after it's added
    setTimeout(() => {
      window.scrollBy({
        top: 400, // Scroll down 400px to show new item
        behavior: 'smooth'
      });
    }, 100); // Small delay to ensure the new item is rendered
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Image upload functions for shared quality images
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: FileList | File[], retryCount = 0) => {
    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          try {
            // Upload to server instead of base64 conversion
            const uploadedUrl = await uploadFileWithRetry(file, retryCount);
            uploadedUrls.push(uploadedUrl);
          } catch (uploadError: any) {
            if (uploadError.message.includes('timeout') && retryCount < 2) {
              const retryUrl = await uploadFileWithRetry(file, retryCount + 1);
              uploadedUrls.push(retryUrl);
            } else {
              throw uploadError;
            }
          }
        } else {
          }
      }
      
      // Add images to ALL items (shared across all items of same quality)
      setFormData(prev => {
        const existingImages = prev.items[0]?.images || [];
        const newImages = [...existingImages, ...uploadedUrls];
        
        const newFormData = {
        ...prev,
        items: prev.items.map(item => ({
          ...item,
            images: newImages // All items get the same images
          }))
        };
        return newFormData;
      });
      
      if (uploadedUrls.length > 0) {
        showValidationMessage('success', `${uploadedUrls.length} image(s) uploaded successfully!`);
      }
    } catch (error: any) {
      const errorMessage = error.message?.includes('timeout') 
        ? 'Upload timeout - please try again with smaller files or check your connection.'
        : 'Failed to upload images. Please try again.';
      showValidationMessage('error', errorMessage);
    } finally {
      setUploadingImages(false);
    }
  };

  // Upload file with retry mechanism
  const uploadFileWithRetry = async (file: File, retryCount = 0): Promise<string> => {
    const maxRetries = 2;
    const timeoutDuration = 30000 + (retryCount * 10000); // 30s, 40s, 50s
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'fabrics');

        const token = localStorage.getItem('token');
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData - let browser set it with boundary
          },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (data.success && (data.url || data.imageUrl)) {
          return data.url || data.imageUrl;
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } catch (error: any) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Upload failed after all retry attempts');
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (imageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        images: item.images?.filter((_, i) => i !== imageIndex) || []
      }))
    }));
  };

  // Camera functions
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      return cameras;
    } catch (error) {
      return [];
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported in this browser');
        return;
      }
      
      const cameras = await getAvailableCameras();
      const currentCamera = cameras[currentCameraIndex];
      
      const constraints = {
        video: {
          deviceId: currentCamera ? { exact: currentCamera.deviceId } : undefined,
          facingMode: currentCameraIndex === 0 ? 'environment' : 'user',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        }
      };
      
      if (!currentCamera) {
        delete constraints.video.deviceId;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => {
              setTimeout(() => {
                videoRef.current?.play().catch(e2 => {}); }, 200);
            });
          };
        }
      }, 200);
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (error.name === 'NotSupportedError') {
        setCameraError('Camera not supported in this browser. Please use a modern browser.');
      } else if (error.name === 'NotReadableError') {
        setCameraError('Camera is already in use by another application.');
      } else {
        setCameraError(`Camera error: ${error.message || 'Unknown error'}`);
      }
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
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);
    
    try {
      const nextCamera = availableCameras[nextIndex];
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          deviceId: { exact: nextCamera.deviceId },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 }
        } 
      });
      
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      setCameraError(`Failed to switch camera: ${error.message || 'Unknown error'}`);
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
        
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            handleFiles([file]);
            stopCamera();
          }
        }, 'image/jpeg', 0.8);
      }
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Validate shared fields (Quality Code and Quality Name)
    const qualityCode = formData.items[0]?.qualityCode?.trim();
    const qualityName = formData.items[0]?.qualityName?.trim();
    
    if (!qualityCode) {
      newErrors.qualityCode = 'Quality Code is required';
    }
    
    if (!qualityName) {
      newErrors.qualityName = 'Quality Name is required';
    }
    
    // Validate each item's weaver and weaverQualityName fields
    formData.items.forEach((item, index) => {
      if (!item.weaver?.trim()) {
        newErrors[`items.${index}.weaver`] = 'Weaver is required';
      }
      
      if (!item.weaverQualityName?.trim()) {
        newErrors[`items.${index}.weaverQualityName`] = 'Weaver Quality Name is required';
      }
    });
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showValidationMessage('error', 'Please fill all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const apiData = formData.items.map(item => ({
        qualityCode: item.qualityCode,
        qualityName: item.qualityName,
        weaver: item.weaver,
        weaverQualityName: item.weaverQualityName,
        greighWidth: parseFloat(item.greighWidth) || 0,
        finishWidth: parseFloat(item.finishWidth) || 0,
        weight: parseFloat(item.weight) || 0,
        gsm: parseFloat(item.gsm) || 0,
        danier: item.danier,
        reed: parseInt(item.reed) || 0,
        pick: parseInt(item.pick) || 0,
        greighRate: parseFloat(item.greighRate) || 0,
        images: item.images || []
      }));

      const token = localStorage.getItem('token');
      
      if (isEditMode && editId) {
        // For edit mode, we need to handle multiple items properly
        try {
          // Check if quality code changed - this affects how we handle the update
          const currentQualityCode = formData.items[0]?.qualityCode?.trim();
          const qualityCodeChanged = originalQualityCode !== currentQualityCode;
          
          if (qualityCodeChanged) {
            // Quality code changed - this is a major change that affects all items
            // We need to update the quality code for ALL items in the group
            showValidationMessage('info', 'Quality code changed - updating all related items...');
            
            // Update all items with the new quality code
          const updateResponse = await fetch(`/api/fabrics/${editId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
              body: JSON.stringify({
                qualityCode: currentQualityCode,
                qualityName: formData.items[0]?.qualityName?.trim(),
                weaver: formData.items[0]?.weaver?.trim(),
                weaverQualityName: formData.items[0]?.weaverQualityName?.trim(),
                greighWidth: parseFloat(formData.items[0]?.greighWidth) || 0,
                finishWidth: parseFloat(formData.items[0]?.finishWidth) || 0,
                weight: parseFloat(formData.items[0]?.weight) || 0,
                gsm: parseFloat(formData.items[0]?.gsm) || 0,
                danier: formData.items[0]?.danier || '',
                reed: parseInt(formData.items[0]?.reed) || 0,
                pick: parseInt(formData.items[0]?.pick) || 0,
                greighRate: parseFloat(formData.items[0]?.greighRate) || 0,
                images: formData.items[0]?.images || [],
                updateAllWithQualityCode: true, // Signal to backend to update all related items
                originalQualityCode: originalQualityCode
              })
          });

          const updateData = await updateResponse.json();
        
          if (updateData.success) {
              showValidationMessage('success', 'All items updated successfully with new quality code!');
              
              // Set flag to refresh fabrics page when user returns
              sessionStorage.setItem('fabricsPageShouldRefresh', 'true');
              
              // Store the updated fabric data for immediate state update
              const updatedFabricData = {
                _id: editId,
                qualityCode: currentQualityCode,
                qualityName: formData.items[0]?.qualityName?.trim(),
                weaver: formData.items[0]?.weaver?.trim(),
                weaverQualityName: formData.items[0]?.weaverQualityName?.trim(),
                greighWidth: parseFloat(formData.items[0]?.greighWidth) || 0,
                finishWidth: parseFloat(formData.items[0]?.finishWidth) || 0,
                weight: parseFloat(formData.items[0]?.weight) || 0,
                gsm: parseFloat(formData.items[0]?.gsm) || 0,
                danier: formData.items[0]?.danier || '',
                reed: parseInt(formData.items[0]?.reed) || 0,
                pick: parseInt(formData.items[0]?.pick) || 0,
                greighRate: parseFloat(formData.items[0]?.greighRate) || 0,
                images: formData.items[0]?.images || []
              };
              sessionStorage.setItem('editedFabricData', JSON.stringify(updatedFabricData));
              
              setTimeout(() => {
                // Use URL parameter to force refresh
                router.push('/fabrics?refresh=true');
              }, 800);
            } else {
              // Handle quality code validation error
              if (updateData.message && updateData.message.includes('already exists and cannot be used')) {
                showValidationMessage('error', updateData.message);
                // Don't redirect - let user fix the quality code
              } else {
                showValidationMessage('error', updateData.message || 'Update failed');
                setTimeout(() => {
                  router.push('/fabrics');
                }, 2000);
              }
            }
          } else {
            // No quality code change - handle item updates and additions
            // First, update existing items
            const updateResponse = await fetch(`/api/fabrics/${editId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                ...apiData[0],
                updateAllItems: true, // Signal to backend to update all related items
                allItems: apiData // Send all items data
              })
            });

            const updateData = await updateResponse.json();
          
            if (updateData.success) {
              // Check if we need to create new items (when user added more items)
              const originalItemCount = updateData.originalItemCount || 1;
              const newItemsCount = apiData.length - originalItemCount;
              
              if (newItemsCount > 0) {
                // Create new items for the additional ones
                showValidationMessage('info', `Updating existing items and creating ${newItemsCount} new item(s)...`);
                
                // Get the new items (items beyond the original count)
                const newItems = apiData.slice(originalItemCount);
                
                // Create new fabrics for the additional items
                const createResponse = await fetch('/api/fabrics', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify(newItems)
                });
                
                const createData = await createResponse.json();
                
                if (createData.success) {
                  showValidationMessage('success', `Successfully updated existing items and created ${newItemsCount} new item(s)!`);
                  setTimeout(() => {
                    router.push('/fabrics');
                  }, 1500);
                } else {
                  showValidationMessage('error', `Updated existing items but failed to create new ones: ${createData.message}`);
                  setTimeout(() => {
                    router.push('/fabrics');
                  }, 2000);
                }
              } else {
                // No new items, just show success for updates
            if (updateData.warning && updateData.existingFabrics) {
              // Show warning about existing fabrics with same quality code
              const warningMessage = `${updateData.message}\n\nExisting fabrics with this quality code:\n${updateData.existingFabrics.map((fabric: any) => 
                `• ${fabric.qualityName} - Weaver: ${fabric.weaver}, Quality: ${fabric.weaverQualityName}`
              ).join('\n')}`;
              
              showValidationMessage('warning', warningMessage);
              
              // Still redirect after showing warning
              setTimeout(() => {
                router.push('/fabrics');
              }, 3000); // Give more time to read the warning
            } else {
              // Reset validation states on success
              setErrors({});
              setIsQualityCodeValid(false);
              setQualityCodeCache({}); // Clear cache on successful submission
              showValidationMessage('success', 'Fabric updated successfully!');
              
              // Set flag to refresh fabrics page when user returns
              sessionStorage.setItem('fabricsPageShouldRefresh', 'true');
              
              // Store the updated fabric data for immediate state update
              const updatedFabricData = {
                _id: editId,
                qualityCode: formData.items[0]?.qualityCode?.trim(),
                qualityName: formData.items[0]?.qualityName?.trim(),
                weaver: formData.items[0]?.weaver?.trim(),
                weaverQualityName: formData.items[0]?.weaverQualityName?.trim(),
                greighWidth: parseFloat(formData.items[0]?.greighWidth) || 0,
                finishWidth: parseFloat(formData.items[0]?.finishWidth) || 0,
                weight: parseFloat(formData.items[0]?.weight) || 0,
                gsm: parseFloat(formData.items[0]?.gsm) || 0,
                danier: formData.items[0]?.danier || '',
                reed: parseInt(formData.items[0]?.reed) || 0,
                pick: parseInt(formData.items[0]?.pick) || 0,
                greighRate: parseFloat(formData.items[0]?.greighRate) || 0,
                images: formData.items[0]?.images || []
              };
              sessionStorage.setItem('editedFabricData', JSON.stringify(updatedFabricData));
              
              setTimeout(() => {
                // Use URL parameter to force refresh
                router.push('/fabrics?refresh=true');
              }, 500);
                }
            }
          } else {
            showValidationMessage('error', updateData.message || 'Update failed');
            }
          }
        } catch (error) {
          showValidationMessage('error', 'An error occurred while updating fabric');
        }
      } else {
        // Create new fabric(s) - each item becomes a separate record but with same quality code
        const response = await fetch('/api/fabrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiData)
        });

        const data = await response.json();
        
        if (data.success) {
          // Reset validation states on success
          setErrors({});
          setIsQualityCodeValid(false);
          setQualityCodeCache({}); // Clear cache on successful submission
          showValidationMessage('success', `Fabric created successfully with ${formData.items.length} item(s)!`);
          
          // Set flag to refresh fabrics page when user returns
          sessionStorage.setItem('fabricsPageShouldRefresh', 'true');
          
          setTimeout(() => {
            // Use URL parameter to force refresh
            router.push('/fabrics?refresh=true');
          }, 500);
        } else {
          showValidationMessage('error', data.message || 'Operation failed');
        }
      }
    } catch (error) {
      showValidationMessage('error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton - Show immediately to prevent flickering
  if (!mounted || pageLoading || (isEditMode && loading)) {
    return (
      <div className={`min-h-screen rounded-2xl transition-colors duration-300 ${
        isDarkMode 
          ? 'text-white bg-gray-900' 
          : 'text-gray-900 bg-white'
      }`}>
        <div className={`border-b shadow-lg transition-colors duration-300 ${
          isDarkMode 
            ? 'border-gray-600/50 bg-gray-800' 
            : 'border-gray-200 bg-white'
        }`}>
          <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-3 xl:px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6 lg:h-20 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl animate-pulse ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}></div>
                <div className="space-y-2">
                  <div className={`w-32 sm:w-48 h-6 sm:h-8 rounded-lg animate-pulse ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}></div>
                  <div className={`w-48 sm:w-64 h-4 sm:h-5 rounded animate-pulse ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}></div>
                </div>
              </div>
              <div className={`w-24 h-10 sm:w-28 sm:h-12 rounded-xl animate-pulse ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-3 xl:px-4 py-6 sm:py-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Form skeleton */}
            <div className="space-y-4 sm:space-y-6">
              <div className={`w-full h-12 sm:h-14 rounded-xl animate-pulse ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}></div>
              <div className={`w-full h-12 sm:h-14 rounded-xl animate-pulse ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}></div>
              <div className={`w-full h-12 sm:h-14 rounded-xl animate-pulse ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}></div>
            </div>
            
            {/* Items skeleton */}
            <div className="space-y-4 sm:space-y-6">
              <div className={`w-32 h-8 rounded-lg animate-pulse ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
              }`}></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`p-4 sm:p-6 rounded-xl border animate-pulse ${
                    isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="space-y-3 sm:space-y-4">
                      <div className={`w-full h-10 rounded-lg animate-pulse ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                      }`}></div>
                      <div className={`w-full h-10 rounded-lg animate-pulse ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                      }`}></div>
                      <div className={`w-full h-10 rounded-lg animate-pulse ${
                        isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen rounded-2xl transition-all duration-500 ease-out animate-in fade-in-0 slide-in-from-bottom-2 ${
            isDarkMode 
        ? 'text-white bg-gray-900' 
        : 'text-gray-900 bg-white'
    }`}>

      {/* Floating Validation Message */}
      {validationMessage && (
        <div className={`fixed top-4 left-4 z-50 min-w-80 max-w-md p-4 rounded-lg shadow-2xl border-l-4 backdrop-blur-sm transform transition-all duration-300 ${
          validationMessage.type === 'success'
            ? 'bg-green-900/90 border-green-500 text-green-100'
            : validationMessage.type === 'error'
            ? 'bg-red-900/90 border-red-500 text-red-100'
            : validationMessage.type === 'warning'
            ? 'bg-yellow-900/90 border-yellow-500 text-yellow-100'
            : 'bg-blue-900/90 border-blue-500 text-blue-100'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {validationMessage.type === 'success' ? (
                <CheckIcon className="h-6 w-6 text-green-400" />
              ) : validationMessage.type === 'error' ? (
                <XMarkIcon className="h-6 w-6 text-red-400" />
              ) : validationMessage.type === 'warning' ? (
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              ) : (
                <PhotoIcon className="h-6 w-6 text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{validationMessage.text}</p>
            </div>
            <button
              onClick={() => setValidationMessage(null)}
              className={`flex-shrink-0 transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className={`border-b shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-top-2 ${
        isDarkMode 
          ? 'border-gray-600/50 bg-gray-800' 
          : 'border-gray-200 bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-1 sm:px-2 lg:px-3 xl:px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6 lg:h-20 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <button
                onClick={() => router.push('/fabrics')}
                className={`p-2 sm:p-3 rounded-xl transition-all duration-200 hover:scale-110 border ${
                  isDarkMode 
                    ? 'bg-gray-700/50 hover:bg-gray-600/70 border-gray-600 hover:border-gray-500' 
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-300 hover:border-gray-400'
                }`}
              >
                <ArrowLeftIcon className={`h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`} />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold transition-colors duration-300 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {isEditMode ? 'Edit Fabric' : 'Create New Fabric'}
                  </h1>
                  <p className={`text-sm sm:text-base mt-1 transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {isEditMode ? 'Update fabric information and properties' : 'Add fabric items to your inventory with detailed specifications'}
                  </p>
                </div>
              </div>
              
              {/* Keyboard Shortcuts Button - Now in Header - Hidden on small screens */}
              <div className="relative group hidden xl:block">
                <button className={`p-2 sm:p-3 rounded-xl transition-all duration-200 hover:scale-105 border ${
                  isDarkMode 
                    ? 'bg-gray-700/50 hover:bg-gray-600/70 border-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-600'
                }`}>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Shortcuts</span>
                  </div>
                </button>
                
                {/* Shortcuts Tooltip */}
                <div className={`absolute top-full right-0 mt-2 p-4 rounded-xl shadow-2xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 min-w-[280px] backdrop-blur-md ${
                  isDarkMode 
                    ? 'bg-gray-900/95 border-gray-600 text-gray-200 shadow-gray-900/50' 
                    : 'bg-white/95 border-gray-300 text-gray-700 shadow-gray-500/20'
                }`}>
                  <div className="space-y-3">
                    <div className={`flex items-center space-x-2 pb-2 border-b transition-colors duration-300 ${
                      isDarkMode ? 'border-gray-500/20' : 'border-gray-300/50'
                    }`}>
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <h3 className="font-bold text-sm">Keyboard Shortcuts</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className={`flex justify-between items-center py-1.5 px-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-500/10' : 'hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500 text-sm">➕</span>
                          <span className="font-medium">Add New Item</span>
                        </div>
                        <kbd className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                          isDarkMode ? 'bg-gray-800 text-green-400 border border-gray-700' : 'bg-gray-100 text-green-600 border border-gray-200'
                        }`}>Alt + N</kbd>
                      </div>
                      <div className={`flex justify-between items-center py-1.5 px-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-500/10' : 'hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-500 text-sm">💾</span>
                          <span className="font-medium">Save Fabric</span>
                        </div>
                        <kbd className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                          isDarkMode ? 'bg-gray-800 text-blue-400 border border-gray-700' : 'bg-gray-100 text-blue-600 border border-gray-200'
                        }`}>Ctrl + Enter</kbd>
                      </div>
                      <div className={`flex justify-between items-center py-1.5 px-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-500/10' : 'hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-orange-500 text-sm">↩️</span>
                          <span className="font-medium">Go Back</span>
                        </div>
                        <kbd className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                          isDarkMode ? 'bg-gray-800 text-orange-400 border border-gray-700' : 'bg-gray-100 text-orange-600 border border-gray-200'
                        }`}>Esc</kbd>
                      </div>
                      <div className={`flex justify-between items-center py-1.5 px-2 rounded-lg transition-colors ${
                        isDarkMode ? 'hover:bg-gray-500/10' : 'hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-500 text-sm">⚡</span>
                          <span className="font-medium">Quick Save</span>
                        </div>
                        <kbd className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                          isDarkMode ? 'bg-gray-800 text-purple-400 border border-gray-700' : 'bg-gray-100 text-purple-600 border border-gray-200'
                        }`}>Ctrl + S</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className={`flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 rounded-xl border transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-100 border-gray-300'
              }`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m16 0v10l-8 4-8-4V7" />
                </svg>
                <span className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {formData.items.length} Weaver{formData.items.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-1 sm:px-2 lg:px-3 xl:px-4 py-2 transition-all duration-300 animate-in fade-in-0 slide-in-from-top-4 delay-100 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>

        {/* Loading Indicator for Edit Mode */}
        {isEditMode && loading && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl border border-blue-500/30 bg-blue-500/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-blue-400">Loading Fabric Data...</h3>
                <p className="text-sm sm:text-base text-blue-300">
                  Please wait while we fetch the fabric information for editing.
                  {timeoutCountdown > 0 && (
                    <span className="ml-2 text-blue-200">
                      (Timeout in {timeoutCountdown}s)
                    </span>
                  )}
                </p>
                <div className="mt-2 sm:mt-3 w-full bg-blue-500/20 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ 
                      width: timeoutCountdown > 0 ? `${(timeoutCountdown / 30) * 100}%` : '100%' 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Shared Fabric Information */}
          <div className={`p-2 sm:p-3 lg:p-4 rounded-xl border mb-3 sm:mb-4 lg:mb-6 transition-all duration-500 ease-out animate-in fade-in-0 slide-in-from-top-4 delay-200 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
                            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quality Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {/* Quality Code */}
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">
                   Quality Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                <input
                  type="text"
                  value={formData.items[0]?.qualityCode || ''}
                  onChange={(e) => {
                    handleSharedFieldChange('qualityCode', e.target.value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      checkQualityCodeExists(e.target.value);
                    } else {
                      // Clear error if field is empty
                      setErrors(prev => ({ ...prev, qualityCode: '' }));
                    }
                  }}
                  placeholder="e.g., 1001-WL"
                  disabled={isEditMode && loading}
                    className={`w-full p-2 sm:p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm sm:text-base ${
                    errors.qualityCode 
                      ? 'border-red-500 focus:ring-red-400' 
                      : isQualityCodeValid 
                        ? 'border-green-500 focus:ring-green-400' 
                        : ''
                  } ${isEditMode && loading ? 'opacity-50 cursor-not-allowed' : ''} ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400 hover:border-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400'
                  }`}
                />
                  {/* Clear button for Quality Code */}
                  {formData.items[0]?.qualityCode && (
                    <button
                      type="button"
                      onClick={() => handleSharedFieldChange('qualityCode', '')}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                          : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                      }`}
                      title="Clear field"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                  {checkingQualityCode && (
                    <div className="absolute right-3 top-3" title="Checking quality code...">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  {isQualityCodeValid && !checkingQualityCode && (
                    <div className="absolute right-3 top-3" title="Quality code is available">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {errors.qualityCode && !checkingQualityCode && (
                    <div className="absolute right-3 top-3" title="Quality code error">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                </div>
                 {errors.qualityCode && (
                   <div className="mt-2 p-2 sm:p-3 bg-red-900/20 border border-red-500/30 rounded-lg animate-in slide-in-from-top-2">
                     <p className="text-red-400 text-xs sm:text-sm flex items-center">
                       <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                       <span className="flex-1">{errors.qualityCode}</span>
                     </p>
                   </div>
                 )}
                 {!isEditMode && (
                   <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                     You can use existing quality codes to add new items.
                   </p>
                 )}
                 {isQualityCodeValid && !isEditMode && (
                   <div className="mt-2 p-2 sm:p-3 bg-green-900/20 border border-green-500/30 rounded-lg animate-in slide-in-from-top-2">
                     <p className="text-green-400 text-xs sm:text-sm flex items-center">
                       <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                       <span className="flex-1">Ready to create!</span>
                     </p>
                   </div>
                 )}
              </div>

              {/* Quality Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                   Quality Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                <input
                  type="text"
                  value={formData.items[0]?.qualityName || ''}
                  onChange={(e) => handleSharedFieldChange('qualityName', e.target.value)}
                  placeholder="Enter quality name"
                    className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                   } ${errors.qualityName ? 'border-red-500' : ''}`}
                 />
                   {/* Clear button for Quality Name */}
                   {formData.items[0]?.qualityName && (
                     <button
                       type="button"
                       onClick={() => handleSharedFieldChange('qualityName', '')}
                       className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                         isDarkMode 
                           ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                           : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                       }`}
                       title="Clear field"
                     >
                       <XMarkIcon className="h-4 w-4" />
                     </button>
                   )}
                </div>
                 {errors.qualityName && (
                   <p className="text-red-500 text-sm mt-1">{errors.qualityName}</p>
                 )}
               </div>
            </div>

            {/* Quality Images Section */}
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">Quality Images</label>
                <span className={`text-xs px-2 py-1 rounded ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {formData.items[0]?.images?.length || 0} image(s)
                </span>
              </div>
              
              {/* Image Upload Area */}
              <div className="flex items-center space-x-4 mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                  id="quality-image-upload"
                />
                <label
                  htmlFor="quality-image-upload"
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
                  onTouchStart={(e) => {
                    e.preventDefault();
                  }}
                  className={`px-6 py-3 rounded-lg border-2 border-dashed transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-green-500 text-gray-300 hover:text-green-400' 
                      : 'border-gray-300 hover:border-green-400 text-gray-600 hover:text-green-600'
                  }`}
                >
                  <PhotoIcon className="h-5 w-5 inline mr-2" />
                  Camera
                </button>
                
                {/* Drag & Drop Button - Only visible on 1200px+ displays */}
                <button
                  type="button"
                  onClick={() => {
                    // Trigger the file input when drag & drop button is clicked
                    document.getElementById('quality-image-upload')?.click();
                  }}
                  className={`hidden min-[1200px]:inline-flex px-6 py-3 rounded-lg border-2 border-dashed transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-purple-500 text-gray-300 hover:text-purple-400' 
                      : 'border-gray-300 hover:border-purple-400 text-gray-600 hover:text-purple-600'
                  }`}
                  title="Drag & Drop Images (Click to browse files)"
                >
                  <svg className="h-5 w-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Drag & Drop
                </button>
                
                {uploadingImages && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Uploading...</span>
                  </div>
                )}
              </div>
              
              {/* Drag & Drop Area - Enhanced visual feedback */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`w-full px-6 py-8 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center space-x-3 group ${
                  dragActive
                    ? isDarkMode
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-purple-500 bg-purple-50 text-purple-600'
                    : isDarkMode
                    ? 'border-gray-500 hover:border-purple-400 text-gray-300 hover:text-purple-300 hover:bg-purple-500/10'
                    : 'border-gray-300 hover:border-purple-500 text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <svg className={`w-8 h-8 transition-all duration-300 ${
                  dragActive ? 'scale-110' : 'group-hover:scale-110'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-center">
                  <p className="text-lg font-medium">
                    {dragActive ? 'Drop images here!' : 'Drag & drop images here'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    dragActive 
                      ? isDarkMode ? 'text-purple-300' : 'text-purple-500'
                      : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {dragActive ? 'Release to upload' : 'or click the buttons above'}
                  </p>
                </div>
              </div>
              
              {/* Image Previews */}
              {formData.items[0]?.images && formData.items[0].images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {formData.items[0].images.map((image, imageIndex) => (
                    <div key={imageIndex} className="relative group">
                      <div className={`aspect-square rounded-lg overflow-hidden border-2 shadow-sm hover:shadow-lg transition-all duration-200 ${
                        isDarkMode 
                          ? 'border-gray-600 bg-gray-700' 
                          : 'border-gray-200 bg-gray-100'
                      }`}>
                        <img
                          src={image}
                          alt={`Quality image ${imageIndex + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show fallback
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}">
                                  <div class="text-center">
                                    <svg class="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <p class="text-xs">Image Error</p>
                                  </div>
                                </div>
                              `;
                            }
                          }}
                          onLoad={(e) => {
                            }}
                        />
                        
                        {/* Preview Button - Shows on Hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button
                            type="button"
                            onClick={() => setShowImagePreview({ url: image, index: imageIndex })}
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
                        onClick={() => removeImage(imageIndex)}
                        className={`absolute -top-2 -right-2 rounded-full p-1.5 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 hover:scale-110 ${
                          isDarkMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                        title="Remove Image"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fabric Items */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-xl font-semibold">Weaver Information</h3>
                
                {/* Short Code Dropdown - Shows Item Count and Quick Navigation */}
                {formData.items.length > 1 && (
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-500 hover:bg-gray-600' 
                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-sm font-medium">
                        📦 {formData.items.length} Weaver{formData.items.length > 1 ? 's' : ''}
                      </span>
                      <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className={`absolute top-full left-0 mt-2 w-48 border rounded-lg shadow-xl z-50 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="py-2">
                          <div className={`px-3 py-2 text-xs font-medium border-b flex items-center justify-between ${
                          isDarkMode 
                            ? 'text-gray-400 border-gray-600' 
                            : 'text-gray-500 border-gray-100'
                        }`}>
                            <span>Quick Navigation</span>
                            <button
                              type="button"
                              onClick={() => setIsDropdownOpen(false)}
                              className={`p-1 rounded-full transition-colors ${
                                isDarkMode 
                                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                              }`}
                              title="Close dropdown"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                        </div>
                        {formData.items.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              // Scroll to specific item
                              const itemElement = document.getElementById(`fabric-item-${index}`);
                              if (itemElement) {
                                itemElement.scrollIntoView({ 
                                  behavior: 'smooth', 
                                  block: 'center' 
                                });
                                // Add highlight effect
                                itemElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
                                setTimeout(() => {
                                  itemElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
                                }, 2000);
                              }
                                // Keep dropdown open after clicking
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center space-x-2 ${
                              isDarkMode 
                                ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
                              {index + 1}
                            </span>
                              <span>Weaver {index + 1}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {formData.items.map((item, index) => (
              <div 
                key={index}
                id={`fabric-item-${index}`}
                className={`p-2 sm:p-3 lg:p-4 rounded-xl border shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-top-4 delay-300 ${
                  isDarkMode 
                    ? 'border-gray-600 bg-gray-800' 
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h4 className="text-base sm:text-lg font-semibold">Weaver {index + 1}</h4>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'text-red-400 hover:bg-red-500 hover:text-white' 
                          : 'text-red-600 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                  {/* Weaver */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                                               Weaver Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.weaver}
                      onChange={(e) => handleItemChange(index, 'weaver', e.target.value)}
                      placeholder="Enter weaver name"
                        className={`w-full p-2.5 sm:p-3 pr-10 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 ${errors[`items.${index}.weaver`] ? 'border-red-500 focus:ring-red-400' : ''} ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-500 text-white placeholder-gray-400 hover:border-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 hover:border-gray-400'
                      }`}
                    />
                      {/* Clear button for Weaver */}
                      {item.weaver && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'weaver', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                     {errors[`items.${index}.weaver`] && (
                       <p className="text-red-500 text-sm mt-1">{errors[`items.${index}.weaver`]}</p>
                     )}
                  </div>

                  {/* Weaver Quality Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Weaver Quality Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.weaverQualityName}
                      onChange={(e) => handleItemChange(index, 'weaverQualityName', e.target.value)}
                      placeholder="Enter weaver quality name"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[`items.${index}.weaverQualityName`] 
                          ? 'border-red-500 focus:ring-red-400' 
                          : ''
                      } ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for Weaver Quality Name */}
                      {item.weaverQualityName && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'weaverQualityName', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {errors[`items.${index}.weaverQualityName`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`items.${index}.weaverQualityName`]}</p>
                    )}
                  </div>

                  {/* Greigh Width */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Greigh Width (inches)
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.greighWidth}
                      onChange={(e) => handleItemChange(index, 'greighWidth', e.target.value)}
                      placeholder="e.g., 58.5"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for Greigh Width */}
                      {item.greighWidth && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'greighWidth', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Finish Width */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Finish Width (inches)
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.finishWidth}
                      onChange={(e) => handleItemChange(index, 'finishWidth', e.target.value)}
                      placeholder="e.g., 56.0"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for Finish Width */}
                      {item.finishWidth && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'finishWidth', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Weight (KG)
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.weight}
                      onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                      placeholder="e.g., 8.0"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for Weight */}
                      {item.weight && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'weight', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* GSM */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      GSM
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.gsm}
                      onChange={(e) => handleItemChange(index, 'gsm', e.target.value)}
                      placeholder="e.g., 72.5"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for GSM */}
                      {item.gsm && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'gsm', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Danier */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Danier
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.danier}
                      onChange={(e) => handleItemChange(index, 'danier', e.target.value)}
                      placeholder="e.g., 55*22D"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for Danier */}
                      {item.danier && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'danier', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reed */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reed
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.reed}
                      onChange={(e) => handleItemChange(index, 'reed', e.target.value)}
                      placeholder="e.g., 120"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for Reed */}
                      {item.reed && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'reed', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pick */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pick
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.pick}
                      onChange={(e) => handleItemChange(index, 'pick', e.target.value)}
                      placeholder="e.g., 80"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for Pick */}
                      {item.pick && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'pick', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Greigh Rate */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Greigh Rate (₹)
                    </label>
                    <div className="relative">
                    <input
                      type="text"
                      value={item.greighRate}
                      onChange={(e) => handleItemChange(index, 'greighRate', e.target.value)}
                      placeholder="e.g., 150.00"
                        className={`w-full p-3 pr-10 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                      {/* Clear button for Greigh Rate */}
                      {item.greighRate && (
                        <button
                          type="button"
                          onClick={() => handleItemChange(index, 'greighRate', '')}
                          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                            isDarkMode 
                              ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/20' 
                              : 'text-gray-500 hover:text-red-500 hover:bg-red-100'
                          }`}
                          title="Clear field"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button - Full Width */}
          <div className="mt-8">
              <button
                type="button"
                onClick={addItem}
                              className={`w-full px-6 py-4 rounded-xl border-2 border-dashed transition-all duration-300 flex items-center justify-center space-x-3 group ${
                  isDarkMode 
                    ? 'border-gray-500 hover:border-blue-400 text-gray-300 hover:text-blue-300 hover:bg-blue-500/10' 
                    : 'border-gray-300 hover:border-blue-500 text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}

            >
              <PlusIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                              <span className="text-lg font-medium">Add Another Weaver</span>
              </button>
          </div>

          {/* Submit Buttons - Sticky */}
          <div className={`mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 p-3 rounded-lg shadow-lg border z-50 min-[1200px]:sticky min-[1200px]:bottom-4 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-200'
          }`}>
            {/* Reset Button - Only show on create page */}
            {!isEditMode && (
              <button
                type="button"
                onClick={() => {
                  // Reset to empty fields
                  setFormData({
                    items: [{
                      qualityCode: '',
                      qualityName: '',
                      weaver: '',
                      weaverQualityName: '',
                      greighWidth: '',
                      finishWidth: '',
                      weight: '',
                      gsm: '',
                      danier: '',
                      reed: '',
                      pick: '',
                      greighRate: '',
                      images: []
                    }]
                  });
                  // Clear all errors and validation states
                  setErrors({});
                  setIsQualityCodeValid(false);
                  setQualityCodeCache({});
                  showValidationMessage('info', 'Form reset to empty fields');
                }}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg border transition-colors text-sm sm:text-base ${
                  isDarkMode 
                    ? 'border-orange-600 text-orange-300 hover:bg-orange-700' 
                    : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                }`}
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset All
              </button>
            )}
            
            <button
              type="button"
              onClick={() => router.push('/fabrics')}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg border transition-colors text-sm sm:text-base ${
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
              className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-lg font-medium transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${
                loading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              } ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}

            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>{isEditMode ? 'Update Fabric' : `Create Fabric${formData.items.length > 1 ? 's' : ''}`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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
                <div className={`flex items-center justify-center h-64 rounded-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
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
                    controls={false}
                    className="w-full h-96 object-cover rounded-lg bg-black"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Camera Info */}
                  <div className={`absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-white'
        }`}>
                    {availableCameras[currentCameraIndex]?.label || `Camera ${currentCameraIndex + 1}`}
                  </div>
                  
                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      onTouchStart={(e) => {
                        e.preventDefault();
                      }}
                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
                    >
                      <div className="w-12 h-12 bg-blue-500 rounded-full border-4 border-white flex items-center justify-center">
                        <svg className={`w-6 h-6 transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-white'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className={`p-4 border-t transition-colors duration-300 ${
          isDarkMode 
            ? 'border-gray-700 bg-gray-700' 
            : 'border-gray-200 bg-gray-50'
        }`}>
              <div className="flex items-center justify-between text-sm">
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {availableCameras.length > 0 ? `${currentCameraIndex + 1} of ${availableCameras.length} cameras` : 'No cameras available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-60 p-4 transition-colors duration-300 ${
          isDarkMode ? 'bg-black/80' : 'bg-black/60'
        }`}>
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
                  link.download = `quality-image-${showImagePreview.index + 1}.jpg`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
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
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                title="Open in New Tab"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              
              {/* Close Button */}
              <button
                onClick={() => setShowImagePreview(null)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'bg-black/50 hover:bg-black/70 text-white' : 'bg-black/50 hover:bg-black/70 text-white'
                }`}
                title="Close"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* Image Info */}
            <div className={`absolute bottom-4 left-4 bg-black/50 px-3 py-2 rounded-lg text-sm transition-colors duration-300 ${
              isDarkMode ? 'text-white' : 'text-white'
            }`}>
              <p>Quality Image {showImagePreview.index + 1}</p>
              <p className={`text-xs truncate max-w-xs transition-colors duration-300 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-200'
              }`}>{showImagePreview.url}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

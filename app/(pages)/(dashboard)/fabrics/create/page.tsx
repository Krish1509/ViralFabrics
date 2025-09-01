'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  CheckIcon,
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { FabricFormData } from '@/types/fabric';

export default function CreateFabricPage() {
  const { isDarkMode } = useDarkMode();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if we're in edit mode
  const editId = searchParams.get('edit');
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
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load fabric data for editing
  const loadFabricForEdit = async () => {
    if (!editId) return;
    
    try {
      setLoading(true);
      // First get the main fabric
      const response = await fetch(`/api/fabrics/${editId}`);
      const data = await response.json();
      
      if (data.success) {
        const fabric = data.data;
        
        // Then get all fabrics with the same quality code
        const allFabricsResponse = await fetch(`/api/fabrics?search=${encodeURIComponent(fabric.qualityCode)}`);
        const allFabricsData = await allFabricsResponse.json();
        
        if (allFabricsData.success) {
          // Filter to get exact quality code matches
          const sameQualityFabrics = allFabricsData.data.filter((f: any) => 
            f.qualityCode === fabric.qualityCode && f.qualityName === fabric.qualityName
          );
          
          console.log('Loading fabrics for edit:', sameQualityFabrics.length, 'items');
          
          // Convert all fabrics to form items
          const items = sameQualityFabrics.map((f: any) => ({
            qualityCode: f.qualityCode || '',
            qualityName: f.qualityName || '',
            weaver: f.weaver || '',
            weaverQualityName: f.weaverQualityName || '',
            greighWidth: f.greighWidth?.toString() || '',
            finishWidth: f.finishWidth?.toString() || '',
            weight: f.weight?.toString() || '',
            gsm: f.gsm?.toString() || '',
            danier: f.danier || '',
            reed: f.reed?.toString() || '',
            pick: f.pick?.toString() || '',
            greighRate: f.greighRate?.toString() || '',
            images: f.images || []
          }));
          
          setFormData({ items });
        } else {
          // Fallback to single item if search fails
          setFormData({
            items: [{
              qualityCode: fabric.qualityCode || '',
              qualityName: fabric.qualityName || '',
              weaver: fabric.weaver || '',
              weaverQualityName: fabric.weaverQualityName || '',
              greighWidth: fabric.greighWidth?.toString() || '',
              finishWidth: fabric.finishWidth?.toString() || '',
              weight: fabric.weight?.toString() || '',
              gsm: fabric.gsm?.toString() || '',
              danier: fabric.danier || '',
              reed: fabric.reed?.toString() || '',
              pick: fabric.pick?.toString() || '',
              greighRate: fabric.greighRate?.toString() || '',
              images: fabric.images || []
            }]
          });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to load fabric data' });
      }
    } catch (error) {
      console.error('Error loading fabric:', error);
      setMessage({ type: 'error', text: 'Error loading fabric data' });
    } finally {
      setLoading(false);
    }
  };

  // Load fabric data for editing
  useEffect(() => {
    if (isEditMode && editId) {
      loadFabricForEdit();
    }
  }, [isEditMode, editId]);

  // Auto-sync shared fields when items change
  useEffect(() => {
    if (formData.items.length > 1) {
      syncSharedFields();
    }
  }, [formData.items.length]);

  // Function to sync shared fields across all items
  const syncSharedFields = () => {
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
          images: sharedImages // Sync images across all items
        }))
      };
    });
  };

  // Check if quality code already exists when creating new fabric
  const checkQualityCodeExists = async (qualityCode: string) => {
    if (!qualityCode.trim() || isEditMode) return; // Skip if editing or empty
    
    setCheckingQualityCode(true);
    try {
      const response = await fetch(`/api/fabrics?search=${encodeURIComponent(qualityCode.trim())}&limit=1`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        // Check if any fabric has exact quality code match
        const exactMatch = data.data.find((fabric: any) => 
          fabric.qualityCode.toLowerCase() === qualityCode.trim().toLowerCase()
        );
        
        if (exactMatch) {
          setErrors(prev => ({ 
            ...prev, 
            qualityCode: `Quality code "${qualityCode}" already exists. You can add items to existing quality codes.` 
          }));
        }
      }
    } catch (error) {
      console.error('Error checking quality code:', error);
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
    
    // Check quality code uniqueness after user stops typing
    if (field === 'qualityCode' && value.trim() && !isEditMode) {
      // Debounce the API call
      setTimeout(() => {
        checkQualityCodeExists(value);
      }, 1000);
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
  const showValidationMessage = (type: 'success' | 'error' | 'info', text: string, duration = 4000) => {
    setValidationMessage({ type, text });
    setTimeout(() => {
      setValidationMessage(null);
    }, duration);
  };

  const addItem = () => {
    setFormData(prev => {
      // Get the shared values from the first item
      const sharedQualityCode = prev.items[0]?.qualityCode || '';
      const sharedQualityName = prev.items[0]?.qualityName || '';
      const sharedImages = prev.items[0]?.images || []; // Share images across all items
      
      return {
        ...prev,
        items: [...prev.items, {
          qualityCode: sharedQualityCode,
          qualityName: sharedQualityName,
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
          images: sharedImages // New items get same images
        }]
      };
    });
    
    // Clear any existing errors when adding new item
    setErrors({});

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

  const handleFiles = async (files: FileList | File[]) => {
    console.log('handleFiles called with:', files.length, 'files');
    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
        
        if (file.type.startsWith('image/')) {
          // Convert to base64 for demo (in production, upload to cloud storage)
          const base64 = await fileToBase64(file);
          console.log('Base64 generated, length:', base64.length);
          uploadedUrls.push(base64);
        } else {
          console.warn('Skipping non-image file:', file.name, file.type);
        }
      }
      
      console.log('Total images processed:', uploadedUrls.length);
      
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
        console.log('Updated images for ALL items:', newImages.length, 'images');
        return newFormData;
      });
      
      if (uploadedUrls.length > 0) {
        showValidationMessage('success', `${uploadedUrls.length} image(s) uploaded successfully!`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      showValidationMessage('error', 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
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
      console.error('Error getting cameras:', error);
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
              console.log('Video play error:', e);
              setTimeout(() => {
                videoRef.current?.play().catch(e2 => console.log('Retry video play error:', e2));
              }, 200);
            });
          };
        }
      }, 200);
    } catch (error: any) {
      console.error('Camera access denied:', error);
      
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
      console.error('Error switching camera:', error);
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
    
    // Validate each item's weaver field
    formData.items.forEach((item, index) => {
      if (!item.weaver?.trim()) {
        newErrors[`items.${index}.weaver`] = 'Weaver is required';
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
        // For edit mode, first delete all existing items with same quality code, then create new ones
        try {
          const qualityCode = formData.items[0]?.qualityCode;
          const qualityName = formData.items[0]?.qualityName;
          
          console.log('Deleting existing fabrics with quality code:', qualityCode);
          
          // Delete all existing fabrics with same quality code and name
          const deleteResponse = await fetch(`/api/fabrics?qualityCode=${encodeURIComponent(qualityCode)}&qualityName=${encodeURIComponent(qualityName)}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const deleteData = await deleteResponse.json();
          
          if (!deleteData.success) {
            console.warn('Failed to delete existing items:', deleteData.message);
            // Continue anyway - might be a new quality code
          }

          // Create all new items
          const createResponse = await fetch('/api/fabrics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(apiData)
          });

          const createData = await createResponse.json();
          
          if (createData.success) {
            showValidationMessage('success', `Fabric updated successfully with ${formData.items.length} item(s)!`);
            setTimeout(() => {
              router.push('/fabrics');
            }, 1000);
          } else {
            showValidationMessage('error', createData.message || 'Update failed');
          }
        } catch (error) {
          console.error('Error in edit mode:', error);
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
          showValidationMessage('success', `Fabric created successfully with ${formData.items.length} item(s)!`);
          setTimeout(() => {
            router.push('/fabrics');
          }, 1000);
        } else {
          showValidationMessage('error', data.message || 'Operation failed');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      showValidationMessage('error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#1D293D' }}>
      {/* Floating Validation Message */}
      {validationMessage && (
        <div className={`fixed top-4 right-4 z-50 min-w-80 max-w-md p-4 rounded-lg shadow-2xl border-l-4 backdrop-blur-sm transform transition-all duration-300 ${
          validationMessage.type === 'success'
            ? 'bg-green-900/90 border-green-500 text-green-100'
            : validationMessage.type === 'error'
            ? 'bg-red-900/90 border-red-500 text-red-100'
            : 'bg-blue-900/90 border-blue-500 text-blue-100'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {validationMessage.type === 'success' ? (
                <CheckIcon className="h-6 w-6 text-green-400" />
              ) : validationMessage.type === 'error' ? (
                <XMarkIcon className="h-6 w-6 text-red-400" />
              ) : (
                <PhotoIcon className="h-6 w-6 text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{validationMessage.text}</p>
            </div>
            <button
              onClick={() => setValidationMessage(null)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-600" style={{ backgroundColor: '#253649' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/fabrics')}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditMode ? 'Edit Fabric' : 'Create New Fabric'}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {isEditMode ? 'Update fabric information' : 'Add fabric items to your inventory'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm px-3 py-1 rounded-full ${
                isDarkMode 
                  ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                {formData.items.length} Item{formData.items.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8">


        {/* Form */}
        <form onSubmit={handleSubmit}>
           
           
          {/* Shared Fabric Information */}
          <div className={`p-6 rounded-xl border mb-8 ${
            isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <h3 className="text-lg font-semibold mb-6">Shared Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quality Code */}
              <div>
                <label className="block text-sm font-medium mb-2">
                   Quality Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.items[0]?.qualityCode || ''}
                    onChange={(e) => handleSharedFieldChange('qualityCode', e.target.value)}
                    placeholder="e.g., 1001-WL"
                    className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                     } ${errors.qualityCode ? 'border-red-500' : ''}`}
                  />
                  {checkingQualityCode && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                 {errors.qualityCode && (
                   <p className="text-red-500 text-sm mt-1">{errors.qualityCode}</p>
                 )}
                 {!isEditMode && (
                   <p className="text-xs text-gray-500 mt-1">
                     Quality code will be checked for uniqueness. Multiple items can share the same quality code.
                   </p>
                 )}
              </div>

              {/* Quality Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                   Quality Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.items[0]?.qualityName || ''}
                  onChange={(e) => handleSharedFieldChange('qualityName', e.target.value)}
                  placeholder="Enter quality name"
                  className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                   } ${errors.qualityName ? 'border-red-500' : ''}`}
                 />
                 {errors.qualityName && (
                   <p className="text-red-500 text-sm mt-1">{errors.qualityName}</p>
                 )}
               </div>
            </div>

            {/* Quality Images Section */}
            <div className="mt-8">
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
                
                {uploadingImages && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Uploading...</span>
                  </div>
                )}
              </div>
              
              {/* Image Previews */}
              {formData.items[0]?.images && formData.items[0].images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {formData.items[0].images.map((image, imageIndex) => (
                    <div key={imageIndex} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-200 bg-gray-100 dark:bg-gray-700">
                        <img
                          src={image}
                          alt={`Quality image ${imageIndex + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Image failed to load:', image);
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
                            console.log('Image loaded successfully:', image);
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
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 hover:scale-110"
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
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Fabric Items</h3>
            </div>

            {formData.items.map((item, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl border border-gray-600 shadow-lg"
                style={{ backgroundColor: '#253649' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold">Item {index + 1}</h4>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {/* Weaver */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                       Weaver <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.weaver}
                      onChange={(e) => handleItemChange(index, 'weaver', e.target.value)}
                      placeholder="Enter weaver name"
                      className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-700 border-gray-500 text-white placeholder-gray-400 hover:border-gray-400 ${errors[`items.${index}.weaver`] ? 'border-red-500 focus:ring-red-400' : ''}`}
                    />
                     {errors[`items.${index}.weaver`] && (
                       <p className="text-red-500 text-sm mt-1">{errors[`items.${index}.weaver`]}</p>
                     )}
                  </div>

                  {/* Weaver Quality Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Weaver Quality Name
                    </label>
                    <input
                      type="text"
                      value={item.weaverQualityName}
                      onChange={(e) => handleItemChange(index, 'weaverQualityName', e.target.value)}
                      placeholder="Enter weaver quality name"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Greigh Width */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Greigh Width (inches)
                    </label>
                    <input
                      type="text"
                      value={item.greighWidth}
                      onChange={(e) => handleItemChange(index, 'greighWidth', e.target.value)}
                      placeholder="e.g., 58.5"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Finish Width */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Finish Width (inches)
                    </label>
                    <input
                      type="text"
                      value={item.finishWidth}
                      onChange={(e) => handleItemChange(index, 'finishWidth', e.target.value)}
                      placeholder="e.g., 56.0"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Weight (KG)
                    </label>
                    <input
                      type="text"
                      value={item.weight}
                      onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                      placeholder="e.g., 8.0"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* GSM */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      GSM
                    </label>
                    <input
                      type="text"
                      value={item.gsm}
                      onChange={(e) => handleItemChange(index, 'gsm', e.target.value)}
                      placeholder="e.g., 72.5"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Danier */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Danier
                    </label>
                    <input
                      type="text"
                      value={item.danier}
                      onChange={(e) => handleItemChange(index, 'danier', e.target.value)}
                      placeholder="e.g., 55*22D"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Reed */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reed
                    </label>
                    <input
                      type="text"
                      value={item.reed}
                      onChange={(e) => handleItemChange(index, 'reed', e.target.value)}
                      placeholder="e.g., 120"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Pick */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Pick
                    </label>
                    <input
                      type="text"
                      value={item.pick}
                      onChange={(e) => handleItemChange(index, 'pick', e.target.value)}
                      placeholder="e.g., 80"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
                  </div>

                  {/* Greigh Rate */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Greigh Rate (₹)
                    </label>
                    <input
                      type="text"
                      value={item.greighRate}
                      onChange={(e) => handleItemChange(index, 'greighRate', e.target.value)}
                      placeholder="e.g., 150.00"
                      className={`w-full p-3 rounded-lg border transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                    />
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
              className="w-full px-6 py-4 rounded-xl border-2 border-dashed border-gray-500 hover:border-blue-400 text-gray-300 hover:text-blue-300 transition-all duration-300 flex items-center justify-center space-x-3 hover:bg-blue-500/10 group"
            >
              <PlusIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-lg font-medium">Add Another Item</span>
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/fabrics')}
              className={`px-6 py-3 rounded-lg border transition-colors ${
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
              className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
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
                    controls={false}
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
                    <button
                      type="button"
                      onClick={capturePhoto}
                      onTouchStart={(e) => {
                        e.preventDefault();
                      }}
                      className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
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
                  link.download = `quality-image-${showImagePreview.index + 1}.jpg`;
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
              <p>Quality Image {showImagePreview.index + 1}</p>
              <p className="text-xs text-gray-300 truncate max-w-xs">{showImagePreview.url}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

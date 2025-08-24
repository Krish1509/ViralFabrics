'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PlusIcon, 
  PencilIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Order, Party, Quality } from '@/types';

interface LabAddModalProps {
  order: Order | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface LabData {
  orderItemId: string;
  orderItemName: string;
  labSendDate: string;
  approvalDate: string;
  sampleNumber: string;
  existingLab?: any; // Track if lab already exists
}

export default function LabAddModal({ order, onClose, onSuccess }: LabAddModalProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [labData, setLabData] = useState<LabData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);

  // Check for existing labs when order changes
  useEffect(() => {
    if (order && order.items) {
      // Initialize with optimistic data immediately
      const optimisticLabData: LabData[] = order.items.map((item: any, index: number) => ({
        orderItemId: item._id,
        orderItemName: item.quality?.name || `Item ${index + 1}`,
        labSendDate: new Date().toISOString().split('T')[0],
        approvalDate: new Date().toISOString().split('T')[0],
        sampleNumber: '',
        existingLab: null
      }));
      setLabData(optimisticLabData);
      
      // Then fetch actual data in background
      checkExistingLabs();
    }
  }, [order]);

  const checkExistingLabs = async () => {
    if (!order) return;
    
    setCheckingExisting(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced timeout to 2 seconds
      
      const response = await fetch(`/api/labs/by-order/${order._id}`, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=60' // Increased cache to 60 seconds
        }
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (data.success) {
        const existingLabs = Array.isArray(data.data) ? data.data : [];
        const existingLabMap = new Map();
        
        existingLabs.forEach((lab: any) => {
          existingLabMap.set(lab.orderItemId, lab);
        });
        
        // Update lab data with existing labs
        const updatedLabData: LabData[] = order.items.map((item: any, index: number) => {
          const existingLab = existingLabMap.get(item._id);
          return {
            orderItemId: item._id,
            orderItemName: item.quality?.name || `Item ${index + 1}`,
            labSendDate: existingLab?.labSendDate ? new Date(existingLab.labSendDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            approvalDate: existingLab?.labSendData?.approvalDate || new Date().toISOString().split('T')[0],
            sampleNumber: existingLab?.labSendNumber || '',
            existingLab: existingLab || null
          };
        });
        
        setLabData(updatedLabData);
      } else {
        console.error('Failed to fetch existing labs:', data.message);
        // Keep optimistic data on error
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Lab check timeout - using optimistic data');
      } else {
        console.error('Error checking existing labs:', error);
      }
      // Keep optimistic data on error
    } finally {
      setCheckingExisting(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLabDataChange = (index: number, field: keyof LabData, value: any) => {
    const updatedLabData = [...labData];
    updatedLabData[index] = { ...updatedLabData[index], [field]: value };
    setLabData(updatedLabData);
  };

  const handleImageClick = (imageUrl: string, alt: string) => {
    setPreviewImage({ url: imageUrl, alt });
    setShowImagePreview(true);
  };



  const handleSubmit = async () => {
    if (!order) return;

    // Validate required fields before submitting
    const validationErrors = [];
    for (let i = 0; i < labData.length; i++) {
      const lab = labData[i];
      // Only validate lab send date (sample number is completely optional)
      if (!lab.labSendDate) {
        validationErrors.push(`Item ${i + 1}: Lab send date is required`);
      }
    }

    if (validationErrors.length > 0) {
      showMessage('error', `Please fix the following errors:\n${validationErrors.join('\n')}`);
      return;
    }

    setLoading(true);
    try {
      const createdLabs = [];
      const updatedLabs = [];
      
      for (const lab of labData) {
        // Skip if orderItemId is a temporary ID (for new orders that haven't been saved yet)
        if (lab.orderItemId.startsWith('item_')) {
          showMessage('error', 'Please save the order first before adding lab data.');
          return;
        }

        if (lab.existingLab) {
          // Update existing lab - also update orderItemId if it changed
          const response = await fetch(`/api/labs/${lab.existingLab._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderItemId: lab.orderItemId, // Update the orderItemId to match new item ID
              labSendDate: lab.labSendDate,
              labSendNumber: lab.sampleNumber.trim() || undefined,
              labSendData: {
                approvalDate: lab.approvalDate,
                sampleNumber: lab.sampleNumber.trim() || undefined
              },
              remarks: lab.sampleNumber.trim() ? `Sample: ${lab.sampleNumber.trim()}` : 'Lab record updated'
            }),
          });

          const data = await response.json();
          console.log('Lab update response:', data); // Debug log
          
          if (response.ok) {
            // Handle both { success: true, data: ... } and direct data responses
            const labData = data.success ? data.data : data;
            updatedLabs.push(labData);
          } else {
            throw new Error(data.error || data.message || 'Failed to update lab');
          }
        } else {
          // Create new lab
          const response = await fetch('/api/labs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: order._id,
              orderItemId: lab.orderItemId,
              labSendDate: lab.labSendDate,
              labSendNumber: lab.sampleNumber.trim() || undefined,
              labSendData: {
                approvalDate: lab.approvalDate,
                sampleNumber: lab.sampleNumber.trim() || undefined
              },
              status: 'sent',
              remarks: lab.sampleNumber.trim() ? `Sample: ${lab.sampleNumber.trim()}` : 'Lab record created'
            }),
          });

          const data = await response.json();
          console.log('Lab creation response:', data); // Debug log
          
                     if (response.ok) {
             // Handle both { success: true, data: ... } and direct data responses
             const labData = data.success ? data.data : data;
             createdLabs.push(labData);
           } else {
             // Check for duplicate key error or conflict
             if (response.status === 409 || 
                 (data.error && data.error.includes('duplicate key')) ||
                 (data.message && data.message.includes('already exists'))) {
               console.log('Lab already exists for this item, treating as success');
               // Treat duplicate as success since the lab already exists
               createdLabs.push({ id: 'exists', orderItemId: lab.orderItemId });
             } else if (response.status === 500 && data.error?.includes('wasPopulated')) {
               // Lab was created but populate failed - this is still a success
               console.log('Lab created successfully but populate failed, treating as success');
               createdLabs.push({ id: 'created', orderItemId: lab.orderItemId });
             } else {
               throw new Error(data.error || data.message || 'Failed to create lab');
             }
           }
        }
      }

             const totalProcessed = createdLabs.length + updatedLabs.length;
       const existingLabs = createdLabs.filter(lab => lab.id === 'exists').length;
       const newLabs = createdLabs.filter(lab => lab.id !== 'exists').length;
       
       let message = '';
       if (newLabs > 0 && updatedLabs.length > 0) {
         message = `Successfully created ${newLabs} and updated ${updatedLabs.length} lab records`;
       } else if (newLabs > 0) {
         message = `Successfully created ${newLabs} lab records`;
       } else if (updatedLabs.length > 0) {
         message = `Successfully updated ${updatedLabs.length} lab records`;
       } else if (existingLabs > 0) {
         message = `Lab records already exist for ${existingLabs} items. No changes needed.`;
       } else {
         message = 'No changes made';
       }

             showMessage('success', message);
       
       // Trigger real-time update for Order Activity Log
       const event = new CustomEvent('orderUpdated', { 
         detail: { 
           orderId: order._id,
           action: 'lab_add',
           timestamp: new Date().toISOString()
         } 
       });
       window.dispatchEvent(event);
       
       // Refresh lab data to get updated state
       await checkExistingLabs();
       
       onSuccess();
       onClose();
         } catch (error) {
       console.error('Error processing labs:', error);
       let errorMessage = 'Failed to process labs';
       
       if (error instanceof Error) {
         if (error.message.includes('duplicate key')) {
           errorMessage = 'Some lab records already exist. Please refresh and try again.';
         } else {
           errorMessage = error.message;
         }
       }
       
       showMessage('error', errorMessage);
     } finally {
       setLoading(false);
     }
  };

  if (!order) return null;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="fixed inset-0 backdrop-blur-md bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl bg-white text-gray-900 flex items-center justify-center lab-scroll">
          <style jsx>{`
            .lab-scroll::-webkit-scrollbar {
              width: 10px;
            }
            .lab-scroll::-webkit-scrollbar-track {
              background: #E5E7EB;
              border-radius: 6px;
              margin: 4px 0;
            }
            .lab-scroll::-webkit-scrollbar-thumb {
              background: #9CA3AF;
              border-radius: 6px;
              border: 2px solid #E5E7EB;
              transition: background 0.2s ease;
            }
            .lab-scroll::-webkit-scrollbar-thumb:hover {
              background: #6B7280;
            }
            .lab-scroll::-webkit-scrollbar-thumb:active {
              background: #4B5563;
            }
            .lab-scroll::-webkit-scrollbar-corner {
              background: #E5E7EB;
            }
          `}</style>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (checkingExisting) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl lab-scroll ${
          isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'
        }`}>
          <style jsx>{`
            .lab-scroll::-webkit-scrollbar {
              width: 10px;
            }
            .lab-scroll::-webkit-scrollbar-track {
              background: ${isDarkMode ? '#374151' : '#E5E7EB'};
              border-radius: 6px;
              margin: 4px 0;
            }
            .lab-scroll::-webkit-scrollbar-thumb {
              background: ${isDarkMode ? '#6B7280' : '#9CA3AF'};
              border-radius: 6px;
              border: 2px solid ${isDarkMode ? '#374151' : '#E5E7EB'};
              transition: background 0.2s ease;
            }
            .lab-scroll::-webkit-scrollbar-thumb:hover {
              background: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
            }
            .lab-scroll::-webkit-scrollbar-thumb:active {
              background: ${isDarkMode ? '#D1D5DB' : '#4B5563'};
            }
            .lab-scroll::-webkit-scrollbar-corner {
              background: ${isDarkMode ? '#374151' : '#E5E7EB'};
            }
          `}</style>
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className={`p-3 rounded-xl ${
                isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
              }`}>
                <BeakerIcon className={`h-8 w-8 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <div className="ml-4">
                <h2 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Lab Management
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Loading lab data...
                </p>
              </div>
            </div>
            
            {/* Loading skeleton */}
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className={`animate-pulse ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                } rounded-lg p-6`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                    } rounded-lg`}></div>
                    <div className="flex-1 space-y-3">
                      <div className={`h-4 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      } rounded w-1/3`}></div>
                      <div className={`h-3 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      } rounded w-1/2`}></div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, fieldIndex) => (
                      <div key={fieldIndex} className={`h-10 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                      } rounded`}></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
              <p className={`mt-2 text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Loading lab records...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasExistingLabs = labData.some(lab => lab.existingLab);
  const hasNewLabs = labData.some(lab => !lab.existingLab);
  const hasUnsavedOrder = labData.some(lab => lab.orderItemId.startsWith('item_'));
  const hasValidationErrors = labData.some(lab => 
    !lab.labSendDate
  );

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-6xl h-[92vh] flex flex-col rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            {hasUnsavedOrder ? (
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
            ) : hasExistingLabs ? (
              <PencilIcon className="h-6 w-6 text-blue-500" />
            ) : (
              <PlusIcon className="h-6 w-6 text-green-500" />
            )}
                          <div>
                <h2 className="text-xl font-bold">
                  {hasUnsavedOrder ? 'Order Not Saved' : hasExistingLabs ? 'Edit Lab Data' : 'Add Lab Data'}
                </h2>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Order: {order.orderId} • {order.items.length} items
                  {hasExistingLabs && hasNewLabs && ' • Some items have existing labs'}
                  {hasUnsavedOrder && ' • Please save the order first'}
                </p>
              </div>
            </div>
                     <div className="flex items-center space-x-2">
             <button
               onClick={onClose}
               className={`p-2 rounded-lg transition-colors ${
                 isDarkMode
                   ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                   : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
               }`}
             >
               <XMarkIcon className="h-6 w-6" />
             </button>
           </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-4 p-4 rounded-lg border ${
            message.type === 'success'
              ? isDarkMode
                ? 'bg-green-900/20 border-green-500/30 text-green-400'
                : 'bg-green-50 border-green-200 text-green-800'
              : isDarkMode
                ? 'bg-red-900/20 border-red-500/30 text-red-400'
                : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckIcon className="h-5 w-5 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Warning for unsaved order */}
        {hasUnsavedOrder && (
          <div className={`mx-6 mt-4 p-4 rounded-lg border ${
            isDarkMode
              ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              <div>
                <p className="font-medium">Order not saved yet</p>
                <p className="text-sm mt-1">Please save the order first before adding lab data. The order items need to be saved to the database before lab data can be associated with them.</p>
              </div>
            </div>
          </div>
        )}

        {/* Lab Data Content */}
        <div className="flex-1 overflow-y-auto p-6 lab-scroll" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode ? '#6B7280 #374151' : '#9CA3AF #E5E7EB'
        }}>
          <style jsx>{`
            .lab-scroll::-webkit-scrollbar {
              width: 10px;
            }
            .lab-scroll::-webkit-scrollbar-track {
              background: ${isDarkMode ? '#374151' : '#E5E7EB'};
              border-radius: 6px;
              margin: 4px 0;
            }
            .lab-scroll::-webkit-scrollbar-thumb {
              background: ${isDarkMode ? '#6B7280' : '#9CA3AF'};
              border-radius: 6px;
              border: 2px solid ${isDarkMode ? '#374151' : '#E5E7EB'};
              transition: background 0.2s ease;
            }
            .lab-scroll::-webkit-scrollbar-thumb:hover {
              background: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
            }
            .lab-scroll::-webkit-scrollbar-thumb:active {
              background: ${isDarkMode ? '#D1D5DB' : '#4B5563'};
            }
            .lab-scroll::-webkit-scrollbar-corner {
              background: ${isDarkMode ? '#374151' : '#E5E7EB'};
            }
          `}</style>
          <div>
             <h3 className="text-lg font-semibold mb-6">Lab Data for Order Items</h3>
          
          {/* Lab Data Form */}
          <div className="space-y-6">
            {labData.map((lab, index) => {
              const orderItem = order.items.find((item: any) => item._id === lab.orderItemId);
              return (
                <div key={lab.orderItemId} className={`p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200 ${
                  lab.existingLab 
                    ? (isDarkMode ? 'bg-green-900/10 border-green-500/40' : 'bg-green-50/80 border-green-200')
                    : lab.orderItemId.startsWith('item_')
                    ? (isDarkMode ? 'bg-yellow-900/10 border-yellow-500/40' : 'bg-yellow-50/80 border-yellow-200')
                    : (isDarkMode ? 'bg-blue-900/10 border-blue-500/40' : 'bg-blue-50/80 border-blue-200')
                }`}>
                                     {/* Item Header with Status Tag */}
                   <div className="flex items-center mb-6">
                     <div className="flex items-center space-x-3">
                       {/* Status Tag */}
                       <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                         lab.existingLab
                           ? (isDarkMode ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200')
                           : lab.orderItemId.startsWith('item_')
                           ? (isDarkMode ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-200')
                           : (isDarkMode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200')
                       }`}>
                         {lab.existingLab ? 'Existing Lab' : lab.orderItemId.startsWith('item_') ? 'Unsaved Order' : 'New Lab'}
                       </div>
                       
                       {/* Item Title */}
                       <h4 className="font-bold text-lg">{lab.orderItemName}</h4>
                     </div>
                   </div>

                  {/* Item Content */}
                  <div className="flex items-start space-x-4 mb-6">
                    {/* Item Images */}
                    <div className="flex-shrink-0">
                      {(orderItem as any)?.imageUrls && (orderItem as any).imageUrls.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {(orderItem as any).imageUrls.map((imageUrl: string, imageIndex: number) => (
                            <div key={imageIndex} className="relative group">
                                                             <img
                                 src={imageUrl}
                                 alt={`Item ${index + 1} image ${imageIndex + 1}`}
                                 className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
                                 onClick={() => handleImageClick(imageUrl, `Item ${index + 1} image ${imageIndex + 1}`)}
                                 onError={(e) => {
                                   e.currentTarget.style.display = 'none';
                                 }}
                               />
                              <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                  <span className="text-white text-xs font-medium">#{imageIndex + 1}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <PhotoIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Item Details */}
                    <div className="flex-1">
                      {/* Image count info */}
                      <div className="text-xs text-gray-500 mb-3">
                        {(orderItem as any)?.imageUrls ? `${(orderItem as any).imageUrls.length} images` : 'No images'}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Quality:</span>
                          <span className={`${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {(orderItem as any)?.quality?.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Quantity:</span>
                          <span className={`${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {(orderItem as any)?.quantity || 0}
                          </span>
                        </div>
                        {(orderItem as any)?.styleNo && (
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>Style:</span>
                            <span className={`${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {(orderItem as any).styleNo}
                            </span>
                          </div>
                        )}
                        {(orderItem as any)?.description && (
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>Description:</span>
                            <span className={`${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {(orderItem as any).description}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compact Form Fields in One Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={`block text-xs font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Lab Send Date *
                      </label>
                      <input
                        type="date"
                        value={lab.labSendDate}
                        onChange={(e) => handleLabDataChange(index, 'labSendDate', e.target.value)}
                        className={`w-full p-3 rounded-lg border text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Approval Date
                      </label>
                      <input
                        type="date"
                        value={lab.approvalDate}
                        onChange={(e) => handleLabDataChange(index, 'approvalDate', e.target.value)}
                        className={`w-full p-3 rounded-lg border text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDarkMode 
                            ? 'bg-gray-800 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Sample Number
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={lab.sampleNumber}
                          onChange={(e) => handleLabDataChange(index, 'sampleNumber', e.target.value)}
                          placeholder="Enter sample number"
                          className={`w-full p-3 pr-10 rounded-lg border text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode 
                              ? 'bg-gray-800 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                        {lab.sampleNumber && (
                          <button
                            type="button"
                            onClick={() => handleLabDataChange(index, 'sampleNumber', '')}
                            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-all duration-200 hover:scale-110 ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                            }`}
                            title="Clear sample number"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons */}
      <div className="sticky bottom-0 bg-inherit border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || hasValidationErrors || hasUnsavedOrder}
            className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
              loading || hasValidationErrors || hasUnsavedOrder
                ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                : isDarkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {loading ? 'Saving...' : 'Save Lab Data'}
          </button>
        </div>
      </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && previewImage && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-4 -right-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-200 z-10"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <img
              src={previewImage?.url || ''}
              alt={previewImage?.alt || ''}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
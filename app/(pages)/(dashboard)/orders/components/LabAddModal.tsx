'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PlusIcon, 
  PencilIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  TrashIcon
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
  labSendDate: string;
  approvalDate: string;
  sampleNumber: string;
  existingLabId?: string; // Track if lab already exists
}

export default function LabAddModal({ order, onClose, onSuccess }: LabAddModalProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [labData, setLabData] = useState<LabData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);


  // Check for existing labs when order changes
  useEffect(() => {
    if (order && order.items) {
      checkExistingLabs();
    }
  }, [order]);

  const checkExistingLabs = async () => {
    if (!order) return;
    
    setCheckingExisting(true);
    try {
      const response = await fetch(`/api/labs/by-order/${order._id}`);
      const data = await response.json();
      
      if (data.success) {
        const existingLabs = Array.isArray(data.data) ? data.data : [];
        
        // Initialize lab data with existing labs info
        const initialLabData: LabData[] = order.items.map((item, index) => {
          // Use item index as fallback if _id doesn't exist (for new orders)
          const itemId = (item as any)._id || `item_${index}`;
          
          // Try to find existing lab by multiple criteria
          let existingLab = existingLabs.find((lab: any) => 
            lab.orderItemId === itemId || 
            (lab.orderItem && lab.orderItem._id === itemId)
          );
          
          // If no direct match, try to match by item position/index
          if (!existingLab && itemId !== `item_${index}`) {
            // Sort labs by creation date to maintain order consistency
            const sortedLabs = [...existingLabs].sort((a: any, b: any) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            existingLab = sortedLabs[index];
            
            // If we found a lab by position, update its orderItemId to match the new item
            if (existingLab && existingLab.orderItemId !== itemId) {
              console.log(`Updating lab ${existingLab._id} orderItemId from ${existingLab.orderItemId} to ${itemId}`);
            }
          }
          
                     return {
             orderItemId: itemId,
             labSendDate: existingLab ? new Date(existingLab.labSendDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
             approvalDate: existingLab?.labSendData?.approvalDate || '',
             sampleNumber: existingLab?.labSendNumber || '',
             existingLabId: existingLab?._id
           };
        });
        
        console.log('Lab detection results:', {
          orderId: order._id,
          itemCount: order.items.length,
          existingLabsCount: existingLabs.length,
          labData: initialLabData.map((lab, index) => ({
            itemIndex: index,
            itemId: lab.orderItemId,
            hasExistingLab: !!lab.existingLabId,
            existingLabId: lab.existingLabId
          }))
        });
        
        setLabData(initialLabData);
      } else {
        // If API fails, initialize with empty data
        const initialLabData: LabData[] = order.items.map((item, index) => ({
          orderItemId: (item as any)._id || `item_${index}`,
          labSendDate: new Date().toISOString().split('T')[0],
          approvalDate: '',
          sampleNumber: '',
          existingLabId: undefined
        }));
        setLabData(initialLabData);
      }
    } catch (error) {
      console.error('Error checking existing labs:', error);
      // Initialize with empty data on error
      const initialLabData: LabData[] = order.items.map((item, index) => ({
        orderItemId: (item as any)._id || `item_${index}`,
        labSendDate: new Date().toISOString().split('T')[0],
        approvalDate: '',
        sampleNumber: '',
        existingLabId: undefined
      }));
      setLabData(initialLabData);
    } finally {
      setCheckingExisting(false);
    }
  };

  // Initialize lab data for all order items
  useEffect(() => {
    if (order && order.items && !checkingExisting) {
      const updatedLabData = labData.map((lab, index) => ({
        ...lab,
        sampleNumber: lab.existingLabId ? lab.sampleNumber : ''
      }));
      setLabData(updatedLabData);
    }
        }, [order, checkingExisting]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLabDataChange = (index: number, field: keyof LabData, value: any) => {
    const updatedLabData = [...labData];
    updatedLabData[index] = { ...updatedLabData[index], [field]: value };
    setLabData(updatedLabData);
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



        if (lab.existingLabId) {
          // Update existing lab - also update orderItemId if it changed
          const response = await fetch(`/api/labs/${lab.existingLabId}`, {
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
          if (data.success) {
            updatedLabs.push(data.data);
          } else {
            throw new Error(data.error || 'Failed to update lab');
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
          if (data.success) {
            createdLabs.push(data.data);
          } else {
            if (data.error?.includes('already exists')) {
              showMessage('error', `Lab already exists for item ${lab.orderItemId}. Please refresh and try again.`);
            } else {
              throw new Error(data.error || 'Failed to create lab');
            }
          }
        }
      }

      const totalProcessed = createdLabs.length + updatedLabs.length;
      let message = '';
      if (createdLabs.length > 0 && updatedLabs.length > 0) {
        message = `Successfully created ${createdLabs.length} and updated ${updatedLabs.length} lab records`;
      } else if (createdLabs.length > 0) {
        message = `Successfully created ${createdLabs.length} lab records`;
      } else if (updatedLabs.length > 0) {
        message = `Successfully updated ${updatedLabs.length} lab records`;
      } else {
        message = 'No changes made';
      }

      showMessage('success', message);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing labs:', error);
      showMessage('error', 'Failed to process labs');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="fixed inset-0 backdrop-blur-md bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl bg-white text-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (checkingExisting) {
    return (
      <div className="fixed inset-0  backdrop-blur-sm bg-opacity-50 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-md rounded-xl shadow-2xl ${
          isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'
        }`}>
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Checking existing lab data...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasExistingLabs = labData.some(lab => lab.existingLabId);
  const hasNewLabs = labData.some(lab => !lab.existingLabId);
  const hasUnsavedOrder = labData.some(lab => lab.orderItemId.startsWith('item_'));
  const hasValidationErrors = labData.some(lab => 
    !lab.labSendDate
  );

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-[#1D293D] text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
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



                       {/* Lab Data Table */}
               <div className="p-6">
                 <h3 className="text-lg font-semibold mb-4">Lab Data for Order Items</h3>
                 
                 {/* Legend */}
                 <div className={`mb-4 p-3 rounded-lg border ${
                   isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                 }`}>
                   <div className="flex items-center justify-center space-x-6 text-sm">
                     <div className="flex items-center">
                       <div className={`w-4 h-4 rounded mr-2 ${
                         isDarkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'
                       } border`}></div>
                       <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                         Existing Lab Data
                       </span>
                     </div>
                     <div className="flex items-center">
                       <div className={`w-4 h-4 rounded mr-2 ${
                         isDarkMode ? 'bg-white/10 border-white/20' : 'bg-white border-gray-300'
                       } border`}></div>
                       <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                         New Lab Data
                       </span>
                     </div>
                   </div>
                 </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${
                isDarkMode ? 'bg-white/5' : 'bg-gray-50'
              }`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Item Details
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Sample Send Date
                  </th>
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Approval Date
                  </th>
                                     <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-500'
                   }`}>
                     Sample Number
                   </th>
                   
                   <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-500'
                   }`}>
                     Status
                   </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${
                isDarkMode ? 'divide-white/10' : 'divide-gray-200'
              }`}>
                {labData.map((lab, index) => (
                  <tr key={lab.orderItemId} className={`hover:${
                    isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                  }`}>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className={`font-medium flex items-center ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Item {index + 1}
                          {lab.existingLabId && (
                            <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded-full ${
                              isDarkMode
                                ? 'bg-green-900/20 text-green-400'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              <CheckIcon className="h-2.5 w-2.5 mr-0.5" />
                              Lab
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Qty: {order.items[index]?.quantity || 0}
                        </div>
                        {order.items[index]?.description && (
                          <div className={`text-xs ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {order.items[index]?.description}
                          </div>
                        )}
                        {/* Item Images */}
                        {order.items[index]?.imageUrls && order.items[index]?.imageUrls.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs font-medium mb-1">Item Images:</div>
                            <div className="flex flex-wrap gap-1">
                              {order.items[index]?.imageUrls.map((imageUrl, imageIndex) => (
                                <div key={imageIndex} className="relative group">
                                  <img 
                                    src={imageUrl} 
                                    alt={`Item ${index + 1} image ${imageIndex + 1}`}
                                    className="w-6 h-6 object-cover rounded border"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={lab.labSendDate}
                        onChange={(e) => handleLabDataChange(index, 'labSendDate', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
                          lab.existingLabId
                            ? isDarkMode
                              ? 'bg-green-900/10 border-green-500/30 text-white focus:border-green-500'
                              : 'bg-green-50 border-green-200 text-gray-900 focus:border-green-500'
                            : isDarkMode
                              ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={lab.approvalDate}
                        onChange={(e) => handleLabDataChange(index, 'approvalDate', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
                          lab.existingLabId && lab.approvalDate
                            ? isDarkMode
                              ? 'bg-green-900/10 border-green-500/30 text-white focus:border-green-500'
                              : 'bg-green-50 border-green-200 text-gray-900 focus:border-green-500'
                            : isDarkMode
                              ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={lab.sampleNumber}
                        onChange={(e) => {
                          // Allow any input without restrictions
                          handleLabDataChange(index, 'sampleNumber', e.target.value);
                        }}
                        className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors ${
                          lab.existingLabId
                            ? isDarkMode
                              ? 'bg-green-900/10 border-green-500/30 text-white focus:border-green-500'
                              : 'bg-green-50 border-green-200 text-gray-900 focus:border-green-500'
                            : isDarkMode
                              ? 'bg-white/10 border-white/20 text-white focus:border-blue-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                        placeholder="Enter sample number (optional)"
                        maxLength={100}
                      />

                    </td>
                     
                     <td className="px-4 py-3">
                      <div className="flex items-center">
                        {lab.orderItemId.startsWith('item_') ? (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            isDarkMode
                              ? 'bg-yellow-900/20 text-yellow-400'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Unsaved
                          </span>
                        ) : lab.existingLabId ? (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            isDarkMode
                              ? 'bg-green-900/20 text-green-400'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Exists
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            isDarkMode
                              ? 'bg-blue-900/20 text-blue-400'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            <PlusIcon className="h-3 w-3 mr-1" />
                            New
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          isDarkMode ? 'border-white/10' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? 'text-gray-300 hover:text-white hover:bg-white/10'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || hasUnsavedOrder || hasValidationErrors}
            className={`inline-flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
              loading || hasUnsavedOrder || hasValidationErrors
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105'
            } ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : hasUnsavedOrder ? (
              <>
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Save Order First
              </>
            ) : hasValidationErrors ? (
              <>
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Fix Required Fields
              </>
            ) : (
              <>
                {hasExistingLabs ? <PencilIcon className="h-4 w-4 mr-2" /> : <PlusIcon className="h-4 w-4 mr-2" />}
                {hasExistingLabs && hasNewLabs ? 'Update & Create' : hasExistingLabs ? 'Update Labs' : 'Create Lab Records'}
              </>
            )}
          </button>
        </div>
      </div>


    </div>
  );
}

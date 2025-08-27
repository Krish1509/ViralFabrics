// 'use client';

// import { useState, useEffect, useCallback, useRef } from 'react';
// import { 
//   XMarkIcon,
//   PlusIcon,
//   CheckIcon,
//   ExclamationTriangleIcon,
//   TrashIcon,
//   InformationCircleIcon,
//   PencilIcon
// } from '@heroicons/react/24/outline';
// import { useDarkMode } from '../../hooks/useDarkMode';
// import { Fabric, FabricFormData, FabricItem, FabricValidationErrors } from '@/types/fabric';

// interface FabricFormProps {
//   fabric?: Fabric | null;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// // Enhanced message interface
// interface ValidationMessage {
//   id: string;
//   type: 'success' | 'error' | 'warning' | 'info';
//   text: string;
//   timestamp: number;
//   autoDismiss?: boolean;
//   dismissTime?: number;
// }

// // Validation state interface
// interface ValidationState {
//   errors: FabricValidationErrors;
//   touched: Set<string>;
//   isValidating: boolean;
//   lastValidationTime: number;
// }

// export default function FabricForm({ fabric, onClose, onSuccess }: FabricFormProps) {
//   const { isDarkMode, mounted } = useDarkMode();
//   const [formData, setFormData] = useState<FabricFormData>({
//     items: [{
//       qualityCode: '',  
//       qualityName: '',
//       weaver: '',
//       weaverQualityName: '',
//       greighWidth: '',
//       finishWidth: '',
//       weight: '',
//       gsm: '',
//       danier: '',
//       reed: '',
//       pick: '',
//       greighRate: ''
//     }]
//   });
  
//   const [validationState, setValidationState] = useState<ValidationState>({
//     errors: {},
//     touched: new Set(),
//     isValidating: false,
//     lastValidationTime: 0
//   });
  
//   const [loading, setLoading] = useState(false);
//   const [messages, setMessages] = useState<ValidationMessage[]>([]);
//   const [formInitialized, setFormInitialized] = useState(false);
//   const formRef = useRef<HTMLFormElement>(null);

//   // Enhanced message system
//   const showMessage = useCallback((type: 'success' | 'error' | 'warning' | 'info', text: string, options?: { autoDismiss?: boolean; dismissTime?: number }) => {
//     const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//     const newMessage: ValidationMessage = {
//       id: messageId,
//       type,
//       text,
//       timestamp: Date.now(),
//       autoDismiss: options?.autoDismiss ?? true,
//       dismissTime: options?.dismissTime ?? 5000
//     };

//     setMessages(prev => [...prev, newMessage]);

//     if (newMessage.autoDismiss) {
//       setTimeout(() => {
//         dismissMessage(messageId);
//       }, newMessage.dismissTime);
//     }
//   }, []);

//   const dismissMessage = useCallback((messageId: string) => {
//     setMessages(prev => prev.filter(msg => msg.id !== messageId));
//   }, []);

//   // Validation helper functions
//   const markFieldAsTouched = (field: string) => {
//     setValidationState(prev => ({
//       ...prev,
//       touched: new Set([...prev.touched, field])
//     }));
//   };

//   const getFieldError = (field: string): string => {
//     return validationState.errors[field] || '';
//   };

//   const hasFieldError = (field: string): boolean => {
//     return !!validationState.errors[field];
//   };

//   const getFieldValidationState = (field: string) => {
//     const isTouched = validationState.touched.has(field);
//     const hasError = hasFieldError(field);
//     const error = getFieldError(field);
    
//     return {
//       isTouched,
//       hasError,
//       error,
//       isValidating: validationState.isValidating && isTouched
//     };
//   };

//   // Validation function
//   const validateFormForSubmission = useCallback((): FabricValidationErrors => {
//     const newErrors: FabricValidationErrors = {};
//     if (!formInitialized) return newErrors;

//     formData.items.forEach((item, index) => {
//       const itemPrefix = `items.${index}`;
      
//       if (!item.qualityCode) {
//         newErrors[`${itemPrefix}.qualityCode`] = 'Quality code is required';
//       }
      
//       if (!item.qualityName) {
//         newErrors[`${itemPrefix}.qualityName`] = 'Quality name is required';
//       }
      
//       if (!item.weaver) {
//         newErrors[`${itemPrefix}.weaver`] = 'Weaver is required';
//       }
      
//       if (!item.weaverQualityName) {
//         newErrors[`${itemPrefix}.weaverQualityName`] = 'Weaver quality name is required';
//       }
      
//       // Validate numeric fields
//       const numericFields = ['greighWidth', 'finishWidth', 'weight', 'gsm', 'reed', 'pick', 'greighRate'];
//       numericFields.forEach(field => {
//         const value = item[field as keyof FabricItem];
//         if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
//           newErrors[`${itemPrefix}.${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be a positive number`;
//         }
//       });
//     });

//     return newErrors;
//   }, [formData, formInitialized]);

//   // Handle field changes
//   const handleItemChange = (index: number, field: string, value: any) => {
//     setFormData(prev => {
//       const updatedItems = [...prev.items];
//       if (!updatedItems[index]) {
//         updatedItems[index] = {
//           qualityCode: '', qualityName: '', weaver: '', weaverQualityName: '',
//           greighWidth: '', finishWidth: '', weight: '', gsm: '', danier: '',
//           reed: '', pick: '', greighRate: ''
//         };
//       }
//       updatedItems[index] = { ...updatedItems[index], [field]: value };
//       return { ...prev, items: updatedItems };
//     });

//     const fieldKey = `items.${index}.${field}`;
//     markFieldAsTouched(fieldKey);
    
//     if (validationState.errors[fieldKey]) {
//       setValidationState(prev => ({
//         ...prev,
//         errors: { ...prev.errors, [fieldKey]: '' }
//       }));
//     }
//   };

//   // Add/Remove items
//   const addItem = () => {
//     setFormData(prev => ({
//       ...prev,
//       items: [...prev.items, {
//         qualityCode: '', qualityName: '', weaver: '', weaverQualityName: '',
//         greighWidth: '', finishWidth: '', weight: '', gsm: '', danier: '',
//         reed: '', pick: '', greighRate: ''
//       }]
//     }));
    
//     setTimeout(() => {
//       if (formRef.current) {
//         formRef.current.scrollTo({ top: formRef.current.scrollHeight, behavior: 'smooth' });
//       }
//     }, 300);
//   };

//   const removeItem = (index: number) => {
//     if (formData.items.length > 1) {
//       setFormData(prev => ({
//         ...prev,
//         items: prev.items.filter((_, i) => i !== index)
//       }));
//     }
//   };

//   // Form submission
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Mark all fields as touched for comprehensive validation
//     const allFields = new Set<string>();
//     formData.items.forEach((_, index) => {
//       ['qualityCode', 'qualityName', 'weaver', 'weaverQualityName', 'greighWidth', 'finishWidth', 'weight', 'gsm', 'reed', 'pick', 'greighRate'].forEach(field => {
//         allFields.add(`items.${index}.${field}`);
//       });
//     });
    
//     setValidationState(prev => ({
//       ...prev,
//       touched: new Set([...prev.touched, ...allFields])
//     }));

//     await new Promise(resolve => setTimeout(resolve, 100));
    
//     const newErrors = validateFormForSubmission();
//     setValidationState(prev => ({
//       ...prev,
//       errors: newErrors
//     }));

//     if (Object.keys(newErrors).length > 0) {
//       showMessage('error', 'Please fix the validation errors below', { autoDismiss: false });
      
//       const firstErrorField = Object.keys(newErrors)[0];
//       const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
//       if (errorElement) {
//         errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
//       }
      
//       return;
//     }

//     setLoading(true);
//     try {
//       // Convert form data to API format
//       const apiData = formData.items.map(item => ({
//         qualityCode: item.qualityCode,
//         qualityName: item.qualityName,
//         weaver: item.weaver,
//         weaverQualityName: item.weaverQualityName,
//         greighWidth: parseFloat(item.greighWidth) || 0,
//         finishWidth: parseFloat(item.finishWidth) || 0,
//         weight: parseFloat(item.weight) || 0,
//         gsm: parseFloat(item.gsm) || 0,
//         danier: item.danier,
//         reed: parseInt(item.reed) || 0,
//         pick: parseInt(item.pick) || 0,
//         greighRate: parseFloat(item.greighRate) || 0
//       }));

//       const token = localStorage.getItem('token');
//       const url = fabric ? `/api/fabrics/${fabric._id}` : '/api/fabrics';
//       const method = fabric ? 'PUT' : 'POST';

//       const response = await fetch(url, {
//         method,
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify(apiData)
//       });

//       const data = await response.json();
      
//       if (data.success) {
//         showMessage('success', fabric ? 'Fabric updated successfully!' : 'Fabric created successfully!', { autoDismiss: true, dismissTime: 3000 });
//         onSuccess();
//         onClose();
//       } else {
//         showMessage('error', data.message || 'Operation failed', { autoDismiss: false });
//       }
//     } catch (error) {
//       console.error('Form submission error:', error);
//       showMessage('error', 'An error occurred', { autoDismiss: false });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initialize form data
//   useEffect(() => {
//     if (fabric) {
//       setFormData({
//         items: [{
//           qualityCode: fabric.qualityCode,
//           qualityName: fabric.qualityName,
//           weaver: fabric.weaver,
//           weaverQualityName: fabric.weaverQualityName,
//           greighWidth: fabric.greighWidth.toString(),
//           finishWidth: fabric.finishWidth.toString(),
//           weight: fabric.weight.toString(),
//           gsm: fabric.gsm.toString(),
//           danier: fabric.danier,
//           reed: fabric.reed.toString(),
//           pick: fabric.pick.toString(),
//           greighRate: fabric.greighRate.toString()
//         }]
//       });
//     }
//     setFormInitialized(true);
//   }, [fabric]);

//   if (!mounted) return null;

//   return (
//     <>
//       {/* Enhanced Message System Styles */}
//       <style jsx>{`
//         @keyframes slideInRight {
//           from {
//             transform: translateX(100%);
//             opacity: 0;
//           }
//           to {
//             transform: translateX(0);
//             opacity: 1;
//           }
//         }
        
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         .message-enter {
//           animation: slideInRight 0.3s ease-out forwards;
//         }
        
//         .validation-error {
//           animation: fadeInUp 0.3s ease-out forwards;
//         }
//       `}</style>
      
//       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//         <div className={`relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-xl shadow-2xl ${
//           isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
//         }`}>
//           {/* Header */}
//           <div className={`flex items-center justify-between p-6 border-b ${
//             isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
//           }`}>
//             <div className="flex items-center space-x-4">
//               <div className="flex items-center space-x-3">
//                 {fabric ? (
//                   <PencilIcon className="h-8 w-8 text-blue-500" />
//                 ) : (
//                   <PlusIcon className="h-8 w-8 text-green-500" />
//                 )}
//                 <h2 className="text-2xl font-bold">{fabric ? 'Edit Fabric' : 'Create New Fabric'}</h2>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <span className={`text-sm px-2 py-1 rounded-full ${
//                   isDarkMode 
//                     ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
//                     : 'bg-blue-100 text-blue-700 border border-blue-200'
//                 }`}>
//                   {formData.items.length} Item{formData.items.length !== 1 ? 's' : ''}
//                 </span>
//               </div>
//             </div>
//             <button 
//               onClick={onClose} 
//               className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
//                 isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//               }`}
//             >
//               <XMarkIcon className="h-6 w-6" />
//             </button>
//           </div>

//           {/* Enhanced Message System */}
//           <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
//             {messages.map((message, index) => (
//               <div
//                 key={message.id}
//                 className={`transform transition-all duration-300 ease-out ${
//                   isDarkMode ? 'bg-gray-800/95 border-gray-600 backdrop-blur-sm' : 'bg-white border-gray-200'
//                 } rounded-lg border shadow-lg p-4 max-w-sm ${
//                   message.type === 'success'
//                     ? isDarkMode
//                       ? 'border-green-500/40 bg-green-900/30 shadow-green-500/20'
//                       : 'border-green-200 bg-green-50'
//                     : message.type === 'warning'
//                     ? isDarkMode
//                       ? 'border-yellow-500/40 bg-yellow-900/30 shadow-yellow-500/20'
//                       : 'border-yellow-200 bg-yellow-50'
//                     : message.type === 'info'
//                     ? isDarkMode
//                       ? 'border-blue-500/40 bg-blue-900/30 shadow-blue-500/20'
//                       : 'border-blue-200 bg-blue-50'
//                     : isDarkMode
//                       ? 'border-red-500/40 bg-red-900/30 shadow-red-500/20'
//                       : 'border-red-200 bg-red-50'
//                 } ${isDarkMode ? 'backdrop-blur-md' : ''}`}
//                 style={{
//                   transform: `translateX(${index * 10}px)`,
//                   animation: 'slideInRight 0.3s ease-out',
//                   boxShadow: isDarkMode ? 
//                     message.type === 'success' ? '0 4px 20px rgba(34, 197, 94, 0.3)' :
//                     message.type === 'warning' ? '0 4px 20px rgba(234, 179, 8, 0.3)' :
//                     message.type === 'info' ? '0 4px 20px rgba(59, 130, 246, 0.3)' :
//                     '0 4px 20px rgba(239, 68, 68, 0.3)' : undefined
//                 }}
//               >
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-start space-x-3">
//                     <div className={`flex-shrink-0 ${
//                       message.type === 'success'
//                         ? isDarkMode ? 'text-green-400' : 'text-green-500'
//                         : message.type === 'warning'
//                         ? isDarkMode ? 'text-yellow-400' : 'text-yellow-500'
//                         : message.type === 'info'
//                         ? isDarkMode ? 'text-blue-400' : 'text-blue-500'
//                         : isDarkMode ? 'text-red-400' : 'text-red-500'
//                     }`}>
//                       {message.type === 'success' ? (
//                         <CheckIcon className="h-5 w-5" />
//                       ) : message.type === 'warning' ? (
//                         <ExclamationTriangleIcon className="h-5 w-5" />
//                       ) : message.type === 'info' ? (
//                         <InformationCircleIcon className="h-5 w-5" />
//                       ) : (
//                         <ExclamationTriangleIcon className="h-5 w-5" />
//                       )}
//                     </div>
//                     <div className="flex-1">
//                       <p className={`text-sm font-medium ${
//                         message.type === 'success'
//                           ? isDarkMode ? 'text-green-300' : 'text-green-800'
//                           : message.type === 'warning'
//                           ? isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
//                           : message.type === 'info'
//                           ? isDarkMode ? 'text-blue-300' : 'text-blue-800'
//                           : isDarkMode ? 'text-red-300' : 'text-red-800'
//                       }`}>
//                         {message.text}
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => dismissMessage(message.id)}
//                     className={`flex-shrink-0 ml-3 p-1.5 rounded-full transition-all duration-200 hover:scale-110 ${
//                       message.type === 'success'
//                         ? isDarkMode ? 'hover:bg-green-500/20 text-green-400 hover:text-green-300' : 'hover:bg-green-100 text-green-500'
//                         : message.type === 'warning'
//                         ? isDarkMode ? 'hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300' : 'hover:bg-yellow-100 text-yellow-500'
//                         : message.type === 'info'
//                         ? isDarkMode ? 'hover:bg-blue-500/20 text-blue-400 hover:text-blue-300' : 'hover:bg-blue-100 text-blue-500'
//                         : isDarkMode ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' : 'hover:bg-red-100 text-red-500'
//                     }`}
//                   >
//                     <XMarkIcon className="h-4 w-4" />
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Validation Errors Summary */}
//           {Object.keys(validationState.errors).length > 0 && (
//             <div className={`p-4 rounded-lg border mb-4 ${
//               isDarkMode 
//                 ? 'bg-red-900/30 border-red-500/40 shadow-red-500/20 backdrop-blur-sm' 
//                 : 'bg-red-50 border-red-200'
//             }`}
//             style={{
//               boxShadow: isDarkMode ? '0 4px 20px rgba(239, 68, 68, 0.2)' : undefined
//             }}>
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center space-x-2">
//                   <div className={`p-1.5 rounded-full ${
//                     isDarkMode ? 'bg-red-500/20' : 'bg-red-100'
//                   }`}>
//                     <ExclamationTriangleIcon className={`h-5 w-5 ${
//                       isDarkMode ? 'text-red-400' : 'text-red-600'
//                     }`} />
//                   </div>
//                   <span className={`font-semibold ${
//                     isDarkMode ? 'text-red-300' : 'text-red-700'
//                   }`}>
//                     Validation Issues Found
//                   </span>
//                 </div>
//                 <button
//                   onClick={() => setValidationState(prev => ({ ...prev, errors: {} }))}
//                   className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
//                     isDarkMode ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' : 'hover:bg-red-100 text-red-600'
//                   }`}
//                 >
//                   <XMarkIcon className="h-4 w-4" />
//                 </button>
//               </div>
//               <ul className={`text-sm space-y-2 ${
//                 isDarkMode ? 'text-red-200' : 'text-red-600'
//               }`}>
//                 {Object.entries(validationState.errors).map(([field, error]) => (
//                   <li key={field} className="flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-red-500/10">
//                     <span className={`w-2 h-2 rounded-full mr-3 ${
//                       isDarkMode ? 'bg-red-400' : 'bg-red-500'
//                     }`}></span>
//                     <span className="flex-1">{error}</span>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Form */}
//           <form ref={formRef} onSubmit={handleSubmit} className={`overflow-y-auto max-h-[calc(95vh-200px)] ${
//             isDarkMode 
//               ? 'scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-800' 
//               : 'scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-gray-100'
//           }`}>
//             <div className="p-6 space-y-8 pb-24">
//               {/* Fabric Items */}
//               <div>
//                 <div className="flex items-center justify-between mb-6">
//                   <h3 className="text-xl font-semibold">Fabric Items</h3>
//                   <button
//                     type="button"
//                     onClick={addItem}
//                     className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
//                       isDarkMode
//                         ? 'bg-blue-600 hover:bg-blue-700 text-white'
//                         : 'bg-blue-600 hover:bg-blue-700 text-white'
//                     }`}
//                   >
//                     <PlusIcon className="h-4 w-4 mr-2" />
//                     Add Item
//                   </button>
//                 </div>

//                 <div className="space-y-6">
//                   {formData.items.map((item, index) => (
//                     <div key={index} className={`p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
//                       isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
//                     }`}>
//                       <div className="flex items-center justify-between mb-4">
//                         <h4 className="text-lg font-medium">Item {index + 1}</h4>
//                         {formData.items.length > 1 && (
//                           <button
//                             type="button"
//                             onClick={() => removeItem(index)}
//                             className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
//                               isDarkMode 
//                                 ? 'text-red-400 hover:bg-red-500/20' 
//                                 : 'text-red-600 hover:bg-red-100'
//                             }`}
//                           >
//                             <TrashIcon className="h-5 w-5" />
//                           </button>
//                         )}
//                       </div>

//                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                         {/* Quality Code */}
//                         <div data-field={`items.${index}.qualityCode`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Quality Code <span className="text-red-500">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             value={item.qualityCode}
//                             onChange={(e) => handleItemChange(index, 'qualityCode', e.target.value)}
//                             placeholder="e.g., 1001 - WL"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.qualityCode`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.qualityCode`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.qualityCode`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Quality Name */}
//                         <div data-field={`items.${index}.qualityName`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Quality Name <span className="text-red-500">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             value={item.qualityName}
//                             onChange={(e) => handleItemChange(index, 'qualityName', e.target.value)}
//                             placeholder="Enter quality name"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.qualityName`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.qualityName`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.qualityName`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Weaver */}
//                         <div data-field={`items.${index}.weaver`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Weaver <span className="text-red-500">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             value={item.weaver}
//                             onChange={(e) => handleItemChange(index, 'weaver', e.target.value)}
//                             placeholder="Enter weaver name"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.weaver`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.weaver`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.weaver`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Weaver Quality Name */}
//                         <div data-field={`items.${index}.weaverQualityName`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Weaver Quality Name <span className="text-red-500">*</span>
//                           </label>
//                           <input
//                             type="text"
//                             value={item.weaverQualityName}
//                             onChange={(e) => handleItemChange(index, 'weaverQualityName', e.target.value)}
//                             placeholder="Enter weaver quality name"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.weaverQualityName`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.weaverQualityName`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.weaverQualityName`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Greigh Width */}
//                         <div data-field={`items.${index}.greighWidth`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Greigh Width (inches)
//                           </label>
//                           <input
//                             type="number"
//                             step="0.1"
//                             value={item.greighWidth}
//                             onChange={(e) => handleItemChange(index, 'greighWidth', e.target.value)}
//                             placeholder="e.g., 58.5"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.greighWidth`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.greighWidth`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.greighWidth`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Finish Width */}
//                         <div data-field={`items.${index}.finishWidth`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Finish Width (inches)
//                           </label>
//                           <input
//                             type="number"
//                             step="0.1"
//                             value={item.finishWidth}
//                             onChange={(e) => handleItemChange(index, 'finishWidth', e.target.value)}
//                             placeholder="e.g., 56.0"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.finishWidth`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.finishWidth`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.finishWidth`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Weight */}
//                         <div data-field={`items.${index}.weight`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Weight (KG)
//                           </label>
//                           <input
//                             type="number"
//                             step="0.1"
//                             value={item.weight}
//                             onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
//                             placeholder="e.g., 8.0"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.weight`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.weight`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.weight`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* GSM */}
//                         <div data-field={`items.${index}.gsm`}>
//                           <label className="block text-sm font-medium mb-2">
//                             GSM
//                           </label>
//                           <input
//                             type="number"
//                             step="0.1"
//                             value={item.gsm}
//                             onChange={(e) => handleItemChange(index, 'gsm', e.target.value)}
//                             placeholder="e.g., 72.5"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.gsm`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.gsm`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.gsm`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Danier */}
//                         <div data-field={`items.${index}.danier`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Danier
//                           </label>
//                           <input
//                             type="text"
//                             value={item.danier}
//                             onChange={(e) => handleItemChange(index, 'danier', e.target.value)}
//                             placeholder="e.g., 55*22D"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             }`}
//                           />
//                         </div>

//                         {/* Reed */}
//                         <div data-field={`items.${index}.reed`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Reed
//                           </label>
//                           <input
//                             type="number"
//                             value={item.reed}
//                             onChange={(e) => handleItemChange(index, 'reed', e.target.value)}
//                             placeholder="e.g., 120"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.reed`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.reed`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.reed`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Pick */}
//                         <div data-field={`items.${index}.pick`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Pick
//                           </label>
//                           <input
//                             type="number"
//                             value={item.pick}
//                             onChange={(e) => handleItemChange(index, 'pick', e.target.value)}
//                             placeholder="e.g., 80"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.pick`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.pick`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.pick`).error}
//                             </p>
//                           )}
//                         </div>

//                         {/* Greigh Rate */}
//                         <div data-field={`items.${index}.greighRate`}>
//                           <label className="block text-sm font-medium mb-2">
//                             Greigh Rate (₹)
//                           </label>
//                           <input
//                             type="number"
//                             step="0.01"
//                             value={item.greighRate}
//                             onChange={(e) => handleItemChange(index, 'greighRate', e.target.value)}
//                             placeholder="e.g., 150.00"
//                             className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                               isDarkMode 
//                                 ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
//                                 : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
//                             } ${getFieldValidationState(`items.${index}.greighRate`).hasError ? 
//                               isDarkMode 
//                                 ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' 
//                                 : 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
//                               : ''}`}
//                           />
//                           {getFieldValidationState(`items.${index}.greighRate`).hasError && (
//                             <p className="text-red-500 text-sm mt-2 error-message flex items-center">
//                               <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                               {getFieldValidationState(`items.${index}.greighRate`).error}
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </form>

//           {/* Sticky Submit Button */}
//           <div className={`sticky bottom-0 left-0 right-0 p-6 border-t shadow-lg ${
//             isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
//           }`}>
//             <div className="flex items-center justify-between">
//               {/* Validation Status */}
//               {Object.keys(validationState.errors).length > 0 && (
//                 <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
//                   isDarkMode 
//                     ? 'bg-red-900/20 text-red-400 border border-red-500/30' 
//                     : 'bg-red-50 text-red-700 border border-red-200'
//                 }`}>
//                   <ExclamationTriangleIcon className="h-4 w-4" />
//                   <span>{Object.keys(validationState.errors).length} validation error{Object.keys(validationState.errors).length !== 1 ? 's' : ''}</span>
//                 </div>
//               )}
              
//               <div className="flex space-x-4">
//                 <button
//                   type="button"
//                   onClick={onClose}
//                   className={`px-8 py-3 rounded-lg border transition-all duration-200 hover:scale-105 ${
//                     isDarkMode 
//                       ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
//                       : 'border-gray-300 text-gray-700 hover:bg-gray-50'
//                   }`}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={loading || Object.keys(validationState.errors).length > 0}
//                   onClick={handleSubmit}
//                   className={`px-10 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2 ${
//                     loading || Object.keys(validationState.errors).length > 0
//                       ? 'opacity-50 cursor-not-allowed'
//                       : ''
//                   } ${
//                     Object.keys(validationState.errors).length > 0
//                       ? isDarkMode
//                         ? 'bg-gray-600 text-gray-400'
//                         : 'bg-gray-400 text-gray-600'
//                       : isDarkMode 
//                         ? 'bg-blue-600 hover:bg-blue-700 shadow-lg text-white' 
//                         : 'bg-blue-500 hover:bg-blue-600 shadow-lg text-white'
//                   }`}
//                 >
//                   {loading ? (
//                     <>
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
//                       <span>Saving...</span>
//                     </>
//                   ) : Object.keys(validationState.errors).length > 0 ? (
//                     <>
//                       <ExclamationTriangleIcon className="h-5 w-5" />
//                       <span>Fix Errors</span>
//                     </>
//                   ) : (
//                     <>
//                       <CheckIcon className="h-5 w-5" />
//                       <span>{fabric ? 'Update Fabric' : 'Create Fabric'}</span>
//                     </>
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

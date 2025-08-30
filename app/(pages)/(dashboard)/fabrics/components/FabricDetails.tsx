'use client';

import { useState } from 'react';
import { 
  XMarkIcon,
  PencilIcon,
  CubeIcon,
  DocumentTextIcon,
  Square3Stack3DIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Fabric } from '@/types/fabric';

interface FabricDetailsProps {
  fabric: Fabric;
  onClose: () => void;
  onEdit: () => void;
}

export default function FabricDetails({ fabric, onClose, onEdit }: FabricDetailsProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [showImagePreview, setShowImagePreview] = useState<{ url: string; index: number } | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      } max-h-[98vh] overflow-hidden`}>
        {/* Header */}
        <div className={`relative p-8 border-b ${
          isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800' : 'border-gray-200 bg-gradient-to-r from-white to-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <CubeIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Fabric Details
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <p className={`text-lg font-mono ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {fabric.qualityCode}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onEdit}
                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                }`}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Fabric
              </button>
              <button
                onClick={onClose}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(98vh-200px)]">
          <div className="p-8">
            {/* Images Section */}
            {fabric.images && fabric.images.length > 0 && (
              <div className={`mb-8 p-6 rounded-2xl border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg`}>
                <div className="flex items-center mb-6">
                  <div className={`p-3 rounded-xl ${
                    isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <PhotoIcon className={`h-6 w-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <h3 className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Fabric Images
                    </h3>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {fabric.images.length} image{fabric.images.length !== 1 ? 's' : ''} uploaded
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {fabric.images.map((image, index) => (
                    <div
                      key={index}
                                             className={`relative group rounded-lg overflow-hidden border ${
                         isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                       } shadow-sm cursor-pointer transition-transform duration-200 hover:scale-105`}
                       onClick={() => setShowImagePreview({ url: image, index })}
                    >
                      <img
                        src={image}
                        alt={`Fabric image ${index + 1}`}
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.svg';
                        }}
                      />
                                             <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center`}>
                         <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                           isDarkMode
                             ? 'bg-black/70 text-white'
                             : 'bg-white/90 text-gray-700'
                         }`}>
                           {index + 1}
                         </div>
                         <div className={`absolute top-2 left-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                           isDarkMode
                             ? 'bg-blue-600 hover:bg-blue-700 text-white'
                             : 'bg-blue-500 hover:bg-blue-600 text-white'
                         }`}>
                           <EyeIcon className="h-4 w-4" />
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-Generated Label */}
            <div className={`mb-8 p-6 rounded-2xl border ${
              isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            } shadow-lg`}>
              <div className="flex items-center mb-4">
                <div className={`p-3 rounded-xl ${
                  isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <DocumentTextIcon className={`h-6 w-6 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <h3 className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Auto-Generated Label
                  </h3>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    System generated label based on fabric specifications
                  </p>
                </div>
              </div>
              <div className={`p-4 rounded-lg font-mono text-sm whitespace-pre-line ${
                isDarkMode ? 'bg-gray-700/50 text-green-300' : 'bg-gray-50 text-green-700'
              }`}>
                {fabric.label}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center mb-6">
                    <div className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <CubeIcon className={`h-6 w-6 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Basic Information
                      </h3>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Fabric identification and classification
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Quality Code
                      </span>
                      <span className={`text-sm font-mono font-semibold ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {fabric.qualityCode}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Quality Name
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {fabric.qualityName}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Weaver
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        {fabric.weaver}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Weaver Quality Name
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {fabric.weaverQualityName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                <div className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center mb-6">
                    <div className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                    }`}>
                                             <Square3Stack3DIcon className={`h-6 w-6 ${
                         isDarkMode ? 'text-green-400' : 'text-green-600'
                       }`} />
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Dimensions
                      </h3>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Width measurements and specifications
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Greigh Width
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {fabric.greighWidth}"
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Finish Width
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>
                        {fabric.finishWidth}"
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Specifications & Pricing */}
              <div className="space-y-6">
                {/* Specifications */}
                <div className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center mb-6">
                    <div className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                    }`}>
                      <ScaleIcon className={`h-6 w-6 ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Specifications
                      </h3>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Technical specifications and measurements
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Weight
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {fabric.weight} KG
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        GSM
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {fabric.gsm}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Danier
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {fabric.danier}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Reed
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {fabric.reed}
                      </span>
                    </div>
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        Pick
                      </span>
                      <span className={`text-sm font-semibold ${
                        isDarkMode ? 'text-purple-400' : 'text-purple-600'
                      }`}>
                        {fabric.pick}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className={`p-6 rounded-2xl border ${
                  isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                } shadow-lg`}>
                  <div className="flex items-center mb-6">
                    <div className={`p-3 rounded-xl ${
                      isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'
                    }`}>
                      <CurrencyDollarIcon className={`h-6 w-6 ${
                        isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div className="ml-4">
                      <h3 className={`text-xl font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Pricing
                      </h3>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Cost and rate information
                      </p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <div className={`flex justify-between items-center ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <span className="text-lg font-medium">Greigh Rate</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{fabric.greighRate.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className={`mt-8 pt-6 border-t ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <span className="font-medium">Created:</span> {formatDateTime(fabric.createdAt)}
                </div>
                <div className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <span className="font-medium">Last Updated:</span> {formatDateTime(fabric.updatedAt)}
                </div>
              </div>
            </div>
                     </div>
         </div>
       </div>

       {/* Image Preview Modal */}
       {showImagePreview && (
         <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="relative w-full max-w-4xl">
             <button
               onClick={() => setShowImagePreview(null)}
               className={`absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 z-10 ${
                 isDarkMode
                   ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                   : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
               }`}
             >
               <XMarkIcon className="h-6 w-6" />
             </button>
             
             <img
               src={showImagePreview.url}
               alt={`Fabric image ${showImagePreview.index + 1}`}
               className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
               onError={(e) => {
                 const target = e.target as HTMLImageElement;
                 target.src = '/placeholder-image.svg';
               }}
             />
             
             <div className={`mt-4 text-center ${
               isDarkMode ? 'text-gray-300' : 'text-gray-600'
             }`}>
               Image {showImagePreview.index + 1} of {fabric.images.length}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }

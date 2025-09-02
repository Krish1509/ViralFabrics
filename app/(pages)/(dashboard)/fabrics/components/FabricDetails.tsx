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
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Fabric } from '@/types/fabric';

interface FabricDetailsProps {
  fabric: Fabric;
  onClose: () => void;
  onEdit: (fabric: Fabric) => void;
}

export default function FabricDetails({ fabric, onClose, onEdit }: FabricDetailsProps) {
  const { isDarkMode, mounted } = useDarkMode();
  const [showImagePreview, setShowImagePreview] = useState<{ url: string; index: number } | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
      <div className={`w-full max-w-6xl h-full sm:h-auto rounded-xl sm:rounded-2xl shadow-2xl ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      } max-h-[98vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`relative p-4 sm:p-6 border-b flex-shrink-0 ${
          isDarkMode ? 'border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800' : 'border-gray-200 bg-gradient-to-r from-white to-gray-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shadow-lg ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-700' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <CubeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full ${
                    isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    Quality Code
                  </span>
                  <span className={`text-lg sm:text-2xl font-bold font-mono ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {fabric.qualityCode}
                  </span>
                </div>
                <h1 className={`text-lg sm:text-xl font-semibold ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {fabric.qualityName}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-2 sm:mt-3">
                  <div className={`flex items-center space-x-2 px-2 sm:px-3 py-1 rounded-lg ${
                    isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      Weaver: {fabric.weaver}
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 px-2 sm:px-3 py-1 rounded-lg ${
                    isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      Quality: {fabric.weaverQualityName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => onEdit(fabric)}
                className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                }`}
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
                <span className="sm:hidden">Edit</span>
              </button>
              <button
                onClick={onClose}
                className={`p-2 sm:p-3 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className={`flex-1 overflow-y-auto scrollbar-thin ${
          isDarkMode 
            ? 'scrollbar-thumb-gray-600 scrollbar-track-gray-800' 
            : 'scrollbar-thumb-gray-400 scrollbar-track-gray-100'
        }`}>
          <div className="p-4">
            
            {/* Images Section */}
            {fabric.images && fabric.images.length > 0 && (
              <div className={`mb-6 p-4 rounded-xl border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg ${
                      isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <PhotoIcon className={`h-5 w-5 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-lg font-bold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Quality Images ({fabric.images.length})
                      </h3>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Slide to view all images
                      </p>
                    </div>
                  </div>
                  {fabric.images.length > 1 && (
                    <div className={`text-xs sm:text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {currentImageIndex + 1} of {fabric.images.length}
                    </div>
                  )}
                </div>

                {/* Main Image Display */}
                <div className="mb-4">
                  <div className={`relative rounded-lg overflow-hidden border ${
                    isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                  } shadow-md group`}>
                    <img
                      src={fabric.images[currentImageIndex]}
                      alt={`Fabric image ${currentImageIndex + 1}`}
                      className="w-full h-40 sm:h-48 md:h-56 object-cover cursor-pointer transition-transform duration-200 hover:scale-105"
                      onClick={() => setShowImagePreview({ url: fabric.images[currentImageIndex], index: currentImageIndex })}
                    />
                    
                    {/* Overlay with expand button */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <button
                        onClick={() => setShowImagePreview({ url: fabric.images[currentImageIndex], index: currentImageIndex })}
                        className={`p-2 sm:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 ${
                          isDarkMode
                            ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white'
                            : 'bg-white/90 hover:bg-white text-gray-700'
                        } shadow-lg`}
                      >
                        <ArrowsPointingOutIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    </div>

                    {/* Navigation arrows for multiple images */}
                    {fabric.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => prev === 0 ? fabric.images.length - 1 : prev - 1);
                          }}
                          className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                            isDarkMode
                              ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white'
                              : 'bg-white/90 hover:bg-white text-gray-700'
                          } shadow-lg`}
                        >
                          <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(prev => prev === fabric.images.length - 1 ? 0 : prev + 1);
                          }}
                          className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                            isDarkMode
                              ? 'bg-gray-800/80 hover:bg-gray-700/90 text-white'
                              : 'bg-white/90 hover:bg-white text-gray-700'
                          } shadow-lg`}
                        >
                          <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      </>
                    )}

                    {/* Image counter badge */}
                    <div className={`absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      isDarkMode
                        ? 'bg-gray-800/80 text-white border border-gray-600'
                        : 'bg-white/90 text-gray-700 border border-gray-200'
                    } shadow-lg`}>
                      {currentImageIndex + 1} / {fabric.images.length}
                    </div>
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {fabric.images.length > 1 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {fabric.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          index === currentImageIndex
                            ? isDarkMode
                              ? 'border-blue-500 shadow-lg scale-105'
                              : 'border-blue-600 shadow-lg scale-105'
                            : isDarkMode
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-12 sm:h-16 object-cover"
                        />
                        <div className={`absolute top-1 right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full text-xs flex items-center justify-center font-bold ${
                          index === currentImageIndex
                            ? 'bg-blue-500 text-white'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300'
                              : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auto-Generated Label */}
            <div className={`mb-6 p-4 sm:p-6 rounded-xl border ${
              isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
            } shadow-lg`}>
              <div className="flex items-center mb-4">
                <div className={`p-2 sm:p-3 rounded-xl ${
                  isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                }`}>
                  <DocumentTextIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className={`text-lg sm:text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Auto-Generated Label
                  </h3>
                  <p className={`text-xs sm:text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    System generated label based on fabric specifications
                  </p>
                </div>
              </div>
              <div className={`p-3 sm:p-4 rounded-lg font-mono text-xs sm:text-sm whitespace-pre-line ${
                isDarkMode ? 'bg-gray-700/50 text-green-300' : 'bg-gray-50 text-green-700'
              }`}>
                {fabric.label}
              </div>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Basic Information */}
              <div className={`p-4 sm:p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg`}>
                <div className="flex items-center mb-4">
                  <div className={`p-2 sm:p-3 rounded-xl ${
                    isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <CubeIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Basic Information
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Quality Code
                    </span>
                    <span className={`text-xs sm:text-sm font-mono font-semibold ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {fabric.qualityCode}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Quality Name
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {fabric.qualityName}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Weaver
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`}>
                      {fabric.weaver}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Weaver Quality
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {fabric.weaverQualityName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dimensions & Specifications */}
              <div className={`p-4 sm:p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg`}>
                <div className="flex items-center mb-4">
                  <div className={`p-2 sm:p-3 rounded-xl ${
                    isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <Square3Stack3DIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Dimensions & Specs
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Greigh Width
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {fabric.greighWidth || '-'}"
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Finish Width
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {fabric.finishWidth || '-'}"
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Weight
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {fabric.weight || '-'} KG
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      GSM
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {fabric.gsm || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Details & Pricing */}
              <div className={`p-4 sm:p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg`}>
                <div className="flex items-center mb-4">
                  <div className={`p-2 sm:p-3 rounded-xl ${
                    isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                    <ScaleIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Technical & Pricing
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Danier
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {fabric.danier || '-'}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Reed
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {fabric.reed || '-'}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Pick
                    </span>
                    <span className={`text-xs sm:text-sm font-semibold ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {fabric.pick || '-'}
                    </span>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <div className={`flex justify-between items-center ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <span className="text-sm font-medium">Greigh Rate</span>
                      <span className="text-lg sm:text-xl font-bold text-green-600">
                        ₹{(fabric.greighRate || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className={`p-4 sm:p-6 rounded-xl border ${
                isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
              } shadow-lg`}>
                <div className="flex items-center mb-4">
                  <div className={`p-2 sm:p-3 rounded-xl ${
                    isDarkMode ? 'bg-gray-500/20' : 'bg-gray-100'
                  }`}>
                    <ClockIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <h3 className={`text-lg font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Timestamps
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className={`h-4 w-4 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <div>
                        <div className={`text-xs font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Created
                        </div>
                        <div className={`text-xs sm:text-sm font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatDateTime(fabric.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <ClockIcon className={`h-4 w-4 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <div>
                        <div className={`text-xs font-medium ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Updated
                        </div>
                        <div className={`text-xs sm:text-sm font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatDateTime(fabric.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Image Preview Modal */}
        {showImagePreview && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="relative w-full max-w-6xl">
              {/* Close Button */}
              <button
                onClick={() => setShowImagePreview(null)}
                className="absolute top-4 right-4 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 z-10 shadow-lg"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              
              {/* Navigation Buttons */}
              {fabric.images.length > 1 && (
                <>
                  <button
                    onClick={() => {
                      const newIndex = showImagePreview.index === 0 ? fabric.images.length - 1 : showImagePreview.index - 1;
                      setShowImagePreview({ url: fabric.images[newIndex], index: newIndex });
                      setCurrentImageIndex(newIndex);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 z-10 shadow-lg"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => {
                      const newIndex = showImagePreview.index === fabric.images.length - 1 ? 0 : showImagePreview.index + 1;
                      setShowImagePreview({ url: fabric.images[newIndex], index: newIndex });
                      setCurrentImageIndex(newIndex);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 z-10 shadow-lg"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
              
              {/* Main Image */}
              <div className="relative bg-gray-900 rounded-lg">
                <img
                  src={showImagePreview.url}
                  alt={`Fabric image ${showImagePreview.index + 1}`}
                  className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                
                {/* Image Info Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-black/70 text-white text-sm font-medium shadow-lg">
                  Image {showImagePreview.index + 1} of {fabric.images.length}
                </div>
              </div>

              {/* Thumbnail Navigation */}
              {fabric.images.length > 1 && (
                <div className="mt-6 flex justify-center">
                  <div className="flex space-x-2 bg-black/50 rounded-xl p-3 max-w-full overflow-x-auto">
                    {fabric.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setShowImagePreview({ url: image, index });
                          setCurrentImageIndex(index);
                        }}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                          index === showImagePreview.index
                            ? 'border-white shadow-lg scale-110'
                            : 'border-gray-400 hover:border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-16 h-16 object-cover"
                        />
                        <div className={`absolute top-1 right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold ${
                          index === showImagePreview.index
                            ? 'bg-white text-black'
                            : 'bg-black/70 text-white'
                        }`}>
                          {index + 1}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

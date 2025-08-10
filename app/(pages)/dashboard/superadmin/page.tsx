'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from './hooks/useDarkMode';

interface Photo {
  id: string;
  dataUrl: string;
  timestamp: Date;
  name: string;
}

export default function SuperAdminDashboard() {
  const { isDarkMode } = useDarkMode();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load photos from localStorage on component mount
  useEffect(() => {
    const savedPhotos = localStorage.getItem('dashboard-photos');
    if (savedPhotos) {
      try {
        setPhotos(JSON.parse(savedPhotos));
      } catch (error) {
        console.error('Error loading photos:', error);
      }
    }
  }, []);

  // Save photos to localStorage whenever photos change
  useEffect(() => {
    localStorage.setItem('dashboard-photos', JSON.stringify(photos));
  }, [photos]);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCurrentPhoto(null);
  };

  // Take photo
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCurrentPhoto(dataUrl);
      }
    }
  };

  // Save photo
  const savePhoto = () => {
    if (currentPhoto) {
      const newPhoto: Photo = {
        id: Date.now().toString(),
        dataUrl: currentPhoto,
        timestamp: new Date(),
        name: `Photo_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
      };
      
      setPhotos(prev => [newPhoto, ...prev]);
      setCurrentPhoto(null);
      setShowCamera(false);
      stopCamera();
    }
  };

  // Delete photo
  const deletePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  // Download photo
  const downloadPhoto = (photo: Photo) => {
    const link = document.createElement('a');
    link.download = `${photo.name}.jpg`;
    link.href = photo.dataUrl;
    link.click();
  };

  // Open camera modal
  const openCamera = () => {
    setShowCamera(true);
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Close camera modal
  const closeCamera = () => {
    setShowCamera(false);
    stopCamera();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, Super Admin!
          </h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Manage your CRM system and monitor all activities from your dashboard.
          </p>
        </div>
        
        {/* Camera Button */}
        <button
          onClick={openCamera}
          className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            isDarkMode
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
          }`}
        >
          <CameraIcon className="h-5 w-5 mr-2" />
          Take Photo
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-xl border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-xl ${
              isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
            }`}>
              <UsersIcon className={`h-8 w-8 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Users
              </p>
              <p className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                1,234
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-xl ${
              isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
            }`}>
              <BuildingOfficeIcon className={`h-8 w-8 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Companies
              </p>
              <p className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                89
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-xl ${
              isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
            }`}>
              <DocumentTextIcon className={`h-8 w-8 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Documents
              </p>
              <p className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                456
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl border transition-all duration-300 ${
          isDarkMode
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <div className={`p-3 rounded-xl ${
              isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
            }`}>
              <PhotoIcon className={`h-8 w-8 ${
                isDarkMode ? 'text-orange-400' : 'text-orange-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Photos
              </p>
              <p className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {photos.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Gallery */}
      <div className={`rounded-xl border transition-all duration-300 ${
        isDarkMode
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6 border-b border-gray-200 dark:border-white/10">
          <h2 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Photo Gallery
          </h2>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Your captured photos and memories
          </p>
        </div>

        <div className="p-6">
          {photos.length === 0 ? (
            <div className={`text-center py-12 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <PhotoIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No photos yet</p>
              <p className="text-sm">Click "Take Photo" to capture your first image</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className={`group relative rounded-lg overflow-hidden border transition-all duration-300 ${
                  isDarkMode ? 'border-white/10' : 'border-gray-200'
                }`}>
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => downloadPhoto(photo)}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        isDarkMode
                          ? 'bg-white/20 text-white hover:bg-white/30'
                          : 'bg-white/80 text-gray-900 hover:bg-white'
                      }`}
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        isDarkMode
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Photo info */}
                  <div className={`absolute bottom-0 left-0 right-0 p-2 ${
                    isDarkMode ? 'bg-black/50' : 'bg-white/80'
                  }`}>
                    <p className={`text-xs font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {photo.name}
                    </p>
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {photo.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-xl shadow-2xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Camera
              </h3>
              <button
                onClick={closeCamera}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode
                    ? 'text-gray-400 hover:bg-white/10'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Camera View */}
            <div className="p-6">
              {!currentPhoto ? (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className={`relative rounded-lg overflow-hidden border-2 border-dashed ${
                    isDarkMode ? 'border-white/20' : 'border-gray-300'
                  }`}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                    />
                    {!isCameraActive && (
                      <div className={`absolute inset-0 flex items-center justify-center ${
                        isDarkMode ? 'bg-slate-700/50' : 'bg-gray-100/50'
                      }`}>
                        <div className="text-center">
                          <CameraIcon className={`h-12 w-12 mx-auto mb-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <p className={`text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            Camera loading...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={takePhoto}
                      disabled={!isCameraActive}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        isCameraActive
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <CameraIcon className="h-5 w-5 mr-2 inline" />
                      Take Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Photo Preview */}
                  <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-white/20">
                    <img
                      src={currentPhoto}
                      alt="Captured photo"
                      className="w-full h-64 object-cover"
                    />
                  </div>

                  {/* Photo Actions */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setCurrentPhoto(null)}
                      className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                        isDarkMode
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Retake
                    </button>
                    <button
                      onClick={savePhoto}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all duration-300"
                    >
                      Save Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden canvas for capturing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );
}

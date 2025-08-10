'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  CameraIcon,
  PhotoIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface User {
  _id: string;
  name: string;
  username: string;
  role: string;
  createdAt: string;
}

interface Photo {
  id: string;
  dataUrl: string;
  timestamp: Date;
  name: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === 'superadmin') {
        router.push('/dashboard/superadmin');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Load photos from localStorage on component mount
  useEffect(() => {
    const savedPhotos = localStorage.getItem('user-dashboard-photos');
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
    localStorage.setItem('user-dashboard-photos', JSON.stringify(photos));
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">CRM Admin Panel</h1>
                <p className="text-sm text-slate-600">User Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Camera Button */}
              <button
                onClick={openCamera}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-300 shadow-lg"
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                Take Photo
              </button>
              
              <button className="p-2 text-slate-600 hover:text-slate-900 transition-colors duration-200">
                <BellIcon className="h-6 w-6" />
              </button>
              <button className="p-2 text-slate-600 hover:text-slate-900 transition-colors duration-200">
                <CogIcon className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-red-600 transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-slate-600">
            Access your CRM tools and manage your business activities from your personal dashboard.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">My Documents</p>
                <p className="text-2xl font-bold text-slate-900">24</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CalendarIcon className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Upcoming Tasks</p>
                <p className="text-2xl font-bold text-slate-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-violet-100 rounded-xl">
                <ChartBarIcon className="h-8 w-8 text-violet-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Performance</p>
                <p className="text-2xl font-bold text-slate-900">92%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-xl">
                <PhotoIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">My Photos</p>
                <p className="text-2xl font-bold text-slate-900">{photos.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Gallery */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">My Photo Gallery</h3>
          <p className="text-sm text-slate-600 mb-6">Your captured photos and memories</p>
          
          {photos.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <PhotoIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No photos yet</p>
              <p className="text-sm">Click "Take Photo" to capture your first image</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-white/20">
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-48 object-cover"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => downloadPhoto(photo)}
                      className="p-2 rounded-lg bg-white/80 text-gray-900 hover:bg-white transition-all duration-300"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-300"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Photo info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/80">
                    <p className="text-xs font-medium text-gray-900">
                      {photo.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {photo.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                  <span className="font-medium text-slate-900">Create Document</span>
                </div>
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-slate-400" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <CalendarIcon className="h-6 w-6 text-emerald-600" />
                  <span className="font-medium text-slate-900">Schedule Meeting</span>
                </div>
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-slate-400" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-6 w-6 text-violet-600" />
                  <span className="font-medium text-slate-900">Update Profile</span>
                </div>
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Document created</p>
                  <p className="text-xs text-slate-600">30 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Meeting scheduled</p>
                  <p className="text-xs text-slate-600">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Profile updated</p>
                  <p className="text-xs text-slate-600">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-slate-600">Full Name</p>
              <p className="text-lg text-slate-900">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Username</p>
              <p className="text-lg text-slate-900">{user?.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Role</p>
              <p className="text-lg text-slate-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Member Since</p>
              <p className="text-lg text-slate-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl shadow-2xl bg-white border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Camera
              </h3>
              <button
                onClick={closeCamera}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all duration-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Camera View */}
            <div className="p-6">
              {!currentPhoto ? (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                    />
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/50">
                        <div className="text-center">
                          <CameraIcon className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                          <p className="text-sm text-gray-600">
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
                  <div className="rounded-lg overflow-hidden border border-gray-200">
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
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all duration-300"
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

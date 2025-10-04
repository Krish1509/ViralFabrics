'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface UpcomingOrder {
  id: string;
  orderId: string;
  orderType: string;
  deliveryDate: string;
  party: {
    name: string;
    contactPerson?: string;
    contactPhone?: string;
  };
  status: string;
  priority: number;
  items: Array<{
    quantity: number;
    description?: string;
  }>;
  daysUntilDelivery: number;
}

interface DeliveredSoonTableProps {
  isDarkMode: boolean;
}

// Ultra-fast client-side cache for delivered soon data
const deliveredSoonCache = {
  data: null as UpcomingOrder[] | null,
  timestamp: 0,
  ttl: 30 * 1000 // 30 seconds for ultra-fast loading
};

const DeliveredSoonTable: React.FC<DeliveredSoonTableProps> = ({ isDarkMode }) => {
  // Load from localStorage for instant display
  const [upcomingOrders, setUpcomingOrders] = useState<UpcomingOrder[]>(() => {
    try {
      const cached = localStorage.getItem('upcoming-deliveries-cache');
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30000) { // 30 seconds
          return data || [];
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return []; // Start with empty array, will be populated by API
  });
  const [loading, setLoading] = useState(false); // Never show loading to prevent "No data" messages
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [filteredOrders, setFilteredOrders] = useState<UpcomingOrder[]>(upcomingOrders);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetchUpcomingOrders = useCallback(async () => {
    try {
      // Ultra-fast cache check - load from cache immediately if available
      if (deliveredSoonCache.data && (Date.now() - deliveredSoonCache.timestamp) < deliveredSoonCache.ttl) {
        setUpcomingOrders(deliveredSoonCache.data);
        setFilteredOrders(deliveredSoonCache.data);
        setLoading(false);
        return; // Instant load from cache
      }

      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view upcoming orders');
        return;
      }

      // Reasonable timeout for reliable data loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for reliable loading
      
      // Try dedicated upcoming deliveries endpoint first, fallback to orders API
      let response: Response | undefined;
      let useFallback = false;
      
      try {
        response = await fetch(`/api/dashboard/upcoming-deliveries-instant`, {
          headers: {
            'Accept': 'application/json'
          },
          signal: controller.signal,
          cache: 'default'
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          // Timeout occurred, try with cached data or show empty state
          if (deliveredSoonCache.data) {
            setUpcomingOrders(deliveredSoonCache.data);
            setFilteredOrders(deliveredSoonCache.data);
            setLoading(false);
            return; // Use cached data instead of showing error
          }
          // No cached data, show empty state instead of error
          setUpcomingOrders([]);
          setFilteredOrders([]);
          setLoading(false);
          return;
        }
        // If dedicated endpoint fails, try fallback
        useFallback = true;
      }
      
      // If dedicated endpoint failed or returned error, try fallback
      if (useFallback || !response || !response.ok) {
        try {
          response = await fetch(`/api/orders?limit=1000`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            signal: controller.signal,
            cache: 'default'
          });
        } catch (fallbackError: any) {
          if (fallbackError.name === 'AbortError') {
            if (deliveredSoonCache.data) {
              setUpcomingOrders(deliveredSoonCache.data);
              setFilteredOrders(deliveredSoonCache.data);
              setLoading(false);
              return;
            }
            setUpcomingOrders([]);
            setFilteredOrders([]);
            setLoading(false);
            return;
          }
          throw fallbackError;
        }
      }

      if (response && response.ok) {
        const data = await response.json();
        
        // Handle response format
        let orders = [];
        if (data.success && data.data) {
          orders = Array.isArray(data.data) ? data.data : [];
        } else if (Array.isArray(data)) {
          orders = data;
        }
        
        let validUpcoming;
        
        // Check if this is from the dedicated endpoint (pre-processed) or fallback (needs processing)
        if (orders.length > 0 && orders[0].daysUntilDelivery !== undefined) {
          // Data is already processed by the dedicated API, just use it directly
          validUpcoming = orders.filter((order: any) => order && order.orderId);
          
        } else {
          // Fallback: process orders from the general orders API
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Start from yesterday to catch any timezone issues
          const startDate = new Date(today);
          startDate.setDate(today.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          
          const upcoming = orders
            .filter((order: any) => order.deliveryDate)
            .map((order: any) => {
              const deliveryDate = new Date(order.deliveryDate);
              if (isNaN(deliveryDate.getTime())) return null;
              
              // Normalize delivery date to start of day for accurate comparison
              deliveryDate.setHours(0, 0, 0, 0);
              
              const daysUntil = Math.ceil((deliveryDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              
              return {
                id: order._id || order.id,
                orderId: order.orderId,
                orderType: order.orderType || 'Not Set',
                deliveryDate: order.deliveryDate,
                party: order.party || { name: 'Unknown Party' },
                status: order.status,
                priority: order.priority || 5,
                items: order.items || [],
                daysUntilDelivery: daysUntil
              };
            })
            .filter((order: UpcomingOrder | null) => {
              if (!order) return false;
              // Include orders from yesterday (-1 day) to 7 days from now to handle timezone issues
              return order.daysUntilDelivery >= -1 && order.daysUntilDelivery <= 7;
            })
            .sort((a: UpcomingOrder | null, b: UpcomingOrder | null) => {
              if (!a || !b) return 0;
              return a.daysUntilDelivery - b.daysUntilDelivery;
            });

          validUpcoming = upcoming.filter((order: UpcomingOrder | null): order is UpcomingOrder => order !== null);
        }
        
        setUpcomingOrders(validUpcoming);
        setFilteredOrders(validUpcoming);
        setHasLoadedOnce(true);
        
        // Update cache for instant future loads
        deliveredSoonCache.data = validUpcoming;
        deliveredSoonCache.timestamp = Date.now();
        
        // Also save to localStorage for instant loading on page refresh
        try {
          localStorage.setItem('upcoming-deliveries-cache', JSON.stringify({
            data: validUpcoming,
            timestamp: Date.now()
          }));
        } catch (e) {
          // Ignore localStorage errors
        }
      } else {
        if (response && response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (response && response.status === 404) {
          setUpcomingOrders([]);
          setFilteredOrders([]);
          deliveredSoonCache.data = [];
          deliveredSoonCache.timestamp = Date.now();
        } else {
          setError(`Failed to load upcoming orders (${response?.status || 'unknown'})`);
        }
      }
    } catch (error: any) {
      // Graceful error handling - don't show errors for timeouts if we have cached data
      if (error.name === 'AbortError') {
        // Check if we have cached data to show instead of error
        if (deliveredSoonCache.data) {
          setUpcomingOrders(deliveredSoonCache.data);
          setFilteredOrders(deliveredSoonCache.data);
          setLoading(false);
          return; // Show cached data instead of error
        }
        // Only show timeout error if no cached data available and we've tried before
        if (hasLoadedOnce) {
          setError('Request timeout. Please try again.');
        }
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        // Network errors - try to use cached data first
        if (deliveredSoonCache.data) {
          setUpcomingOrders(deliveredSoonCache.data);
          setFilteredOrders(deliveredSoonCache.data);
          setLoading(false);
          return; // Show cached data instead of error
        }
        if (hasLoadedOnce) {
          setError('Network error. Please check your connection.');
        }
      } else {
        // Other errors - try to use cached data first
        if (deliveredSoonCache.data) {
          setUpcomingOrders(deliveredSoonCache.data);
          setFilteredOrders(deliveredSoonCache.data);
          setLoading(false);
          return; // Show cached data instead of error
        }
        if (hasLoadedOnce) {
          setError('Failed to load upcoming orders. Please try again.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingOrders();
    
    // Aggressive background refresh for ultra-fast loading
    const refreshInterval = setInterval(() => {
      // Refresh data in background every 25 seconds (before cache expires)
      if (!loading) {
        fetchUpcomingOrders();
      }
    }, 25000); // 25 seconds - refresh before cache expires
    
    // Silent retry mechanism - retry every 5 seconds if there was an error
    const retryInterval = setInterval(() => {
      if (error && !loading) {
        fetchUpcomingOrders();
      }
    }, 5000); // 5 seconds for faster recovery
    
    return () => {
      clearInterval(refreshInterval);
      clearInterval(retryInterval);
    };
  }, [fetchUpcomingOrders, error, loading]);

  // Visibility change listener removed for ultra-fast loading

  // Filter orders by selected date
  useEffect(() => {
    if (!selectedDate) {
      setFilteredOrders(upcomingOrders);
    } else {
      const filtered = upcomingOrders.filter(order => 
        order.deliveryDate.startsWith(selectedDate)
      );
      setFilteredOrders(filtered);
    }
  }, [selectedDate, upcomingOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return isDarkMode ? 'text-green-400' : 'text-green-600';
      case 'in_progress':
        return isDarkMode ? 'text-blue-400' : 'text-blue-600';
      case 'pending':
        return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (priority >= 6) return isDarkMode ? 'text-orange-400' : 'text-orange-600';
    return isDarkMode ? 'text-green-400' : 'text-green-600';
  };

  const getDaysUntilColor = (days: number) => {
    if (days === 0) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (days <= 2) return isDarkMode ? 'text-orange-400' : 'text-orange-600';
    return isDarkMode ? 'text-green-400' : 'text-green-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };


  if (loading) {
    return (
      <div className={`rounded-lg border p-6 ${
        isDarkMode 
          ? 'bg-white/5 border-white/10' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="animate-pulse">
          <div className={`h-6 w-48 rounded mb-4 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-16 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${
      isDarkMode 
        ? 'bg-white/5 border-white/10' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <TruckIcon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Delivered Soon
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isDarkMode 
                ? 'bg-blue-900/30 text-blue-300' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              Next 7 Days
            </span>
          </div>
          
          {/* Date Filter and Refresh */}
          <div className="flex items-center gap-2">
            <CalendarIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="Filter by date"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className={`px-2 py-1 text-xs rounded ${
                  isDarkMode
                    ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Clear
              </button>
            )}
            <button
              onClick={() => {
                // Simple refresh without clearing cache
                fetchUpcomingOrders();
              }}
              disabled={loading}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-slate-700 text-gray-300 hover:bg-slate-600 border-slate-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message - Only show if we have a real error and no cached data */}
      {error && !deliveredSoonCache.data && (
        <div className="p-6">
          <div className={`flex items-center justify-between gap-2 p-3 rounded-lg ${
            isDarkMode 
              ? 'bg-red-900/20 border border-red-800/30' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className={`w-5 h-5 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`} />
              <p className={`text-sm ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>
                {error}
              </p>
            </div>
            <button
              onClick={() => {
                setError(null);
                fetchUpcomingOrders();
              }}
              disabled={loading}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : isDarkMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredOrders.length === 0 ? (
          <div className="p-6 text-center">
            <TruckIcon className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {selectedDate 
                ? `No orders scheduled for ${formatDate(selectedDate)}`
                : 'No orders scheduled for delivery in the next 7 days'
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className={`border-b ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
              }`}>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Order Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Party
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Delivery Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              isDarkMode ? 'divide-white/10' : 'divide-gray-200'
            }`}>
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`hover:${
                  isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                } transition-colors`}>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        #{order.orderId}
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {order.orderType}
                      </div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {order.party.name}
                      </div>
                      {order.party.contactPerson && (
                        <div className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {order.party.contactPerson}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatDate(order.deliveryDate)}
                        </div>
                        <div className={`text-sm font-medium ${getDaysUntilColor(order.daysUntilDelivery)}`}>
                          {order.daysUntilDelivery === 0 
                            ? 'Today' 
                            : order.daysUntilDelivery === 1 
                            ? 'Tomorrow' 
                            : `${order.daysUntilDelivery} days`
                          }
                        </div>
                      </div>
                      {order.daysUntilDelivery <= 2 && (
                        <ClockIcon className={`w-4 h-4 ${
                          order.daysUntilDelivery === 0 
                            ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                            : (isDarkMode ? 'text-orange-400' : 'text-orange-600')
                        }`} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      {order.priority >= 8 && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isDarkMode 
                            ? 'bg-red-900/30 text-red-300' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          High Priority
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {filteredOrders.length > 0 && (
        <div className={`px-6 py-3 border-t ${
          isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={`${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              {selectedDate && ` for ${formatDate(selectedDate)}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveredSoonTable;

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
  ttl: 10 * 60 * 1000 // 10 minutes for ultra-fast loading
};

const DeliveredSoonTable: React.FC<DeliveredSoonTableProps> = ({ isDarkMode }) => {
  const [upcomingOrders, setUpcomingOrders] = useState<UpcomingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [filteredOrders, setFilteredOrders] = useState<UpcomingOrder[]>([]);

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

      // Ultra-fast timeout for instant response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      // Single optimized API call
      const response = await fetch(`/api/orders?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        signal: controller.signal,
        cache: 'default' // Use browser cache for speed
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        // Handle response format
        let orders = [];
        if (data.success && data.data) {
          orders = Array.isArray(data.data) ? data.data : [];
        } else if (Array.isArray(data)) {
          orders = data;
        }
        
        // Fast filtering for orders with delivery dates in next 7 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = orders
          .filter((order: any) => order.deliveryDate)
          .map((order: any) => {
            const deliveryDate = new Date(order.deliveryDate);
            if (isNaN(deliveryDate.getTime())) return null;
            
            const daysUntil = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
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
          .filter((order: UpcomingOrder | null) => 
            order && order.daysUntilDelivery >= 0 && order.daysUntilDelivery <= 7
          )
          .sort((a: UpcomingOrder | null, b: UpcomingOrder | null) => {
            if (!a || !b) return 0;
            return a.daysUntilDelivery - b.daysUntilDelivery;
          });

        const validUpcoming = upcoming.filter((order: UpcomingOrder | null): order is UpcomingOrder => order !== null);
        
        setUpcomingOrders(validUpcoming);
        setFilteredOrders(validUpcoming);
        
        // Update cache for instant future loads
        deliveredSoonCache.data = validUpcoming;
        deliveredSoonCache.timestamp = Date.now();
      } else {
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (response.status === 404) {
          setUpcomingOrders([]);
          setFilteredOrders([]);
          deliveredSoonCache.data = [];
          deliveredSoonCache.timestamp = Date.now();
        } else {
          setError(`Failed to load upcoming orders (${response.status})`);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        setError('Failed to load upcoming orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingOrders();
  }, [fetchUpcomingOrders]);

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

      {/* Error Message */}
      {error && (
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

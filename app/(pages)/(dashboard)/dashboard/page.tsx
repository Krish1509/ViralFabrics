'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBagIcon, 
  UsersIcon, 
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Order, Party } from '@/types';
import { useDarkMode } from '../hooks/useDarkMode';

export default function DashboardPage() {
  const { isDarkMode } = useDarkMode();
  const [orders, setOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const [ordersResponse, partiesResponse] = await Promise.all([
        fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/parties', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      const ordersData = await ordersResponse.json();
      const partiesData = await partiesResponse.json();

      if (ordersData.success) {
        setOrders(ordersData.data.orders || []);
      }
      if (partiesData.success) {
        setParties(partiesData.data || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStats = () => {
    const total = orders.length;
    const pending = orders.filter(order => {
      const now = new Date();
      return now <= new Date(order.arrivalDate);
    }).length;
    const arrived = orders.filter(order => {
      const now = new Date();
      return now > new Date(order.arrivalDate) && 
             (!order.deliveryDate || now <= new Date(order.deliveryDate));
    }).length;
    const delivered = orders.filter(order => {
      const now = new Date();
      return order.deliveryDate && now > new Date(order.deliveryDate);
    }).length;

    return { total, pending, arrived, delivered };
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
            <p className={`mt-1 text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              Welcome to your CRM Admin Panel
            </p>
          </div>
        </div>
      </div>

              {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Orders */}
            <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Total Orders</p>
                  <p className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total}</p>
                </div>
              </div>
            </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          {/* Arrived Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Arrived</p>
                <p className="text-2xl font-bold text-gray-900">{stats.arrived}</p>
              </div>
            </div>
          </div>

          {/* Delivered Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Orders Management */}
          <Link href="/orders" className="group">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBagIcon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                    Manage Orders
                  </h3>
                  <p className="text-sm text-gray-500">
                    Create, edit, and track orders
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Parties Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Parties
                </h3>
                <p className="text-sm text-gray-500">
                  {parties.length} parties in system
                </p>
              </div>
            </div>
          </div>

          {/* Users Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  User Management
                </h3>
                <p className="text-sm text-gray-500">
                  Manage system users
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Arrival Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.slice(0, 5).map((order) => {
                      const status = (() => {
                        const now = new Date();
                        if (order.deliveryDate && now > new Date(order.deliveryDate)) return 'Delivered';
                        if (order.arrivalDate && now > new Date(order.arrivalDate)) return 'Arrived';
                        return 'Pending';
                      })();

                      const statusColor = (() => {
                        switch (status) {
                          case 'Delivered': return 'bg-green-100 text-green-800';
                          case 'Arrived': return 'bg-blue-100 text-blue-800';
                          case 'Pending': return 'bg-yellow-100 text-yellow-800';
                          default: return 'bg-gray-100 text-gray-800';
                        }
                      })();

                      return (
                        <tr key={order._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.orderType === 'Dying'
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {order.orderType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.arrivalDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {orders.length > 5 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Link 
                    href="/orders"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View all orders →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

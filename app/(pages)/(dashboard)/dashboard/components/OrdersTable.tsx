'use client';

import React, { useState } from 'react';
import { Order } from '@/types';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';

interface OrdersTableProps {
  orders: Order[];
  title: string;
  loading?: boolean;
  onViewOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  onDeleteOrder?: (order: Order) => void;
}

export default function OrdersTable({ 
  orders, 
  title, 
  loading = false,
  onViewOrder,
  onEditOrder,
  onDeleteOrder
}: OrdersTableProps) {
  const { isDarkMode } = useDarkMode();
  const [sortField, setSortField] = useState<keyof Order>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeColor = (type?: string) => {
    switch (type) {
      case 'Dying': return 'bg-purple-100 text-purple-800';
      case 'Printing': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`rounded-lg border shadow-sm p-6 transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700 shadow-slate-900/20' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="animate-pulse">
          <div className={`h-6 rounded w-1/4 mb-4 transition-colors duration-300 ${
            isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
          }`}></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-4 rounded transition-colors duration-300 ${
                isDarkMode ? 'bg-slate-700' : 'bg-gray-200'
              }`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border shadow-lg transition-all duration-500 ${
      isDarkMode 
        ? 'bg-slate-800/80 border-slate-700 shadow-slate-900/30 backdrop-blur-sm' 
        : 'bg-white/80 border-gray-200 shadow-gray-200/50 backdrop-blur-sm'
    }`}>
      <div className={`p-4 sm:p-6 border-b transition-colors duration-300 ${
        isDarkMode ? 'border-slate-700' : 'border-gray-200'
      }`}>
        <h3 className={`text-base sm:text-lg font-semibold transition-colors duration-300 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{title}</h3>
        <p className={`text-sm mt-1 transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className={`p-12 text-center transition-colors duration-300 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-slate-600' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSort('orderId')}
                >
                  Order ID
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-slate-600' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSort('orderType')}
                >
                  Type
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-slate-600' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSort('party')}
                >
                  Party
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-slate-600' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-slate-600' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSort('deliveryDate')}
                >
                  Delivery Date
                </th>
                <th 
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-colors duration-300 ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-slate-600' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                  onClick={() => handleSort('createdAt')}
                >
                  Created
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-slate-800 divide-slate-700' 
                : 'bg-white divide-gray-200'
            }`}>
              {sortedOrders.map((order) => (
                <tr key={order._id} className={`transition-colors duration-300 ${
                  isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DocumentTextIcon className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {order.orderId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.orderType ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOrderTypeColor(order.orderType)}`}>
                        {order.orderType}
                      </span>
                    ) : (
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Not set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className={`text-sm font-medium transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {typeof order.party === 'object' ? order.party?.name : 'N/A'}
                        </div>
                        {order.contactName && (
                          <div className={`text-sm transition-colors duration-300 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>{order.contactName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status || 'Not set'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <div>
                        <span className={`text-sm transition-colors duration-300 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatDate(order.deliveryDate)}
                        </span>
                        {order.deliveryDate && (() => {
                          const deliveryDate = new Date(order.deliveryDate);
                          const today = new Date();
                          const tomorrow = new Date(today);
                          tomorrow.setDate(today.getDate() + 1);
                          tomorrow.setHours(0, 0, 0, 0);
                          
                          const nextWeek = new Date(today);
                          nextWeek.setDate(today.getDate() + 7);
                          nextWeek.setHours(23, 59, 59, 999);
                          
                          if (deliveryDate >= tomorrow && deliveryDate <= nextWeek) {
                            const daysUntilDelivery = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            return (
                              <div className={`text-xs mt-1 transition-colors duration-300 ${
                                daysUntilDelivery <= 1 
                                  ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                                  : (isDarkMode ? 'text-yellow-400' : 'text-yellow-600')
                              }`}>
                                {daysUntilDelivery <= 1 ? 'Tomorrow' : `In ${daysUntilDelivery} days`}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ClockIcon className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm transition-colors duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {onViewOrder && (
                        <button
                          onClick={() => onViewOrder(order)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="View Order"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      {onEditOrder && (
                        <button
                          onClick={() => onEditOrder(order)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Edit Order"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteOrder && (
                        <button
                          onClick={() => onDeleteOrder(order)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete Order"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

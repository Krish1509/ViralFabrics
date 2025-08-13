'use client';

import { X, Edit, Calendar, Phone, MapPin, Package, FileText } from 'lucide-react';
import { Order } from '@/types';
import { useDarkMode } from '../../hooks/useDarkMode';

interface OrderDetailsProps {
  order: Order;
  onClose: () => void;
  onEdit: () => void;
}

export default function OrderDetails({ order, onClose, onEdit }: OrderDetailsProps) {
  const { isDarkMode } = useDarkMode();
  const getOrderStatus = (order: Order) => {
    const now = new Date();
    if (order.deliveryDate && now > new Date(order.deliveryDate)) return 'Delivered';
    if (order.arrivalDate && now > new Date(order.arrivalDate)) return 'Arrived';
    return 'Pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Arrived': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const party = typeof order.party === 'string' ? null : order.party;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b transition-colors duration-300 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div>
            <h2 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Details</h2>
            <p className={`text-sm mt-1 transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Order ID: {order.orderId}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className={`inline-flex items-center px-3 py-2 border rounded-md text-sm font-medium transition-colors duration-300 ${
                isDarkMode 
                  ? 'border-slate-600 text-gray-300 hover:bg-slate-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={onClose}
              className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Order Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Order Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Order ID:</span>
                    <span className="text-sm text-gray-900">{order.orderId}</span>
                  </div>
                  {order.orderNo && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Order No:</span>
                      <span className="text-sm text-gray-900">{order.orderNo}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Type:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.orderType === 'Dying'
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.orderType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getOrderStatus(order))}`}>
                      {getOrderStatus(order)}
                    </span>
                  </div>
                  {order.quantity && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Quantity:</span>
                      <span className="text-sm text-gray-900">{order.quantity.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Important Dates
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Arrival Date:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(order.arrivalDate).toLocaleDateString()}
                    </span>
                  </div>
                  {order.poDate && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">PO Date:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(order.poDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {order.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Delivery Date:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Numbers */}
              {(order.poNumber || order.styleNo) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Reference Numbers
                  </h3>
                  <div className="space-y-3">
                    {order.poNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">PO Number:</span>
                        <span className="text-sm text-gray-900">{order.poNumber}</span>
                      </div>
                    )}
                    {order.styleNo && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Style Number:</span>
                        <span className="text-sm text-gray-900">{order.styleNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Party Information */}
              {party && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Party Information</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <p className="text-sm text-gray-900 font-medium">{party.name}</p>
                    </div>
                    {party.contactName && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Contact:</span>
                        <p className="text-sm text-gray-900">{party.contactName}</p>
                      </div>
                    )}
                    {party.contactPhone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{party.contactPhone}</span>
                      </div>
                    )}
                    {party.address && (
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                        <span className="text-sm text-gray-900">{party.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(order.contactName || order.contactPhone) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {order.contactName && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Contact Name:</span>
                        <p className="text-sm text-gray-900">{order.contactName}</p>
                      </div>
                    )}
                    {order.contactPhone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{order.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quality */}
              {order.quality && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Description</h3>
                  <p className="text-sm text-gray-900">
                    {typeof order.quality === 'string' 
                      ? order.quality 
                      : order.quality.description || 'No description available'
                    }
                  </p>
                </div>
              )}

              {/* Image */}
              {order.imageUrl && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Image</h3>
                  <img
                    src={order.imageUrl}
                    alt="Order"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(order.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

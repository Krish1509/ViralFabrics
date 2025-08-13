'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Filter, Download } from 'lucide-react';
import OrderForm from './components/OrderForm';
import OrderDetails from './components/OrderDetails';
import PartyModal from './components/PartyModal';
import QualityModal from './components/QualityModal';
import { Order, Party, Quality } from '@/types';
import { useDarkMode } from '../hooks/useDarkMode';

export default function OrdersPage() {
  const { isDarkMode } = useDarkMode();
  const [orders, setOrders] = useState<Order[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [filters, setFilters] = useState({
    party: '',
    orderType: '',
    status: ''
  });

  // Fetch orders, parties, and qualities
  useEffect(() => {
    fetchOrders();
    fetchParties();
    fetchQualities();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch('/api/parties', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setParties(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const fetchQualities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch('/api/qualities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setQualities(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching qualities:', error);
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        return;
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setOrders(orders.filter(order => order._id !== orderId));
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.styleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.party as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesParty = !filters.party || order.party === filters.party;
    const matchesType = !filters.orderType || order.orderType === filters.orderType;
    const matchesStatus = !filters.status || getOrderStatus(order) === filters.status;

    return matchesSearch && matchesParty && matchesType && matchesStatus;
  });

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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Orders</h1>
              <p className={`mt-1 text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                Manage your orders and track their status
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-lg shadow p-6 mb-6`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* Party Filter */}
            <select
              value={filters.party}
              onChange={(e) => setFilters({ ...filters, party: e.target.value })}
              className={`border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="">All Parties</option>
              {parties.map((party) => (
                <option key={party._id} value={party._id}>
                  {party.name}
                </option>
              ))}
            </select>

            {/* Order Type Filter */}
            <select
              value={filters.orderType}
              onChange={(e) => setFilters(prev => ({ ...prev, orderType: e.target.value }))}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">All Types</option>
              <option value="Dying">Dying</option>
              <option value="Printing">Printing</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className={`border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Arrived">Arrived</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'} shadow rounded-lg overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Order ID
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Party
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Type
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Arrival Date
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 divide-slate-700' : 'bg-white divide-gray-200'}`}>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className={`transition-colors duration-300 ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {order.orderId}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {(order.party as any)?.name || 'N/A'}
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
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(order.arrivalDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(getOrderStatus(order))}`}>
                        {getOrderStatus(order)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(order)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(order)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className={`transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
             {showForm && (
         <OrderForm
           order={editingOrder}
           parties={parties}
           qualities={qualities}
           onClose={() => {
             setShowForm(false);
             setEditingOrder(null);
           }}
           onSuccess={() => {
             setShowForm(false);
             setEditingOrder(null);
             fetchOrders();
           }}
           onAddParty={() => {
             setShowPartyModal(true);
           }}
           onRefreshParties={fetchParties}
           onAddQuality={(newQualityData?: any) => {
             if (newQualityData) {
               // Immediately add the new quality to the state
               setQualities(prev => [...prev, newQualityData]);
             } else {
               // Fetch all qualities if no specific data provided
               fetchQualities();
             }
           }}
         />
       )}

      {showDetails && selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => {
            setShowDetails(false);
            setSelectedOrder(null);
          }}
          onEdit={() => {
            setShowDetails(false);
            setSelectedOrder(null);
            handleEdit(selectedOrder);
          }}
        />
      )}

      {showPartyModal && (
        <PartyModal
          onClose={() => setShowPartyModal(false)}
          onSuccess={() => {
            setShowPartyModal(false);
            fetchParties();
          }}
        />
      )}

      {showQualityModal && (
        <QualityModal
          onClose={() => setShowQualityModal(false)}
          onSuccess={(newQualityName?: string, newQualityData?: any) => {
            setShowQualityModal(false);
            // Immediately add the new quality to the state
            if (newQualityData) {
              setQualities(prev => [...prev, newQualityData]);
            }
            // Also fetch to ensure we have the latest data
            fetchQualities();
          }}
        />
      )}
    </div>
  );
}

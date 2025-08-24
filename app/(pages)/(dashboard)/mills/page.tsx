'use client';

import { useState, useEffect } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  PlusIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface MillOutput {
  _id: string;
  orderId: string;
  order?: {
    _id: string;
    orderId: string;
    party?: {
      name: string;
    };
  };
  recdDate: string;
  millBillNo: string;
  finishedMtr: number;
  millRate: number;
  createdAt: string;
  updatedAt: string;
}

export default function MillsPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [millOutputs, setMillOutputs] = useState<MillOutput[]>([]);
  const [filteredOutputs, setFilteredOutputs] = useState<MillOutput[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const itemsPerPage = 10;

  // Fetch mill outputs
  const fetchMillOutputs = async (page = 1, orderIdFilter = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (orderIdFilter) {
        params.append('orderId', orderIdFilter);
      }

      const response = await fetch(`/api/mill-outputs?${params}`);
      const data = await response.json();

      if (data.success) {
        setMillOutputs(data.data);
        setFilteredOutputs(data.data);
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.pages);
        setCurrentPage(data.pagination.page);
      }
    } catch (error) {
      console.error('Error fetching mill outputs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unique order IDs for filter
  const fetchOrderIds = async () => {
    try {
      const response = await fetch('/api/mill-outputs');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const orderIds = data.data.map((output: any) => String(output.orderId || '')).filter((id: string) => id);
        const uniqueOrderIds = [...new Set(orderIds)] as string[];
        setOrderIds(uniqueOrderIds.sort());
      } 
    } catch (error) {
      console.error('Error fetching order IDs:', error);
    }
  };

  useEffect(() => {
    fetchMillOutputs();
    fetchOrderIds();
  }, []);

  // Filter mill outputs based on search term and order ID
  useEffect(() => {
    let filtered = millOutputs;

    if (searchTerm) {
      filtered = filtered.filter(output => 
        output.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        output.millBillNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        output.order?.party?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedOrderId) {
      filtered = filtered.filter(output => output.orderId === selectedOrderId);
    }

    setFilteredOutputs(filtered);
  }, [millOutputs, searchTerm, selectedOrderId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMillOutputs(currentPage, selectedOrderId);
    setRefreshing(false);
  };

  const handleOrderIdFilter = (orderId: string) => {
    setSelectedOrderId(orderId);
    fetchMillOutputs(1, orderId);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedOrderId('');
    fetchMillOutputs(1, '');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mill Outputs Management</h1>
            <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Track and manage mill output records
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300' 
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              className={`flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors`}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Mill Output
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-6 rounded-xl border mb-6 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } shadow-sm`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search by Order ID, Bill No, or Party..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* Order ID Filter */}
              <div className="relative">
                <FunnelIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleOrderIdFilter(e.target.value)}
                  className={`pl-10 pr-8 py-2 rounded-lg border appearance-none transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  }`}
                >
                  <option value="">All Orders</option>
                  {orderIds.map(orderId => (
                    <option key={orderId} value={orderId}>Order {orderId}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedOrderId) && (
              <button
                onClick={clearFilters}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center">
              <BuildingOfficeIcon className={`h-8 w-8 mr-4 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Outputs
                </p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center">
              <DocumentTextIcon className={`h-8 w-8 mr-4 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  This Month
                </p>
                <p className="text-2xl font-bold">
                  {millOutputs.filter(output => {
                    const outputDate = new Date(output.recdDate);
                    const now = new Date();
                    return outputDate.getMonth() === now.getMonth() && 
                           outputDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center">
              <CurrencyDollarIcon className={`h-8 w-8 mr-4 ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Value
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(millOutputs.reduce((sum, output) => 
                    sum + (output.finishedMtr * output.millRate), 0
                  ))}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-xl border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-sm`}>
            <div className="flex items-center">
              <CalendarIcon className={`h-8 w-8 mr-4 ${
                isDarkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <div>
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Avg Rate
                </p>
                <p className="text-2xl font-bold">
                  {millOutputs.length > 0 
                    ? formatCurrency(millOutputs.reduce((sum, output) => sum + output.millRate, 0) / millOutputs.length)
                    : '₹0.00'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mill Outputs Table */}
        <div className={`rounded-xl border overflow-hidden ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } shadow-sm`}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredOutputs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Order ID
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Party
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Bill No
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Received Date
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Finished (mtr)
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Rate
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Total Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {filteredOutputs.map((output) => (
                      <tr key={output._id} className={`hover:${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      } transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>
                            {output.orderId}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            {output.order?.party?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            {output.millBillNo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`${
                            isDarkMode ? 'text-gray-300' : 'text-gray-900'
                          }`}>
                            {formatDate(output.recdDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            {output.finishedMtr.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-medium ${
                            isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                          }`}>
                            {formatCurrency(output.millRate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-bold ${
                            isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          }`}>
                            {formatCurrency(output.finishedMtr * output.millRate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`px-6 py-4 border-t ${
                  isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchMillOutputs(currentPage - 1, selectedOrderId)}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded border transition-colors ${
                          currentPage === 1
                            ? isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <span className={`px-3 py-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => fetchMillOutputs(currentPage + 1, selectedOrderId)}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded border transition-colors ${
                          currentPage === totalPages
                            ? isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <BuildingOfficeIcon className={`h-16 w-16 mx-auto mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className={`text-lg font-medium mb-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No mill outputs found
              </h3>
              <p className={`${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {searchTerm || selectedOrderId 
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by adding your first mill output.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

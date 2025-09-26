'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../hooks/useDarkMode';

interface Party {
  _id: string;
  name: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PartiesPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch parties
  const fetchParties = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view parties');
        return;
      }

      const response = await fetch('/api/parties?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setParties(data.data || []);
      } else {
        setError('Failed to fetch parties');
      }
    } catch (error) {
      setError('Failed to fetch parties');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create party
  const handleCreateParty = async () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Party name is required' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Party created successfully' });
        setShowCreateModal(false);
        setFormData({ name: '', contactPerson: '', phoneNumber: '', email: '', address: '' });
        fetchParties();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to create party' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create party' });
    } finally {
      setSubmitting(false);
    }
  };

  // Update party
  const handleUpdateParty = async () => {
    if (!selectedParty || !formData.name.trim()) {
      setMessage({ type: 'error', text: 'Party name is required' });
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/parties/${selectedParty._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Party updated successfully' });
        setShowEditModal(false);
        setSelectedParty(null);
        setFormData({ name: '', contactPerson: '', phoneNumber: '', email: '', address: '' });
        fetchParties();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to update party' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update party' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete party
  const handleDeleteParty = async () => {
    if (!selectedParty) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/parties/${selectedParty._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Party deleted successfully' });
        setShowDeleteModal(false);
        setSelectedParty(null);
        fetchParties();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to delete party' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete party' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter parties
  const filteredParties = parties.filter(party =>
    party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (party.contactPerson && party.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (party.phoneNumber && party.phoneNumber.includes(searchTerm))
  );

  useEffect(() => {
    if (mounted) {
      fetchParties();
    }
  }, [mounted, fetchParties]);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Parties
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage parties and customers
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ name: '', contactPerson: '', phoneNumber: '', email: '', address: '' });
            setShowCreateModal(true);
            setMessage(null);
          }}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Party
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? isDarkMode ? 'bg-green-900/20 border border-green-800/30' : 'bg-green-50 border border-green-200'
            : isDarkMode ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${
            message.type === 'success'
              ? isDarkMode ? 'text-green-300' : 'text-green-800'
              : isDarkMode ? 'text-red-300' : 'text-red-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
        <input
          type="text"
          placeholder="Search parties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            isDarkMode 
              ? 'bg-white/5 border-white/10 text-white placeholder-gray-400' 
              : 'border-gray-300'
          }`}
        />
      </div>

      {/* Parties Table */}
      <div className={`rounded-lg border overflow-hidden ${
        isDarkMode
          ? 'bg-white/5 border-white/10'
          : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
            <thead className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Contact Person
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Phone
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-white/10' : 'divide-gray-200'}`}>
              {filteredParties.map((party) => (
                <tr key={party._id} className={`${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {party.name}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {party.contactPerson || '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {party.phoneNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setFormData({
                            name: party.name,
                            contactPerson: party.contactPerson || '',
                            phoneNumber: party.phoneNumber || '',
                            email: party.email || '',
                            address: party.address || ''
                          });
                          setSelectedParty(party);
                          setShowEditModal(true);
                          setMessage(null);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
                            : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedParty(party);
                          setShowDeleteModal(true);
                          setMessage(null);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
                            : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredParties.length === 0 && (
          <div className={`text-center py-12 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <BuildingOfficeIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No parties found</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Create New Party
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter party name"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter contact person"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter address"
                />
              </div>
            </div>
            <div className={`flex justify-end space-x-3 p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateParty}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedParty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Edit Party
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-white' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
            </div>
            <div className={`flex justify-end space-x-3 p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowEditModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateParty}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedParty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}>
            <div className={`p-6 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Delete Party
              </h3>
            </div>
            <div className="p-6">
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Are you sure you want to delete "{selectedParty.name}"? This action cannot be undone.
              </p>
            </div>
            <div className={`flex justify-end space-x-3 p-6 border-t ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteParty}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

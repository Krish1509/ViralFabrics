'use client';

import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Fabric } from '@/types/fabric';

interface BulkDeleteConfirmationProps {
  fabrics: Fabric[];
  qualityCode: string;
  qualityName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export default function BulkDeleteConfirmation({
  fabrics,
  qualityCode,
  qualityName,
  onConfirm,
  onCancel,
  isDeleting
}: BulkDeleteConfirmationProps) {
  const { isDarkMode } = useDarkMode();

  return (
    <div className="fixed inset-0 bg-blur-md bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-2xl w-full rounded-xl shadow-2xl ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isDarkMode ? 'bg-red-500/20' : 'bg-red-100'
            }`}>
              <ExclamationTriangleIcon className={`h-6 w-6 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Delete All Fabrics
              </h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className={`p-4 rounded-lg border ${
              isDarkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className={`h-5 w-5 mt-0.5 ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <div>
                  <h4 className={`font-semibold ${
                    isDarkMode ? 'text-red-300' : 'text-red-800'
                  }`}>
                    Warning: Bulk Deletion
                  </h4>
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-red-200' : 'text-red-700'
                  }`}>
                    You are about to delete all {fabrics.length} fabric(s) with quality code "{qualityCode}" and quality name "{qualityName}". This action is permanent and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Fabrics to be deleted */}
          <div className="mb-6">
            <h4 className={`font-semibold mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Fabrics to be deleted ({fabrics.length}):
            </h4>
            <div className={`max-h-64 overflow-y-auto rounded-lg border ${
              isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
            }`}>
              {fabrics.map((fabric, index) => (
                <div
                  key={fabric._id}
                  className={`p-3 border-b last:border-b-0 ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Item {index + 1}: {fabric.weaver} - {fabric.weaverQualityName}
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Width: {fabric.finishWidth}" | Weight: {fabric.weight} KG | GSM: {fabric.gsm} | Rate: ₹{fabric.greighRate}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Details */}
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Quality Details:
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={`font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Quality Code:</span>
                <span className={`ml-2 font-mono ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>{qualityCode}</span>
              </div>
              <div>
                <span className={`font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Quality Name:</span>
                <span className={`ml-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{qualityName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isDarkMode 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
            } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              isDeleting 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:scale-105'
            } ${
              isDarkMode 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                <span>Delete All ({fabrics.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

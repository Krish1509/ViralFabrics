'use client';

import { useState } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function DebugPasswordPage() {
  const { isDarkMode, mounted } = useDarkMode();
  const [action, setAction] = useState('list-users');
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/debug/fix-passwords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          action,
          username: username.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error: ' + error
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            🔧 Password Debug Tool
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Fix login issues for users who can't access their accounts
          </p>
        </div>

        {/* Action Selection */}
        <div className={`p-6 rounded-lg border-2 ${
          isDarkMode 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Select Action
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setAction('list-users')}
              className={`p-4 rounded-lg border-2 transition-all ${
                action === 'list-users'
                  ? isDarkMode
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                    : 'bg-blue-50 border-blue-300 text-blue-700'
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-medium">👥 List Users</div>
              <div className="text-sm opacity-75">View all users and their password status</div>
            </button>

            <button
              onClick={() => setAction('fix-user')}
              className={`p-4 rounded-lg border-2 transition-all ${
                action === 'fix-user'
                  ? isDarkMode
                    ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : 'bg-green-50 border-green-300 text-green-700'
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-medium">🔧 Fix Password</div>
              <div className="text-sm opacity-75">Reset a user's password</div>
            </button>

            <button
              onClick={() => setAction('test-login')}
              className={`p-4 rounded-lg border-2 transition-all ${
                action === 'test-login'
                  ? isDarkMode
                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                    : 'bg-orange-50 border-orange-300 text-orange-700'
                  : isDarkMode
                    ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="text-lg font-medium">🧪 Test Login</div>
              <div className="text-sm opacity-75">Test if a password works</div>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`p-6 rounded-lg border-2 ${
          isDarkMode 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {action === 'list-users' && 'List All Users'}
            {action === 'fix-user' && 'Fix User Password'}
            {action === 'test-login' && 'Test User Login'}
          </h2>

          {action !== 'list-users' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {action === 'fix-user' ? 'New Password' : 'Password to Test'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }`}
                  placeholder={action === 'fix-user' ? 'Enter new password' : 'Enter password to test'}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`mt-6 w-full px-4 py-3 rounded-lg font-semibold transition-all ${
              loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 active:scale-95'
            } ${
              isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Execute Action'}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className={`p-6 rounded-lg border-2 ${
            result.success
              ? isDarkMode
                ? 'bg-green-900/20 border-green-500/30'
                : 'bg-green-50 border-green-200'
              : isDarkMode
                ? 'bg-red-900/20 border-red-500/30'
                : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              result.success
                ? isDarkMode ? 'text-green-400' : 'text-green-800'
                : isDarkMode ? 'text-red-400' : 'text-red-800'
            }`}>
              {result.success ? '✅ Success' : '❌ Error'}
            </h3>
            
            <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p className="mb-2">{result.message}</p>
              
              {result.users && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Users ({result.count}):</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {result.users.map((user: any, index: number) => (
                      <div key={index} className={`p-3 rounded border ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                      }`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">{user.username}</span>
                            <span className="text-xs opacity-75 ml-2">({user.name})</span>
                          </div>
                          <div className="text-xs">
                            <span className={`px-2 py-1 rounded ${
                              user.passwordStatus === 'Has Password'
                                ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'
                                : isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.passwordStatus}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs opacity-75 mt-1">
                          Role: {user.role} • Created: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.loginTest && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Login Test Results:</h4>
                  <div className={`p-3 rounded border ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                  }`}>
                    <div className="space-y-1 text-sm">
                      <div>Username: {result.loginTest.username}</div>
                      <div>User Exists: {result.loginTest.userExists ? '✅ Yes' : '❌ No'}</div>
                      <div>Password Match: {result.loginTest.passwordMatch ? '✅ Yes' : '❌ No'}</div>
                      <div>Password Length: {result.loginTest.passwordLength} characters</div>
                    </div>
                  </div>
                </div>
              )}
              
              {result.user && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Updated User:</h4>
                  <div className={`p-3 rounded border ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                  }`}>
                    <div className="space-y-1 text-sm">
                      <div>Name: {result.user.name}</div>
                      <div>Username: {result.user.username}</div>
                      <div>Role: {result.user.role}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className={`p-6 rounded-lg border-2 ${
          isDarkMode 
            ? 'bg-blue-900/20 border-blue-500/30' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>
            📋 How to Fix Login Issues
          </h3>
          <div className={`space-y-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p><strong>Step 1:</strong> Use "List Users" to see all users and their password status</p>
            <p><strong>Step 2:</strong> For users with "No Password" or login issues, use "Fix Password"</p>
            <p><strong>Step 3:</strong> Enter the username and a new password (minimum 6 characters)</p>
            <p><strong>Step 4:</strong> Use "Test Login" to verify the password works</p>
            <p><strong>Step 5:</strong> The user should now be able to login with the new password</p>
          </div>
        </div>
      </div>
    </div>
  );
}

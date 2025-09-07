import React from 'react';
import { escapeHtml } from '../utils/validation';

export default function Profile({ user }) {
  if (!user) {
    return (
      <div className="bg-white shadow rounded p-6 max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <div className="text-center py-4">
          <div className="text-gray-500">Loading profile information...</div>
        </div>
      </div>
    );
  }

  const safeUser = {
    username: user.nickname || user.email?.split('@')[0] || 'N/A',
    name: user.name || user.given_name || user.family_name || 'Not provided',
    email: user.email || 'Not provided',
    contactNumber: user.phone_number || user.contactNumber || 'Not provided',
    country: user.country || user.locale?.split('-')[1]?.toUpperCase() || 'Not provided',
    picture: user.picture || null,
    emailVerified: user.email_verified || false,
    lastLogin: user.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'N/A'
  };

  return (
    <div className="bg-white shadow rounded p-6 max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>
      
      {safeUser.picture && (
        <div className="flex justify-center mb-6">
          <img 
            src={safeUser.picture} 
            alt="Profile"
            className="w-20 h-20 rounded-full border-2 border-gray-200"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <span className="font-medium text-gray-700">Username:</span>
          <span className="text-gray-900 text-right max-w-48 break-words">
            {escapeHtml(safeUser.username)}
          </span>
        </div>
        
        <div className="flex justify-between items-start">
          <span className="font-medium text-gray-700">Full Name:</span>
          <span className="text-gray-900 text-right max-w-48 break-words">
            {escapeHtml(safeUser.name)}
          </span>
        </div>
        
        <div className="flex justify-between items-start">
          <span className="font-medium text-gray-700">Email:</span>
          <span className="text-gray-900 text-right max-w-48 break-words">
            {escapeHtml(safeUser.email)}
            {safeUser.emailVerified && (
              <span className="ml-1 text-green-600 text-sm">✓</span>
            )}
          </span>
        </div>
        
        <div className="flex justify-between items-start">
          <span className="font-medium text-gray-700">Contact Number:</span>
          <span className="text-gray-900 text-right max-w-48 break-words">
            {escapeHtml(safeUser.contactNumber)}
          </span>
        </div>
        
        <div className="flex justify-between items-start">
          <span className="font-medium text-gray-700">Country:</span>
          <span className="text-gray-900 text-right max-w-48 break-words">
            {escapeHtml(safeUser.country)}
          </span>
        </div>

        <div className="flex justify-between items-start pt-2 border-t border-gray-200">
          <span className="font-medium text-gray-700">Last Login:</span>
          <span className="text-gray-500 text-right text-sm">
            {safeUser.lastLogin}
          </span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Profile information is retrieved securely from your identity provider.
        </p>
      </div>
    </div>
  );
}

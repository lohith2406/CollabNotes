import React, { useState, useEffect } from 'react';
import { notes } from '../services/api';

const ShareModal = ({ note, onClose, onUpdate }) => {
  const [email, setEmail] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);

  useEffect(() => {
    if (note && note.sharedWith) {
      setSharedUsers(note.sharedWith);
    }
  }, [note]);

  const handleShare = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await notes.share(note._id, { email, canEdit });
      setEmail('');
      setCanEdit(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share note');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (userId) => {
    try {
      await notes.toggleAccess(note._id, userId);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle access');
    }
  };

  const handleRevokeAccess = async (userId) => {
    if (!window.confirm('Are you sure you want to revoke access?')) {
      return;
    }

    try {
      await notes.revokeAccess(note._id, userId);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke access');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Share Note</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <form onSubmit={handleShare} className="mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="user@example.com"
              />
            </div>
            <div className="flex items-center">
              <input
                id="canEdit"
                type="checkbox"
                checked={canEdit}
                onChange={(e) => setCanEdit(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="canEdit" className="ml-2 block text-sm text-gray-700">
                Can edit
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>

        {sharedUsers.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Shared with</h4>
            <div className="space-y-2">
              {sharedUsers.map((share, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      {share.user?.email || 'Unknown user'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {share.canEdit ? 'Can edit' : 'View only'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleAccess(share.user?._id || share.user)}
                      className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      {share.canEdit ? 'Make view-only' : 'Allow edit'}
                    </button>
                    <button
                      onClick={() => handleRevokeAccess(share.user?._id || share.user)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;


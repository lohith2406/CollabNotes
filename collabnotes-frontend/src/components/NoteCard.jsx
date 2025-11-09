import React from 'react';
import { useNavigate } from 'react-router-dom';

const NoteCard = ({ note, currentUserId, onDelete }) => {
  const navigate = useNavigate();
  const isOwner = note.user?._id?.toString() === currentUserId || note.user?.toString() === currentUserId;
  const isShared = note.sharedWith && note.sharedWith.length > 0;
  const preview = note.content ? (note.content.length > 150 ? note.content.substring(0, 150) + '...' : note.content) : 'No content';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete(note._id);
    }
  };

  return (
    <div
      onClick={() => navigate(`/notes/${note._id}`)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {note.title || 'Untitled Note'}
          </h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-3">{preview}</p>
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-xs text-gray-500">
              {formatDate(note.updatedAt)}
            </span>
            {!isOwner && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Shared
              </span>
            )}
            {isShared && isOwner && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Shared with {note.sharedWith.length}
              </span>
            )}
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="ml-4 text-red-600 hover:text-red-800 p-1"
            title="Delete note"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteCard;


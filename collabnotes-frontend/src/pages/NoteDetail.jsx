import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notes } from '../services/api';
import socketService from '../services/socket';
import NoteEditor from '../components/NoteEditor';
import ShareModal from '../components/ShareModal';
import ActiveUsers from '../components/ActiveUsers';
import Toast from '../components/Toast';

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);
  const contentDebounceRef = useRef(null);
  const titleDebounceRef = useRef(null);
  const socketConnectedRef = useRef(false);

  useEffect(() => {
    // Connect socket
    if (token && !socketConnectedRef.current) {
      socketService.connect(token);
      socketConnectedRef.current = true;
    }

    fetchNote();

    return () => {
      // Leave note room on unmount
      if (id) {
        socketService.leaveNote(id);
      }
    };
  }, [id, token]);

  useEffect(() => {
    if (!note || !socketService.isConnected) return;

    // Join note room
    socketService.joinNote(id);

    // Set up socket listeners
    const handleContentUpdate = (data) => {
      if (data.updatedBy.id !== user.id) {
        setIsRemoteUpdate(true);
        setNote((prev) => ({ ...prev, content: data.content }));
        setTimeout(() => setIsRemoteUpdate(false), 100);
      }
    };

    const handleTitleUpdate = (data) => {
      if (data.updatedBy.id !== user.id) {
        setIsRemoteUpdate(true);
        setNote((prev) => ({ ...prev, title: data.title }));
        setTimeout(() => setIsRemoteUpdate(false), 100);
      }
    };

    const handleError = (error) => {
      setToast({ type: 'error', message: error.message || 'An error occurred' });
    };

    socketService.onContentChange(handleContentUpdate);
    socketService.onTitleChange(handleTitleUpdate);
    socketService.onError(handleError);

    return () => {
      socketService.offContentChange(handleContentUpdate);
      socketService.offTitleChange(handleTitleUpdate);
      socketService.offError(handleError);
    };
  }, [note, id, user]);

  const fetchNote = async () => {
    try {
      const response = await notes.getAll();
      const foundNote = response.data.find((n) => n._id === id);
      if (foundNote) {
        setNote(foundNote);
      } else {
        setToast({ type: 'error', message: 'Note not found' });
        navigate('/');
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load note' });
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = () => {
    if (!note || !user) return { canEdit: false, isOwner: false };

    const isOwner = note.user?._id?.toString() === user.id || note.user?.toString() === user.id;
    const isEditor = note.sharedWith?.some(
      (entry) => (entry.user?._id?.toString() === user.id || entry.user?.toString() === user.id) && entry.canEdit
    );

    return {
      canEdit: isOwner || isEditor,
      isOwner,
    };
  };

  const handleTitleChange = (newTitle) => {
    if (contentDebounceRef.current) {
      clearTimeout(contentDebounceRef.current);
    }

    setSaving(true);
    socketService.emitTitleChange(id, newTitle);

    titleDebounceRef.current = setTimeout(async () => {
      try {
        await notes.update(id, { title: newTitle, content: note.content });
        setSaving(false);
      } catch (err) {
        setSaving(false);
        setToast({ type: 'error', message: 'Failed to save title' });
      }
    }, 1000);
  };

  const handleContentChange = (newContent) => {
    if (contentDebounceRef.current) {
      clearTimeout(contentDebounceRef.current);
    }

    setSaving(true);
    socketService.emitContentChange(id, newContent);

    contentDebounceRef.current = setTimeout(async () => {
      try {
        await notes.update(id, { title: note.title, content: newContent });
        setSaving(false);
      } catch (err) {
        setSaving(false);
        setToast({ type: 'error', message: 'Failed to save content' });
      }
    }, 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await notes.delete(id);
      setToast({ type: 'success', message: 'Note deleted successfully!' });
      navigate('/');
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete note' });
    }
  };

  const handleShareUpdate = () => {
    fetchNote();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">Loading note...</div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  const { canEdit, isOwner } = checkPermissions();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-900 flex items-center"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Notes
        </button>
        <div className="flex items-center space-x-4">
          {saving && (
            <span className="text-sm text-gray-500 flex items-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          )}
          {!saving && note && (
            <span className="text-sm text-green-600">Saved</span>
          )}
          {isOwner && (
            <>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Share
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-4">
        <ActiveUsers socketService={socketService} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <NoteEditor
          title={note.title}
          content={note.content}
          canEdit={canEdit}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          isRemoteUpdate={isRemoteUpdate}
        />
      </div>

      {showShareModal && (
        <ShareModal
          note={note}
          onClose={() => setShowShareModal(false)}
          onUpdate={handleShareUpdate}
        />
      )}
    </div>
  );
};

export default NoteDetail;


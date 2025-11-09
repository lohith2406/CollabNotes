import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notes } from '../services/api';
import NoteCard from '../components/NoteCard';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';

const Dashboard = () => {
  const [noteList, setNoteList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await notes.getAll();
      setNoteList(response.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load notes' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) {
      setToast({ type: 'error', message: 'Please enter a note title' });
      return;
    }

    setCreating(true);
    try {
      const response = await notes.create({
        title: newNoteTitle,
        content: newNoteContent,
      });
      setToast({ type: 'success', message: 'Note created successfully!' });
      setShowCreateModal(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      navigate(`/notes/${response.data._id}`);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to create note' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await notes.delete(noteId);
      setToast({ type: 'success', message: 'Note deleted successfully!' });
      fetchNotes();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to delete note' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">My Notes</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Create Note
        </button>
      </div>

      {noteList.length === 0 ? (
        <EmptyState onCreateNote={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {noteList.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              currentUserId={user?.id}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowCreateModal(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter note title"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content (optional)
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Enter note content"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateNote}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewNoteTitle('');
                    setNewNoteContent('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


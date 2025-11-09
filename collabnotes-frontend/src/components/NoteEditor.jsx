import React, { useState, useEffect, useRef } from 'react';

const NoteEditor = ({ 
  title: initialTitle, 
  content: initialContent, 
  canEdit, 
  onTitleChange, 
  onContentChange,
  isRemoteUpdate = false
}) => {
  const [title, setTitle] = useState(initialTitle || '');
  const [content, setContent] = useState(initialContent || '');
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const isLocalChangeRef = useRef(false);

  useEffect(() => {
    if (!isRemoteUpdate) {
      setTitle(initialTitle || '');
      setContent(initialContent || '');
    }
  }, [initialTitle, initialContent, isRemoteUpdate]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    isLocalChangeRef.current = true;
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    isLocalChangeRef.current = true;
    if (onContentChange) {
      onContentChange(newContent);
    }
  };

  // Apply remote updates
  useEffect(() => {
    if (isRemoteUpdate && !isLocalChangeRef.current) {
      if (initialTitle !== undefined && initialTitle !== title) {
        setTitle(initialTitle);
      }
      if (initialContent !== undefined && initialContent !== content) {
        setContent(initialContent);
      }
    }
    isLocalChangeRef.current = false;
  }, [isRemoteUpdate, initialTitle, initialContent]);

  if (!canEdit) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title || 'Untitled Note'}</h2>
        </div>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{content || 'No content'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title..."
          className="w-full text-2xl font-bold text-gray-900 border-none outline-none focus:ring-0 p-0"
        />
      </div>
      <div>
        <textarea
          ref={contentRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing your note..."
          className="w-full min-h-[400px] text-gray-700 border-none outline-none focus:ring-0 resize-none p-0"
          rows={20}
        />
      </div>
    </div>
  );
};

export default NoteEditor;


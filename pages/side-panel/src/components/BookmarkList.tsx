/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from 'react';
import { FaTrash, FaPen, FaCheck, FaTimes } from 'react-icons/fa';

interface Bookmark {
  id: number;
  title: string;
  content: string;
}

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onBookmarkSelect: (content: string) => void;
  onBookmarkUpdateTitle?: (id: number, title: string) => void;
  onBookmarkDelete?: (id: number) => void;
  onBookmarkReorder?: (draggedId: number, targetId: number) => void;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  onBookmarkSelect,
  onBookmarkUpdateTitle,
  onBookmarkDelete,
  onBookmarkReorder,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditTitle(bookmark.title);
  };

  const handleSaveEdit = (id: number) => {
    if (onBookmarkUpdateTitle && editTitle.trim()) {
      onBookmarkUpdateTitle(id, editTitle);
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    // Add more transparent effect
    e.currentTarget.classList.add('opacity-25');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-25');
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) return;

    if (onBookmarkReorder) {
      onBookmarkReorder(draggedId, targetId);
    }
  };

  // Focus the input field when entering edit mode
  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  return (
    <div className="p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-300">Quick Start</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {bookmarks.map(bookmark => (
          <div
            key={bookmark.id}
            draggable={editingId !== bookmark.id}
            onDragStart={e => handleDragStart(e, bookmark.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, bookmark.id)}
            className="group relative rounded-xl p-4 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200">
            {editingId === bookmark.id ? (
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="mr-2 grow rounded-lg px-3 py-2 text-sm border border-white/20 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-white/30 focus:bg-white/15"
                  placeholder="Enter title..."
                />
                <button
                  onClick={() => handleSaveEdit(bookmark.id)}
                  className="rounded-lg p-2 bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200"
                  aria-label="Save edit"
                  type="button">
                  <FaCheck size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="ml-1 rounded-lg p-2 bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:border-red-500/50 transition-all duration-200"
                  aria-label="Cancel edit"
                  type="button">
                  <FaTimes size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onBookmarkSelect(bookmark.content)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onBookmarkSelect(bookmark.content);
                      }
                    }}
                    className="w-full text-left pr-16">
                    <div className="truncate text-sm font-medium text-white">{bookmark.title}</div>
                  </button>
                </div>
              </>
            )}

            {editingId !== bookmark.id && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                {/* Edit button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleEditClick(bookmark);
                  }}
                  className="rounded-lg p-2 opacity-0 transition-all duration-200 group-hover:opacity-100 bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                  aria-label="Edit bookmark"
                  type="button">
                  <FaPen size={14} />
                </button>

                {/* Delete button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (onBookmarkDelete) {
                      onBookmarkDelete(bookmark.id);
                    }
                  }}
                  className="rounded-lg p-2 opacity-0 transition-all duration-200 group-hover:opacity-100 bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:border-red-500/50"
                  aria-label="Delete bookmark"
                  type="button">
                  <FaTrash size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarkList;

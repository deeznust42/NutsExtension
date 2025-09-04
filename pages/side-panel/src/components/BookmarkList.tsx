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
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Quick Start</h3>
        <p className="text-sm text-gray-400">Choose a common task to get started quickly</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {bookmarks.map(bookmark => (
          <div
            key={bookmark.id}
            draggable={editingId !== bookmark.id}
            onDragStart={e => handleDragStart(e, bookmark.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, bookmark.id)}
            className="group relative rounded-xl p-4 bg-white/8 backdrop-blur-md border border-white/15 hover:bg-white/12 hover:border-white/25 transition-all duration-200 cursor-pointer">
            {editingId === bookmark.id ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="grow rounded-lg px-3 py-2 text-sm border border-white/25 bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-white/15 focus:ring-1 focus:ring-blue-400/30"
                  placeholder="Enter title..."
                />
                <button
                  onClick={() => handleSaveEdit(bookmark.id)}
                  className="rounded-lg p-2 bg-green-500/20 border border-green-500/40 text-green-300 hover:bg-green-500/30 hover:border-green-500/60 transition-all duration-200"
                  aria-label="Save edit"
                  type="button">
                  <FaCheck size={14} />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="rounded-lg p-2 bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:border-red-500/60 transition-all duration-200"
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
                    className="w-full text-left pr-20 group-hover:text-blue-300 transition-colors duration-200">
                    <div className="text-sm font-medium text-white group-hover:text-blue-200 transition-colors duration-200">
                      {bookmark.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-2">{bookmark.content}</div>
                  </button>
                </div>
              </>
            )}

            {editingId !== bookmark.id && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                {/* Edit button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleEditClick(bookmark);
                  }}
                  className="rounded-lg p-2 opacity-0 transition-all duration-200 group-hover:opacity-100 bg-white/10 border border-white/20 text-gray-300 hover:bg-white/20 hover:border-white/30 hover:text-white"
                  aria-label="Edit bookmark"
                  type="button">
                  <FaPen size={12} />
                </button>

                {/* Delete button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (onBookmarkDelete) {
                      onBookmarkDelete(bookmark.id);
                    }
                  }}
                  className="rounded-lg p-2 opacity-0 transition-all duration-200 group-hover:opacity-100 bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:border-red-500/60"
                  aria-label="Delete bookmark"
                  type="button">
                  <FaTrash size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* More prompts button */}
      <div className="mt-4">
        <a
          href="https://github.com/ZaynIkhlaq/DeezNust/blob/main/Prompts.md"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white/90 backdrop-blur-sm transition-colors duration-200 hover:bg-white/15 hover:border-white/30">
          <span>Browse more useful prompts</span>
        </a>
      </div>
    </div>
  );
};

export default BookmarkList;

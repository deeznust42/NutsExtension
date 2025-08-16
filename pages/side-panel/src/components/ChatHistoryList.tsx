/* eslint-disable react/prop-types */
import { FaTrash } from 'react-icons/fa';
import { BsBookmark } from 'react-icons/bs';

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface ChatHistoryListProps {
  sessions: ChatSession[];
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionBookmark: (sessionId: string) => void;
  visible: boolean;
}

const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  sessions,
  onSessionSelect,
  onSessionDelete,
  onSessionBookmark,
  visible,
}) => {
  if (!visible) return null;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Chat History</h2>
      {sessions.length === 0 ? (
        <div className="rounded-lg bg-white/30 text-gray-500 p-4 text-center backdrop-blur-sm">
          No chat history available
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <div
              key={session.id}
              className="group relative rounded-lg bg-white/50 hover:bg-white/70 p-3 backdrop-blur-sm transition-all">
              <button onClick={() => onSessionSelect(session.id)} className="w-full text-left" type="button">
                <h3 className="text-sm font-medium text-gray-900">{session.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{formatDate(session.createdAt)}</p>
              </button>

              {/* Bookmark button - top right */}
              {onSessionBookmark && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onSessionBookmark(session.id);
                  }}
                  className="absolute right-2 top-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 bg-white text-gray-900 hover:bg-gray-100"
                  aria-label="Bookmark session"
                  type="button">
                  <BsBookmark size={14} />
                </button>
              )}

              {/* Delete button - bottom right */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  onSessionDelete(session.id);
                }}
                className="absolute bottom-2 right-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 bg-white text-gray-500 hover:bg-gray-100"
                aria-label="Delete session"
                type="button">
                <FaTrash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistoryList;

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
      <h2 className="mb-4 text-lg font-semibold text-white">Chat History</h2>
      {sessions.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 text-gray-400 p-6 text-center backdrop-blur-md">
          No chat history available
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <div
              key={session.id}
              className="group relative rounded-xl bg-white/5 hover:bg-white/10 p-4 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-200">
              <button onClick={() => onSessionSelect(session.id)} className="w-full text-left" type="button">
                <h3 className="text-sm font-medium text-white">{session.title}</h3>
                <p className="mt-1 text-xs text-gray-400">{formatDate(session.createdAt)}</p>
              </button>

              {/* Bookmark button - top right */}
              {onSessionBookmark && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onSessionBookmark(session.id);
                  }}
                  className="absolute right-12 top-2 rounded-lg p-2 opacity-0 transition-all duration-200 group-hover:opacity-100 bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:border-white/30"
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
                className="absolute right-2 top-2 rounded-lg p-2 opacity-0 transition-all duration-200 group-hover:opacity-100 bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 hover:border-red-500/50"
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

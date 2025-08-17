import type { Message } from '@extension/storage';
import { ACTOR_PROFILES } from '../types/message';
import { memo } from 'react';

interface MessageListProps {
  messages: Message[];
}

export default memo(function MessageList({ messages }: MessageListProps) {
  return (
    <div className="max-w-full space-y-6">
      {messages.map((message, index) => (
        <MessageBlock
          key={`${message.actor}-${message.timestamp}-${index}`}
          message={message}
          isSameActor={index > 0 ? messages[index - 1].actor === message.actor : false}
        />
      ))}
    </div>
  );
});

interface MessageBlockProps {
  message: Message;
  isSameActor: boolean;
}

function MessageBlock({ message, isSameActor }: MessageBlockProps) {
  if (!message.actor) {
    console.error('No actor found');
    return <div />;
  }
  const actor = ACTOR_PROFILES[message.actor as keyof typeof ACTOR_PROFILES];
  const isProgress = message.content === 'Showing progress...';
  const isUser = message.actor === 'user';

  return (
    <div className={`flex max-w-full gap-4 ${!isSameActor ? `mt-6 first:mt-0` : ''}`}>
      {!isSameActor && (
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: actor.iconBackground }}>
          <img src={actor.icon} alt={actor.name} className="size-8" />
        </div>
      )}
      {isSameActor && <div className="w-10" />}

      <div className="min-w-0 flex-1">
        {!isSameActor && <div className="mb-2 text-sm font-semibold text-white opacity-90">{actor.name}</div>}

        <div className="space-y-2">
          <div
            className={`rounded-2xl px-4 py-3 backdrop-blur-md border transition-all duration-200 ${
              isUser ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-gray-200'
            }`}>
            {isProgress ? (
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="animate-progress h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" />
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words text-xs leading-relaxed">{message.content}</div>
            )}
          </div>
          {!isProgress && (
            <div className="text-right text-[10px] text-gray-400 opacity-50">{formatTimestamp(message.timestamp)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Formats a timestamp (in milliseconds) to a readable time string
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted time string
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Check if the message is from today
  const isToday = date.toDateString() === now.toDateString();

  // Check if the message is from yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  // Check if the message is from this year
  const isThisYear = date.getFullYear() === now.getFullYear();

  // Format the time (HH:MM)
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return timeStr; // Just show the time for today's messages
  }

  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }

  if (isThisYear) {
    // Show month and day for this year
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
  }

  // Show full date for older messages
  return `${date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}, ${timeStr}`;
}

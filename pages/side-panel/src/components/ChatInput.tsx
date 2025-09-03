import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FaMicrophone } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { IoSend } from 'react-icons/io5';
import { IoStop } from 'react-icons/io5';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStopTask: () => void;
  onMicClick?: () => void;
  isRecording?: boolean;
  isProcessingSpeech?: boolean;
  disabled: boolean;
  showStopButton: boolean;
  setContent?: (setter: (text: string) => void) => void;
  isFreshChat?: boolean; // New prop to indicate if this is a fresh chat

  // Historical session ID - if provided, shows replay button instead of send button
  historicalSessionId?: string | null;
  onReplay?: (sessionId: string) => void;
}

export default function ChatInput({
  onSendMessage,
  onStopTask,
  onMicClick,
  isRecording = false,
  isProcessingSpeech = false,
  disabled,
  showStopButton,
  setContent,
  isFreshChat = false, // Default to false
  historicalSessionId,
  onReplay,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const isSendButtonDisabled = useMemo(() => disabled || text.trim() === '', [disabled, text]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle text changes and resize textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = isFreshChat ? 120 : 60; // Bigger max height for fresh chat
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  };

  // Expose a method to set content from outside
  useEffect(() => {
    if (setContent) {
      setContent(setText);
    }
  }, [setContent]);

  // Initial resize when component mounts
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = isFreshChat ? 120 : 60; // Bigger max height for fresh chat
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [isFreshChat]); // Add isFreshChat to dependency array

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (text.trim()) {
        onSendMessage(text);
        setText('');
      }
    },
    [text, onSendMessage],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  const handleReplay = useCallback(() => {
    if (historicalSessionId && onReplay) {
      onReplay(historicalSessionId);
    }
  }, [historicalSessionId, onReplay]);

  return (
    <form
      onSubmit={handleSubmit}
      className={`overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 ${
        isFreshChat
          ? 'border-white/20 bg-white/8 shadow-lg' // More prominent for fresh chat
          : ''
      } ${
        disabled
          ? 'cursor-not-allowed opacity-50'
          : 'focus-within:border-white/20 focus-within:bg-white/10 hover:border-white/15 hover:bg-white/8'
      }`}
      aria-label="Chat input form">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-disabled={disabled}
          rows={isFreshChat ? 3 : 1} // More rows for fresh chat
          className={`w-full resize-none border-none bg-transparent p-3 pr-16 text-white placeholder-gray-400 focus:outline-none text-sm ${
            disabled ? 'cursor-not-allowed' : ''
          }`}
          placeholder={isFreshChat ? 'What can I help you with?' : 'What can I help you with?'}
          aria-label="Message input"
        />

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {onMicClick && (
            <button
              type="button"
              onClick={onMicClick}
              disabled={disabled || isProcessingSpeech}
              aria-label={
                isProcessingSpeech ? 'Processing speech...' : isRecording ? 'Stop recording' : 'Start voice input'
              }
              className={`rounded-lg p-1.5 transition-all duration-200 ${
                disabled || isProcessingSpeech
                  ? 'cursor-not-allowed opacity-50'
                  : isRecording
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'hover:bg-white/10 text-gray-400 hover:text-white'
              }`}>
              {isProcessingSpeech ? (
                <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin" />
              ) : (
                <FaMicrophone className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
              )}
            </button>
          )}

          {showStopButton ? (
            <button
              type="button"
              onClick={onStopTask}
              className="rounded-lg bg-red-800/90 border border-red-600/50 px-4 py-2 text-red-100 font-semibold text-sm hover:bg-red-800 hover:border-red-500 transition-colors">
              <IoStop className="h-4 w-4" />
            </button>
          ) : historicalSessionId ? (
            <button
              type="button"
              onClick={handleReplay}
              disabled={!historicalSessionId}
              aria-disabled={!historicalSessionId}
              className={`rounded-lg bg-green-500/20 border border-green-500/30 px-3 py-1.5 text-green-300 transition-all duration-200 hover:bg-green-500/30 hover:border-green-500/50 text-sm ${
                !historicalSessionId ? 'cursor-not-allowed opacity-50' : ''
              }`}>
              Replay
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSendButtonDisabled}
              aria-disabled={isSendButtonDisabled}
              className={`rounded-lg bg-white/20 border border-white/30 px-3 py-1.5 text-white transition-all duration-200 hover:bg-white/30 hover:border-white/40 hover:scale-105 text-sm font-medium ${
                isSendButtonDisabled ? 'cursor-not-allowed opacity-50' : ''
              }`}>
              <IoSend className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

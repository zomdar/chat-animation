'use client';
import { ChangeEvent, KeyboardEvent, useRef } from "react";
import { FiArrowUp, FiLoader } from "react-icons/fi";
import styles from "./styles.module.css";

interface ChatInputProps {
  message: string;
  loading: boolean;
  onMessageChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
}

export const ChatInput = ({
  message,
  loading,
  onMessageChange,
  onSendMessage,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const isDisabled = loading || !message.trim();

  return (
    <div className={styles.chatInputContainer}>
      <textarea
        ref={inputRef}
        value={message}
        onChange={onMessageChange}
        onKeyPress={handleKeyPress}
        className={styles.chatInput}
        placeholder={loading ? "AI is thinking..." : "Send a message"}
        rows={1}
        disabled={loading}
      />
      <button
        onClick={onSendMessage}
        className={`${styles.chatSendButton} ${
          !isDisabled ? styles.chatSendButtonActive : ""
        } ${loading ? styles.loading : ""}`}
        disabled={isDisabled}
        aria-label={loading ? "AI is processing" : "Send message"}
      >
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSquare} />
            <FiLoader className={styles.loadingIcon} />
          </div>
        ) : (
          <FiArrowUp className={styles.sendIcon} />
        )}
      </button>
    </div>
  );
};
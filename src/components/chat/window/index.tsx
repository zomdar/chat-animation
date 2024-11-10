'use client';

import { ChatMessage } from "../message";
import { ChatInput } from "../input";
import { LoadingIndicator } from "../loading";
import { useChat } from "@/hooks/use-chat";
import styles from "./styles.module.css";

export const ChatWindow = () => {
  const {
    message,
    loading,
    chatHistory,
    responses,
    bottomOfChatRef,
    handleMessageChange,
    handleSendMessage,
  } = useChat();

  return (
    <div className={styles.chatContainer}>
      <ul className={styles.chatMessages}>
        {chatHistory.map((item) => (
          <ChatMessage
            key={item.id}
            message={item}
            response={responses.find((resp) => resp.id === item.id)}
          />
        ))}
        {loading && <LoadingIndicator />}
        <div ref={bottomOfChatRef} />
      </ul>

      <ChatInput
        message={message}
        loading={loading}
        onMessageChange={handleMessageChange}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

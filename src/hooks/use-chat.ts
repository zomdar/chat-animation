'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, ResponseStream } from '@/components/chat/types';
import { getSocket } from '@/lib/socket';

const INITIAL_MESSAGE: Message = {
  id: uuidv4(),
  type: 'system',
  text: "Hello, I'm Franklin and I'm here to help you with anything, start by asking a question!",
};

export const useChat = () => {
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState<ResponseStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([INITIAL_MESSAGE]);
  
  const streamTimeoutRef = useRef<NodeJS.Timeout[]>([]);
  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  const cleanupTimeouts = () => {
    streamTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    streamTimeoutRef.current = [];
  };

  useEffect(() => {
    const handleChatResponse = (response: string) => {
      const messageId = uuidv4();
      const words = response.split(" ");

      setLoading(false);
      setChatHistory(prev => [...prev, { 
        id: messageId, 
        type: 'system', 
        text: response,
      }]);

      setResponses(prev => [...prev, { id: messageId, words, visibleCount: 0 }]);

      cleanupTimeouts();

      const timeouts = words.map((_, index) => {
        return setTimeout(() => {
          setResponses(prev =>
            prev.map(resp =>
              resp.id === messageId
                ? { ...resp, visibleCount: index + 1 }
                : resp
            )
          );
        }, index * 50);
      });

      streamTimeoutRef.current = timeouts;
    };

    socket.on("chat response", handleChatResponse);
    return () => {
      socket.off("chat response", handleChatResponse);
      cleanupTimeouts();
    };
  }, []);

  useEffect(() => {
    bottomOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, responses]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessageId = uuidv4();
    setLoading(true);
    setChatHistory(prev => [...prev, { id: userMessageId, type: 'user', text: message }]);
    socket.emit("chat message", message);
    setMessage("");
  };

  return {
    message,
    loading,
    chatHistory,
    responses,
    bottomOfChatRef,
    handleMessageChange,
    handleSendMessage
  };
};
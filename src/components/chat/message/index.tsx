import React, { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, ResponseStream } from "../types";
import { motion } from 'framer-motion';
import styles from './styles.module.css';
import remarkGfm from 'remark-gfm';

// Define interface for markdown component props
interface MarkdownComponentProps {
  children: ReactNode;
}

const MarkdownComponents = {
  p: ({ children }: MarkdownComponentProps) => (
    <motion.p
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.paragraph}
    >
      {children}
    </motion.p>
  ),
  
  blockquote: ({ children }: MarkdownComponentProps) => (
    <motion.blockquote
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.blockquote}
    >
      {children}
    </motion.blockquote>
  ),
  
  h1: ({ children }: MarkdownComponentProps) => (
    <motion.h1
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={styles.heading1}
    >
      {children}
    </motion.h1>
  ),
  
  h2: ({ children }: MarkdownComponentProps) => (
    <motion.h2
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={styles.heading2}
    >
      {children}
    </motion.h2>
  ),
  
  h3: ({ children }: MarkdownComponentProps) => (
    <motion.h3
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={styles.heading3}
    >
      {children}
    </motion.h3>
  ),

  strong: ({ children }: MarkdownComponentProps) => (
    <strong className={styles.strong}>{children}</strong>
  ),

  em: ({ children }: MarkdownComponentProps) => (
    <em className={styles.emphasis}>{children}</em>
  ),

  ul: ({ children }: MarkdownComponentProps) => (
    <ul className={styles.unorderedList}>{children}</ul>
  ),

  ol: ({ children }: MarkdownComponentProps) => (
    <ol className={styles.orderedList}>{children}</ol>
  ),

  li: ({ children }: MarkdownComponentProps) => (
    <li className={styles.listItem}>{children}</li>
  ),
};

interface ChatMessageProps {
  message: Message;
  response?: ResponseStream;
  isComplete?: boolean;
}

export const ChatMessage = ({ 
  message, 
  response, 
  isComplete = true 
}: ChatMessageProps) => {
  const isUser = message.type === "user";
  const name = isUser ? "You" : "Franklin";
  
  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={styles.messageContainer}
    >
      <span className={styles.userName}>{name}</span>
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        className={`${styles.messageContent} ${
          isUser ? styles.userMessage : styles.botMessage
        }`}
      >
        <div className={styles.markdownContent}>
          {response ? (
            <div className={styles.streamingResponse}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
              >
                {response.words.slice(0, response.visibleCount).join(" ")}
              </ReactMarkdown>
              {!isComplete && <span className={styles.cursor} />}
            </div>
          ) : (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
            >
              {message.text}
            </ReactMarkdown>
          )}
        </div>
      </motion.div>
    </motion.li>
  );
};

export default ChatMessage;
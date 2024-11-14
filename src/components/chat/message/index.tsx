import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Message, ResponseStream } from "../types";
import { motion, Variants, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import styles from './styles.module.css';
import remarkGfm from 'remark-gfm';

// Animation variants
const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

// Animation variants
const messageVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// This function will process text nodes recursively
const processNode = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(processNode).join(' ');
  if (React.isValidElement(node)) {
    return processNode(node.props.children);
  }
  return '';
};

const AnimatedText = ({ children }: { children: React.ReactNode }) => {
  const text = processNode(children);
  
  return (
    <>
      {text.split(' ').map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: i * 0.03,
            ease: "easeOut"
          }}
          style={{ 
            display: 'inline-block', 
            marginRight: '8px',
            whiteSpace: 'pre-wrap'
          }}
        >
          {word}
        </motion.span>
      ))}
    </>
  );
};

const MarkdownComponents: Partial<Components> = {
  p: ({ children }) => (
    <p className={styles.paragraph}>
      <AnimatedText>{children}</AnimatedText>
    </p>
  ),

  li: ({ children, ...props }) => {
    return (
      <motion.li
        variants={listItemVariants}
        className={styles.listItem}
      >
        <AnimatedText>{children}</AnimatedText>
      </motion.li>
    );
  },

  ol: ({ children }) => (
    <motion.ol
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className={styles.orderedList}
    >
      {children}
    </motion.ol>
  ),

  ul: ({ children }) => (
    <motion.ul
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className={styles.unorderedList}
    >
      {children}
    </motion.ul>
  ),

  strong: ({ children }) => (
    <strong className={styles.strong}>
      <AnimatedText>{children}</AnimatedText>
    </strong>
  ),

  em: ({ children }) => (
    <em className={styles.emphasis}>
      <AnimatedText>{children}</AnimatedText>
    </em>
  ),

  h1: ({ children }) => (
    <h1 className={styles.heading1}>
      <AnimatedText>{children}</AnimatedText>
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className={styles.heading2}>
      <AnimatedText>{children}</AnimatedText>
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className={styles.heading3}>
      <AnimatedText>{children}</AnimatedText>
    </h3>
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
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={styles.messageContainer}
    >
      <span className={styles.userName}>
        {name}
      </span>
      <div
        className={`${styles.messageContent} ${
          isUser ? styles.userMessage : styles.botMessage
        }`}
      >
        <div className={styles.markdownContent}>
          {response ? (
            <div className={styles.streamingResponse}>
              <ReactMarkdown 
                components={MarkdownComponents}
                remarkPlugins={[remarkGfm]}
              >
                {response.words.slice(0, response.visibleCount).join(" ")}
              </ReactMarkdown>
              {!isComplete && <span className={styles.cursor} />}
            </div>
          ) : (
            <ReactMarkdown 
              components={MarkdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {message.text}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </motion.li>
  );
};

export default ChatMessage;
"use client";

import { useEffect, useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend } from "react-icons/fi";
import styles from "./chat.module.css";

const socket = io(process.env.NEXT_PUBLIC_OPENAI_URL || "");

interface ResponseWord {
  id: string;
  words: string[];
  visibleCount: number;
}

const loaderVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.3,
      duration: 0.5,
    },
  }),
};

const parseResponseText = (text: string): JSX.Element[] => {
  const elements: JSX.Element[] = [];
  const lines = text.split('\n');
  
  let currentList: JSX.Element[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const addList = () => {
    if (listType === 'ul') {
      elements.push(<ul key={elements.length}>{currentList}</ul>);
    } else if (listType === 'ol') {
      elements.push(<ol key={elements.length}>{currentList}</ol>);
    }
    currentList = [];
    listType = null;
  };

  lines.forEach((line, index) => {
    if (line.startsWith('- ')) {
      if (listType === 'ol') addList();
      listType = 'ul';
      currentList.push(<li key={index}>{line.substring(2)}</li>);
    } else if (/^\d+\. /.test(line)) {
      if (listType === 'ul') addList();
      listType = 'ol';
      currentList.push(<li key={index}>{line.substring(line.indexOf('.') + 2)}</li>);
    } else {
      if (listType) addList();
      elements.push(<p key={index}>{line}</p>);
    }
  });

  if (listType) addList();
  return elements;
};

const Chat = () => {
  const [message, setMessage] = useState<string>("");
  const [responses, setResponses] = useState<ResponseWord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLines, setLoadingLines] = useState<number[]>([]);
  const [chatHistory, setChatHistory] = useState<{ id: string; type: string; text: string }[]>([
    { id: uuidv4(), type: "system", text: "Hello, I’m Franklin and I’m here to help you with anything, start by asking a question!" }
  ]);

  const bottomOfChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, responses]);

  useEffect(() => {
    const handleChatResponse = (response: string) => {
      setLoading(false);
      setLoadingLines([]);
      const messageId = uuidv4();
      const words = response.split(" ");

      setResponses((prevResponses) => [
        ...prevResponses,
        { id: messageId, words, visibleCount: 0 },
      ]);

      setChatHistory((prev) => [...prev, { id: messageId, type: "system", text: response }]);

      words.forEach((_, index) => {
        setTimeout(() => {
          setResponses((prevResponses) =>
            prevResponses.map((resp) =>
              resp.id === messageId ? { ...resp, visibleCount: index + 1 } : resp
            )
          );
        }, (index + 1) * 100);
      });
    };

    socket.on("chat response", handleChatResponse);

    return () => {
      socket.off("chat response", handleChatResponse);
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== "") {
      const userMessageId = uuidv4();
      setLoading(true);
      setLoadingLines([0, 1, 2]);
      setChatHistory((prev) => [...prev, { id: userMessageId, type: "user", text: message }]);
      socket.emit("chat message", message);
      setMessage("");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const triggerLoader = () => {
    setLoading(true);
    setLoadingLines([0, 1, 2]);
  };

  return (
    <div className={styles.chatContainer}>
      <ul className={styles.chatMessages}>
        {chatHistory.map((item) => {
          const response = responses.find(resp => resp.id === item.id);
          return (
            <li key={item.id} className={`${styles.chatMessage} ${styles[`${item.type}Message`]}`}>
              <span className={styles.chatName}>{item.type === "user" ? "You" : "Franklin"}</span>
              <div className={`${styles.turtleChat} ${styles[`${item.type}Chat`]}`}>
                {response ? (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={loaderVariants}
                    className={styles.chatText}
                  >
                    {response.words.slice(0, response.visibleCount).join(" ")}
                  </motion.div>
                ) : (
                  <div className={styles.chatText}>{parseResponseText(item.text)}</div>
                )}
              </div>
            </li>
          );
        })}
        <AnimatePresence>
          {loadingLines.map((line, index) => (
            <motion.li
              key={index}
              className={styles.chatMessage}
              initial="hidden"
              animate="visible"
              exit="hidden"
              custom={index}
              variants={loaderVariants}
            >
              <div
                className={`${styles.skeletonLoader} ${styles.skeletonLoaderVisible}`}
                style={{ animationDelay: `${index * 0.3}s` }}
              ></div>
            </motion.li>
          ))}
        </AnimatePresence>
        <div ref={bottomOfChatRef} />
      </ul>
      <div className={styles.chatInputContainer}>
        <input
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          className={styles.chatInput}
          placeholder="Send Message"
        />
        <button onClick={sendMessage} className={styles.chatSendButton}>
          <FiSend />
        </button>
      </div>
    </div>
  );
};

export default Chat;

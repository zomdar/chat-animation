"use client";

import { useEffect, useState, ChangeEvent, KeyboardEvent } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowUp, FiSend } from "react-icons/fi"; // Import the send icon from react-icons
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

const Chat = () => {
  const [message, setMessage] = useState<string>("");
  const [responses, setResponses] = useState<ResponseWord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLines, setLoadingLines] = useState<number[]>([]);

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

      words.forEach((_, index) => {
        setTimeout(() => {
          setResponses((prevResponses) =>
            prevResponses.map((resp) =>
              resp.id === messageId
                ? { ...resp, visibleCount: index + 1 }
                : resp
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
      setLoading(true);
      setLoadingLines([0, 1, 2]); // Set 3 lines of loaders
      socket.emit("chat message", message);
      setMessage("");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const triggerLoader = () => {
    setLoading(true);
    setLoadingLines([0, 1, 2]); // Set 3 lines of loaders
  };

  return (
    <div className={styles.chatContainer}>
      <ul className={styles.chatMessages}>
        {responses.map((response) => (
          <li key={response.id} className={styles.chatMessage}>
            {response.words
              .slice(0, response.visibleCount)
              .map((word, wordIndex) => (
                <span
                  key={`${response.id}-${wordIndex}`}
                  className={styles.chatWord}
                >
                  {word}
                </span>
              ))}
          </li>
        ))}
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
          <FiArrowUp />
        </button>
        {/* <button onClick={triggerLoader} className={styles.chatSendButton}>
          Test Loader
        </button> */}
      </div>
    </div>
  );
};

export default Chat;

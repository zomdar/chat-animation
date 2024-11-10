import { Message, ResponseStream } from "../types";
import ReactMarkdown from "react-markdown";
import styles from "./styles.module.css";

interface ChatMessageProps {
  message: Message;
  response?: ResponseStream;
}

export const ChatMessage = ({ message, response }: ChatMessageProps) => {
  return (
    <li className={`${styles.chatMessage} ${styles[`${message.type}Message`]}`}>
      <span className={styles.chatName}>
        {message.type === "user" ? "You" : "Franklin"}
      </span>
      <div className={`${styles.turtleChat} ${styles[`${message.type}Chat`]}`}>
        <div className={styles.chatText}>
          {response ? (
            response.words.slice(0, response.visibleCount).join(" ")
          ) : (
            <ReactMarkdown>{message.text}</ReactMarkdown>
          )}
        </div>
      </div>
    </li>
  );
};

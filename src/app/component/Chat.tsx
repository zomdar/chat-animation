"use client";

import { useEffect, useState, ChangeEvent } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

// Assuming NEXT_PUBLIC_OPENAI_URL is correctly set in your .env file
const socket = io(process.env.NEXT_PUBLIC_OPENAI_URL || "");

interface ResponseWord {
  id: string;
  words: string[];
  visibleCount: number;
}

function Chat() {
  const [message, setMessage] = useState<string>("");
  const [responses, setResponses] = useState<ResponseWord[]>([]);

  useEffect(() => {
    const handleChatResponse = (response: string) => {
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
    socket.emit("chat message", message);
    setMessage("");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {responses.map((response) => (
          <li
            key={response.id}
            style={{
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "5px",
              wordWrap: "break-word",
              maxWidth: "100%",
            }}
          >
            {response.words
              .slice(0, response.visibleCount)
              .map((word, wordIndex) => (
                <span key={`${response.id}-${wordIndex}`} style={{ marginRight: "4px" }}>
                  {word}
                </span>
              ))}
          </li>
        ))}
      </ul>
      <input
        value={message}
        onChange={handleChange}
        style={{ width: "100%", marginBottom: "10px", padding: "10px", boxSizing: "border-box" }}
      />
      <button
        onClick={sendMessage}
        style={{ width: "100%", padding: "10px", boxSizing: "border-box", cursor: "pointer" }}
      >
        Send
      </button>
    </div>
  );
}

export default Chat;

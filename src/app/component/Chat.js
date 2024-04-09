"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const socket = io("http://localhost:3000");

function Chat() {
  const [message, setMessage] = useState("");
  // This state now holds objects with an id, words array, and a count of how many words should be shown
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const handleChatResponse = (response) => {
      const messageId = uuidv4();
      const words = response.split(" ");
      
      // Add the new message with all words hidden initially
      setResponses(prevResponses => [...prevResponses, { id: messageId, words, visibleCount: 0 }]);

      // Incrementally reveal each word
      words.forEach((_, index) => {
        setTimeout(() => {
          setResponses(prevResponses => prevResponses.map(resp => {
            if (resp.id === messageId) {
              return { ...resp, visibleCount: index + 1 };
            }
            return resp;
          }));
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

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {responses.map((response, index) => (
          <li key={response.id} style={{ marginBottom: "10px", padding: "10px", borderRadius: "5px", wordWrap: "break-word", maxWidth: "100%", }}>
            {response.words.slice(0, response.visibleCount).map((word, wordIndex) => (
              <span key={`${response.id}-${wordIndex}`} style={{ marginRight: "4px" }}>{word}</span>
            ))}
          </li>
        ))}
      </ul>
      <input value={message} onChange={(e) => setMessage(e.target.value)} style={{ width: "100%", marginBottom: "10px", padding: "10px", boxSizing: "border-box" }} />
      <button onClick={sendMessage} style={{ width: "100%", padding: "10px", boxSizing: "border-box", cursor: "pointer" }}>Send</button>
    </div>
  );
}

export default Chat;

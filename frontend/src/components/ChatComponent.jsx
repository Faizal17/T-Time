import React, { useState, useEffect, useCallback, useRef } from "react";

const ChatComponent = ({ chat, userData, selectedOption }) => {
  const [className, setClassName] = useState("");
  useEffect(() => {
    if (chat.senderId === userData.id) {
      setClassName("ms-auto me-3");
    } else {
      setClassName("me-auto ms-3");
    }
  }, []);
  return (
    <div
      className={`card ${className} mt-3 mb-3`}
      style={{ maxWidth: "18rem" }}
    >
      <div className="card-body">
        <p className="card-text">{chat[`chat${selectedOption}`]}</p>
      </div>
      <div className="card-footer text-body-secondary text-end">
        Sent by {chat.name}
      </div>
    </div>
  );
};

export default ChatComponent;

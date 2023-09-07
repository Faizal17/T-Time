import React, { createContext, useEffect, useState } from "react";
import AWS from "aws-sdk";

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const secretName = "MyWebSocketApi";
      const region = "us-east-1";
      const accessKeyId = "ASIA4PYA3HA3XXIKZ37Z";
      const secretAccessKey = "3aTl/Dz4w0paJ2vbcn54/AtqeijyhxFYfJiI7z7P";
      const sessionToken =
        "FwoGZXIvYXdzEE8aDEEtnKGshMKyXPQ+CyLAAbCRB5L/3bGxKxUFnF98X8mWGiQ2uU3zxrYfzHgKK0gI5jfB+wbO+n+Mb4r7ZYPEYtXY1jfDoobbijuKpeAc6wrfi4fwCjJlm6XPWkqzR5vGroT7f2NOGgbCaCcngevhkmX3qQsaGzkiXMBrk2lv+yNJZ94etUL//6jQNJgk2FMM0zF5xaMq75/g1HKuy5mgkdaY8mCSwbRLcgR5fLckC0d8XnvkkRmQf2Mf8gNhN4FwybmWM3HFXYTkLQ0AQF4m0iiFiqSmBjIt54ieTF0Jg1GbSQ/QVxL0RyLAcFF4KZ7j1mj+PvhezJU4/ofMKJ8Qb2J78QjV";
      AWS.config.update({
        accessKeyId,
        secretAccessKey,
        region,
        sessionToken,
      });

      const secretsManager = new AWS.SecretsManager();
      let api = "";
      try {
        const secretDataResponse = await secretsManager
          .getSecretValue({ SecretId: secretName })
          .promise();
        const secretValue = JSON.parse(secretDataResponse.SecretString);
        api = secretValue.ApiId;
        const newSocket = new WebSocket(
          "wss://" + api + ".execute-api.us-east-1.amazonaws.com/production"
        );

        setSocket(newSocket);

        return () => {
          newSocket.close();
        };
      } catch (error) {
        console.error("Error fetching secret:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;

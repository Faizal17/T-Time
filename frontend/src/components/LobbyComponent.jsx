import React, { useContext, useEffect } from "react";
import WebSocketContext from "./WebSocketContext";
import { Button } from "bootstrap";

const LobbyComponent = ({
  addOneMember,
  lobbyMembers,
  addToast,
  setGameDetails,
  gameDetails,
  removeOneMember,
  userData,
  setGameStarted,
  setSelector,
}) => {
  const socket = useContext(WebSocketContext);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.origin === "newPlayerConnect") {
          if (message.newPlayer.id !== userData.id) {
            addOneMember(message.newPlayer);
            addToast("Success", "Success", message.message);
          }
        }

        if (message.origin === "disconnect") {
          removeOneMember(message.removedUser);
          addToast("Secondary", "User Left", message.message);
        }

        if (message.origin === "startGame") {
          setGameDetails(message.gameDetails);
          setSelector(message.selector);
          setGameStarted(true);
          addToast("Success", "Game started", message.message);
        }

        if (message.origin === "error") {
          addToast("Danger", "Error", message.message);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }
  }, [socket]);

  function startGame() {
    try {
      socket.send(
        JSON.stringify({
          action: "startGame",
          gameId: gameDetails.id,
        })
      );
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div>
      <h3 className="text-center mt-3">
        Share this code to invite other people: {gameDetails.id}
      </h3>
      <table className="stat mx-auto mt-5">
        <thead>
          <tr style={{ textAlign: "center" }}>
            <th>Sr. No.</th>
            <th>Connection Id</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {lobbyMembers != null ? (
            Object.keys(lobbyMembers).map((id, index) => (
              <tr key={id} style={{ textAlign: "center" }}>
                <td>{index + 1}</td>
                <td>{lobbyMembers[id].id}</td>
                <td>{lobbyMembers[id].name}</td>
              </tr>
            ))
          ) : (
            <></>
          )}
        </tbody>
      </table>
      {gameDetails.creatorId === userData.id ? (
        <div className="col-12 text-center mt-5">
          <div className="btn btn-primary text-center" onClick={startGame}>
            Start Game
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default LobbyComponent;

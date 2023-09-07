import React, { useContext, useEffect, useState } from "react";
import WebSocketContext from "./WebSocketContext";

const HomePage = ({
  setUserData,
  setInLobby,
  addToast,
  setAllMembers,
  setGameDetails,
}) => {
  const socket = useContext(WebSocketContext);
  const [inputValue, setInputValue] = useState("");
  const [inputRoundValue, setInputRoundValue] = useState(1);
  const [name, setName] = useState("");

  useEffect(() => {
    let enteredName = "";

    while (enteredName === "" || enteredName === null || !enteredName.trim()) {
      enteredName = prompt("Please enter your name:");
    }

    setName(enteredName);
  }, []);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.origin === "connect") {
          setUserData(message.newPlayer);
          setAllMembers(message.totalPlayers);
          setGameDetails(message.gameDetails);
          setInLobby(true);
          addToast(
            "Success",
            "Success",
            "You have successfully joined the lobby."
          );
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

  function createLobby() {
    try {
      if (inputRoundValue < 1) {
        addToast("Danger", "Error", "Number of rounds should be atleast 1");
        return;
      }
      socket.send(
        JSON.stringify({
          action: "createLobby",
          totalRound: inputRoundValue,
          name: name,
        })
      );
    } catch (err) {
      console.log(err);
    }
  }

  function joinLobby() {
    try {
      socket.send(
        JSON.stringify({
          action: "joinLobby",
          gameId: inputValue,
          name: name,
        })
      );
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <React.Fragment>
      <div className="row">
        <h1 className="my-5 text-center">T-Time</h1>
        <div className="mb-5 text-center">
          Welcome <b>{name}</b>. Please select one of the options
        </div>
        <div className="col-6 mx-auto input-group" style={{ width: "50%" }}>
          <input
            className="me-3 form-control"
            type="number"
            value={inputRoundValue}
            onChange={(e) => setInputRoundValue(e.target.value)}
            placeholder="Number of Rounds"
          />
          <div className="btn btn-primary" onClick={createLobby}>
            Create Lobby
          </div>
        </div>
        <div className="col-12 text-center my-5">OR</div>
        <div className="col-6 mx-auto input-group" style={{ width: "50%" }}>
          <input
            className="me-3 form-control"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Lobby Code"
          />
          <div className="btn btn-primary" onClick={joinLobby}>
            Join Lobby
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default HomePage;

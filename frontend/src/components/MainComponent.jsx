import React, { useState, useEffect, useCallback, useRef } from "react";
import { WebSocketProvider } from "./WebSocketContext";
import HomePage from "./HomePage";
import LobbyComponent from "./LobbyComponent";
import ToastContainer from "react-bootstrap/ToastContainer";
import BootstrapToast from "./toasts";
import GameComponent from "./GameComponent";
import LeaderboardComponenet from "./Leaderboard";
import ChatRoom from "./ChatComponent";
import EndComponent from "./EndComponent";

const MainComponent = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [inLobby, setInLobby] = useState(false);
  const [userData, setUserData] = useState({});
  const [toasts, setToasts] = useState([]);
  const [gameDetails, setGameDetails] = useState({});
  const [selector, setSelector] = useState({});
  const [lobbyMembers, setLobbyMembers] = useState([]);

  const setAllMembers = (totalPlayers) => {
    const objectData = totalPlayers.reduce((acc, obj) => {
      acc[obj.id] = obj;
      return acc;
    }, {});
    setLobbyMembers(objectData);
  };

  const updateLobbyMembers = (newPlayer) => {
    let newLobbyMembers = lobbyMembers;
    newLobbyMembers[newPlayer.id] = newPlayer;
    setLobbyMembers(newLobbyMembers);
  };

  const addOneMember = (newPlayer) => {
    let newLobbyMembers = lobbyMembers;
    newLobbyMembers[newPlayer.id] = newPlayer;
    setLobbyMembers(newLobbyMembers);
  };

  const removeOneMember = (newPlayer) => {
    let newLobbyMembers = lobbyMembers;
    delete newLobbyMembers[newPlayer.id];
    setLobbyMembers(newLobbyMembers);
  };

  // Function to add a new toast
  const addToast = (variant, title, body) => {
    const newToast = {
      id: Math.random(),
      Component: BootstrapToast,
      variant: variant,
      title: title,
      body: body,
    };

    setToasts((prevState) => [...prevState, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prevState) => prevState.filter((toast) => toast.id !== id));
  };

  return (
    <React.Fragment>
      {!inLobby && !gameStarted ? (
        <HomePage
          setUserData={setUserData}
          setInLobby={setInLobby}
          addToast={addToast}
          setAllMembers={setAllMembers}
          setGameDetails={setGameDetails}
        ></HomePage>
      ) : !gameStarted ? (
        <LobbyComponent
          addOneMember={addOneMember}
          lobbyMembers={lobbyMembers}
          addToast={addToast}
          setGameDetails={setGameDetails}
          gameDetails={gameDetails}
          removeOneMember={removeOneMember}
          userData={userData}
          setGameStarted={setGameStarted}
          setSelector={setSelector}
        ></LobbyComponent>
      ) : gameStarted && !gameFinished ? (
        <GameComponent
          selector={selector}
          userData={userData}
          lobbyMembers={lobbyMembers}
          setGameDetails={setGameDetails}
          addToast={addToast}
          addOneMember={addOneMember}
          setSelector={setSelector}
          setGameFinished={setGameFinished}
        ></GameComponent>
      ) : (
        <EndComponent
          lobbyMembers={lobbyMembers}
          gameDetails={gameDetails}
          addToast={addToast}
        ></EndComponent>
      )}
      <ToastContainer className="position-fixed top-0 end-0 p-3">
        {toasts.map(({ id, Component, variant, title, body }) => (
          <Component
            key={id}
            variant={variant}
            title={title}
            body={body}
            handleRemove={() => removeToast(id)}
          />
        ))}
      </ToastContainer>
    </React.Fragment>
  );
};

export default MainComponent;

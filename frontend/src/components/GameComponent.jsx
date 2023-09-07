import React, { useState, useEffect, useCallback, useRef } from "react";
import GuessesComponent from "./GuessesComponent";
import TComponent from "./TComponent";
import LeaderboardChatComponenet from "./LeaderboardChatComponent";

const GameComponent = ({
  selector,
  userData,
  lobbyMembers,
  setGameDetails,
  addToast,
  addOneMember,
  setSelector,
  setGameFinished,
}) => {
  const [guesses, setGuesses] = useState({});
  const [chats, setChats] = useState([]);
  const [updateKey, setUpdateKey] = useState(Date.now());

  function setGuessesFunction(guessObj, emptyGuess) {
    if (emptyGuess) {
      setGuesses({});
    } else {
      setGuesses({ ...guessObj });
    }
  }

  function setChatsFunction(chatArr) {
    setChats([...chatArr]);
  }

  useEffect(() => {
    setUpdateKey(Date.now());
  }, [guesses]);

  function updateGuess(guessId, guessStatus) {
    let newGuesses = guesses;
    let newGuess = newGuesses[guessId];
    if (guessStatus) {
      newGuess.variant = "success";
    } else {
      newGuess.variant = "danger";
    }
    newGuesses[guessId] = newGuess;
    setGuesses({ ...newGuesses });
  }

  return (
    <React.Fragment>
      <div style={{ height: "100vh", overflowY: "auto" }}>
        <h1 className="text-center my-2">T-Time</h1>
        <hr />
        <div className="px-4">
          <div className="row pt-5 p-0 m-0 gx-5">
            <div
              className="col-3 noScrollBar border"
              style={{
                height: "80vh",
                overflowY: "auto",
              }}
            >
              <GuessesComponent
                selector={selector}
                userData={userData}
                addToast={addToast}
                guesses={guesses}
              ></GuessesComponent>
            </div>
            <div className="col-5 my-auto">
              <TComponent
                selector={selector}
                userData={userData}
                addToast={addToast}
                setGameDetails={setGameDetails}
                setGuessesFunction={setGuessesFunction}
                guesses={guesses}
                updateLobbyMembers={addOneMember}
                updateGuess={updateGuess}
                setSelector={setSelector}
                setGameFinished={setGameFinished}
                updateKey={updateKey}
                setChatsFunction={setChatsFunction}
                chats={chats}
              ></TComponent>
            </div>
            <div
              className="col-4 noScrollBar border-start border-bottom border-end p-0"
              style={{
                height: "80vh",
                overflowY: "auto",
              }}
            >
              <LeaderboardChatComponenet
                lobbyMembers={lobbyMembers}
                chats={chats}
                userData={userData}
              ></LeaderboardChatComponenet>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default GameComponent;

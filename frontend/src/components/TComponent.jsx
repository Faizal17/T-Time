import React, { useContext, useEffect, useState } from "react";
import WebSocketContext from "./WebSocketContext";
import GuessComponent from "./GuessComponent";

const TComponent = ({
  selector,
  userData,
  setGameDetails,
  addToast,
  setGuessesFunction,
  guesses,
  updateLobbyMembers,
  updateGuess,
  setSelector,
  setGameFinished,
  updateKey,
  setChatsFunction,
  chats,
}) => {
  const [isSelector, setIsSelector] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const [guessedActorName, setGuessedActorName] = useState("");
  const [guessedActressName, setGuessedActressName] = useState("");
  const [guessedMovieName, setGuessedMovieName] = useState("");
  const [actorName, setActorName] = useState("");
  const [actressName, setActressName] = useState("");
  const [movieName, setMovieName] = useState("");
  const [hasGuessedMovieName, setHasGuessedMovieName] = useState(false);
  const [hasGuessedActorName, setHasGuessedActorName] = useState(false);
  const [hasGuessedActressName, setHasGuessedActressName] = useState(false);

  useEffect(() => {
    setIsSelector(selector.id === userData.id);
    setHasSelected(false);
    setActorName("");
    setActressName("");
    setMovieName("");
    setGuessedActorName("");
    setGuessedActressName("");
    setGuessedMovieName("");
    setHasGuessedActorName(false);
    setHasGuessedActressName(false);
    setHasGuessedMovieName(false);
    setGuessesFunction({}, true);
  }, [selector]);

  const socket = useContext(WebSocketContext);
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.origin === "disconnect") {
          addToast("Secondary", "User Left", message.message);
        }

        if (message.origin === "addNames") {
          setGuessedActorName(message.gameDetails.actorName);
          setGuessedActressName(message.gameDetails.actressName);
          setGuessedMovieName(message.gameDetails.movieName);
          if (isSelector) {
            message.gameDetails.actorName = actorName;
            message.gameDetails.actressName = actressName;
            message.gameDetails.movieName = movieName;
          }
          setHasSelected(true);
          setGameDetails(message.gameDetails);
          addToast("Success", "Success", message.message);
        }

        if (message.origin === "guessNames") {
          let validGuess = true;
          if (message.type === "actorName" && hasGuessedActorName) {
            validGuess = false;
          }
          if (message.type === "actressName" && hasGuessedActressName) {
            validGuess = false;
          } else if (message.type === "movieName" && hasGuessedMovieName) {
            validGuess = false;
          }
          if (validGuess) {
            let newGuesses = guesses;
            newGuesses[message.guessId] = {
              guessId: message.guessId,
              guessName: message.guessName,
              guesserId: message.userId,
              selectorId: message.selectorId,
              roundId: message.roundId,
              type: message.type,
              message: message.message,
              variant: "info",
            };
            setGuessesFunction(newGuesses, false);
          }
        }

        if (message.origin === "verifyGuessedNames") {
          if (message.guessStatus) {
            if (message.guessNameType === "actorName") {
              setHasGuessedActorName(true);
              setActorName(message.guessName);
            } else if (message.guessNameType === "actressName") {
              setHasGuessedActressName(true);
              setActressName(message.guessName);
            } else if (message.guessNameType === "movieName") {
              setHasGuessedMovieName(true);
              setMovieName(message.guessName);
            }
            updateLobbyMembers(message.winnerUser);
            addToast("Success", "Success", message.message);
          }
          updateGuess(message.guessId, message.guessStatus);
        }

        if (message.origin === "sendMessage") {
          let newChats = chats;
          newChats.push({
            gameId: message.gameId,
            id: message.id,
            name: message.name,
            chat: message.chat,
            chaten: message.chaten,
            chatru: message.chatru,
            chatfr: message.chatfr,
            chathi: message.chathi,
            chattr: message.chattr,
            time: message.time,
            senderId: message.senderId,
          });
          setChatsFunction(newChats);
        }

        if (message.origin === "nextRound") {
          setSelector(message.selector);
          addToast("Success", "Success", message.message);
        }

        if (message.origin === "endGame") {
          setGameFinished(true);
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

  useEffect(() => {
    if (
      isSelector &&
      hasGuessedActorName &&
      hasGuessedActressName &&
      hasGuessedMovieName
    ) {
      try {
        socket.send(
          JSON.stringify({
            action: "nextRound",
            gameId: userData.gameId,
            actorName: actorName,
            actressName: actressName,
            movieName: movieName,
          })
        );
      } catch (err) {
        console.log(err);
      }
    }
  }, [hasGuessedActorName, hasGuessedActressName, hasGuessedMovieName]);

  function addNames() {
    try {
      if (!isSelector) {
        addToast("Danger", "Error", "You are not a selector for this game");
        return;
      }

      if (
        actorName === null ||
        actorName === undefined ||
        actorName.trim().length === 0 ||
        actressName === null ||
        actressName === undefined ||
        actressName.trim().length === 0 ||
        movieName === null ||
        movieName === undefined ||
        movieName.trim().length === 0
      ) {
        addToast("Danger", "Error", "Please enter valid three names");
        return;
      }
      socket.send(
        JSON.stringify({
          action: "addNames",
          gameId: userData.gameId,
          actorName: actorName,
          actressName: actressName,
          movieName: movieName,
        })
      );
    } catch (err) {
      console.log(err);
    }
  }

  function guessActressName() {
    if (hasGuessedActressName) {
      return;
    }
    if (
      actressName === null ||
      actressName === undefined ||
      actressName.trim().length === 0
    ) {
      addToast("Danger", "Error", "Please enter valid actress name");
      return;
    }
    try {
      socket.send(
        JSON.stringify({
          action: "guessNames",
          gameId: userData.gameId,
          actressName: actressName,
          roundId: selector.currentRound - 1,
        })
      );
      setActressName("");
    } catch (err) {
      console.log(err);
    }
  }

  function guessActorName() {
    if (hasGuessedActorName) {
      return;
    }
    if (
      actorName === null ||
      actorName === undefined ||
      actorName.trim().length === 0
    ) {
      addToast("Danger", "Error", "Please enter valid actress name");
      return;
    }
    try {
      socket.send(
        JSON.stringify({
          action: "guessNames",
          gameId: userData.gameId,
          actorName: actorName,
          roundId: selector.gameId - 1,
        })
      );
      setActorName("");
    } catch (err) {
      console.log(err);
    }
  }

  function guessMovieName() {
    if (hasGuessedMovieName) {
      return;
    }
    if (
      movieName === null ||
      movieName === undefined ||
      movieName.trim().length === 0
    ) {
      addToast("Danger", "Error", "Please enter valid actress name");
      return;
    }
    try {
      socket.send(
        JSON.stringify({
          action: "guessNames",
          gameId: userData.gameId,
          movieName: movieName,
          roundId: selector.gameId - 1,
        })
      );
      setMovieName("");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div>
      {isSelector && hasSelected ? (
        <div className="row text-center">
          <div className="col-12 pb-4 border-bottom border-dark">
            {movieName}
          </div>
          <div
            className="col-6 pt-4 border-end border-dark"
            style={{ height: "20vh" }}
          >
            {actorName}
          </div>
          <div className="col-6 pt-4">{actressName}</div>
        </div>
      ) : isSelector ? (
        <div className="row text-center">
          <div className="col-12 pb-4 border-bottom border-dark">
            <input
              className="mx-auto form-control w-50 text-center"
              type="text"
              value={movieName}
              onChange={(e) => setMovieName(e.target.value)}
              placeholder="Movie Name"
            />
          </div>
          <div
            className="col-6 pt-4 border-end border-dark"
            style={{ height: "20vh" }}
          >
            <input
              className="me-3 form-control text-center"
              type="text"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder="Actor Name"
            />
          </div>
          <div className="col-6 pt-4">
            <input
              className="me-3 form-control text-center"
              type="text"
              value={actressName}
              onChange={(e) => setActressName(e.target.value)}
              placeholder="Actress Name"
            />
          </div>

          <div className="btn btn-primary w-50 mx-auto mt-5" onClick={addNames}>
            Submit Names
          </div>
        </div>
      ) : !isSelector && !hasSelected ? (
        <div className="row text-center">
          <div className="col-12 pb-4 border-bottom border-dark">
            Waiting for the names to be selected...
          </div>
          <div
            className="col-6 pt-4 border-end border-dark"
            style={{ height: "20vh" }}
          ></div>
          <div className="col-6 pt-4"></div>
        </div>
      ) : (
        <div className="row text-center">
          <div className="col-12 pb-4 border-bottom border-dark">
            <div className="mx-auto input-group mb-3 w-50">
              <span className="input-group-text" id="basic-addon1">
                {guessedMovieName}
              </span>
              <input
                className="form-control text-center"
                type="text"
                value={movieName}
                onChange={(e) => setMovieName(e.target.value)}
                placeholder="Movie Name"
                disabled={hasGuessedMovieName}
              />
              <span
                className="input-group-text"
                style={{ cursor: "pointer" }}
                onClick={guessMovieName}
                data-bs-toggle="tooltip"
                title="Guess Movie"
                disabled={hasGuessedMovieName}
              >
                <i className="bi bi-check-lg"></i>
              </span>
            </div>
          </div>
          <div
            className="col-6 pt-4 border-end border-dark"
            style={{ height: "20vh" }}
          >
            <div className="mx-auto input-group mb-3">
              <span className="input-group-text" id="basic-addon1">
                {guessedActorName}
              </span>
              <input
                className="form-control text-center"
                type="text"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                placeholder="Actor Name"
                disabled={hasGuessedActorName}
              />
              <span
                className="input-group-text"
                style={{ cursor: "pointer" }}
                onClick={guessActorName}
                data-bs-toggle="tooltip"
                title="Guess Actor"
                disabled={hasGuessedActorName}
              >
                <i className="bi bi-check-lg"></i>
              </span>
            </div>
          </div>
          <div className="col-6 pt-4">
            <div className="mx-auto input-group mb-3">
              <span className="input-group-text" id="basic-addon1">
                {guessedActressName}
              </span>
              <input
                className="form-control text-center"
                type="text"
                value={actressName}
                onChange={(e) => setActressName(e.target.value)}
                placeholder="Actress Name"
                disabled={hasGuessedActressName}
              />
              <span
                className="input-group-text"
                style={{ cursor: "pointer" }}
                onClick={guessActressName}
                data-bs-toggle="tooltip"
                title="Guess Actress"
                disabled={hasGuessedActressName}
              >
                <i className="bi bi-check-lg"></i>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TComponent;

import React, { useContext, useEffect, useState } from "react";
import WebSocketContext from "./WebSocketContext";

const GuessComponent = ({ guessDetails, isSelector, gameId }) => {
  const socket = useContext(WebSocketContext);
  let icon = "";
  let color = "black";
  if (guessDetails.type === "actorName") {
    icon = "gender-male";
    color = "cornflowerblue";
  } else if (guessDetails.type === "actressName") {
    icon = "gender-female";
    color = "deeppink";
  } else {
    icon = "film";
  }

  function verifyGuessedName(guessDetails, status) {
    try {
      socket.send(
        JSON.stringify({
          action: "verifyGuessedNames",
          gameId: gameId,
          guessId: guessDetails.guessId,
          guessName: guessDetails.guessName,
          guessNameType: guessDetails.type,
          guessStatus: status,
          userId: guessDetails.guesserId,
        })
      );
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div
      className={`card mx-auto border-${guessDetails.variant} mb-3`}
      style={{ maxWidth: "18rem" }}
    >
      <div className="card-header">Guess</div>
      <div className="card-body">
        <h5 className="card-title">
          <i className={`bi bi-${icon} me-2`} style={{ color: `${color}` }}></i>
          {guessDetails.guessName}
        </h5>
        <p className="card-text">{guessDetails.message}</p>
        {isSelector && guessDetails.variant === "info" ? (
          <div className="row">
            <div
              className="col btn btn-success text-center me-3"
              onClick={() => {
                verifyGuessedName(guessDetails, true);
              }}
            >
              Accept
            </div>
            <div
              className="col btn btn-danger text-center"
              onClick={() => {
                verifyGuessedName(guessDetails, false);
              }}
            >
              Reject
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default GuessComponent;

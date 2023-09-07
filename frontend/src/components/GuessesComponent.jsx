import React, { useContext, useEffect, useState } from "react";
import WebSocketContext from "./WebSocketContext";
import GuessComponent from "./GuessComponent";

const GuessesComponent = ({ selector, userData, addToast, guesses }) => {
  const [localGuess, setLocalGuess] = useState([]);

  useEffect(() => {
    const newLocalGuesses = Object.entries(guesses).filter(
      ([key, data]) => data.selectorId === selector.id
    );
    setLocalGuess(newLocalGuesses);
  }, [guesses]);
  return (
    <div>
      <h3 className="text-center pt-3">Guesses</h3>
      <hr />
      {localGuess.length > 0 ? (
        localGuess.map((e, index) => (
          <GuessComponent
            key={e[0]}
            guessDetails={e[1]}
            isSelector={selector.id === userData.id}
            gameId={userData.gameId}
          ></GuessComponent>
        ))
      ) : (
        <div className="text-center">No guesses performed yet</div>
      )}
    </div>
  );
};

export default GuessesComponent;

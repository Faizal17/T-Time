import React, { useState, useEffect, useCallback, useRef } from "react";

const LeaderboardComponenet = (lobbyMembers) => {
  let sortedLobbyMembers = Object.values(lobbyMembers.lobbyMembers);
  sortedLobbyMembers.sort((a, b) => b.score - a.score);
  return (
    <React.Fragment>
      <table className="stat mx-auto mt-5">
        <thead>
          <tr style={{ textAlign: "center" }}>
            <th>Sr. No.</th>
            <th>Name</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {sortedLobbyMembers != null ? (
            sortedLobbyMembers.map((item, index) => (
              <tr key={item.id} style={{ textAlign: "center" }}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
                <td>{item.score}</td>
              </tr>
            ))
          ) : (
            <></>
          )}
        </tbody>
      </table>
    </React.Fragment>
  );
};

export default LeaderboardComponenet;

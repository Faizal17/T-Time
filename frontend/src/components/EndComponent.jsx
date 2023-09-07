import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import WebSocketContext from "./WebSocketContext";
import LeaderboardComponenet from "./Leaderboard";

const EndComponent = ({ lobbyMembers, gameDetails, addToast }) => {
  const [email, setEmail] = useState("");
  const socket = useContext(WebSocketContext);

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.origin === "sendEmail") {
          addToast("Success", "Success", message.message);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }
  }, [socket]);

  const goHome = () => {
    window.location.reload();
  };

  function createAsciiTable(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return "";
    }

    const headers = Object.keys(data[0]);

    const columnWidths = headers.map((header) =>
      Math.max(
        header.length,
        ...data.map((item) => String(item[header]).length)
      )
    );

    const horizontalRow = columnWidths
      .map((width) => "-".repeat(width))
      .join("-+-");

    const headerRow = headers
      .map((header, index) => header.padEnd(columnWidths[index]))
      .join(" | ");

    const tableRows = data.map((item) =>
      headers
        .map((header, index) =>
          String(item[header]).padEnd(columnWidths[index])
        )
        .join(" | ")
    );

    const asciiTable = [
      horizontalRow,
      headerRow,
      horizontalRow,
      ...tableRows,
      horizontalRow,
    ].join("\n");

    return asciiTable;
  }

  function sendEmail(e) {
    e.preventDefault();
    if (email.trim().length === 0) {
      return;
    }
    try {
      let sortedLobbyMembers = Object.values(lobbyMembers);
      sortedLobbyMembers.sort((a, b) => b.score - a.score);
      const filteredSortedLobbyMembers = sortedLobbyMembers.map(
        ({ id, currentRound, ...rest }) => rest
      );
      socket.send(
        JSON.stringify({
          action: "sendEmail",
          gameId: "gameDetails.id",
          email: email,
          body: createAsciiTable(filteredSortedLobbyMembers),
        })
      );
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="leaderBoardTable">
      <form
        className="row mx-auto mt-5"
        style={{ width: "fit-content" }}
        onSubmit={sendEmail}
      >
        <input
          className="me-3 form-control"
          style={{ width: "auto" }}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button
          className="btn btn-primary"
          style={{ width: "auto" }}
          type="submit"
        >
          Send result to Email
        </button>
      </form>
      <LeaderboardComponenet
        lobbyMembers={lobbyMembers}
      ></LeaderboardComponenet>
      <div className="row">
        <div
          className="btn btn-primary mt-5 mx-auto"
          style={{ width: "auto" }}
          onClick={goHome}
        >
          Go Home
        </div>
      </div>
    </div>
  );
};

export default EndComponent;

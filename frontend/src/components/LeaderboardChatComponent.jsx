import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import { Tab, Nav } from "react-bootstrap";
import LeaderboardComponenet from "./Leaderboard";
import ChatComponent from "./ChatComponent";
import WebSocketContext from "./WebSocketContext";

const LeaderboardChatComponenet = ({ lobbyMembers, chats, userData }) => {
  const socket = useContext(WebSocketContext);
  const [message, setMessage] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const sendMessage = (e) => {
    e.preventDefault();
    try {
      socket.send(
        JSON.stringify({
          action: "sendMessage",
          name: userData.name,
          chat: message,
          time: Date.now(),
          gameId: userData.gameId,
        })
      );
      setMessage("");
    } catch (err) {
      console.log(err);
    }
  };
  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
  };
  return (
    <React.Fragment>
      <div>
        <Tab.Container id="myTab" defaultActiveKey="home">
          {/* reference - https://react-bootstrap.netlify.app/docs/components/navs */}
          <Nav justify variant="tabs" className="nav-tabs">
            <Nav.Item>
              <Nav.Link eventKey="home">Leaderboard</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="profile">Chat</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="home">
              <LeaderboardComponenet
                // lobbyMembers={{
                //   1: { id: 1, name: "fzl", score: 10 },
                //   2: { id: 2, name: "preetha", score: 5 },
                // }}
                lobbyMembers={lobbyMembers}
              ></LeaderboardComponenet>
            </Tab.Pane>
            <Tab.Pane eventKey="profile">
              {/* Content for the Profile tab */}
              <div
                className="input-group mx-auto mt-3"
                style={{ width: "fit-content" }}
              >
                <span className="input-group-text" id="basic-addon3">
                  Translate To
                </span>
                <select
                  id="selectOptions"
                  value={selectedOption}
                  onChange={handleSelectChange}
                >
                  <option value="">None</option>
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="ru">Russian</option>
                  <option value="hi">Hindi</option>
                  <option value="tr">Turkish</option>
                </select>
              </div>
              <div style={{ height: "60vh", overflowY: "auto" }}>
                {chats.length > 0 ? (
                  chats.map((e, index) => (
                    <ChatComponent
                      key={e.id}
                      chat={e}
                      userData={userData}
                      selectedOption={selectedOption}
                    ></ChatComponent>
                  ))
                ) : (
                  <></>
                )}
              </div>
              <form className="input-group" onSubmit={sendMessage}>
                <input
                  className="form-control"
                  type="text"
                  required={true}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message"
                />
                <button
                  className="btn btn-primary input-group-text"
                  type="submit"
                >
                  <i className="bi bi-send-fill"></i>
                </button>
              </form>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </div>
    </React.Fragment>
  );
};

export default LeaderboardChatComponenet;

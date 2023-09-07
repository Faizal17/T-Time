import logo from "./logo.svg";
import "./App.css";
import MainComponent from "./components/MainComponent";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import { WebSocketProvider } from "./components/WebSocketContext";

function App() {
  return (
    <WebSocketProvider>
      <MainComponent></MainComponent>
    </WebSocketProvider>
  );
}

export default App;

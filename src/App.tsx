import React from 'react';
import './App.css';
import {Wallet} from "./Wallet";
import Game from "./Game";

function App() {
  return (
    <div className="App">
      <Wallet>
        <Game></Game>
      </Wallet>
    </div>
  );
}

export default App;

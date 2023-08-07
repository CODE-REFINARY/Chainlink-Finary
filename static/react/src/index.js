import React, { Component } from "react";
import { render } from "react-dom";

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <i>This is a test of the react integration</i>
      </div>
    );
  }
}

const appDiv = document.getElementById("app");
render(<App />, appDiv);

import React, { Component } from "react";
import { render } from "react-dom";

export * as allExports from './collectionStateManager.js';
export { synthesizeGalleryBasic, synthesizeGallery } from './patchwork-function.js';

const {
  addElement,
  createFence,
  makeForm,
  parseKeyUp,
  parseKeyDown,
  addButtonsDocView,
  addButtonsDocEmptyView,
  addButtonsChainlinkView,
  addButtons,
  deleteButtons,
  instFenceEditButtons,
  instChainlinkEditButtons,
  instContentEditButtons,
  deleteFenceEditButtons,
  deleteChainlinkEditButtons,
  deleteContentEditButtons,
  deleteDoc,
  deleteChainlink,
  deleteContent,
  renameDoc,
  editChainlink,
  editContent
} = allExports;



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

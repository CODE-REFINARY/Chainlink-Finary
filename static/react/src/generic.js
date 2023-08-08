import { parseKeyUp, parseKeyDown, addButtonsDocView, addButtonsDocEmptyView, deleteDoc, renameDoc, editChainlink, editContent, instChainlinkEditButtons, instContentEditButtons, instFenceEditButtons, deleteFenceEditButtons, deleteChainlinkEditButtons, deleteContentEditButtons, createFence } from "./chainlink-utilities.js";

// await full DOM load before adding DB items
document.addEventListener("DOMContentLoaded", function() {

        // Globals
        window.ctrl = false;			// This flag indicates whether the "ctrl" key is being held down

        // Handle empty document case where only chainlink add button should be present
        if (document.getElementById("chainlink-display").querySelector(":scope > section") == null) {
                window.in = "doc-empty";	// signal to key parser to disable all hotkeys except "c"
                addButtonsDocEmptyView();
        } else {
                window.in = "doc";
                addButtonsDocView();
        }

        // Add the event listeners above for keystrokes
        window.addEventListener("keyup", parseKeyUp);
        window.addEventListener("keydown", parseKeyDown);
        document.getElementById("add-page-btn").addEventListener("click", createFence);

        // Add CRUD buttons for page content
        instFenceEditButtons();
        instChainlinkEditButtons();
        instContentEditButtons();

        //deleteFenceEditButtons();
        //deleteChainlinkEditButtons();
        //deleteContentEditButtons();

});

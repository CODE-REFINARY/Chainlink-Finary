import { parseKeyUp, parseKeyDown, addContentButtons, deleteDoc, renameDoc, editChainlink, editContent, instChainlinkEditButtons, instContentEditButtons, instFenceEditButtons, deleteFenceEditButtons, deleteChainlinkEditButtons, deleteContentEditButtons, createFence } from "./chainlink-utilities.js";

document.addEventListener("DOMContentLoaded", function() {
        // Globals
        window.ctrl = false;			// This flag indicates whether the "ctrl" key is being held down
        window.in = "chainlink";		// This setting is used for parsing keystrokes

        // Add the event listeners above for keystrokes
        window.addEventListener("keyup", parseKeyUp);
        window.addEventListener("keydown", parseKeyDown);
        document.getElementById("add-page-btn").addEventListener("click", createFence);

        // Add CRUD buttons for page content
        instChainlinkEditButtons();
        instContentEditButtons();

        addContentButtons(4);
});

import { parseKeyDown, createFence } from "./chainlink-utilities.js";

document.addEventListener("DOMContentLoaded", function() {
        // Globals
        window.in = "chainlink";		// This setting is used for parsing keystrokes

        // Add the event listeners above for keystrokes
        window.addEventListener("keydown", parseKeyDown);
        document.getElementById("add-page-btn").addEventListener("click", createFence);
});

import { parseKeyUp, parseKeyDown, instantiateEditButtons, createFence, initialize } from "./chainlink-utilities.js";

// await full DOM load before adding DB items
document.addEventListener("DOMContentLoaded", function() {

        initialize();

        // Add the event listeners above for keystrokes
        window.addEventListener("keyup", parseKeyUp);
        window.addEventListener("keydown", parseKeyDown);
        document.getElementById("add-page-btn").addEventListener("click", createFence);

        // Add CRUD buttons for page content
        /*instFenceEditButtons();
        instChainlinkEditButtons();
        instContentEditButtons();*/

        //deleteFenceEditButtons();
        //deleteChainlinkEditButtons();
        //deleteContentEditButtons();
        instantiateEditButtons();
});

import { parseKeyDown, instantiateEditButtons, createFence, initialize } from "./collectionStateManager.js";

// await full DOM load before adding DB items
document.addEventListener("DOMContentLoaded", function() {

        initialize();

        // Add the event listeners above for keystrokes
        window.addEventListener("keydown", parseKeyDown);
        instantiateEditButtons();
});

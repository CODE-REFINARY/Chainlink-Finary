import { initialize } from "./collectionStateManager.js";

// await full DOM load before adding DB items
document.addEventListener("DOMContentLoaded", function() {
        let edit = false; // This variable sets whether the page shows edit controls
        let queryString = window.location.search;
        let params = new URLSearchParams(queryString);
        if (params.get("edit") == "true") {
                edit = true;
        };
        initialize(edit);
});

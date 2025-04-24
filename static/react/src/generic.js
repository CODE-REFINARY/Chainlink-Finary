import { initialize } from "./collectionStateManager.js";

// await full DOM load before adding DB items
document.addEventListener("DOMContentLoaded", function() {
        let edit = false; // This variable sets whether the page shows edit controls
        let queryString = window.location.search;
        let params = new URLSearchParams(queryString);
        if (params.get("edit") == "true") {
                edit = true;
                let style = document.createElement('style');
                style.textContent = `
                .content-wrapper:hover .inner-content, .chainlink-wrapper:hover h2 {
                    border-width: 1px;
                    border-style: solid;
                    color: rgb(208, 68, 35);
                }
                `;
                document.head.appendChild(style);
                console.log("ddds")
        };

        initialize(edit);
});

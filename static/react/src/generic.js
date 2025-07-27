import React from "react";
import { createRoot } from "react-dom/client";
import { ChainlinkDisplayAsComponents } from "./collectionComponentLibrary.js";

// await full DOM load before adding DB items
document.addEventListener("DOMContentLoaded", function() {

        function initialize(edit) {
                let elementsComponent = undefined;
                let editingEnabled = edit;
                if (editingEnabled == true) {
                        //refresh();
                        // delete the chainlink manifest entries before you create a root out of the dispplay. This is done because
                        // we're gonna make chainlink manifest dynamic and we need to get rid of the old entries that were rendered server-side
                        // before we render with react because we don't want react to manipulate the dom directly.
                        let el = document.getElementById("chainlink-manifest-entries");
                        while (el.firstChild) {
                                el.removeChild(el.firstChild);
                        }
                        elementsComponent = createRoot(document.getElementById("chainlink-display"));
                        elementsComponent.render(<ChainlinkDisplayAsComponents/>);
                }
        }


        let edit = false; // This variable sets whether the page shows edit controls
        let queryString = window.location.search;
        let params = new URLSearchParams(queryString);
        if (params.get("edit") == "true") {
                edit = true;
        };
        initialize(edit);
});

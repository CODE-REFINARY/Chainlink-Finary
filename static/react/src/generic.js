import React, {useState } from "react";
import { createRoot } from "react-dom/client";
import { ElementDisplayAsComponents } from "./collectionComponentLibrary.js";
import { ViewOptionsSideMenu } from "./ancillaryComponents.js";


document.addEventListener("DOMContentLoaded", function () {

    function initialize(edit) {
        // 1. Logic for the Element Display (Content)
        if (edit === true) {
            let manifestEl = document.getElementById("element-manifest-entries");
            if (manifestEl) {
                while (manifestEl.firstChild) {
                    manifestEl.removeChild(manifestEl.firstChild);
                }
            }
            const elementsComponent = createRoot(document.getElementById("element-display"));
            elementsComponent.render(<ElementDisplayAsComponents/>);
        }

        // 2. Logic for the Side Menu (Switches)
        const anchorElement = document.getElementById("chainlink-manifest");
        if (anchorElement) {
            // Create a wrapper for our React menu
            const menuWrapper = document.createElement("div");
            menuWrapper.id = "react-side-menu-root";
            
            // Insert it as the next adjacent sibling
            anchorElement.insertAdjacentElement('afterend', menuWrapper);

            const sideMenuRoot = createRoot(menuWrapper);
            sideMenuRoot.render(<ViewOptionsSideMenu/>);
        }
    }

    let queryString = window.location.search;
    let params = new URLSearchParams(queryString);
    let edit = params.get("edit") === "true";

    document.documentElement.setAttribute('edit-mode', edit ? 'true' : 'false');

    initialize(edit);
});
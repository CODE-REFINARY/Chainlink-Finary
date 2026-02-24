import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ElementDisplayAsComponents } from "./collectionComponentLibrary.js";
import { ViewOptionsSideMenu, CollectionEditForm, CollectionDeleteForm, CollectionCreateForm, EnterEditModeButton, ExitEditModeButton } from "./ancillaryComponents.js";


document.addEventListener("DOMContentLoaded", function () {

    function initialize(edit) {

        // Logic for the Element Display (Content)
        if (edit === true) {

            // This turns the bookmarks into a dynamic component
            let manifestEl = document.getElementById("element-manifest-entries");
            if (manifestEl) {
                while (manifestEl.firstChild) {
                    manifestEl.removeChild(manifestEl.firstChild);
                }
            }

            // This is the big call: the one that actually rebuilds all body elements.
            const elementsComponent = createRoot(document.getElementById("element-display"));
            elementsComponent.render(<ElementDisplayAsComponents/>);


            // Logic for the Side Menu (toggles and buttons)
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

        const CollectionManager = () => {
            // Define your state at the top of the component
            const [showCreate, setShowCreate] = useState(false);
            const [showEdit, setShowEdit] = useState(false);
            const [showDelete, setShowDelete] = useState(false);

            if (edit === true) {
                return (
                    <>
                        <CollectionCreateForm show={showCreate} setShow={setShowCreate} />
                        <ExitEditModeButton />
                    </>
                );
            } else {
                return (
                    <>
                        <CollectionCreateForm show={showCreate} setShow={setShowCreate} />
                        <EnterEditModeButton />
                    </>
                );
            }
        };

        const collectionControlsList = document.getElementById("collection-controls");
        const root = createRoot(collectionControlsList);

        root.render(<CollectionManager />);
    }

    let queryString = window.location.search;
    let params = new URLSearchParams(queryString);
    let edit = params.get("edit") === "true";


    document.documentElement.setAttribute('edit-mode', edit ? 'true' : 'false');

    initialize(edit);
});
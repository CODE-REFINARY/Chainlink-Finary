/* React imports */
import React from "react";
import { createRoot } from "react-dom/client";
import { Element, Article, Chainlink, Content, Header } from "./classes.js"
import {
        ChainlinkEditButtons, ChainlinkElement,
        ContentEditButtons, ContentElement,
        CreatePageEditButtons,
        ElementCreationForm,
        FenceEditButtons, NoElements
} from "./components.js"


/* Variables that store 1 or more event listeners so that they be referenced and de-registered later */
export let elementsEditButtonEventHandlers = [];

// State variables to describe the state of the page. These can be called to reliably determine something about the current page
let isArticle;
let isChainlink;
let articleIsEmpty;
let chainlinkIsEmpty;
let pageEditButtons;
let numBodyElements;        // the number of Elements rendered on the page
let numFooterElements;
let numHeaderElements;
let formIsActive;
let cursor;             // the cursor is a positive integer representing the position at which new Elements will be created. By default, it's equal to numElements (which is to say it's positioned at the end of the Element list). Cursor values are indices of elements and when a new element is created, that elements new index will be what the cursor was right before it was created (after which the cursor value will increment)

/* Static Variables */
const bodyElementClassNames = ["chainlink-wrapper", "content-wrapper"]; // define the set of classnames that identify body Elements
const contentElementClassNames = ["content-wrapper"];
const headerElementClassNames = ["header-element-wrapper"];
const footerElementClassNames = ["footer-element-wrapper"];
const formClassNames = ["content-creation-form"];
const contentTypes = ["paragraph", "code", "linebreak", "header3"]


// Set up state variables after DOM is ready to be read
document.addEventListener("DOMContentLoaded", function() {

        /* Read-Only flag variables */

        /* Boolean flags */

        /* Javascript objects that update alongside the page and modify it */

        // this flag indicates that Article view is current
        isArticle = {
                get value() {
                        return (document.getElementById("element-display").getAttribute("template") === "article");
                }
        };
        // flag indicates that Chainlink view is current
        isChainlink = {
                get value() {
                        return (document.getElementById("element-display").getAttribute("template") === "chainlink");
                }
        };

        // flag indicates that the chainlink has no content display. This flag is only set in Chainlink view
        chainlinkIsEmpty = {
                get value() {
                        if (!document.getElementById("chainlink-display").firstElementChild) {
                                return false;
                        }
                        return (document.getElementById("chainlink-display").firstElementChild.childElementCount === 1 && isChainlink.value);
                }
        };

        formIsActive = {
                get value() {
                        if (document.getElementById("crud-form")) {
                                return true;
                        } else {
                                return false;
                        }
                }
        };

        // variable indicates the number of elements currently rendered on the screen
        numBodyElements = {
                get value() {
                        const selector = bodyElementClassNames.map(className => `.${className}`).join(', ');
                        const elements = document.querySelectorAll(selector);
                        return (Array.from(elements).length);
                }
        };

        // variable indicates the number of elements currently rendered on the screen
        numHeaderElements = {
                get value() {
                        const selector = headerElementClassNames.map(className => `.${className}`).join(', ');
                        const elements = document.querySelectorAll(selector);
                        return (Array.from(elements).length);
                }
        };

        // variable indicates the number of elements currently rendered on the screen
        numFooterElements = {
                get value() {
                        const selector = footerElementClassNames.map(className => `.${className}`).join(', ');
                        const elements = document.querySelectorAll(selector);
                        return (Array.from(elements).length);
                }
        };

        articleIsEmpty = {
                get value() {
                        return (numBodyElements.value === 0);
                }
        };


        /* Javascript objects with setters that alter contents of the page when called */

        // cursor
        cursor = {
                get value() {
                        return (numBodyElements.value - 1);         // Temporary fix cursor at the end position
                }
        };

        // contentButtons indicates the existence of buttons that create content on the page
        pageEditButtons = {
                _value: false,
                root: createRoot(document.getElementById("content-placeholder")),
                get value() {
                        return this._value;
                },
                set value(newValue) {
                        if (newValue !== this._value) {
                                this._value = newValue;
                                //const root = createRoot(container);
                                this.root.render(<CreatePageEditButtons bitmask={this._value}/>);
                        }
                }
        };
});


/**
 * Create the buttons that appear in #chainlink-display toward the bottom of the fence
 *
 * @param {number} quantity - the number of buttons to create. 1 button is chainlink. 5 buttons is everything. 4 buttons is everything but chainlink
 * @returns {null}
 */
export function initialize() {
	/*var mainElement = document.querySelector("main");
        var container = document.createElement("div");
        container.id = "add-buttons";
        mainElement.appendChild(container);
        var root = createRoot(container);
        if (quantity == 1) {
                root.render(<CreateChainlinkButton />);
        } else if (quantity == 4) {
                root.render(<CreateContentButtons />);
        } else if (quantity == 5) {
                root.render(<ContentCreationButtonsFive />);
        }

        // Render chainlink/content creation buttons
        if (isArticle.value) {
                if (articleIsEmpty.value) {
                        pageEditButtons.value = "10";
                } else {
                        pageEditButtons.value = "11";
                }
        } else if (isChainlink.value) {
                pageEditButtons.value = "01";
        }
*/
        refresh();
        showDiagnostics();
}


export function storeEditButtonHandlers(editFunction, deleteFunction) {
        elementsEditButtonEventHandlers.push([editFunction, deleteFunction]);
}


/**
 * Assign indices to Elements. The title element is always index 0. 
 *
 * @returns {null}
 */
export function refresh() {
        // Assign indices to all elements in the article/chainlink body
        let index = 0;
        const allElements = document.querySelectorAll('#chainlink-display *');
        for (let i = 0; i < allElements.length; i++) {
                const element = allElements[i];
                for (let j = 0; j < bodyElementClassNames.length; j++) {
                        if (element.classList.contains(bodyElementClassNames[j])) {
                                element.setAttribute("index", index);
                                index++;
                                break;
                        }
                }
        }

        // Update the Chainlink Manifest links with any new chainlinks that were potentially added.
        let list = document.getElementById("chainlink-manifest-entries");
        let chainlinks = document.querySelectorAll(".chainlink-wrapper");
        let chainlinkInfo = []
        while (list.firstChild) {
                list.removeChild(list.firstChild);
        }
        chainlinks.forEach(function(element) {
                chainlinkInfo.push([element.querySelector(".chainlink-inner-text").textContent, element.id])
        });

        chainlinkInfo.forEach(function(element) {
                let listItem = document.createElement("li");
                let link = document.createElement("a");
                link.textContent = element[0];
                link.setAttribute("href", "#" + element[1]);
                listItem.appendChild(link);
                list.appendChild(listItem);
        });

        // Remove or add the "no content" marker for the Article.
        const chainlinkElements = document.getElementById("chainlink-elements");
        const headerElements = document.getElementById("header-elements");
        const footerElements = document.getElementById("footer-elements");
        let noClMarker = chainlinkElements.querySelector(".no-elements");
        let noFtMarker = document.getElementById("no-footer");
        let noHrMarker = document.getElementById("no-header");
        if (numBodyElements.value > 0 || formIsActive.value) {
                if (noClMarker) {
                        noClMarker.remove()
                }
        } else {
                if (noClMarker === null) {
                        const container = document.createElement("div");
                        const root = createRoot(container);
                        container.className = "no-elements";
                        chainlinkElements.append(container);
                        root.render(<NoElements />);
                }
        }

        if (numHeaderElements.value > 0) {
                if (noHrMarker) {
                        noHrMarker.remove()
                }
        } else {
                if (noHrMarker === null) {
                        const container = document.createElement("div");
                        const root = createRoot(container);
                        container.className = "no-elements";
                        headerElements.append(container);
                        root.render(<NoElements />);
                }
        }

        if (numFooterElements.value > 0) {
                if (noFtMarker) {
                        noFtMarker.remove()
                }
        } else {
                if (noFtMarker === null) {
                        const container = document.createElement("div");
                        const root = createRoot(container);
                        container.className = "no-elements";
                        footerElements.append(container);
                        root.render(<NoElements />);
                }
        }

        // Remove or add "no content" marker for each Chainlink
        let cls = document.querySelectorAll(".chainlink");
        const selector = contentElementClassNames.map(className => `.${className}`).join(', ');
        for (let i = 0; i < cls.length; i++) {
                // If the number of content elements that are children of this chainlink is zero then display the
                // "no content" marker.
                let numChildElements = Array.from(cls[i].querySelectorAll(selector)).length;
                let marker = cls[i].querySelector(".no-elements");
                if (numChildElements === 0 && !cls[i].querySelector("#crud-form")) {
                        if (marker === null) {
                                const container = document.createElement("div");
                                const root = createRoot(container);
                                container.className = "no-elements";
                                cls[i].append(container);
                                root.render(<NoElements/>);
                        }
                } else {
                        // If there are elements under this chainlink then find the "no content" marker (if it exists)
                        // and remove it. Otherwise, just we're done here.
                        if (marker) {
                                marker.remove();
                        }
                }
        }

        // Grey out buttons (or un-grey them) if forms or other factors are active
        if (formIsActive.value) {
                pageEditButtons.value = "00";
        } else {
                if (isArticle.value) {
                        if (numBodyElements.value === 0) {
                                pageEditButtons.value = "10";
                        } else {
                                pageEditButtons.value = "11";
                        }
                } else if (isChainlink.value) {
                        pageEditButtons.value = "01";
                }
        }
}


/**
 * Create the correct number of content buttons depending on current page
 *
 * @returns {null}
 */
/*export function _addButtons() {
        if (window.in === 'doc') {
                addContentButtons(5);
        } else if (window.in === 'doc-empty') {
                addContentButtons(1);
        } else if (window.in === 'chainlink') {
                addContentButtons(4);
        }
}*/

function showDiagnostics() {
        console.log("isArticle: " + isArticle.value);
        console.log("isChainlink: " + isChainlink.value);
        console.log("chainlinkIsEmpty: " + chainlinkIsEmpty.value);
        console.log("articleIsEmpty: " + (numBodyElements.value === 0).toString());
        console.log("numElements: " + numBodyElements.value);
}

/**
 * Write javascript object parameter to database
 *
 * @param {Element} element - a descendent class of Element to be written to the database
 * @returns {null}
 */
function addElement(element) {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("POST", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";

        // dispatch an AJAX post
        xhr.send(JSON.stringify(element));

        // instantiate element once AJAX Post comes back successful
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        instantiateElement(xhr.response, numBodyElements.value, null);
                }
        }
}

/**
 * Create an Element and insert it into the display area. The location to insert into is denoted by an argument. This
 * argument is a number that specifies the exact order that this new element will have in the list. The previous
 * element occupying this position will be moved "up" i.e. the new element will appear right before the old element.
 *
 * @param {Object} element - XMLHttpRequest or Element object to instantiate on the screen
 * @param {number} index - The index indicates what the index of the new element should have. This index should be made available before
 * instantiateElement is called.
 * @param {NodeList} children - This array-like object contains all HTML nodes that are children of the element parameter (of course
 * assuming that parameter is a Chainlink).
 * @returns {null}
 */
function instantiateElement(element, index, children) {
        let previousElementIndex = index - 1;                                 // the index of the Element directly before the Element to be created
        let previousElement = null;                                             // the Element directly before the Element that will be created
        let adjacentElement = null;                                             // the element right before the element to be inserted

        if (element instanceof Header) {

        }

        else if (element.type === "header2") {
                const parentElement = document.getElementById("chainlink-elements");
                const firstChild = parentElement.firstChild;
                const container = document.createElement("section");
                const root = createRoot(container);
                container.className = "chainlink";
                if (numBodyElements.value === 0) {
                        parentElement.appendChild(container);
                } else if (previousElementIndex === -1) {
                        parentElement.insertBefore(container, firstChild);
                } else {
                        previousElement = document.querySelector(`[index="${previousElementIndex}"]`).parentNode;            // the Element directly before the Element that will be created
                        previousElement.insertAdjacentElement("afterend", container);
                }
                root.render(<ChainlinkElement title={element.title} url={"chainlink-" + element.url + "-" + element.order} date={element.date} children={children} />);

        } else {
                adjacentElement = document.querySelector(`[index="${previousElementIndex}"]`);
                const container = document.createElement("div");
                const root = createRoot(container);
                container.id = "content-" + element.url + "-" + element.order;
                container.className = "content-wrapper";
                container.setAttribute("tag", element.type);
                //container.setAttribute("index", numElements.value);
                /*if (adjacentElement.className == "chainlink-wrapper") {               // if we are inserting a content Element at the start of a Chainlink...
                        parentElement = adjacentElement;                                // the chainlink will be the parent of this new Element
                        firstChild = parentElement.firstChild;                          // get the original first child of the Chainlink
                        parentElement.insertBefore(container, firstChild);              // insert the 
                }*/
                adjacentElement.insertAdjacentElement("afterend", container);
                /*else
                        parentElement.appendChild(container);*/
                root.render(<ContentElement type={element.type} content={element.content} />);
        }
}

/*  JS public functions */

/**
 * Create a form for editing an element (specified by type) and call addElement to update the database with the form contents
 * 
 * @param {string} type - string representation of the type of element that the edit form will be created for
 * @returns {null}
 */
export function makeForm(type) {
        const currentDateTime = new Date().toISOString();
        const _listener = function (e) { escape(e, _listener, "", null) };

        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);

        // html elements to create
        const container = document.createElement("div");
        const root = createRoot(container);
        const chainlink = document.getElementById("chainlink-elements").lastElementChild;

        // fields to pass to addElement for Element creation
        let element = undefined;
        let url = undefined;
        let order = undefined;
        const isPublic = undefined;
        const count = undefined;

        // Define the location where the form should be rendered if it's for modification of a chainlink.
        if (type === "header2") {
                const list = document.getElementById('chainlink-elements');
                container.id = "chainlink-creation-form";
                order = document.getElementById("chainlink-display").childElementCount - 1;
                root.render(<ElementCreationForm placeholder="enter chainlink content"/>);
                list.appendChild(container);
        }

        if (contentTypes.includes(type)) {

                const previousElement = document.querySelector(`[index="${cursor.value}"]`);
                const prevId = previousElement.id
                let nextElement = previousElement.nextElementSibling;

                // If we are submitting a new element to the end...
                if (cursor.value == numBodyElements.value - 1) {
                        // The new element will be the first
                        if (previousElement.className === "chainlink-wrapper") {
                                // element of this chainlink so assign its order to 0 because we are 0-indexed
                                order = 0;
                        } else if (previousElement.className === "content-wrapper") {
                                // The new element's order will be the previous element's order plus one
                                order = getOrderFromId(prevId);
                        }
                }

                else {  // Otherwise we are submitting a new element either at the beginning or in the middle
                        while (nextElement) {
                                // Get a new id for the next element over by incrementing the order
                                let newId = getUrlFromId(prevId) + (getOrderFromId(prevId) + 1);
                                nextElement.id = newId;         // Assign the new order
                                nextElement = nextElement.nextElementSibling;    // Repeat this for all subsequent elements
                        }
                }

                order = getMatchedChildren(chainlink, contentElementClassNames).length;
                url = getUrlFromId(chainlink.querySelector(".chainlink-wrapper").getAttribute('id'));

                if (type === "header3") {
                        container.id = "content-creation-form";
                        root.render(<ElementCreationForm placeholder="enter header content"/>);
                        chainlink.appendChild(container);
                } else if (type === "paragraph") {
                        container.id = "content-creation-form";
                        root.render(<ElementCreationForm placeholder="enter paragraph content"/>);
                        chainlink.appendChild(container);
                } else if (type === "code") {
                        container.id = "content-creation-form";
                        root.render(<ElementCreationForm placeholder="enter code block"/>);
                        chainlink.appendChild(container);
                } else if (type === 'linebreak') {
                        container.id = "content-creation-form";
                        element = new Content("linebreak", undefined, url, currentDateTime, isPublic, count, order);
                        addElement(element);
                        window.addEventListener("keydown", parseKeyDown);
                        window.removeEventListener("keydown", _listener);
                        return null;
                }
        }

        container.addEventListener("submit", function(event) {
                event.preventDefault();
                if (type === "header2") {
                        element = new Chainlink(input.value, url, currentDateTime, isPublic, count, order);
                } else {
                        element = new Content(type, input.value, url, currentDateTime, isPublic, count, order);
                }
                window.addEventListener("keydown", parseKeyDown);
                addElement(element);
                initialize();
                container.remove();
                window.removeEventListener("keydown", _listener);
                refresh();
        });
}


/**œ
 * Callback function used for when the user presses the Esc key while an input dialogue is open
 *
 * @param {KeyboardEvent} e - the keyboard press event used to verify that the key that was pressed was the escape key
 * @param {Function} ref - a reference to the callback function specified for
 * @param {string} fallback - the original value of the field that we are editing
 * <DEPRECATED> @param {string} element - the type of content that is being edited.
 * @param {Element} element - the Element object that was being edited when escape was entered
 * @returns {null}
 */
function escape(e, ref, fallback, element) {
        // if the escape key is pressed...
        if (e.key === "Escape") {
                let formParent = document.getElementById('crud-form').parentNode.parentNode;
                let form = document.getElementById('crud-form').parentNode;
                const display = document.getElementById("chainlink-display");
                const chainlinkCreateForm = display.querySelector("#chainlink-creation-form");
                const contentCreateForm = display.querySelector("#content-creation-form");
                const chainlinkEditForm = display.querySelector("#chainlink-edit-form");
                const contentEditForm = display.querySelector("#content-edit-form");
                const fenceEditForm = (formParent.matches('#header-display'));

                if (fenceEditForm) {
                        form.remove();
                        let h1 = document.createElement("h1");
                        h1.id = "doc-title";
                        h1.innerHTML = fallback;
                        formParent.prepend(h1);
                } else if (chainlinkEditForm) {
                        const index = parseInt(chainlinkEditForm.getAttribute("index"));
                        const children = form.parentElement.querySelectorAll(".content-wrapper");
                        form.parentElement.remove();
                        instantiateElement(element, index, children);
                } else if (chainlinkCreateForm) {
                        form.remove();
                } else if (contentCreateForm) {
                        form.remove();
                } else if (contentEditForm) {
                        const index = parseInt(contentEditForm.getAttribute("index"));
                        form.remove();
                        instantiateElement(element, index, null);
                }

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", ref);
                initialize();
        }
}

/*
 * Create a new Article object and write it to the database via AJAX. Then reload the page if the page write was successful
 *
 * @returns {null}
 */
export function createFence() {
        const currentDateTime = new Date().toISOString();
        const article = new Article("article", "", currentDateTime, false, 0, 0);
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/patchwork/article/generate.html", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(article));

        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        const url = xhr.response.url;
                        let url_substring = url.substring(0, 10);
                        let putRequest = new XMLHttpRequest();
                        putRequest.open("PUT", "doc" + url + ".html", true);
                        putRequest.setRequestHeader('X-CSRFToken', csrftoken);
                        putRequest.setRequestHeader('type', 'doc');
                        putRequest.setRequestHeader('title', "fence" + url_substring);
                        putRequest.setRequestHeader('target', 'null');
                        putRequest.send();
                        putRequest.onreadystatechange = function() {
                                window.location.replace("/patchwork/article/" + url + ".html");
                        }
                }
        }
}

// Keypress parsing function for moving the page up and down
export function parseKeyDown(e) {

        // exit if the ctrl (windows) or command (mac) key is currently being pressed.
        // This code is necessary to allow user to enter Ctr-C/Cmd-C without triggering a hotkey-ed dialogue window.
        if (e.ctrlKey || e.metaKey) {
                return;
        }

        // Trigger an action depending on which key the user presses.
        switch(e.key) {
                case "k":
                        window.scrollBy(0, -70);
                        break;
                case "j":
                        window.scrollBy(0, 70);
                        break;
                case "p":
                        e.preventDefault();
                        makeForm('paragraph');
                        break;
                case "c":
                        e.preventDefault();
                        makeForm('code');
                        break;
                case "n":
                        e.preventDefault();
                        makeForm('header2');
                        break;
                case "h":
                        e.preventDefault();
                        makeForm('header3');
                        break;
                case "b":
                        e.preventDefault();
                        makeForm('linebreak');
                        break;
        }
}

export function deleteButtons() {
        document.getElementById('add-buttons').remove();
}

export function instantiateEditButtons() {
        var wrapper = document.getElementById('header-display');
        var container = document.createElement("div");
        container.id = "fence-context-buttons";
        wrapper.appendChild(container);
        var root = createRoot(container);
        root.render(<FenceEditButtons />);

        var numChainlinks = document.getElementsByClassName("chainlink").length;
        var wrappers = document.getElementsByClassName("chainlink-wrapper");
        for (let i = 0; i < numChainlinks; i++) {
                let container = document.createElement("div");
                let root = createRoot(container);
                container.className = "chainlink-buttons-wrapper";
                wrappers[i].appendChild(container);
                root.render(<ChainlinkEditButtons i={i} wrappers={wrappers}/>);
        }

        var numContents = document.getElementsByClassName("content-wrapper").length;
        var wrappers = document.getElementsByClassName("content-wrapper");
        for (let i = 0; i < numContents; i++) {
                let container = document.createElement("div");
                let root = createRoot(container);
                container.className = "context-buttons-wrapper";
                wrappers[i].appendChild(container);
                root.render(<ContentEditButtons i={i} wrappers={wrappers}/>);
        }
}

export function removeEditButtons() {
        var editButton = document.getElementById("doc-action-edit-title");
        var deleteButton = document.getElementById("doc-action-delete-title");
        editButton.remove();
        deleteButton.remove();

        var chainlinkButtons = document.getElementsByClassName("chainlink-buttons-wrapper");
        var numChainlinkButtons = document.getElementsByClassName("chainlink-buttons-wrapper").length;
        var editButtons = Array.from(document.getElementsByClassName("cl-edit-btn"));
        var deleteButtons = Array.from(document.getElementsByClassName("cl-del-btn"));
        for (let i = 0; i < numChainlinkButtons; i++) {
                chainlinkButtons[0].remove();
        }

        var contentButtons = document.getElementsByClassName("context-buttons-wrapper");
        var numContentButtons = document.getElementsByClassName("context-buttons-wrapper").length;
        var editButtons = Array.from(document.getElementsByClassName("cont-edit-btn"));
        var deleteButtons = Array.from(document.getElementsByClassName("cont-del-btn"));
        for (let i = 0; i < numContentButtons; i++) {
                contentButtons[0].remove();
        }

        elementsEditButtonEventHandlers.length = 0;
}

export function deleteDoc() {

        var confirm = window.confirm("Delete document record?");
        if( confirm == false ) {
                return
        }

 	var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.location.href, true);
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.setRequestHeader('type', 'doc');
        xhr.send();
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        window.location.href = "index.html";
                }
        }
}

export function deleteChainlink(target) {

        var confirm = window.confirm("Delete chainlink?");
        if( confirm == false ) {
                return
        }

        var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.location.href, true);
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.setRequestHeader('type', 'chainlink');
        xhr.setRequestHeader('target', target);
        xhr.send();
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        deinstantiateElement(target)
                }
        }
}


export function deleteContent(target) {
        var confirm = window.confirm("Delete element?");
        if( confirm == false ) {
                return
        }

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.location.href, true);
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.setRequestHeader('type', 'content');
        xhr.setRequestHeader('target', target);
        xhr.send();
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        deinstantiateElement(target)
                }
        }
}

export function renameDoc() {

        const header = document.getElementById('doc-title');
        const wrapper = document.getElementById('header-display');
        const title = header.innerHTML;

        window.removeEventListener("keydown", parseKeyDown);
        
        var _listener = function (e) { escape(e, _listener, title, "h1") };
        window.addEventListener("keydown", _listener);

        const container = document.createElement("div");
        const root = createRoot(container);

        deinstantiateElement("header-display");

        container.id = "chainlink-edit-form";
        container.setAttribute("index", "0");
        root.render(<ElementCreationForm placeholder="enter Article title" />);
        wrapper.appendChild(container);

        deleteButtons();         
        container.addEventListener("submit", function(event) {
                event.preventDefault();
                //addElement(type, input.value, url, order);
                const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                xhr.setRequestHeader('type', 'doc');
                xhr.setRequestHeader('title', event.target.input.value);
                xhr.setRequestHeader('target', 'null');
                xhr.send();
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                //window.location.reload();
                        }
                }

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", _listener)
                //_addButtons();
        });

        header.remove();
}

/**
 * Edit the target chainlink. Instantiate a form to allow the user to change the content of this Chainlink.
 *
 * @param {string} target - this string indicates the id of the chainlink element to edit
 * @returns {null}
 */
export function editChainlink(target) {
        const chainlink = document.getElementById(target);
        const title = chainlink.querySelector(".chainlink-inner-text").textContent;
        const url = getUrlFromId(chainlink.id);
        const order = chainlink.index;
        // The frontIndex specifies the index of this Chainlink as rendered on the page.
        const frontIndex = parseInt(chainlink.getAttribute("index"));
        const element = new Chainlink(title, url, null, true, 0, order);
        const _listener = function (e) {
                escape(e, _listener, "", element)
        };

        let contents = []
        let sibling = chainlink;
        while (sibling) {
                if (sibling !== chainlink) {
                        contents.push(sibling)
                }
                sibling = sibling.nextElementSibling;
        }


        // html elements to create
        const container = document.createElement("div");
        const root = createRoot(container);

        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);

        container.id = "chainlink-edit-form";
        container.setAttribute("index", chainlink.getAttribute("index"));
        root.render(<ElementCreationForm placeholder="enter Chainlink title" value={title} />);
        chainlink.insertAdjacentElement("afterend", container);

        container.addEventListener("submit", function(event) {
                event.preventDefault();
                //addElement(type, input.value, url, order);
                const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                xhr.setRequestHeader('type', 'chainlink');
                xhr.setRequestHeader('title', event.target.input.value);
                xhr.setRequestHeader('target', target);
                xhr.send();
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                container.parentElement.remove();
                                const updatedElement = element;
                                updatedElement.title = event.target.input.value;
                                instantiateElement(updatedElement, frontIndex, contents);
                        }
                }

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", _listener)
        });
        chainlink.remove();
        refresh();
}


/**
 * Edit the target Content. Instantiate a form to allow the user to edit this content.
 *
 * @param {string} target - This string indicates the id of the Content to edit
 * @returns {null}
 */
export function editContent(target) {

        const wrapper = document.getElementById(target);
        const content = wrapper.querySelector(".inner-content");
        const title = content.textContent;
        const url = getUrlFromId(wrapper.id);
        const order = getOrderFromId(wrapper.id);
        const tag = wrapper.getAttribute("tag");
        const index = parseInt(wrapper.getAttribute("index"));
        let element = new Content(tag, title, url, null, true, 0, order);

        const _listener = function (e) {
                escape(e, _listener, "", element);
        };

        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);

        const container = document.createElement("div");
        const root = createRoot(container);

        container.id = "content-edit-form";
        container.setAttribute("index", wrapper.getAttribute("index"));
        root.render(<ElementCreationForm placeholder="enter content title" value={title}/>);
        wrapper.insertAdjacentElement("afterend", container);

        container.addEventListener("submit", function(event) {
                event.preventDefault();
                let csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                xhr.setRequestHeader('type', 'content');
                xhr.setRequestHeader('title', event.target.input.value);
                xhr.setRequestHeader('target', target);
                xhr.send();
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                container.remove();
                                const updatedElement = element;
                                updatedElement.content = event.target.input.value;
                                instantiateElement(updatedElement, index, null);
                        }
                }
                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", _listener);
        });

        wrapper.remove();
        refresh();
}

function deinstantiateElement(id) {

        let obj_to_remove = document.getElementById(id);
        let objToRemoveIndex = parseInt(obj_to_remove.getAttribute("index"));

        if (obj_to_remove.className === "article-wrapper") {
                obj_to_remove.firstElementChild.remove();
        }

        else if (obj_to_remove.getAttribute("class") === "chainlink-wrapper") {
                let nextSiblingParent = obj_to_remove.parentElement.nextElementSibling;
                while (nextSiblingParent) {
                        // Update the IDs of siblings with higher order to account for this chainlink getting removed.
                        let nextSibling = getMatchedChildren(nextSiblingParent, ["chainlink-wrapper"])[0];
                        let orderDisplay = getMatchedChildren(nextSiblingParent, ["chainlink-order"])[0];
                        let oldIdPrefix = getPrefixFromId(nextSibling.getAttribute("id"));
                        let oldIdUrl = getUrlFromId(nextSibling.getAttribute("id"));
                        let oldIdOrder = getOrderFromId(nextSibling.getAttribute("id"));

                        // Construct the new ID for this sibling by subtracting 1 from its order (to account for the
                        // absence of the Content Element that was just deleted).
                        let newOrder = oldIdOrder - 1;
                        let newId = oldIdPrefix + "-" + oldIdUrl + "-" + newOrder;
                        nextSibling.setAttribute("id", newId)

                        // Update the number that appears on the Chainlink header to account for the deleted chainlink.
                        orderDisplay.textContent = "#" + newOrder.toString();

                        // Move on to update the next sibling.
                        nextSiblingParent = nextSiblingParent.nextElementSibling;
                }
                obj_to_remove.parentElement.remove();
        }

        else if (obj_to_remove.getAttribute("class") === "content-wrapper") {
                let nextSibling = obj_to_remove.nextElementSibling;
                while (nextSibling) {
                        // Extract the 3 components of an Element identifier (prefix, url, and order).
                        let oldIdPrefix = getPrefixFromId(nextSibling.getAttribute("id"));
                        let oldIdUrl = getUrlFromId(nextSibling.getAttribute("id"));
                        let oldIdOrder = getOrderFromId(nextSibling.getAttribute("id"));

                        // Construct the new ID for this sibling by subtracting 1 from its order (to account for the
                        // absence of the Content Element that was just deleted).
                        let newOrder = oldIdOrder - 1;
                        let newId = oldIdPrefix + "-" + oldIdUrl + "-" + newOrder;
                        nextSibling.setAttribute("id", newId)
                        nextSibling = nextSibling.nextElementSibling;
                }
                obj_to_remove.remove();
        }


        //elementsEditButtonEventHandlers.splice(objToRemoveIndex, 1);
        removeEditButtons();
        instantiateEditButtons();
        refresh();   // Now that the Chainlink and its children are instantiated assign indices
}


/**
 * Extracts and returns the order value from a given identifier. Every element identifier has 3 parts in this order:
 * Prefix - Url - Order. This function returns the Order (3rd part).
 *
 * @param {string} id - The identifier containing a dash-separated value.
 * @returns {number} The extracted order value. NOTE: This is a number not a string.
 * @throws {Error} Throws an error if the specified value after the dash is not a valid integer or if the identifier format is invalid.
 */
export function getOrderFromId(id) {
  if (typeof id !== 'string') {
    throw new TypeError("The argument must be a string");
  }

  const lastIndex = id.lastIndexOf("-");


  if (lastIndex !== -1) {
    let order = parseInt(id.slice(lastIndex + 1));
    if (isNaN(order)) {
        throw new Error("The value specified after the dash must be an int");
    }
    return order;
  } else {
        throw new Error("An invalid id was specified. Make sure the supplied id contains a dash.")
  }
}


/**
 * Extracts and returns the url from a given identifier. Every element identifier has 3 parts in this order:
 * Prefix - Url - Order. This function returns the Url (2nd part).
 *
 * @param {string} id - The identifier containing a dash-separated value.
 * @returns {string} The url of this id.
 * @throws {TypeError} Throws an error if the input is not a string.
 * @throws {Error} Throws an error if the identifier format is invalid (doesn't contain a dash).
 */
export function getUrlFromId(id) {
  if (typeof id !== 'string') {
    throw new TypeError("The argument must be a string");
  }

  const firstIndex = id.indexOf("-") + 1;
  const lastIndex = id.lastIndexOf("-");

  if (lastIndex !== -1) {
    return id.slice(firstIndex, lastIndex);

  } else {
        throw new Error("An invalid id was specified. Make sure the supplied id contains a dash.")
  }
}


/**
 * Extracts and returns the prefix from a given identifier. Every element identifier has 3 parts in this order:
 * Prefix - Url - Order. This function returns the Prefix (1st part).
 *
 * @param {string} id - The identifier containing a dash-separated value.
 * @returns {string} The extracted prefix.
 * @throws {TypeError} Throws an error if the input is not a string.
 * @throws {Error} Throws an error if the identifier format is invalid (doesn't contain a dash).
 */
export function getPrefixFromId(id) {
  if (typeof id !== 'string') {
    throw new TypeError("The argument must be a string");
  }

  const firstIndex = 0;
  const lastIndex = id.indexOf("-");

  if (lastIndex !== -1) {
    return id.slice(firstIndex, lastIndex);

  } else {
        throw new Error("An invalid id was specified. A prefix wasn't able to be identified for this id.")
  }
}


/**
 * Function: getMatchedChildren
 *
 * Description:
 * This function takes a parent element and an array of class names to match.
 * It queries the parent element for children with the specified classes and returns an array of matched elements.
 *
 * @param {HTMLElement} parent - The parent element to search for children.
 * @param {string[]} matchThis - An array of class names to match.
 * @returns {} - An array containing the matched child elements.
 *
 * Example Usage:
 * const parentElement = document.getElementById('parent');
 * const matchedChildren = getMatchedChildren(parentElement, ['class1', 'class2']);
 */
function getMatchedChildren(parent, matchThis) {
        const selectors = matchThis.map(className => `.${className}`).join(', ');
        return (Array.from(parent.querySelectorAll(selectors)));
}


/**
 * Formats a date string into a human-readable date and time format.
 *
 * @param {string} originalDateString - The input date string in the format "YYYY-MM-DDTHH:mm:ss.SSSZ".
 * @returns {string} - The formatted date string in the format "Mon. 20, 2024, 11:43 p.m." or "Invalid date" if the input is not a valid date.
 */
export function formatDateString(originalDateString) {
  const originalDate = new Date(originalDateString);

  // Check if the date is valid
  if (isNaN(originalDate.getTime())) {
    return "Invalid date";
  }

  const formattedDate = originalDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZoneName: 'short'
  });

  return formattedDate;
}
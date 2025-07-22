/* React imports */
import React from "react";
import { createRoot, hydrateRoot, useRef, useEffect } from "react-dom/client";
import { TagType, Element, Collection, Chainlink, Content, Header, Footer } from "./elementClassDefinitions.js"
import {
        ChainlinkEditButtons,
        ChainlinkElement,
        ContentEditButtons,
        ContentElement,
        CreateBodyEditButtons, CreateFooterEditButtons,
        CreateHeaderEditButtons,
        ElementCreationForm, ElementDeletionForm, ChainlinkDeletionForm,
        NoElements, ElementDisplayAsComponents, ChainlinkDisplayAsComponents
} from "./collectionComponentLibrary.js"
import {
        getOrderFromId, getUrlFromId, formatDateString, getPrefixFromId, getMatchedChildren
} from "./staticUtils";


/* Variables that store 1 or more event listeners so that they be referenced and de-registered later */
export let elementsEditButtonEventHandlers = [];

// State variables to describe the state of the page. These can be called to reliably determine something about the current page
let collectionUrl;
let isArticle;
let isChainlink;
let articleIsEmpty;
let chainlinkIsEmpty;
let bodyEditButtons;
//let numBodyElements;        // the number of Elements rendered on the page
let numFooterElements;
let numHeaderElements;
let bodyFormIsActive;
let anyFormIsActive;
let headerFormIsActive;
let footerFormIsActive;
let collectionTitleDefined;
let cursor;             // the cursor is a positive integer representing the position at which new Elements will be created. By default, it's equal to numElements (which is to say it's positioned at the end of the Element list). Cursor values are indices of elements and when a new element is created, that elements new index will be what the cursor was right before it was created (after which the cursor value will increment)
let elementsComponent = undefined;

/* Static Variables */
const bodyElementClassNames = ["chainlink-wrapper", "content-wrapper"]; // define the set of classnames that identify body Elements
const contentElementClassNames = ["content-wrapper"];
const headerElementClassNames = ["header-element-wrapper"];
const footerElementClassNames = ["footer-element-wrapper"];
const chainlinkElementNames = ["chainlink"];
const bodyElementNames = ["P", "CODE", "BR", "H3", "LI", "LINK", "NOTE", "IMG", "chainlink"];
const formClassNames = ["content-creation-form"];

// These constants define the internal names used to identify different Element types. These should be used to ensure
// that continuity between the backend names and frontend names is kept.

// Body refers to Elements that are instantiated and exist inside a Chainlink
const bodyTypes = ["P", "CODE", "BR", "H3", "LI", "LINK", "NOTE", "IMG"];

// Chainlink refers to the Chainlink Element
const chainlinkTypes = ["CL"];

// Header Elements appear above all Chainlink Elements in their own section. An example of a header Element would be
// The Title which is special in that there can be only one defined per Collection.
const headerTypes = ["H1", "HBNR"];

// Footer Elements appear at the bottom of the Collection and typically contain boilerplate text (like a list of links)
// along with clarifying "endnotes" that explain features of the Collection.
const footerTypes = ["EN", "FTRLI"];

// Collections are web pages that contain content. A user-friendly synonym might be "article" as a Collection is a web
// page that often contains similar items that an article would have.
const collectionTypes = ["COL"];

// This dynamic variable indicates the number of currently rendered chainlink elements.
export const numChainlinkElements = {
    get value() {
        const selector = chainlinkElementNames.map(tagValue => `[tag="${tagValue}"]`).join(', ');
        const elements = document.querySelectorAll(selector);
        return elements.length;
    }
};

// variable indicates the number of elements currently rendered on the screen
export const numBodyElements = {
        get value() {
                const selector = bodyElementNames.map(tagValue => `[tag="${tagValue}"]`).join(', ');
                const elements = document.querySelectorAll(selector);
                return (Array.from(elements).length);
        }
};

// Set up state variables after DOM is ready to be read
document.addEventListener("DOMContentLoaded", function() {

        /* Read-Only flag variables */

        /* Boolean flags */

        /* Javascript objects that update alongside the page and modify it */

        // this flag indicates that Article view is current
        collectionUrl = {
                get value() {
                        const url = document.getElementById("collection-url");
                        return url.value;
                }
        };

        isArticle = {
                get value() {
                        return (document.getElementById("element-display").getAttribute("template") === "collection");
                }
        };
        // flag indicates that Chainlink view is current
        isChainlink = {
                get value() {
                        return (document.getElementById("element-display").getAttribute("template") === "chainlink");
                }
        };

        // flag indicates that the chainlink has no text display. This flag is only set in Chainlink view
        chainlinkIsEmpty = {
                get value() {
                        if (!document.getElementById("chainlink-display").firstElementChild) {
                                return false;
                        }
                        return (document.getElementById("chainlink-display").firstElementChild.childElementCount === 1 && isChainlink.value);
                }
        };

        headerFormIsActive = {
                get value() {
                        if (document.getElementById("header-creation-form")) {
                                return true;
                        } else {
                                return false;
                        }
                }
        }

        bodyFormIsActive = {
                get value() {
                        if (document.getElementById("chainlink-creation-form") || document.getElementById("content-creation-form")) {
                                return true;
                        } else {
                                return false;
                        }
                }
        };

        footerFormIsActive = {
                get value() {
                        if (document.getElementById("footer-creation-form")) {
                                return true;
                        } else {
                                return false;
                        }
                }
        }

        anyFormIsActive = {
                get value() {
                        if (bodyFormIsActive.value || headerFormIsActive.value || footerFormIsActive.value) {
                                return true;
                        } else {
                                return false;
                        }
                }
        }

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

        collectionTitleDefined = {
                get value() {
                        return (document.querySelector("#header-display h1") !== null);
                }
        }

        /* Javascript objects with setters that alter contents of the page when called */

        // cursor
        cursor = {
                get value() {
                        return (numBodyElements.value - 1);         // Temporary fix cursor at the end position
                }
        };

        // contentButtons indicates the existence of buttons that create text on the page
        /*bodyEditButtons = {
                _value: false,
                bodyRoot: createRoot(document.getElementById("chainlink-placeholder")),
                headerRoot: createRoot(document.getElementById("header-placeholder")),
                footerRoot: createRoot(document.getElementById("footer-placeholder")),
                get value() {
                        return this._value;
                },
                set value(newValue) {
                        if (newValue !== this._value) {
                                this._value = newValue;
                                this.bodyRoot.render(<CreateBodyEditButtons bitmask={this._value.substring(1, 3)}/>);
                                this.headerRoot.render(<CreateHeaderEditButtons bitmask={this._value.substring(0, 1)}/>);
                                this.footerRoot.render(<CreateFooterEditButtons bitmask={this._value.substring(3, 4)}/>);
                        }
                }
        };*/

        //let colForm = document.getElementById("add-col-form");
        //colForm.addEventListener("submit", (event)=>{event.preventDefault(); makeForm("COL")});
});

/**
 * This function should be called by a controller only once.
 *
 * @returns {null}
 */
export function initialize(edit) {
        let editingEnabled = edit;
        if (editingEnabled == true) {
                refresh();
                elementsComponent = createRoot(document.getElementById("chainlink-display"));
                elementsComponent.render(<ChainlinkDisplayAsComponents/>);
                window.addEventListener("keydown", parseKeyDown);
                refresh();
        }
}

export function storeEditButtonHandlers(editFunction, deleteFunction) {
        elementsEditButtonEventHandlers.push([editFunction, deleteFunction]);
}

/**
 * Assign indices to Elements. The text element is always index 0.
 *
 * @returns {null}
 */
export function refresh() {
        // Assign indices to all elements in the collection/chainlink body
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
                chainlinkInfo.push([element.querySelector(".chainlink-inner-content").textContent, element.id])
        });

        chainlinkInfo.forEach(function(element) {
                let listItem = document.createElement("li");
                let link = document.createElement("a");
                link.textContent = ">>>" + element[0];
                link.setAttribute("class", "inline-url");
                link.setAttribute("href", "#" + element[1]);
                listItem.appendChild(link);
                list.appendChild(listItem);
        });

        // Remove or add the "MISSING" marker for the Collection.
        const chainlinkElements = document.getElementById("chainlink-display");
        const headerElements = document.getElementById("header-elements");
        const footerElements = document.getElementById("footer-elements");
        let noClMarker = document.getElementById("missing-body");
        let noFtMarker = document.getElementById("missing-footer");
        let noHrMarker = document.getElementById("missing-header");
        if (numBodyElements.value > 0 || bodyFormIsActive.value) {
                if (noClMarker) {
                        noClMarker.remove()
                }
        } else {
                if (noClMarker === null) {
                        const container = document.createElement("div");
                        container.className = "no-elements";
                        container.id = "missing-body"
                        const root = createRoot(container);
                        chainlinkElements.append(container);
                        root.render(<NoElements element={"BODY"}/>);
                }
        }

        // Set or unset the "missing header" warning.
        if (numHeaderElements.value > 0 || headerFormIsActive.value) {
                if (noHrMarker) {
                        noHrMarker.remove()
                }
        } else {
                if (noHrMarker === null) {
                        const container = document.createElement("div");
                        container.id = "missing-header";
                        container.className = "no-elements";
                        const root = createRoot(container);
                        headerElements.append(container);
                        root.render(<NoElements element={"HEADER"}/>);
                }
        }

        if (numFooterElements.value > 0 || footerFormIsActive.value) {
                if (noFtMarker) {
                        noFtMarker.remove()
                }
        } else {

                if (noFtMarker === null) {
                        const container = document.createElement("div");
                        const root = createRoot(container);
                        container.id = "missing-footer";
                        container.className = "no-elements";
                        footerElements.append(container);
                        root.render(<NoElements element={"FOOTER"}/>);
                }
        }

        // Remove or add "no text" marker for each Chainlink
        let cls = document.querySelectorAll(".chainlink");
        const selector = contentElementClassNames.map(className => `.${className}`).join(', ');
        for (let i = 0; i < cls.length; i++) {
                // If the number of text elements that are children of this chainlink is zero then display the
                // "no text" marker.
                let numChildElements = Array.from(cls[i].querySelectorAll(selector)).length;
                let marker = cls[i].querySelector(".no-elements");
                if (numChildElements === 0 && !cls[i].querySelector("#crud-form")) {
                        if (marker === null) {
                                const container = document.createElement("div");
                                const root = createRoot(container);
                                container.className = "no-elements";
                                cls[i].append(container);
                                root.render(<NoElements element={"CHAINLINK"}/>);
                        }
                } else {
                        // If there are elements under this chainlink then find the "no text" marker (if it exists)
                        // and remove it. Otherwise, just we're done here.
                        if (marker) {
                                marker.remove();
                        }
                }
        }




        // Everything below this (about the edit buttons) should probably be removed. This won't be used probably
        // because it will be handled by the react components themselves.


        // This variable is a string consisting of a set number of bits each of which indicates that a specific button
        // group should be enabled or disabled. The first bit is for the header buttons.
        let editButtonsBitmask = "";

        // Determine if the header edit buttons should be disabled or not.
        console.log(collectionTitleDefined.value)
        if (anyFormIsActive.value || collectionTitleDefined.value) {
                editButtonsBitmask += "0";
        } else {
                editButtonsBitmask += "1";
        }

        // Grey out buttons (or un-grey them) if forms or other factors are active
        if (anyFormIsActive.value) {
                editButtonsBitmask += "00";
        } else {
                if (isArticle.value) {
                        if (numBodyElements.value === 0) {
                                editButtonsBitmask += "10";
                        } else {
                                editButtonsBitmask += "11";
                        }
                } else if (isChainlink.value) {
                        editButtonsBitmask += "01";
                }
        }

        // Determine the footer elements
        if (anyFormIsActive.value) {
                editButtonsBitmask += "0";
        } else {
                editButtonsBitmask += "1";
        }

        // Set the actual button enabling/disabling into motion. This is what does the actual work for setting/unsetting
        // the edit buttons as active or not.
        //bodyEditButtons.value = editButtonsBitmask;

        showDiagnostics();
}


function showDiagnostics() {
        console.log("collectionUrl: " + collectionUrl.value);
        console.log("isArticle: " + isArticle.value);
        console.log("isChainlink: " + isChainlink.value);
        console.log("chainlinkIsEmpty: " + chainlinkIsEmpty.value);
        console.log("articleIsEmpty: " + (numBodyElements.value === 0).toString());
        console.log("numElements: " + numBodyElements.value);
        console.log("numChainlinks: " + numChainlinkElements.value);
}

/**
 * Write javascript object parameter to database
 *
 * @param {Element} element - a descendent class of Element to be written to the database
 * @returns {null}
 */
function addElement(element) {
        /*const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("POST", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";

        // dispatch an AJAX post
        xhr.send(JSON.stringify(element));

         */
        // Our target endpoint is the generic view which is the same as this web page.
        let url = window.location.href
        // instantiate element once AJAX Post comes back successful
        let xhr = dispatchAjaxAndAwaitResponse("POST", url, element);
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        instantiateElement(xhr.response, numBodyElements.value, null);
                }
        };
}


/**
 * Dispatches an AJAX request and returns the XMLHttpRequest object.
 *
 * @param {string} requestMethod - The HTTP method to use for the request (e.g., 'GET', 'POST').
 * @param {string} url - The URL to which the request is sent.
 * @param {Object} element - The data to be sent with the request, typically a JSON object.
 * @return {XMLHttpRequest} - The XMLHttpRequest object used to dispatch the request.
 */
function dispatchAjaxAndAwaitResponse(requestMethod, url, element) {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open(requestMethod, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";

        // dispatch an AJAX post
        xhr.send(JSON.stringify(element));

        return xhr;
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
/*function instantiateElement(element, index, children) {
        let previousElementIndex = index - 1;                                 // the index of the Element directly before the Element to be created
        let previousElement = null;                                             // the Element directly before the Element that will be created
        let adjacentElement = null;                                             // the element right before the element to be inserted

        if (chainlinkTypes.includes(element.type)) {
                const parentElement = document.getElementById("chainlink-display");
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
                root.render(<ChainlinkElement text={element.text} url={element.url}
                                              date={element.date} children={children}/>);
        } else if (headerTypes.includes(element.type)) {
                const parentElement = document.getElementById("header-elements");
                const container = document.createElement("h1");
                const root = createRoot(container);
                container.className = "header-element-wrapper";
                container.id = "collection-title";
                container.innerText = element.text;
                parentElement.appendChild(container);
                refresh();
        // Handle the case where the user is trying to instantiate a footer element
        } else if (footerTypes.includes(element.type)) {
                const parentElement = document.getElementById("footer-elements");
                const container = document.createElement("p");
                const root = createRoot(container);
                container.className = "footer-element-wrapper";
                container.id = (element.url).toString() + " collection-footer";
                container.innerText = element.text;
                parentElement.appendChild(container);
                refresh();
        } else if (bodyTypes.includes(element.type)) {
                adjacentElement = document.querySelector(`[index="${previousElementIndex}"]`);
                const container = document.createElement("div");
                const root = createRoot(container);
                container.id = element.url;
                container.className = "content-wrapper";
                container.setAttribute("tag", element.type);
                //container.setAttribute("index", numElements.value);
                /*if (adjacentElement.className == "chainlink-wrapper") {               // if we are inserting a text Element at the start of a Chainlink...
                        parentElement = adjacentElement;                                // the chainlink will be the parent of this new Element
                        firstChild = parentElement.firstChild;                          // get the original first child of the Chainlink
                        parentElement.insertBefore(container, firstChild);              // insert the 
                }
                adjacentElement.insertAdjacentElement("afterend", container);
                /*else
                        parentElement.appendChild(container);
                root.render(<ContentElement type={element.type} text={element.text} />);
        }
}*/

/*  JS public functions */

/**
 * Create a form for editing an element (specified by type) and call addElement to update the database with the form contents
 * 
 * @param {string} type - string representation of the type of element that the edit form will be created for
 * @returns {null}
 */
/*export function makeForm(type) {
        const currentDateTime = new Date().toISOString();
        const _listener = function (e) { escape(e, _listener, null) };

        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);

        // html elements to create
        const container = document.createElement("div");
        const root = createRoot(container);
        const chainlink = document.getElementById("chainlink-display").lastElementChild;
        let formAnchor = document.getElementById("form-anchor");

        // fields to pass to addElement for Element creation
        let element = undefined;
        let url = undefined;
        let order = undefined;
        const isPublic = undefined;
        const count = undefined;

        // If we are making this form for the creation of a chainlink element
        if (chainlinkTypes.includes(type)) {
                //const list = document.getElementById('chainlink-display');
                container.id = "chainlink-creation-form";
                order = document.getElementById("chainlink-display").childElementCount - 1;
                root.render(<ElementCreationForm placeholder="enter chainlink content" type={type} order={order}/>);
                formAnchor.appendChild(container);
        }

        // If we are making this form for the creation of a chainlink-display element that is not a chainlink.
        else if (bodyTypes.includes(type)) {

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
                url = "content-" + getUrlFromId(chainlink.querySelector(".chainlink-wrapper").getAttribute('id')) + '-' + order;

                container.id = "content-creation-form";
                root.render(<ElementCreationForm placeholder="enter header content" type={type} url={url} order={order}/>);
                //chainlink.appendChild(container);
                formAnchor.appendChild(container);
        }

        // Otherwise if we are making this form for the creation of a header element.
        else if (headerTypes.includes(type)) {
                if (type == "H1") {
                        let order = 0; // TODO fix this. The H1 will not always be the first element... or will it???? haven't decided yet
                        const header = document.getElementById("header-elements");
                        container.id = "header-creation-form";
                        root.render(<ElementCreationForm placeholder="enter header content" type={type} order={order}/>);
                        header.appendChild(container);
                } else if (type == "HBNR") {

                }
        }

        // Identify if this is an Element that will be placed in the footer section.
        else if (footerTypes.includes(type)) {
                if (type === "EN") {
                        const footer = document.getElementById("footer-elements");
                        container.id = "footer-creation-form";
                        root.render(<ElementCreationForm placeholder="enter footer content" type={type}/>);
                        footer.appendChild(container);
                }
        }

        // This means the user wants to create a new collection. They probably pressed the "+" button in the list of
        // collection titles.
        else if (collectionTypes.includes(type)) {
                const addColButton = document.getElementById("add-col-form");
                container.id = "collection-creation-form";
                root.render(<ElementCreationForm placeholder="enter the title for the new collection (optional)" type={type}/>);
                addColButton.appendChild(container);
        }


        For the form submit event listener we will grab the values from the form and simply send those values out
        as http request headers via the addElement() function.

        container.addEventListener("submit", function(event) {
                event.preventDefault();

                let formData = new FormData(event.target);
                let formFields = {};

                // Store the field name/value pairs of all fields in the form.
                formData.forEach((value, key) => {
                        formFields[key] = value;
                });

                window.addEventListener("keydown", parseKeyDown);
                addElement(formFields);
                container.remove();
                window.removeEventListener("keydown", _listener);
                refresh();
        });
}*/

/**œ
 * Callback function used for when the user presses the Esc key while an input dialogue is open
**/
function escape(e, ref, element) {
        // if the escape key is pressed...
        if (e.key === "Escape") {
                let form = document.getElementById('crud-form').parentNode;

                if (element) {
                        form.insertAdjacentElement('afterend', element);
                }
                form.remove();

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", ref);
                refresh();
        }
}

/*
 * Create a new Article object and write it to the database via AJAX. Then reload the page if the page write was successful
 *
 * @returns {null}
 */
/*
export function createFence() {
        const currentDateTime = new Date().toISOString();
        const article = new Collection("article", "", currentDateTime, false, 0, 0);
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/patchwork/article/generate.html", true);
        xhr.setRequestHeader('Body-Type', 'application/json');
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
                        putRequest.setRequestHeader('type', 'collection');
                        putRequest.setRequestHeader('title', "fence" + url_substring);
                        putRequest.setRequestHeader('target', 'null');
                        putRequest.send();
                        putRequest.onreadystatechange = function() {
                                window.location.replace("/patchwork/article/" + url + ".html");
                        }
                }
        }
}
 */

// Keypress parsing function for moving the page up and down
/*export function parseKeyDown(e) {

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
                        makeForm('P');
                        break;
                case "c":
                        e.preventDefault();
                        makeForm('CODE');
                        break;
                case "n":
                        e.preventDefault();
                        makeForm('CL');
                        break;
                case "h":
                        e.preventDefault();
                        makeForm('H3');
                        break;
                case "b":
                        e.preventDefault();
                        makeForm('BR');
                        break;
        }
}*/

export function deleteButtons() {
        document.getElementById('add-buttons').remove();
}

export function instantiateEditButtons() {

        var numChainlinks = document.getElementsByClassName("chainlink").length;
        var wrappers = document.getElementsByClassName("chainlink-wrapper");
        for (let i = 0; i < numChainlinks; i++) {
                let container = document.createElement("div");
                let root = createRoot(container);
                container.className = "chainlink-buttons-wrapper";
                wrappers[i].appendChild(container);
                root.render(<ChainlinkEditButtons i={i} wrappers={wrappers} />);
        }

        var numContents = document.getElementsByClassName("content-wrapper").length;
        var wrappers = document.getElementsByClassName("content-wrapper");
        for (let i = 0; i < numContents; i++) {
                let container = document.createElement("div");
                let root = createRoot(container);
                container.className = "context-buttons-wrapper";
                wrappers[i].appendChild(container);
                root.render(<ContentEditButtons i={i} wrappers={wrappers} />);
        }
}

export function removeEditButtons() {

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
        xhr.setRequestHeader('type', 'collection');
        xhr.send();
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        window.location.href = "index.html";
                }
        }
}

export function deleteChainlink1(target) {
        console.log("deleteChainlink1 called with target: " + target);
}


export function deleteChainlink(target) {

        /*
        var confirm = window.confirm("Delete chainlink?");
        if( confirm == false ) {
                return
        }

        var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.location.href, true);
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.setRequestHeader('type', 'CL');
        xhr.setRequestHeader('target', target);
        xhr.send();
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        deinstantiateElement(target)
                }
        }

         */

        const chainlink = document.getElementById(target);
        // The frontIndex specifies the index of this Chainlink as rendered on the page.
        const _listener = function (e) {
                escape(e, _listener, chainlink)
        };

        // Capture the child elements of this chainlink. Whenever we update a chainlink we supply list of child nodes
        // to the instantiateElement() because if the chainlink order is changed then its children should follow it.
        let chainlinkChildren = []
        // Loop through all siblings (technically children but they're on the same level as the <h2>) and add them to
        // the list of children.
        let sibling = chainlink;
        while (sibling) {
                if (sibling !== chainlink) {
                        chainlinkChildren.push(sibling)
                }
                sibling = sibling.nextElementSibling;
        }

        const container = document.createElement("div");
        const root = createRoot(container);

        // Remove keybinds temporarily while the form is open so that the user doesn't accidentally open another form
        // via hotkey.
        window.removeEventListener("keydown", parseKeyDown);
        // Add hotkey for escape key to close the form.
        window.addEventListener("keydown", _listener);

        // Instantiate the form for editing this chainlink and supply all the default parameter values from values
        // on this chainlink.
        container.id = "chainlink-delete-form";
        container.setAttribute("index", chainlink.getAttribute("index"));
        root.render(<ElementDeletionForm type="CL" furl={chainlink.id} />);
        chainlink.insertAdjacentElement("afterend", container);

        container.addEventListener("submit", function(event) {
                /*
                event.preventDefault();
                //addElement(type, input.value, url, order);
                const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);*/
                event.preventDefault();
                let formData = new FormData(event.target);
                let formFields = {}
                // Store the field name/value pairs of all fields in the form.
                formData.forEach((value, key) => {
                        formFields[key] = value;
                });

                dispatchAjaxAndAwaitResponse("DELETE", window.location.href, formFields).onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                let nextSiblingParent = container.parentElement.nextElementSibling;
                                while (nextSiblingParent) {
                                        // Update the IDs of siblings with higher order to account for this chainlink getting removed.
                                        let nextSibling = getMatchedChildren(nextSiblingParent, ["chainlink-wrapper"])[0];
                                        let orderDisplay = getMatchedChildren(nextSiblingParent, ["chainlink-order"])[0];
                                        let oldIdPrefix = getPrefixFromId(nextSibling.getAttribute("id"));
                                        let oldIdUrl = getUrlFromId(nextSibling.getAttribute("id"));
                                        let oldIdOrder = getOrderFromId(nextSibling.getAttribute("id"));

                                        // Construct the new ID for this sibling by subtracting 1 from its order (to account for the
                                        // absence of the Body Element that was just deleted).
                                        let newOrder = oldIdOrder - 1;
                                        let newId = oldIdPrefix + "-" + oldIdUrl + "-" + newOrder;
                                        nextSibling.setAttribute("id", newId)

                                        // Update the number that appears on the Chainlink header to account for the deleted chainlink.
                                        orderDisplay.textContent = "#" + newOrder.toString();

                                        // Move on to update the next sibling.
                                        nextSiblingParent = nextSiblingParent.nextElementSibling;
                                }
                                container.parentElement.remove();
                                removeEditButtons();
                                instantiateEditButtons();
                                refresh();
                                //deinstantiateElement(target);
                        }
                };

                /*
                xhr.send(JSON.stringify(formFields));
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                container.parentElement.remove();
                                instantiateElement(formFields, index, chainlinkChildren);
                        }
                }*/

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", _listener)
        });
        chainlink.remove();
        refresh();
}

export function deleteContent(target) {

        const wrapper = document.getElementById(target);
        const content = wrapper.querySelector(".inner-content");
        const title = content.textContent;
        const order = getOrderFromId(wrapper.id);
        const tag = wrapper.getAttribute("tag");
        const index = parseInt(wrapper.getAttribute("index"));

        const _listener = function (e) {
                escape(e, _listener, wrapper)
        };

        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);

        const container = document.createElement("div");
        const root = createRoot(container);

        container.id = "content-delete-form";
        container.setAttribute("index", wrapper.getAttribute("index"));
        root.render(<ElementDeletionForm type={tag} curl={wrapper.id} />);
        wrapper.insertAdjacentElement("afterend", container);

        container.addEventListener("submit", function(event) {
                event.preventDefault();

                let formData = new FormData(event.target);
                let formFields = {}
                // Store the field name/value pairs of all fields in the form.
                formData.forEach((value, key) => {
                        formFields[key] = value;
                });

                dispatchAjaxAndAwaitResponse("DELETE", window.location.href, formFields).onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {

                                // Update the ID field of all sibling elements:
                                let sibling = container.nextElementSibling;

                                while (sibling) {
                                        // Extract the current id
                                        const currentId = sibling.id;

                                        // Ensure the id matches the expected format
                                        if (currentId && currentId.startsWith("content-")) {
                                                // Find the part after the last dash and parse it as an integer
                                                const parts = currentId.split("-");
                                                const lastPart = parts[parts.length - 1];

                                                // Increment the last part if it's a valid number
                                                if (!isNaN(lastPart)) {
                                                        const incrementedValue = parseInt(lastPart, 10) - 1;
                                                        parts[parts.length - 1] = incrementedValue;

                                                        // Update the id
                                                        sibling.id = parts.join("-");
                                                }
                                        }

                                        // Move to the next sibling
                                        sibling = sibling.nextElementSibling;
                                }

                                container.remove();
                                removeEditButtons();
                                instantiateEditButtons();
                                refresh();
                                //deinstantiateElement(target);
                        }
                };

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", _listener);
        });

        wrapper.remove();
        refresh();

        /*const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.location.href, true);
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('type', 'content');
        xhr.setRequestHeader('target', target);
        xhr.send();
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        deinstantiateElement(target)
                }
        }

        let deletionRequestPayload = {
                type: tag,
                target: target
        };

        let url = window.location.href;

        // deinstantiate element once AJAX Post comes back successful
        dispatchAjaxAndAwaitResponse("DELETE", url, deletionRequestPayload).onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        deinstantiateElement(target);
                }
        };
        */
}


/**
 * Edit the target chainlink. Instantiate a form to allow the user to change the text of this Chainlink.
 *
 * @param {string} target - this string indicates the id of the chainlink element to edit
 * @returns {null}
 */
/*export function editChainlink(target) {
        const chainlink = document.getElementById(target);
        const text = chainlink.querySelector(".chainlink-inner-content").textContent;
        const order = getOrderFromId(chainlink.id);
        // The frontIndex specifies the index of this Chainlink as rendered on the page.
        const index = parseInt(chainlink.getAttribute("index"));
        const _listener = function (e) {
                escape(e, _listener, chainlink)
        };

        // Capture the child elements of this chainlink. Whenever we update a chainlink we supply list of child nodes
        // to the instantiateElement() because if the chainlink order is changed then its children should follow it.
        let chainlinkChildren = []
        // Loop through all siblings (technically children but they're on the same level as the <h2>) and add them to
        // the list of children.
        let sibling = chainlink;
        while (sibling) {
                if (sibling !== chainlink) {
                        chainlinkChildren.push(sibling)
                }
                sibling = sibling.nextElementSibling;
        }

        const container = document.createElement("div");
        const root = createRoot(container);

        // Remove keybinds temporarily while the form is open so that the user doesn't accidentally open another form
        // via hotkey.
        window.removeEventListener("keydown", parseKeyDown);
        // Add hotkey for escape key to close the form.
        window.addEventListener("keydown", _listener);

        // Instantiate the form for editing this chainlink and supply all the default parameter values from values
        // on this chainlink.
        container.id = "chainlink-edit-form";
        container.setAttribute("index", chainlink.getAttribute("index"));
        root.render(<ElementCreationForm placeholder="enter Chainlink title" type="CL" value={text} url={chainlink.id} order={order} />);
        chainlink.insertAdjacentElement("afterend", container);

        container.addEventListener("submit", function(event) {
                event.preventDefault();
                //addElement(type, input.value, url, order);
                const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);

                let formData = new FormData(event.target);
                let formFields = {}
                // Store the field name/value pairs of all fields in the form.
                formData.forEach((value, key) => {
                        formFields[key] = value;
                });

                xhr.send(JSON.stringify(formFields));
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                container.parentElement.remove();
                                instantiateElement(formFields, index, chainlinkChildren);
                        }
                }

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", _listener)
        });
        chainlink.remove();
        refresh();
}*/

/**
 * Edit the target Body. Instantiate a form to allow the user to edit this text.
 *
 * @param {string} target - This string indicates the id of the Body to edit
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
        //let element = new Content(tag, title, url, null, true, order);

        const _listener = function (e) {
                escape(e, _listener, wrapper)
        };

        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);

        const container = document.createElement("div");
        const root = createRoot(container);

        container.id = "content-edit-form";
        container.setAttribute("index", wrapper.getAttribute("index"));
        root.render(<ElementCreationForm placeholder="enter content title" type={tag} value={title} url={wrapper.id} order={order} />);
        wrapper.insertAdjacentElement("afterend", container);

        container.addEventListener("submit", function(event) {
                event.preventDefault();

                let formData = new FormData(event.target);
                let formFields = {}
                // Store the field name/value pairs of all fields in the form.
                formData.forEach((value, key) => {
                        formFields[key] = value;
                });

                dispatchAjaxAndAwaitResponse("PUT", window.location.href, formFields).onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                container.remove();
                                instantiateElement(formFields, index, null);
                        }
                };

                /*
                let csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                //xhr.setRequestHeader('type', 'content');
                //xhr.setRequestHeader("payload", JSON.stringify([{"text": event.target.input.value}]));
                //xhr.setRequestHeader('target', target);
                xhr.send(JSON.stringify(formFields));
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                container.remove();
                                instantiateElement(formFields, index, null);
                        }
                }
                */

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", _listener);
        });

        wrapper.remove();
        refresh();
}

function deinstantiateElement(id) {

        let obj_to_remove = document.getElementById(id);
        console.log(obj_to_remove);
        //let obj_to_remove = document.querySelector(`[index="${index}"]`);
        //let objToRemoveIndex = parseInt(obj_to_remove.getAttribute("index"));

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
                        // absence of the Body Element that was just deleted).
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
                        // absence of the Body Element that was just deleted).
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

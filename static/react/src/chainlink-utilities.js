/* React imports */
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Element, Article, Chainlink, Content } from './classes.js'


/* Variables that store 1 or more event listeners so that they be referenced and de-registered later */
var fenceEditButtonEventHandler;
var fenceDeleteButtonEventHandler;
var chainlinkEditButtonsEventHandlers = [];
var chainlinkDeleteButtonsEventHandlers = [];
var contentEditButtonsEventHandlers = [];
var contentDeleteButtonsEventHandlers = [];

// State variables to describe the state of the page. These can be called to reliable determine something about the current page
var isArticle;
var isChainlink;
var articleIsEmpty;
var chainlinkIsEmpty;
var chainlinkButton;
var contentButtons;
var numElements;        // the number of Elements rendered on the page
var cursor;             // the cursor is a positive integer representing the position at which new Elements will be created. By default it's equal to numElements (which is to say it's positioned at the end of the Element list). Cursor values are indices of elements and when a new element is created, that elements new index will be what the cursor was right before it was created (after which the cursor value will increment)

/* Static Variables */
const elementClassNames = ["article-wrapper", "chainlink-wrapper", "content-wrapper"]; // define the set of classnames that identify Elements


// Set up state variables after DOM is ready to be read
document.addEventListener("DOMContentLoaded", function() {

        /* Read-Only flag variables */

        /* Boolean flags */

        /* Javascript objects that update alongside the page and modify it */

        // this flag indicates that Article view is current
        isArticle = {
                get value() {
                        return (document.getElementById("chainlink-display").getAttribute("template") === "article"); 
                }
        };
        // flag indicates that Chainlink view is current
        isChainlink = {
                get value() {
                        return (document.getElementById("chainlink-display").getAttribute("template") === "chainlink"); 
                }
        };

        // flag indicates that the article has no chainlinks (and thus no content). This flag is only set in Article view
        articleIsEmpty = {
                get value() {
                        return (document.getElementById("chainlink-display").childElementCount === 0 && isArticle.value);
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

        // variable indicates the number of elements currently rendered on the screen
        numElements = {
                get value() {
                        const selector = elementClassNames.map(className => `.${className}`).join(', ');
                        const elements = document.querySelectorAll(selector);
                        return (Array.from(elements).length);
                }
        };


        /* Javascript objects with setters that alter contents of the page when called */

        // cursor
        cursor = {}

        // chainlinkButton is a boolean that indicates the presence of the button that creates Chainlinks
        chainlinkButton = {
                _value: false,
                root: createRoot(document.getElementById("chainlink-placeholder")),
                get value() {
                        return this._value;
                },
                set value(newValue) {
                        if (newValue !== this._value) {
                                this._value = newValue;
                                //const container = document.getElementById("chainlink-placeholder");
                                //const root = createRoot(container);
                                if (newValue === true) {
                                        this.root.render(<CreateChainlinkButton active={true}/>);
                                }
                                else {
                                        this.root.render(<CreateChainlinkButton active={false}/>);
                                }
                        }
                }
        };
        // contentButtons indicates the existence of buttons that create content on the page
        contentButtons = {
                _value: false,
                root: createRoot(document.getElementById("content-placeholder")),
                get value() {
                        return this._value;
                },
                set value(newValue) {
                        if (newValue !== this._value) {
                                this._value = newValue;
                                //const root = createRoot(container);
                                if (newValue === true) {
                                        this.root.render(<CreateContentButtons active={true}/>);
                                }
                                else {
                                        this.root.render(<CreateContentButtons active={false}/>);
                                }
                        }
                }
        };


});

/* React components */
function ContentCreationButtonsFive() {
        return (
                <React.Fragment>
                        <button id="add-p-btn" className="add-buttons" onClick={() => makeForm('paragraph')}>&lt;p&gt; paragraph</button>
                        <button id="add-h3-btn" className="add-buttons" onClick={() => makeForm('header3')}>&lt;h&gt; header</button>
                        <button id="add-cl-btn" className="add-buttons" onClick={() => makeForm('header2')}>&lt;n&gt; chainlink</button>
                        <button id="add-code-btn" className="add-buttons" onClick={() => makeForm('code')}>&lt;c&gt; code</button>
                        <button id="add-br-btn" className="add-buttons" onClick={() => makeForm('linebreak')}>&lt;b&gt; linebreak</button>
                </React.Fragment>
        );
}
function CreateContentButtons(props) {
        if (!props.active) {
                return null;
        }
        return (
                <React.Fragment>
                        <button id="add-p-btn" className="add-buttons" onClick={() => makeForm('paragraph')}>&lt;p&gt; paragraph</button>
                        <button id="add-h3-btn" className="add-buttons" onClick={() => makeForm('header3')}>&lt;h&gt; header</button>
                        <button id="add-code-btn" className="add-buttons" onClick={() => makeForm('code')}>&lt;c&gt; code</button>
                        <button id="add-br-btn" className="add-buttons" onClick={() => makeForm('linebreak')}>&lt;b&gt; linebreak</button>
                </React.Fragment>
        );
}
function CreateChainlinkButton(props) {
        if (!props.active) {
                return null;
        }
        return (
                <React.Fragment>
                        <button id="add-cl-btn" className="add-buttons" onClick={() => makeForm('header2')}>&lt;n&gt; chainlink</button>
                </React.Fragment>
        );
}
function FenceEditButtons() {
        fenceEditButtonEventHandler = function() { renameDoc(); };
        fenceDeleteButtonEventHandler = function() { deleteDoc(); };
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        <button id="doc-action-edit-title" onClick={fenceEditButtonEventHandler}>edit</button>
                        <button id="doc-action-delete-title" onClick={fenceDeleteButtonEventHandler}>delete</button>
                </React.Fragment>
        );
}
function ChainlinkEditButtons(props) {
        chainlinkEditButtonsEventHandlers.push(function() { editChainlink(props.wrappers[props.i].id) });
        chainlinkDeleteButtonsEventHandlers.push(function() { deleteChainlink(props.wrappers[props.i].id) });
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        <button className="cl-edit-btn" target={props.wrappers[props.i].id} onClick={chainlinkEditButtonsEventHandlers[chainlinkEditButtonsEventHandlers.length - 1]}>edit</button>
                        <button className="cl-del-btn" target={props.wrappers[props.i].id} onClick={chainlinkDeleteButtonsEventHandlers[chainlinkDeleteButtonsEventHandlers.length - 1]}>delete</button>
                </React.Fragment>
        );
}
function ChainlinkHeader(props) {
        return (
               <React.Fragment>
                        <span className="chainlink-inner-text">{props.title}</span>
               </React.Fragment>
        );
}
function ChainlinkCreationForm(props) {
        return (
                <React.Fragment>
                        <input autoFocus type="text" id="input" placeholder="enter chainlink name" />
                </React.Fragment>
        );
}
function ContentCreationForm(props) {
        return (
                <React.Fragment>
                        <input autoFocus type="text" id="input" placeholder={props.placeholder} />
                </React.Fragment>
        );
}
function ChainlinkElement(props) {

        useEffect(() => {
                _enumerateElements();
        }, []);

        return (
                <React.Fragment>
                        <div id={props.url} className="chainlink-wrapper">
                                <h2>
                                        <span className="chainlink-inner-text">
                                                {props.title}
                                        </span>
                                        <a className="inline-url header-url" href={"chainlink" + props.url + ".html"}>
                                                {">>>" + props.url.substring(0, 9)}
                                        </a>
                                </h2>
                                <div className="chainlink-buttons-wrapper">
                                        <i className="context-span-message">context action &lt; - - - - - -</i>
                                        <button className="cl-edit-btn" target={props.url}>edit</button>
                                        <button className="cl-del-btn" target={props.url}>delete</button>
                                </div>
                        </div>
                </React.Fragment>
        );
}
function ContentElement(props) {

        useEffect(() => {
                _enumerateElements();
        }, []);

        let Tag = "";
        if (props.type === 'header3') {
                Tag = 'h3';
        } else if (props.type === 'code') {
                Tag = 'code';
        } else if (props.type === 'paragraph') {
                Tag = 'p';
        } else if (props.type === 'linebreak') {
                Tag = 'br';
        } else {
                Tag = 'div';
        }

        if (Tag === 'br') {
                return (
                        <React.Fragment>
                                <span className="inner-content br">
                                        <i>&lt;!-- linebreak insert --&gt;</i>
                                </span>
                                <div className="context-buttons-wrapper">
                                        <i className="context-span-message">context action &lt; - - - - - - </i>
                                        <button className="cont-edit-btn">edit</button>
                                        <button className="cont-del-btn">delete</button>
                                </div>
                        </React.Fragment>
                );
        }
        else {
                return (
                        <React.Fragment>
                                <Tag className="inner-content">
                                        {props.content}
                                </Tag>
                                <div className="context-buttons-wrapper">
                                        <i className="context-span-message">context action &lt; - - - - - - </i>
                                        <button className="cont-edit-btn">edit</button>
                                        <button className="cont-del-btn">delete</button>
                                </div>
                        </React.Fragment>
                );
        }
}

/* JS utility functions (private) */

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
        }*/

        // Render chainlink/content creation buttons
        if (isArticle.value) {
                contentButtons.value = true;
                chainlinkButton.value = true;
        } else if (isChainlink.value) {
                contentButtons.value = true;
        } else if (articleIsEmpty.value) {
                chainlinkButton.value = true;
        } else if (chainlinkIsEmpty.value) {
                contentButtons.value = true;
        }

        _enumerateElements();
        showDiagnostics();
}


/**
 * Assign indices to Elements. The title element is always index 0. 
 *
 * @returns {null}
 */
function _enumerateElements() {
        var index = 0;
        const allElements = document.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
                const element = allElements[i];
                for (let j = 0; j < elementClassNames.length; j++) {
                        if (element.classList.contains(elementClassNames[j])) {
                                element.setAttribute("index", index);
                                index++;
                                break;
                        }
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
        console.log("articleIsEmpty: " + articleIsEmpty.value);
        console.log("numElements: " + numElements.value);
}

/**
 * Write javascript object parameter to database
 *
 * @param {Element} element - a descendent class of Element to be written to the database
 * @returns {null}
 */
function _addElement(element) {
        var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
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
                        instantiateElement(xhr.response, numElements.value);
                }
        }
}

/**
 * Create a representation of an element of type Chainlink or Content. Display this element under #chainlink-display
 *
 * @param {Object} element - XMLHttpRequest or Element object to instantiate on the screen
 * @returns {null}
 */
function instantiateElement(element, index) {
        const previousElementIndex = index - 1;                                                            // the index of the Element directly before the Element to be created
        const previousElement = document.querySelector(`[index="${previousElementIndex}"]`);            // the Element directly before the Element that will be created
        console.log(index);
        if (element instanceof Chainlink || element.type == "header2") {
                const container = document.createElement("section");
                const root = createRoot(container);
                container.className = "chainlink";
                previousElement.insertAdjacentElement("afterend", container);
                root.render(<ChainlinkElement title={element.title} url={element.url} />);

        } else if (element instanceof Content || element.type == "header3" || element.type == "code" || element.type == "paragraph" || element.type == "linebreak") {
                const container = document.createElement("div");
                const root = createRoot(container);
                container.className = "content-wrapper";
                //container.setAttribute("index", numElements.value);
                container.id = element.url + "-" + element.order;
                previousElement.insertAdjacentElement("afterend", container);
                root.render(<ContentElement type={element.type} content={element.content} url={element.url} />);
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
        const _listener = function (e) { escape(e, _listener, "", "") };

        const list = document.getElementById('chainlink-display');
        const section = document.createElement('section');
        const chainlink = document.getElementById("chainlink-display").lastElementChild;

        // html elements to create
        const container = document.createElement("form");
        const root = createRoot(container);

        window.removeEventListener("keyup", parseKeyUp);
        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);

        // fields to pass to addElement for Element creation
        var url = undefined;
        var order = undefined;
        var isPublic = undefined;
        var count = undefined;

        // This switch statement determines what Element type user is editing/creating based on the argument
        if (type == "header2") {
                order = document.getElementById("chainlink-display").childElementCount - 1;
                container.id = "chainlink-creation-form";
                root.render(<ChainlinkCreationForm />);
                list.appendChild(container);
        }
        else if (type == "header3") {
                url = chainlink.firstElementChild.getAttribute('id');
                order = chainlink.childElementCount - 1;
                container.id = "content-creation-form";
                root.render(<ContentCreationForm placeholder="enter header content" />);
                chainlink.appendChild(container);
        }
        else if (type == "paragraph") {
                url = chainlink.firstElementChild.getAttribute('id');
                order = chainlink.childElementCount - 1;
                container.id = "content-creation-form";
                root.render(<ContentCreationForm placeholder="enter paragraph content" />);
                chainlink.appendChild(container);
        } 
        else if (type == "code") {
                url = chainlink.firstElementChild.getAttribute('id');
                order = chainlink.childElementCount - 1;
                container.id = "content-creation-form";
                root.render(<ContentCreationForm placeholder="enter code block" />);
                chainlink.appendChild(container);
        }
        else if (type == 'linebreak') {
                const chainlink = document.getElementById("chainlink-display").lastElementChild;
                order = chainlink.childElementCount - 1;
                url = chainlink.firstElementChild.getAttribute('id');
                const element = new Content("linebreak", undefined, url, currentDateTime, isPublic, count, order);
                _addElement(element);
                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                return;
        }

        //deleteButtons();        // remove buttons temporarily while user input prompt is active
        chainlinkButton.value = false;
        contentButtons.value = false;
        container.addEventListener("submit", function(event) {
                event.preventDefault();
                if (type == "header2") {
                        var element = new Chainlink(input.value, url, currentDateTime, isPublic, count, order);
                } else {
                        var element = new Content(type, input.value, url, currentDateTime, isPublic, count, order);
                }
                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                _addElement(element);
                // _addButtons();
                chainlinkButton.value = true;
                contentButtons.value = true;
                container.remove();
        });
}


/**
 * Callback function used for when the user presses the Esc key while an input dialogue is open
 *
 * @param {event} e - the keyboard press event used to verify that the key that was pressed was the escape key
 * @param {reference} ref - a reference to the callback function specified for 
 * @param {string} fallback - the original value of the field that we are editing
 * @param {string} element - the type of content that is being edited.
 * @returns {null}
 */
function escape(e, ref, fallback, element) {
        var keyCode = e.which;
        if (keyCode == 27) {
                var formParent = document.getElementById('input').parentNode.parentNode;
                var form = document.getElementById('input').parentNode;
                var input = document.getElementById('input');
                const display = document.getElementById("chainlink-display");
                const chainlinkCreateForm = display.querySelector("#chainlink-creation-form");
                const contentCreateForm = display.querySelector("#content-creation-form"); 
                const chainlinkEditForm = (formParent.matches('.chainlink-wrapper'));
                const contentEditForm = (formParent.matches('.content-wrapper'));
                const fenceEditForm = (formParent.matches('#doc-title-wrapper'));

                if (fenceEditForm) {
                        form.remove();
                        var h1 = document.createElement("h1");
                        h1.id = "doc-title";
                        h1.innerHTML = fallback;
                        formParent.prepend(h1);
                } else if (chainlinkEditForm) {
                        form.remove();
                        let container = document.createElement("h2");
                        let root = createRoot(container);
                        formParent.prepend(container);
                        window.location.reload();
                        root.render(<ChainlinkHeader title={fallback}/>);
                } else if (chainlinkCreateForm) {
                        form.remove();
                } else if (contentCreateForm) {
                        form.remove();
                } else if (contentEditForm) {
                        form.remove();
                        var el = document.createElement(element);
                        el.className = "inner-content";
                        el.innerHTML = fallback;
                        formParent.prepend(el);
                }

                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                window.removeEventListener("keydown", ref);
                _addButtons();
        }
}

/**
 * Create a new Article object and write it to the database via AJAX. Then reload the page if the page write was successful
 *
 * @returns {null}
 */
export function createFence() {
        const currentDateTime = new Date().toISOString();
        const article = new Article("article", "", currentDateTime, false, 0, 0);
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "generate.html", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(article));

        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        const url = xhr.response.url;
                        var url_substring = url.substring(0, 10);
                        let nxhr = new XMLHttpRequest();
                        nxhr.open("PUT", "doc" + url + ".html", true);
                        nxhr.setRequestHeader('X-CSRFToken', csrftoken);
                        nxhr.setRequestHeader('type', 'doc');
                        nxhr.setRequestHeader('title', "fence" + url_substring);
                        nxhr.setRequestHeader('target', 'null');
                        nxhr.send();
                        nxhr.onreadystatechange = function() {
                                window.location.replace("doc" + url + ".html");
                        }
                }
        }
}





// Keypress parsing function for creating chainlinks and form elements
export function parseKeyUp(e) {
        var keyCode = e.which;
}

// Keypress parsing function for moving the page up and down
export function parseKeyDown(e) {
        var loc = e.currentTarget.in;   // This variable describes the state of the page when keypresses are registered
        var keyCode = e.which;
        if (e.ctrlKey) {       // exit if the ctrl key is currently being pressed
                return;
        }
        //alert(keyCode);
        if (keyCode == 75) {
            window.scrollBy(0, -70);
        } else if (keyCode == 74) {
            window.scrollBy(0, 70);
        }

        else if (keyCode == 80 && loc != "doc-empty") {
                e.preventDefault();
                makeForm('paragraph');
        } else if (keyCode == 67 && loc != "doc-empty") {
                e.preventDefault();
                makeForm('code');
        } else if (keyCode == 78 && (loc == "doc" || loc == "doc-empty")) {      // disable chainlink creation for chainlink view (only enabled in doc view)
                e.preventDefault();
                makeForm('header2');
        } else if (keyCode == 72 && loc != "doc-empty") {
                e.preventDefault();
                makeForm('header3');
        } else if (keyCode == 66 && loc != "doc-empty") {
                e.preventDefault();
                makeForm('linebreak');
        }
}


export function deleteButtons() {
        document.getElementById('add-buttons').remove();
}

export function instFenceEditButtons() {
        var wrapper = document.getElementById('doc-title-wrapper');
        var container = document.createElement("div");
        container.id = "fence-context-buttons";
        wrapper.appendChild(container);
        var root = createRoot(container);
        root.render(<FenceEditButtons />);
}

export function instChainlinkEditButtons() {
        var numChainlinks = document.getElementsByClassName("chainlink").length;
        var wrappers = document.getElementsByClassName("chainlink-wrapper");
        for (let i = 0; i < numChainlinks; i++) {
                let container = document.createElement("div");
                let root = createRoot(container);
                container.className = "chainlink-buttons-wrapper";
                wrappers[i].appendChild(container);
                root.render(<ChainlinkEditButtons i={i} wrappers={wrappers}/>);
        }
}

export function instContentEditButtons () {
        const numContents = document.getElementsByClassName("content-wrapper").length;
        const contents = document.getElementsByClassName("content-wrapper");
        for (let i = 0; i < numContents; i++) {
                let spanMessage = document.createElement("i");
                let buttons_wrapper = document.createElement("div");
                let contentEditButton = document.createElement("button");
                let contentDeleteButton = document.createElement("button");
                spanMessage.innerHTML = "context action &#60; - - - - - - ";
                spanMessage.className = "context-span-message";
                contentEditButton.innerHTML = "edit";
                contentDeleteButton.innerHTML = "delete";
                contentEditButton.className = "cont-edit-btn";
                contentDeleteButton.className = "cont-del-btn";
                buttons_wrapper.className = "context-buttons-wrapper";
                buttons_wrapper.appendChild(spanMessage);
                buttons_wrapper.appendChild(contentEditButton);
                buttons_wrapper.appendChild(contentDeleteButton);
                contents[i].appendChild(buttons_wrapper);
                contentEditButtonsEventHandlers.push(function() { editContent(contentEditButton.closest('.content-wrapper').id) });
                contentDeleteButtonsEventHandlers.push(function() { deleteContent(contentDeleteButton.closest('.content-wrapper').id) });
                contentEditButton.addEventListener("click", contentEditButtonsEventHandlers[contentEditButtonsEventHandlers.length - 1]);
                contentDeleteButton.addEventListener("click", contentDeleteButtonsEventHandlers[contentDeleteButtonsEventHandlers.length - 1]);
        }
}

export function deleteFenceEditButtons () {
        var editButton = document.getElementById("doc-action-edit-title");
        var deleteButton = document.getElementById("doc-action-delete-title");
        editButton.remove();
        deleteButton.remove();
        editButton.removeEventListener("click", fenceEditButtonEventHandler);
        deleteButton.removeEventListener("click", fenceDeleteButtonEventHandler);
}

export function deleteChainlinkEditButtons () {
        const numChainlinks = document.getElementsByClassName("chainlink").length;
        var chainlinkButtonsWrapper = document.getElementsByClassName("chainlink-buttons-wrapper");
        var editButtons = Array.from(document.getElementsByClassName("cl-edit-btn"));
        var deleteButtons = Array.from(document.getElementsByClassName("cl-del-btn"));
        for (let i = 0; i < numChainlinks; i++) {
                chainlinkButtonsWrapper.remove();
                editButtons[i].removeEventListener("click", chainlinkEditButtonsEventHandlers[i]);
                deleteButtons[i].removeEventListener("click", chainlinkDeleteButtonsEventHandlers[i]);
        }
}

export function deleteContentEditButtons() {
        const numContents = document.getElementsByClassName("content-wrapper").length;
        var editButtons = Array.from(document.getElementsByClassName("cont-edit-btn"));
        var contextButtonsWrapper = document.getElementsByClassName("context-buttons-wrapper");
        var deleteButtons = Array.from(document.getElementsByClassName("cont-del-btn"));
        for (let i = 0; i < numContents; i++) {
                //editButtons[i].remove();
                //deleteButtons[i].remove();
                contextButtonsWrapper.remove();
                editButtons[i].removeEventListener("click", contentEditButtonsEventHandlers[i]);
                deleteButtons[i].removeEventListener("click", contentDeleteButtonsEventHandlers[i]);
        }
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
                        window.location.replace("index.html");
                }
        }
}

export function deleteContent(target) {
        var confirm = window.confirm("Delete element?");
        if( confirm == false ) {
                return
        }

 	var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.location.href, true);
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.setRequestHeader('type', 'content');
        xhr.setRequestHeader('target', target);
        xhr.send(); 
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        window.location.reload();
                }
        }
}

export function renameDoc() {

        const header = document.getElementById('doc-title');
        const wrapper = document.getElementById('doc-title-wrapper');
        const form = document.createElement('form');
        const input = document.createElement('input');
        const title = header.innerHTML;

        window.removeEventListener("keyup", parseKeyUp);
        window.removeEventListener("keydown", parseKeyDown);
        
        var _listener = function (e) { escape(e, _listener, title, "h1") };
        window.addEventListener("keydown", _listener);

        input.setAttribute('type', 'text');
        input.setAttribute('id', 'input');
        input.value = title;
        form.appendChild(input);
        wrapper.appendChild(form);
        input.focus({ focusVisible: true });

        deleteButtons();         
        form.addEventListener("submit", function(event) {
                event.preventDefault();
                //addElement(type, input.value, url, order);
                var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                xhr.setRequestHeader('type', 'doc');
                xhr.setRequestHeader('title', input.value);
                xhr.setRequestHeader('target', 'null');
                xhr.send();
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                window.location.reload();
                        }
                }

                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                _addButtons();
        });

        header.remove();
}

export function editChainlink(target) {

        const chainlink = document.getElementById(target);
        const header = chainlink.getElementsByTagName("h2")[0];
        const form = document.createElement('form');
        const input = document.createElement('input');
        const title = header.querySelector(".chainlink-inner-text").textContent;

        window.removeEventListener("keyup", parseKeyUp);
        window.removeEventListener("keydown", parseKeyDown);

        var _listener = function (e) { escape(e, _listener, title, "h2") };
        window.addEventListener("keydown", _listener);

        input.setAttribute('type', 'text');
        input.setAttribute('id', 'input');
        input.value = title;
        form.appendChild(input);
        chainlink.prepend(form);
        input.focus({ focusVisible: true });

        deleteButtons();
        form.addEventListener("submit", function(event) {
                event.preventDefault();
                //addElement(type, input.value, url, order);
                var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                xhr.setRequestHeader('type', 'chainlink');
                xhr.setRequestHeader('title', input.value);
                xhr.setRequestHeader('target', target);
                xhr.send(); 
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                window.location.reload();
                        }
                }

                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                _addButtons();
        });

        header.remove();
}

export function editContent(target) {

        const wrapper = document.getElementById(target);
        const content = wrapper.getElementsByClassName("inner-content")[0];
        const form = document.createElement('form');
        const input = document.createElement('input');
        const title = content.innerHTML;

        window.removeEventListener("keyup", parseKeyUp);
        window.removeEventListener("keydown", parseKeyDown);

        var _listener = function (e) { escape(e, _listener, title, content.tagName) };
        window.addEventListener("keydown", _listener);

        input.setAttribute('type', 'text');
        input.setAttribute('id', 'input');
        input.value = title;
        form.appendChild(input);
        wrapper.prepend(form);
        input.focus({ focusVisible: true });

        deleteButtons();         
        form.addEventListener("submit", function(event) {
                event.preventDefault();
                //addElement(type, input.value, url, order);
                var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                xhr.setRequestHeader('type', 'content');
                xhr.setRequestHeader('title', input.value);
                xhr.setRequestHeader('target', target);
                xhr.send(); 
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                window.location.reload();
                        }
                }

                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                _addButtons();
        });

        content.remove();
}

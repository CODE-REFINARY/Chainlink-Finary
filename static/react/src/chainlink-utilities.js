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
var elementsEditButtonEventHandlers = [];

// State variables to describe the state of the page. These can be called to reliable determine something about the current page
var isArticle;
var isChainlink;
var articleIsEmpty;
var chainlinkIsEmpty;
//var chainlinkButton;
var pageEditButtons;
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
        /*chainlinkButton = {
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
        };*/
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

/* React components */
/*function ContentCreationButtonsFive() {
        return (
                <React.Fragment>
                        <button id="add-p-btn" className="add-buttons" onClick={() => makeForm('paragraph')}>&lt;p&gt; paragraph</button>
                        <button id="add-h3-btn" className="add-buttons" onClick={() => makeForm('header3')}>&lt;h&gt; header</button>
                        <button id="add-cl-btn" className="add-buttons" onClick={() => makeForm('header2')}>&lt;n&gt; chainlink</button>
                        <button id="add-code-btn" className="add-buttons" onClick={() => makeForm('code')}>&lt;c&gt; code</button>
                        <button id="add-br-btn" className="add-buttons" onClick={() => makeForm('linebreak')}>&lt;b&gt; linebreak</button>
                </React.Fragment>
        );
}*/

/**
 * Render the row of Element creation buttons that appear at the bottom of the article
 *
 * @param {string} bitmask - indicate which buttons to enable and disable. This is regular string containing
 * 0s and 1s (bits) indicating which buttons should be active. The first bit sets the Chainlink button active.
 * The second bit sets the rest of the buttons active.
 */
function CreatePageEditButtons(props) {
        var chainlinkButton;
        var restOfButtons;

        if (props.bitmask[0] === "1") {
                chainlinkButton = (
                        <button id="add-cl-btn" className="add-buttons" onClick={() => makeForm('header2')}>&lt;n&gt; chainlink</button>
                );
        } else if (props.bitmask[0] === "0") {
                chainlinkButton = (
                        <button className="inactive-add-buttons">&lt;p&gt; paragraph</button>
                );
        }

        if (props.bitmask[1] === "1") {
                restOfButtons = (
                        <React.Fragment>
                                <button id="add-p-btn" className="add-buttons" onClick={() => makeForm('paragraph')}>&lt;p&gt; paragraph</button>
                                <button id="add-h3-btn" className="add-buttons" onClick={() => makeForm('header3')}>&lt;h&gt; header</button>
                                <button id="add-code-btn" className="add-buttons" onClick={() => makeForm('code')}>&lt;c&gt; code</button>
                                <button id="add-br-btn" className="add-buttons" onClick={() => makeForm('linebreak')}>&lt;b&gt; linebreak</button>
                                <button className="add-buttons">&lt;inactive&gt; img</button>
                                <button className="add-buttons">&lt;inactive&gt; ul</button>
                                <button className="add-buttons">&lt;inactive&gt; ol</button>
                        </React.Fragment>
                );
        } else if (props.bitmask[1] === "0") {
                restOfButtons = (
                        <React.Fragment>
                                <button className="inactive-add-buttons">&lt;h&gt; header</button>
                                <button className="inactive-add-buttons">&lt;c&gt; code</button>
                                <button className="inactive-add-buttons">&lt;b&gt; linebreak</button>
                                <button className="inactive-add-buttons">&lt;inactive&gt; img</button>
                                <button className="inactive-add-buttons">&lt;inactive&gt; ul</button>
                                <button className="inactive-add-buttons">&lt;inactive&gt; ol</button>
                        </React.Fragment>
                );
        }

        return (
                <React.Fragment>
                        {chainlinkButton}
                        {restOfButtons}
                </React.Fragment>
        );
}
/*function CreateChainlinkButton(props) {
        if (!props.active) {
                return null;
        }
        return (
                <React.Fragment>
                        <button id="add-cl-btn" className="add-buttons" onClick={() => makeForm('header2')}>&lt;n&gt; chainlink</button>
                </React.Fragment>
        );
}*/
function FenceEditButtons() {
        const editFunction = function() { renameDoc() };
        const deleteFunction = function() { deleteDoc() };
        elementsEditButtonEventHandlers.push([editFunction, deleteFunction]);
        fenceEditButtonEventHandler = function() { renameDoc(); };
        fenceDeleteButtonEventHandler = function() { deleteDoc(); };
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        {/*<button id="doc-action-edit-title" onClick={fenceEditButtonEventHandler}>edit</button>*/}
                        {/*<button id="doc-action-delete-title" onClick={fenceDeleteButtonEventHandler}>delete</button>*/}
                        <button id="doc-action-edit-title" onClick={ elementsEditButtonEventHandlers[0][0] }>edit</button>
                        <button id="doc-action-delete-title" onClick={ elementsEditButtonEventHandlers[0][1] }>delete</button>
                </React.Fragment>
        );
}
function ChainlinkEditButtons(props) {
        const editFunction = function() { editChainlink(props.wrappers[props.i].id) };
        const deleteFunction = function() { deleteChainlink(props.wrappers[props.i].id) };
        elementsEditButtonEventHandlers.push([editFunction, deleteFunction]);
        chainlinkEditButtonsEventHandlers.push(function() { editChainlink(props.wrappers[props.i].id) });
        chainlinkDeleteButtonsEventHandlers.push(function() { deleteChainlink(props.wrappers[props.i].id) });
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        {/*<button className="cl-edit-btn" target={props.wrappers[props.i].id} onClick={chainlinkEditButtonsEventHandlers[chainlinkEditButtonsEventHandlers.length - 1]}>edit</button>*/}
                        {/*<button className="cl-del-btn" target={props.wrappers[props.i].id} onClick={chainlinkDeleteButtonsEventHandlers[chainlinkDeleteButtonsEventHandlers.length - 1]}>delete</button>*/}
                        <button className="cl-edit-btn" target={props.wrappers[props.i].id} onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][0] }>edit</button>
                        <button className="cl-del-btn" target={props.wrappers[props.i].id} onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][1] }>delete</button>
                </React.Fragment>
        );
}
function ContentEditButtons(props) {
        const editFunction = function() { editContent(props.wrappers[props.i].id) };
        const deleteFunction = function() { deleteContent(props.wrappers[props.i].id) };
        elementsEditButtonEventHandlers.push([editFunction, deleteFunction]);

        contentEditButtonsEventHandlers.push(function() { editContent(props.wrappers[props.i].id) });
        contentDeleteButtonsEventHandlers.push(function() { deleteContent(props.wrappers[props.i].id) });
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        {/*<button className="cont-edit-btn" onClick={contentEditButtonsEventHandlers[contentEditButtonsEventHandlers.length - 1]}>edit</button>*/}
                        {/*<button className="cont-del-btn" onClick={contentDeleteButtonsEventHandlers[contentDeleteButtonsEventHandlers.length - 1]}>delete</button>*/}
                        <button className="cont-edit-btn" target={ props.wrappers[props.i].id } onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][0] }>edit</button>
                        <button className="cont-del-btn" target={ props.wrappers[props.i].id } onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][1] }>delete</button>
                </React.Fragment>
        );
}
/*function ContentEditButtons(props) {
        contentEditButtonsEventHandlers.push(function() { editContent(props.wrappers[props.i].id) });
        contentDeleteButtonsEventHandlers.push(function() { deleteContent(props.wrappers[props.i].id) });
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        <button className="cont-edit-btn" onClick={() => editContent(props.wrappers[props.i].id)}>edit</button>
                        <button className="cont-del-btn" onClick={() => deleteContent(props.wrappers[props.i].id)}>delete</button>
                </React.Fragment>
        );
}*/
function ChainlinkHeader(props) {
        return (
               <React.Fragment>
                        <span className="chainlink-inner-text">{props.title}</span>
               </React.Fragment>
        );
}
/*function ChainlinkCreationForm(props) {
        return (
                <form>
                        <input autoFocus type="text" id="input" placeholder="enter chainlink name" />
                        <input type="chainlink" value="Submit">
                </form>
        );
}
function ContentCreationForm(props) {
        return (
                <form>
                        <input autoFocus type="text" id="input" placeholder={props.placeholder} />
                </form>
        );
}*/
function ElementCreationForm(props) {
        return (
                <form id="crud-form">
                        <input autoFocus type="text" id="input" placeholder={props.placeholder} defaultValue={props.value}/>
                        <select id="element-creation-select" name="element">
                                <option value="chainlink">chainlink</option>
                                <option value="header">header</option>
                                <option value="paragraph">paragraph</option>
                                <option value="code">code</option>
                                <option value="linebreak">linebreak</option>
                                <option value="unordered list">unordered list</option>
                                <option value="ordered list">ordered list</option>
                        </select>
                        <div id="element-creation-text-align-right">
                            <button id="element-creation-submit" type="submit">Submit</button>
                        </div>
                </form>
        );
}
function ChainlinkElement(props) {

        useEffect(() => {
                // insert all child elements of this Chainlink now the the Chainlink has been rendered
                if (props.children != null) {           // if the children parameter is not null then add append them to the Chainlink element
                        let chainlink = document.getElementById(props.url).parentElement;       // This object represents the Chainlink that was just rendered
                        for (let i = 0; i < props.children.length; i++) {
                                chainlink.appendChild(props.children[i].cloneNode(true)); // Append every child to the Chainlink
                        }
                }
                removeEditButtons();
                instantiateEditButtons();
                _enumerateElements();   // Now that the Chainlink and its children are instantiated assign indices

        }, []);

        return (
                <React.Fragment>
                        <div id={props.url} className="chainlink-wrapper" tag="chainlink">
                                <h2>
                                        <span className="chainlink-inner-text">
                                                {props.title}
                                        </span>
                                        <a className="inline-url header-url" href={"chainlink" + props.url + ".html"}>
                                                {">>>" + props.url.substring(0, 9)}
                                        </a>
                                </h2>
                        </div>
                </React.Fragment>
        );
}
function ContentElement(props) {

        useEffect(() => {
                _enumerateElements();
                removeEditButtons();
                instantiateEditButtons();
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
                if (articleIsEmpty.value) {
                        pageEditButtons.value = "10";
                } else {
                        pageEditButtons.value = "11";
                }
        } else if (isChainlink.value) {
                pageEditButtons.value = "01";
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
                        instantiateElement(xhr.response, numElements.value, null);
                }
        }
}

/**
 * Create a representation of an element of type Chainlink or Content. Display this element under #chainlink-display
 *
 * @param {Object} element - XMLHttpRequest or Element object to instantiate on the screen
 * @param {number} index - The index indicates what the index of the new element should have. This index should be made available before
 * instantiateElement is called.
 * @param {NodeList} children - This array-like object contains all HTML nodes that are children of the element parameter (of course
 * assuming that parameter is a Chainlink).
 * @returns {null}
 */
function instantiateElement(element, index, children) {
        var previousElementIndex = index - 1;                                 // the index of the Element directly before the Element to be created
        var previousElement = null;                                             // the Element directly before the Element that will be created
        var parentElement = null;                                               // the parent html element
        var adjacentElement = null;                                             // the element right before the element to be inserted

        if (previousElementIndex > 0) {                                         // if there are Elements in #chainlink-display then specify the element to insert the new element next to
        }

        if (element instanceof Chainlink || element.type == "header2") {
                parentElement = document.getElementById("chainlink-display");

                const container = document.createElement("section");
                const root = createRoot(container);
                container.className = "chainlink";
                if (articleIsEmpty.value) {
                        parentElement.appendChild(container);
                } else if (previousElementIndex === 0) {
                        const firstElement = parentElement.firstElementChild;
                        parentElement.insertBefore(container, firstElement);
                } else {
                        previousElement = document.querySelector(`[index="${previousElementIndex}"]`).parentNode;            // the Element directly before the Element that will be created
                        previousElement.insertAdjacentElement("afterend", container);
                }
                root.render(<ChainlinkElement title={element.title} url={element.url} children={children} />);

        } else {
                adjacentElement = document.querySelector(`[index="${previousElementIndex}"]`);
                const container = document.createElement("div");
                const root = createRoot(container);
                container.id = element.url + "-" + element.order;
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
        const _listener = function (e) { escape(e, _listener, "", "", "from make form GLITCH FOUND") };

        const list = document.getElementById('chainlink-display');
        const section = document.createElement('section');
        const chainlink = document.getElementById("chainlink-display").lastElementChild;

        // html elements to create
        const container = document.createElement("div");
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
                container.id = "chainlink-creation-form";
                order = document.getElementById("chainlink-display").childElementCount - 1;
                root.render(<ElementCreationForm placeholder="enter chainlink content" />);
                list.appendChild(container);
        }
        else if (type == "header3") {
                container.id = "content-creation-form";
                url = chainlink.firstElementChild.getAttribute('id');
                order = chainlink.childElementCount - 1;
                root.render(<ElementCreationForm placeholder="enter header content" />);
                chainlink.appendChild(container);
        }
        else if (type == "paragraph") {
                container.id = "content-creation-form";
                url = chainlink.firstElementChild.getAttribute('id');
                order = chainlink.childElementCount - 1;
                root.render(<ElementCreationForm placeholder="enter paragraph content" />);
                chainlink.appendChild(container);
        } 
        else if (type == "code") {
                container.id = "content-creation-form";
                url = chainlink.firstElementChild.getAttribute('id');
                order = chainlink.childElementCount - 1;
                root.render(<ElementCreationForm placeholder="enter code block" />);
                chainlink.appendChild(container);
        }
        else if (type == 'linebreak') {
                container.id = "content-creation-form";
                const chainlink = document.getElementById("chainlink-display").lastElementChild;
                //order = chainlink.childElementCount - 1;
                order = parseInt(chainlink.lastElementChild.id.split('-')[1]) + 1;
                url = chainlink.firstElementChild.getAttribute('id');
                const element = new Content("linebreak", undefined, url, currentDateTime, isPublic, count, order);
                _addElement(element);
                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                window.removeEventListener("keydown", _listener);
                return null;
        }

        //deleteButtons();        // remove buttons temporarily while user input prompt is active
        //chainlinkButton.value = false;
        pageEditButtons.value = "00";
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
                //chainlinkButton.value = true;
                //pageEditButtons.value = "11";
                initialize();
                container.remove();
                window.removeEventListener("keydown", _listener);
        });
}


/**
 * Callback function used for when the user presses the Esc key while an input dialogue is open
 *
 * @param {KeyboardEvent} e - the keyboard press event used to verify that the key that was pressed was the escape key
 * @param {Function} ref - a reference to the callback function specified for
 * @param {string} fallback - the original value of the field that we are editing
 * <DEPRECATED> @param {string} element - the type of content that is being edited.
 * @param {Element} element - the Element object that was being edit when escape was entered
 * @returns {null}
 */
function escape(e, ref, fallback, element, from) {
        var keyCode = e.which;
        // if the escape key is pressed...
        if (keyCode == 27) {
                var formParent = document.getElementById('crud-form').parentNode.parentNode;
                var form = document.getElementById('crud-form').parentNode;
                var input = document.getElementById('input');
                const display = document.getElementById("chainlink-display");
                const chainlinkCreateForm = display.querySelector("#chainlink-creation-form");
                const contentCreateForm = display.querySelector("#content-creation-form");
                const chainlinkEditForm = display.querySelector("#chainlink-edit-form");
                const contentEditForm = display.querySelector("#content-edit-form");
                const fenceEditForm = (formParent.matches('#doc-title-wrapper'));

                if (fenceEditForm) {
                        form.remove();
                        var h1 = document.createElement("h1");
                        h1.id = "doc-title";
                        h1.innerHTML = fallback;
                        formParent.prepend(h1);
                } else if (chainlinkEditForm) {
                        const index = parseInt(chainlinkEditForm.getAttribute("index"));
                        const children = form.parentElement.querySelectorAll(".content-wrapper");
                        form.parentElement.remove();
                        instantiateElement(element, index, children);
                        //let container = document.createElement("h2");
                        //let root = createRoot(container);
                        //formParent.prepend(container);
                        //window.location.reload();
                        //root.render(<ChainlinkHeader title={fallback}/>);
                } else if (chainlinkCreateForm) {
                        form.remove();
                } else if (contentCreateForm) {
                        form.remove();
                } else if (contentEditForm) {
                        const index = parseInt(contentEditForm.getAttribute("index"));
                        form.remove();
                        instantiateElement(element, index, null);
                        /*form.remove();
                        var el = document.createElement(element);
                        el.className = "inner-content";
                        el.innerHTML = fallback;
                        formParent.prepend(el);*/
                }

                window.addEventListener("keydown", parseKeyDown);
                window.removeEventListener("keydown", ref);
                initialize();
                //pageEditButtons.value = "11";
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
        console.log(articleIsEmpty.value);
        if (e.ctrlKey) {       // exit if the ctrl key is currently being pressed
                return;
        }
        if (keyCode == 75) {
            window.scrollBy(0, -70);
        } else if (keyCode == 74) {
            window.scrollBy(0, 70);
        }

        else if (keyCode == 80 && !articleIsEmpty.value) {
                e.preventDefault();
                makeForm('paragraph');
        } else if (keyCode == 67 && !articleIsEmpty.value) {
                e.preventDefault();
                makeForm('code');
        } else if (keyCode == 78 && isArticle.value) {      // disable chainlink creation for chainlink view (only enabled in doc view)
                e.preventDefault();
                makeForm('header2');
        } else if (keyCode == 72 && !articleIsEmpty.value) {
                e.preventDefault();
                makeForm('header3');
        } else if (keyCode == 66 && !articleIsEmpty.value) {
                e.preventDefault();
                makeForm('linebreak');
        }
}


export function deleteButtons() {
        document.getElementById('add-buttons').remove();
}

export function instantiateEditButtons() {
        var wrapper = document.getElementById('doc-title-wrapper');
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
        editButton.removeEventListener("click", fenceEditButtonEventHandler);
        deleteButton.removeEventListener("click", fenceDeleteButtonEventHandler);

        //const numChainlinks = document.getElementsByClassName("chainlink").length;
        var chainlinkButtons = document.getElementsByClassName("chainlink-buttons-wrapper");
        var numChainlinkButtons = document.getElementsByClassName("chainlink-buttons-wrapper").length;
        var editButtons = Array.from(document.getElementsByClassName("cl-edit-btn"));
        var deleteButtons = Array.from(document.getElementsByClassName("cl-del-btn"));
        for (let i = 0; i < numChainlinkButtons; i++) {
                //chainlinkButtonsWrapper.remove();
                editButtons[i].removeEventListener("click", chainlinkEditButtonsEventHandlers[i]);
                deleteButtons[i].removeEventListener("click", chainlinkDeleteButtonsEventHandlers[i]);
                chainlinkButtons[0].remove();
        }
        chainlinkEditButtonsEventHandlers.length = 0;
        chainlinkDeleteButtonsEventHandlers.length = 0;

        //var numContents = document.getElementsByClassName("content-wrapper").length;
        var contentButtons = document.getElementsByClassName("context-buttons-wrapper");
        var numContentButtons = document.getElementsByClassName("context-buttons-wrapper").length;
        var editButtons = Array.from(document.getElementsByClassName("cont-edit-btn"));
        var deleteButtons = Array.from(document.getElementsByClassName("cont-del-btn"));
        //var contextButtonsWrapper = document.getElementsByClassName("context-buttons-wrapper");
        for (let i = 0; i < numContentButtons; i++) {
                //editButtons[i].remove();
                //deleteButtons[i].remove();
                editButtons[i].removeEventListener("click", contentEditButtonsEventHandlers[i]);
                deleteButtons[i].removeEventListener("click", contentDeleteButtonsEventHandlers[i]);
                contentButtons[0].remove();
        }

        /*for (let i = 0; i < numElements.value; i++) {
                editButtons[i].removeEventListener("click", elementsEditButtonEventHandlers[i][0]);
                deleteButton[i].removeEventListener("click", elementsEditButtonEventHandlers[i][1]);
        }*/
        contentEditButtonsEventHandlers.length = 0;
        contentDeleteButtonsEventHandlers.length = 0;
        elementsEditButtonEventHandlers.length = 0;
}

/*
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
*/
/*
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

export function _deleteChainlinkButtons () {
        //const numChainlinks = document.getElementsByClassName("chainlink").length;
        var chainlinkButtons = document.getElementsByClassName("chainlink-buttons-wrapper");
        var numChainlinkButtons = document.getElementsByClassName("chainlink-buttons-wrapper").length;
        var editButtons = Array.from(document.getElementsByClassName("cl-edit-btn"));
        var deleteButtons = Array.from(document.getElementsByClassName("cl-del-btn"));
        for (let i = 0; i < numChainlinkButtons; i++) {
                //chainlinkButtonsWrapper.remove();
                editButtons[i].removeEventListener("click", chainlinkEditButtonsEventHandlers[i]);
                deleteButtons[i].removeEventListener("click", chainlinkDeleteButtonsEventHandlers[i]);
                chainlinkButtons[0].remove();     
        }
        chainlinkEditButtonsEventHandlers.length = 0;
        chainlinkDeleteButtonsEventHandlers.length = 0;
}

export function deleteContentEditButtons() {
        //var numContents = document.getElementsByClassName("content-wrapper").length;
        var contentButtons = document.getElementsByClassName("context-buttons-wrapper");
        var numContentButtons = document.getElementsByClassName("context-buttons-wrapper").length;
        var editButtons = Array.from(document.getElementsByClassName("cont-edit-btn"));
        var deleteButtons = Array.from(document.getElementsByClassName("cont-del-btn"));
        //var contextButtonsWrapper = document.getElementsByClassName("context-buttons-wrapper");
        for (let i = 0; i < numContentButtons; i++) {
                //editButtons[i].remove();
                //deleteButtons[i].remove();
                editButtons[i].removeEventListener("click", contentEditButtonsEventHandlers[i]);
                deleteButtons[i].removeEventListener("click", contentDeleteButtonsEventHandlers[i]);
                contentButtons[0].remove();
        }
        contentEditButtonsEventHandlers.length = 0;
        contentDeleteButtonsEventHandlers.length = 0;
}
*/
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
                        window.location.reload();
                }
        }
}

/*

 */
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
                        //window.location.reload();
                        deinstantiateElement(target)
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
                window.removeEventListener("keydown", _listener)
                _addButtons();
        });

        header.remove();
}


/*export function _editChainlink(target) {

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
}*/


/**
 * Edit the target chainlink. Instantiate a form to allow the user to change the content of this Chainlink.
 *
 * @param {string} target - this string indicates the id of the chainlink element to edit
 * @returns {null}
 */
export function editChainlink(target) {
        const chainlink = document.getElementById(target);
        const chainlinkParent = chainlink.parentElement;
        const title = chainlink.querySelector(".chainlink-inner-text").textContent;
        const url = chainlink.id;
        const order = chainlink.index;
        const element = new Chainlink(title, url, null, true, 0, order);
        const _listener = function (e) {
                escape(e, _listener, "", element)
        };

        // html elements to create
        const container = document.createElement("div");
        const root = createRoot(container);

        window.removeEventListener("keyup", parseKeyUp);
        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);

        container.id = "chainlink-edit-form";
        container.setAttribute("index", chainlink.getAttribute("index"));
        root.render(<ElementCreationForm placeholder="enter Chainlink title" />);
        chainlink.insertAdjacentElement("afterend", container);

        container.addEventListener("submit", function(event) {
                event.preventDefault();
                //addElement(type, input.value, url, order);
                var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                xhr.setRequestHeader('type', 'chainlink');
                xhr.setRequestHeader('title', event.target.input.value);
                xhr.setRequestHeader('target', target);
                xhr.send();
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                window.location.reload();
                        }
                }

                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                window.removeEventListener("keydown", _listener)
                _addButtons();
        });
        chainlink.remove();
        _enumerateElements();
}

/*export function _editContent(target) {

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
}*/

/**
 * Edit the target Content. Instantiate a form to allow the user to edit this content
 *
 * @param {string} target - This string indicates the id of the Content to edit
 * @returns {null}
 */
export function editContent(target) {

        const wrapper = document.getElementById(target);
        //const content = wrapper.getElementsByClassName("inner-content")[0];
        const content = wrapper.querySelector(".inner-content");
        const form = document.createElement('form');
        const input = document.createElement('input');
        const title = content.textContent;
        const url = wrapper.id.slice(0, -2);
        const order = parseInt(wrapper.id.split("-").slice(1).join("-"));
        const tag = wrapper.getAttribute("tag");
        var element = new Content(tag, title, url, null, true, 0, order);

        const _listener = function (e) {
                escape(e, _listener, "", element, "from content edit window")
        };

        window.removeEventListener("keyup", parseKeyUp);
        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", _listener);
        //window.addEventListener("keydown", function(e){escape(e, null, "", element)});

        const container = document.createElement("div");
        const root = createRoot(container);

        container.id = "content-edit-form";
        container.setAttribute("index", wrapper.getAttribute("index"));
        root.render(<ElementCreationForm placeholder="enter content title" value={title}/>);
        wrapper.insertAdjacentElement("afterend", container);

        /*input.setAttribute('type', 'text');
        input.setAttribute('id', 'input');
        input.value = title;
        form.appendChild(input);
        wrapper.prepend(form);
        input.focus({ focusVisible: true });*/

        container.addEventListener("submit", function(event) {
                event.preventDefault();
                //addElement(type, input.value, url, order);
                var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                let xhr = new XMLHttpRequest();
                xhr.open("PUT", window.location.href, true);
                xhr.setRequestHeader('X-CSRFToken', csrftoken);
                xhr.setRequestHeader('type', 'content');
                xhr.setRequestHeader('title', event.target.input.value);
                xhr.setRequestHeader('target', target);
                xhr.send();
                xhr.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                                window.location.reload();
                        }
                }
                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                window.removeEventListener("keydown", _listener)
        });

        wrapper.remove();
        _enumerateElements();
}

function deinstantiateElement(id) {

        let obj_to_remove = document.getElementById(id);
        let objToRemoveIndex = parseInt(obj_to_remove.getAttribute("index"));
        if (obj_to_remove.getAttribute("class") === "chainlink-wrapper") {}

        if (obj_to_remove.getAttribute("class") === "content-wrapper") {
                let nextSibling = obj_to_remove.nextElementSibling;
                while (nextSibling) {
                        let oldIdUrl = nextSibling.getAttribute("id").split('-')[0];
                        let oldIdOrder = nextSibling.getAttribute("id").split('-')[1];
                        let newOrder = parseInt(oldIdOrder) - 1;
                        let newId = oldIdUrl + "-" + newOrder;
                        nextSibling.setAttribute("id", newId)
                        nextSibling = nextSibling.nextElementSibling;
                }
        }

        obj_to_remove.remove();
        //elementsEditButtonEventHandlers.splice(objToRemoveIndex, 1);
        removeEditButtons();
        instantiateEditButtons();
        _enumerateElements();   // Now that the Chainlink and its children are instantiated assign indices
}

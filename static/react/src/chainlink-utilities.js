/* React imports */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Element, Fence, Chainlink, Content } from './classes.js'


/* Variables that store 1 or more event listeners so that they be referenced and de-registered later */
var fenceEditButtonEventHandler;
var fenceDeleteButtonEventHandler;
var chainlinkEditButtonsEventHandlers = [];
var chainlinkDeleteButtonsEventHandlers = [];
var contentEditButtonsEventHandlers = [];
var contentDeleteButtonsEventHandlers = [];


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
function ContentCreationButtonsFour() {
        return (
                <React.Fragment>
                        <button id="add-p-btn" className="add-buttons" onClick={() => makeForm('paragraph')}>&lt;p&gt; paragraph</button>
                        <button id="add-h3-btn" className="add-buttons" onClick={() => makeForm('header3')}>&lt;h&gt; header</button>
                        <button id="add-code-btn" className="add-buttons" onClick={() => makeForm('code')}>&lt;c&gt; code</button>
                        <button id="add-br-btn" className="add-buttons" onClick={() => makeForm('linebreak')}>&lt;b&gt; linebreak</button>
                </React.Fragment>
        );
}
function ContentCreationButtonsOne() {
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


/* JS utility functions (private) */

/**
 * Create the correct number of content buttons depending on current page
 *
 * @returns {null}
 */
export function _addButtons() {
        if (window.in === 'doc') {
                addContentButtons(5);
        } else if (window.in === 'doc-empty') {
                addContentButtons(1);
        } else if (window.in === 'chainlink') {
                addContentButtons(4);
        }
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

        // dispatch an AJAX post
        if (element instanceof Article) {
                xhr.send(JSON.stringify({ "type": "header2", "title": element.title, "is_public": element.public, "url": element.url, "count": element.count, "date": element.date }));
        } else if (element instanceof Chainlink) {

        } else if (element instanceof Content) {

        }
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        window.location.reload()
                }
        }
}


/*  JS public functions */

export function createFence() {
    var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "generate.html", true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-CSRFToken', csrftoken);
    xhr.send(JSON.stringify({ "title": "fence", "is_public": false }));

    xhr.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            const url = xhr.getResponseHeader('url');
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

/**
 * Create a form for editing an element (specified by type) and call addElement to update the database with the form contents
 * 
 * @param {string} type - string representation of the type of element that the edit form will be created for
 * @returns {null}
 */
export function makeForm(type) {
        window.removeEventListener("keyup", parseKeyUp);
        window.removeEventListener("keydown", parseKeyDown);

        var _listener = function (e) { escape(e, _listener, "", "") };
        window.addEventListener("keydown", _listener);

        const list = document.getElementById('chainlink-display');
        const section = document.createElement('section');
        const chainlink = document.getElementById("chainlink-display").lastElementChild;
        const form = document.createElement('form');
        const input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('id', 'input');
        form.appendChild(input);

        if (type == "header2") {
                var order = document.getElementById("chainlink-display").childElementCount - 1;
                input.setAttribute('placeholder', 'enter chainlink name');
                //section.appendChild(form);
                //list.appendChild(section);
                list.appendChild(form);
                var url = '';
        }

        else if (type == 'linebreak') {
                const chainlink = document.getElementById("chainlink-display").lastElementChild;
                var order = chainlink.childElementCount - 1;
                const url = chainlink.firstElementChild.getAttribute('id');
                _addElement('linebreak', '', url, order);
                return;
        }

        else {
                if (type == "header3") {
                        input.setAttribute('placeholder', 'enter header title');
                } else if (type == "paragraph") {
                        input.setAttribute('placeholder', 'enter text');
                } else if (type == "code") {
                        input.setAttribute('placeholder', 'enter code block');
                } else {
                        input.setAttribute('placeholder', 'enter value');
                }

                var url = chainlink.firstElementChild.getAttribute('id');
                var order = chainlink.childElementCount - 1;
                form.appendChild(input);
                chainlink.appendChild(form);
        }

        deleteButtons();        // remove buttons temporarily while user input prompt is active 
        document.getElementById('input').focus({ focusVisible: true });
        form.addEventListener("submit", function(event) {
                event.preventDefault();
                _addElement(type, input.value, url, order);
                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                _addButtons();
        });
}

// Keypress parsing function for creating chainlinks and form elements
export function parseKeyUp(e) {
        var keyCode = e.which;
        //alert(keyCode);
        var loc = e.currentTarget.in;   // This variable describes the state of the page when keypresses are registered
        if (keyCode == 17) {            // ctrl
                window.ctrl = false;    // flag that the ctrl key has been released
        } else if (window.ctrl) {       // exit if the ctrl key is currently being held down
                return;
        }
}

// Keypress parsing function for moving the page up and down
export function parseKeyDown(e) {
        var loc = e.currentTarget.in;   // This variable describes the state of the page when keypresses are registered
        var keyCode = e.which;
        if (keyCode == 17) {     // ctrl
                window.ctrl = true;     // flag that the ctrl key is currently being pressed
        } else if (window.ctrl) {       // exit if the ctrl key is currently being pressed
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
                const chainlinkCreateForm = (formParent.matches('#chainlink-display'));
                const chainlinkEditForm = (formParent.matches('.chainlink-wrapper'));
                const contentCreateForm = (formParent.matches('.chainlink'));
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
 * Create the buttons that appear in #chainlink-display toward the bottom of the fence
 *
 * @param {number} quantity - the number of buttons to create. 1 button is chainlink. 5 buttons is everything. 4 buttons is everything but chainlink
 * @returns {null}
 */
export function addContentButtons(quantity) {
	var mainElement = document.querySelector("main");     
        var container = document.createElement("div");
        container.id = "add-buttons";
        mainElement.appendChild(container);
        var root = createRoot(container);
        if (quantity == 1) {
                root.render(<ContentCreationButtonsOne />);
        } else if (quantity == 4) {
                root.render(<ContentCreationButtonsFour />);
        } else if (quantity == 5) {
                root.render(<ContentCreationButtonsFive />);
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

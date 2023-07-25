var fenceEditButtonEventHandler;
var fenceDeleteButtonEventHandler;
var chainlinkEditButtonsEventHandlers = [];
var chainlinkDeleteButtonsEventHandlers = [];
var contentEditButtonsEventHandlers = [];
var contentDeleteButtonsEventHandlers = [];

// add items to database
export function addElement(type, title, url, order) {
    var is_public = "True";
	var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("POST", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.send(JSON.stringify({ "type": type, "title": title, "is_public": is_public, "url": url }));
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        window.location.reload()
                }
        }
}

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

// Create form elements and invoke addElement
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
                var url = ''
        }

        else if (type == 'linebreak') {
                const chainlink = document.getElementById("chainlink-display").lastElementChild;
                var order = chainlink.childElementCount - 1;
                const url = chainlink.firstElementChild.getAttribute('id');
                addElement('linebreak', '', url, order);
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
                addElement(type, input.value, url, order);
                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
                addButtons();
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

// Callback function used for when the user presses the Esc key while an input dialogue is open
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
                        var h2 = document.createElement("h2");
                        h2.innerHTML = fallback;
                        formParent.prepend(h2);
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
                addButtons();
        }
}

// Construct the content buttons for doc view. All buttons are available. This should be called for docs that have 
// one or more chainlinks attached to them.
export function addButtonsDocView() {

	var chainlinkDisplay = document.getElementById("chainlink-display");
	var mainElement = document.querySelector("main");        
        var div = document.createElement("div");

        var button1 = document.createElement("button");
        var button2 = document.createElement("button");
        var button3 = document.createElement("button");
        var button4 = document.createElement("button");
        var button5 = document.createElement("button");

        div.id = "add-buttons";
        button1.id = "add-p-btn";
        button2.id = "add-h3-btn";
        button3.id = "add-cl-btn";
        button4.id = "add-code-btn";
        button5.id = "add-br-btn";
        
        button1.className = "add-buttons";
        button2.className = "add-buttons";
        button3.className = "add-buttons";
        button4.className = "add-buttons";
        button5.className = "add-buttons";

        button1.innerHTML = "&#60;p&#62; paragraph";
        button2.innerHTML = "&#60;h&#62; header";
        button3.innerHTML = "&#60;n&#62 chainlink";
        button4.innerHTML = "&#60;c&#62 code";
        button5.innerHTML = "&#60;b&#62; linebreak";

        div.appendChild(button1);
        div.appendChild(button2);
        div.appendChild(button3);
        div.appendChild(button4);
        div.appendChild(button5);

        // Register event listeners for content creation elements
        button1.addEventListener("click", function() { makeForm('paragraph'); });
        button2.addEventListener("click", function() { makeForm('header3'); });
        button3.addEventListener("click", function() { makeForm('header2'); });
        button4.addEventListener("click", function() { makeForm('code'); });
        button5.addEventListener("click", function() { makeForm('linebreak'); });

        mainElement.appendChild(div);
}

// Create just the chainlink button. Empty docs should only be able to have a chainlink (header 2) added to them
export function addButtonsDocEmptyView() {

	var mainElement = document.querySelector("main");        
        var div = document.createElement("div");
        var button3 = document.createElement("button");
        div.id = "add-buttons";
        button3.id = "add-cl-btn";
        button3.className = "add-buttons";
        button3.innerHTML = "&#60;n&#62 chainlink";
        div.appendChild(button3);
        button3.addEventListener("click", function() { makeForm('header2'); });
        mainElement.appendChild(div);
}

// Chainlinks cannot instantiate other chainlinks. This function instantiates buttons to create content that isn't 
// another chainlink.
export function addButtonsChainlinkView() {

        var chainlinkDisplay = document.getElementById("chainlink-display");
        var mainElement = document.querySelector("main");
        var div = document.createElement("div");
        var button1 = document.createElement("button");
        var button2 = document.createElement("button");
        var button4 = document.createElement("button");
        var button5 = document.createElement("button");

        div.id = "add-buttons";
        button1.id = "add-p-btn";
        button2.id = "add-h3-btn";
        button4.id = "add-code-btn";
        button5.id = "add-br-btn";
        
        button1.className = "add-buttons";
        button2.className = "add-buttons";
        button4.className = "add-buttons";
        button5.className = "add-buttons";

        button1.innerHTML = "&#60;p&#62; paragraph";
        button2.innerHTML = "&#60;h&#62; header";
        button4.innerHTML = "&#60;c&#62 code"
        button5.innerHTML = "&#60;b&#62; linebreak";

        div.appendChild(button1);
        div.appendChild(button2);
        div.appendChild(button4);
        div.appendChild(button5);

        // Register event listeners for content creation elements
        button1.addEventListener("click", function() { makeForm('paragraph'); });
        button2.addEventListener("click", function() { makeForm('header3'); });
        button4.addEventListener("click", function() { makeForm('code'); });
        button5.addEventListener("click", function() { makeForm('linebreak'); });

        mainElement.appendChild(div);
}

// Add buttons. The buttons to add is indicated by window.in
export function addButtons() {
        switch(window.in) {
                case 'doc': 
                        addButtonsDocView();
                        break;
                case 'doc-empty':
                        addButtonsDocEmptyView();
                        break;
                case 'chainlink':
                        addButtonsChainlinkView();
                        break;
                default:
                        console.log("doc type for buttons not specified");
        }
}

export function deleteButtons() {
        document.getElementById('add-buttons').remove();
}

export function instFenceEditButtons() {
        const wrapper = document.getElementById('doc-title-wrapper');
        let fenceEditButton = document.createElement("button");
        let fenceDeleteButton = document.createElement("button");
        fenceEditButton.innerHTML = "edit";
        fenceDeleteButton.innerHTML = "delete";
        var fenceButtonsWrapper = document.createElement("div");
        fenceButtonsWrapper.className = "fence-context-buttons";
        fenceEditButton.id = "doc-action-edit-title";
        fenceDeleteButton.id = "doc-action-delete-title";
        fenceButtonsWrapper.appendChild(fenceEditButton);
        fenceButtonsWrapper.appendChild(fenceDeleteButton);
        wrapper.appendChild(fenceButtonsWrapper);
        fenceEditButtonEventHandler = function() { renameDoc(); };
        fenceDeleteButtonEventHandler = function() { deleteDoc(); };
        fenceEditButton.addEventListener("click", fenceEditButtonEventHandler);
        fenceDeleteButton.addEventListener("click", fenceDeleteButtonEventHandler);
}

export function instChainlinkEditButtons() {
        const numChainlinks = document.getElementsByClassName("chainlink").length;
        const chainlinks = document.getElementsByClassName("chainlink");
        const chainlinkHeaders = document.getElementsByClassName("chainlink-wrapper");
        for (let i = 0; i < numChainlinks; i++) {
                let buttons_wrapper = document.createElement("div");
                let chainlinkEditButton = document.createElement("button");
                let chainlinkDeleteButton = document.createElement("button");
                chainlinkEditButton.innerHTML = "edit";
                chainlinkDeleteButton.innerHTML = "delete";
                chainlinkEditButton.className = "cl-edit-btn";
                chainlinkDeleteButton.className = "cl-del-btn";
                buttons_wrapper.className = "chainlink-buttons-wrapper";
                chainlinkEditButton.setAttribute("target", chainlinkHeaders[i].id);
                chainlinkDeleteButton.setAttribute("target", chainlinkHeaders[i].id);
                buttons_wrapper.appendChild(chainlinkEditButton);
                buttons_wrapper.appendChild(chainlinkDeleteButton);
                chainlinkHeaders[i].appendChild(buttons_wrapper);
                chainlinkEditButtonsEventHandlers.push(function() { editChainlink(chainlinkEditButton.getAttribute('target')) });
                chainlinkDeleteButtonsEventHandlers.push(function() { deleteChainlink(chainlinkDeleteButton.getAttribute('target')) });
                chainlinkEditButton.addEventListener("click", chainlinkEditButtonsEventHandlers[chainlinkEditButtonsEventHandlers.length - 1]);
                chainlinkDeleteButton.addEventListener("click", chainlinkDeleteButtonsEventHandlers[chainlinkDeleteButtonsEventHandlers.length - 1]);
        }
}

export function instContentEditButtons () {
        const numContents = document.getElementsByClassName("content-wrapper").length;
        const contents = document.getElementsByClassName("content-wrapper");
        for (let i = 0; i < numContents; i++) {
                let buttons_wrapper = document.createElement("div");
                let contentEditButton = document.createElement("button");
                let contentDeleteButton = document.createElement("button");
                contentEditButton.innerHTML = "edit";
                contentDeleteButton.innerHTML = "delete";
                contentEditButton.className = "cont-edit-btn";
                contentDeleteButton.className = "cont-del-btn";
                buttons_wrapper.className = "context-buttons-wrapper";
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
                addButtons();
        });

        header.remove();
}

export function editChainlink(target) {

        const chainlink = document.getElementById(target);
        const header = chainlink.getElementsByTagName("h2")[0];
        const form = document.createElement('form');
        const input = document.createElement('input');
        const title = header.innerHTML;

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
                addButtons();
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
                addButtons();
        });

        content.remove();
}

// add items to database
export function addElement(type, title, url, order) {
        var is_public;
        var title;
        if (type == 'header2') {
                is_public = "True";
        }
	var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("POST", window.target, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.send(JSON.stringify({ "type": type, "title": title, "is_public": is_public, "url": url }));
        xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                        window.location.reload()
                }
        }
}

// Create form elements and invoke addElement
export function makeForm(type) {
        window.removeEventListener("keyup", parseKeyUp);
        window.removeEventListener("keydown", parseKeyDown);
        window.addEventListener("keydown", escape);
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

        if (keyCode == 80 && loc != "doc-empty") {
                makeForm('paragraph');
        } else if (keyCode == 67 && loc != "doc-empty") {
                makeForm('code');
        } else if (keyCode == 78 && (loc == "doc" || loc == "doc-empty")) {      // disable chainlink creation for chainlink view (only enabled in doc view)
                makeForm('header2');
        } else if (keyCode == 72 && loc != "doc-empty") {
                makeForm('header3');
        } else if (keyCode == 66 && loc != "doc-empty") {
                makeForm('linebreak');
        }
}

// Keypress parsing function for moving the page up and down
export function parseKeyDown(e) {
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
}

// Keypress parsing function for capturing the Escape key to reload the page
export function escape(e) {
        var keyCode = e.which;
        if (keyCode == 27) {
                var form = document.getElementById('input').parentNode;
                const listForm = document.getElementById('chainlink-display').querySelector("form");
                const chainlinkForm = document.getElementById("chainlink-display").lastElementChild.querySelector("form");

                if (listForm) {
                        listForm.remove();
                        window.addEventListener("keydown", parseKeyDown);
                        window.addEventListener("keyup", parseKeyUp);
                } else if (chainlinkForm) {
                        chainlinkForm.remove();
                        window.addEventListener("keydown", parseKeyDown);
                        window.addEventListener("keyup", parseKeyUp);
                }

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
        button3.innerHTML = "&#60;n&#62 New Chainlink";
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
        button3.innerHTML = "&#60;n&#62 New Chainlink";
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

export function deleteDoc() {

        var confirm = window.confirm("Delete this document record?");
        if( confirm == false ) {
                return
        }

 	var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.target, true);
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

        var confirm = window.confirm("Delete this chainlink?");
        if( confirm == false ) {
                return
        }

 	var csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.target, true);
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

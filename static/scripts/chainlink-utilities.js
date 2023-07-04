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

        document.getElementById('input').focus({ focusVisible: true });
        form.addEventListener("submit", function(event) {
                event.preventDefault();
                addElement(type, input.value, url, order);
                window.addEventListener("keydown", parseKeyDown);
                window.addEventListener("keyup", parseKeyUp);
        });
}

// Keypress parsing function for creating chainlinks and form elements
export function parseKeyUp(e) {
        var keyCode = e.which;
        var loc = e.currentTarget.in;
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
                window.location.reload();
        }
}

import React, { useEffect, createContext, useContext, useRef, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CursorContext = createContext(null);
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

function ParagraphQuillEditor({ value, onChange }) {
    const modules = useMemo(() => ({
        toolbar: [
            ['bold', 'italic', 'underline', 'link'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['code']
        ],
    }), []);

    return (
        <ReactQuill
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
        />
    );
}

const AngleDownIcon = ({ isRotated }) => (
    <span className="icon">
        <svg
            aria-hidden="true"
            viewBox="0 0 320 512"
            style={{
                transform: isRotated ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                width: '1em',
                height: '1em'
            }}
        >
            <path
                fill="currentColor"
                d="M143 352.3L7 216.3c-9.4-9.4-9.4-24.6 0-33.9l22.6-22.6c9.4-9.4 24.6-9.4 33.9 0l96.4 96.4 96.4-96.4c9.4-9.4 24.6-9.4 33.9 0l22.6 22.6c9.4 9.4 9.4 24.6 0 33.9l-136 136c-9.2 9.4-24.4 9.4-33.8 0z"
            />
        </svg>
    </span>
);

const CloseIcon = () => (
    <span className="icon">
        <svg
            aria-hidden="true"
            viewBox="0 0 352 512"
            style={{ width: '1em', height: '1em' }}
        >
            <path
                fill="currentColor"
                d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.19 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.19 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"
            />
        </svg>
    </span>
);

function convertISO8601_to_intl(dateString) {
    // Try to parse the date
    const parsedDate = new Date(dateString);

    // Check if the parsed date is valid
    const isValidDate = !isNaN(parsedDate.getTime());

    // Check if the input string resembles an ISO 8601 format
    const isISO8601 = /^\d{4}-\d{2}-\d{2}T/.test(dateString);

    // If both checks pass, format the date nicely
    if (isValidDate && isISO8601) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        }).format(parsedDate);
    }

    // Otherwise, return the original string
    return dateString;
}

function safeCssToObj(cssString) {
    // 1. Guard against null, undefined, or non-strings
    if (!cssString || typeof cssString !== 'string') return {};

    try {
        return cssString
            .split(';')
            .reduce((acc, rule) => {
                // 2. Filter out empty strings from trailing semicolons
                if (!rule.trim()) return acc;

                const [key, ...valueParts] = rule.split(':');

                // 3. Ensure both key and value exist
                if (key && valueParts.length > 0) {
                    const trimmedKey = key.trim();
                    const value = valueParts.join(':').trim(); // join handles URLs like 'url(http://...)'

                    if (trimmedKey && value) {
                        // 4. Convert kebab-case to camelCase for React
                        const camelKey = trimmedKey.replace(/-./g, (match) => match[1].toUpperCase());
                        acc[camelKey] = value;
                    }
                }
                return acc;
            }, {});
    } catch (error) {
        console.error("Malformed CSS string provided to safeCssToObj:", cssString, error);
        return {}; // Fallback to empty object to prevent React crash
    }
};

/**
 * Recursively checks if an order exists in the Element array.
 * If it does, increments by 1 and checks again.
 */
const getUniqueOrder = (requestedOrder, existingElements) => {

    let order = parseInt(requestedOrder, 10);

    // Find if any OTHER element already has this order
    const collision = existingElements.find(el => parseInt(el.order, 10) === order);

    if (collision) {

        // If collision exists, increment and check again (recursive)
        return getUniqueOrder(order + 1, existingElements);
    }

    return order;
};

export function ElementDisplayAsComponents() {
    const [getElementList, setElementList] = useState([]);
    const [cursor, setCursor] = useState(-1);
    const elements = document.querySelectorAll(".element-wrapper");

    let elementDisplay = document.getElementById("element-display");
    let elementManifest = document.getElementById("element-manifest-entries");

    useEffect(() => {
        let elementList = [];

        elements.forEach((element) => {
            let elementObj = {};
            const tag = element.getAttribute("tag");

            // Shared attributes
            const url = element.id;
            const order = parseInt(element.getAttribute("order"), 10);
            const date = element.getAttribute("date")

            if (tag === "HEADER1") {
                const text = element.querySelector("h1")?.textContent || "";
                Object.assign(elementObj, { tag, date, url, order, text });
            } else if (tag === "HEADER2") {
                const text = element.querySelector("h2 .title")?.textContent || "";
                Object.assign(elementObj, { tag, date, url, order, text });
            } else if (tag === "HEADER3") {
                const text = element.querySelector("h3")?.textContent || "";
                Object.assign(elementObj, { tag, date, url, order, text });
            } else if (tag === "PARAGRAPH") {
                const text = element.querySelector("div")?.outerHTML || "";
                Object.assign(elementObj, { tag, date, url, order, text });
            } else if (tag === "CODE") {
                const text = element.querySelector("code")?.textContent || "";
                Object.assign(elementObj, { tag, date, url, order, text });
            } else if (tag === "LINEBREAK") {
                Object.assign(elementObj, { tag, date, url, order });
            } else {
                // 'continue' doesn't work in forEach; use 'return' instead
                return;
            }

            elementList.push(elementObj);
        });

        setElementList(elementList);
        setCursor(elementList.length);

    }, []); // Run once on mount

    return (
        <React.Fragment>
            {createPortal(
                getElementList
                    .sort((a, b) => a.order - b.order)
                    .map((item) => {
                        switch (item.tag) {
                            case 'HEADER1':
                                return (
                                    <li>
                                        <a key={item.url} className="inline-url" href={`#${item.url}`}>{item.text}</a>
                                    </li>
                                );
                            case 'HEADER2':
                                return (
                                    <li>
                                        <a key={item.url} className="inline-url" href={`#${item.url}`}><span class="h2-arrow">→</span>{item.text}</a>
                                    </li>
                                );
                            case 'HEADER3':
                                return (
                                    <li>
                                        <a key={item.url} className="inline-url" href={`#${item.url}`}><span class="h3-arrow">⟶</span>{item.text}</a>
                                    </li>
                                );
                        }
                    }
                    ),
                elementManifest
            )}
            {getElementList
                .sort((a, b) => a.order - b.order)
                .map((item) => {
                    // We use curly braces here, so we MUST use a return statement
                    switch (item.tag) {
                        case 'HEADER2':
                            return (
                                <Header2
                                    key={item.url}
                                    url={item.url}
                                    text={item.text}
                                    date={item.date}
                                    order={item.order}
                                    elementList={[getElementList, setElementList]}
                                />
                            );
                        case 'HEADER3':
                            return (
                                <Header3
                                    key={item.url}
                                    url={item.url}
                                    text={item.text}
                                    date={item.date}
                                    order={item.order}
                                    elementList={[getElementList, setElementList]}
                                />
                            );
                        case 'HEADER1':
                            return (
                                <Header1
                                    key={item.url}
                                    url={item.url}
                                    text={item.text}
                                    date={item.date}
                                    order={item.order}
                                    elementList={[getElementList, setElementList]}
                                />
                            );
                        case 'CODE':
                            return (
                                <Code
                                    key={item.url}
                                    url={item.url}
                                    text={item.text}
                                    date={item.date}
                                    order={item.order}
                                    elementList={[getElementList, setElementList]}
                                />
                            );
                        case 'LINEBREAK':
                            return (
                                <Linebreak
                                    key={item.url}
                                    url={item.url}
                                    date={item.date}
                                    order={item.order}
                                    elementList={[getElementList, setElementList]}
                                />
                            );
                        case 'PARAGRAPH':
                            return (
                                <Paragraph
                                    key={item.url}
                                    url={item.url}
                                    text={item.text}
                                    date={item.date}
                                    order={item.order}
                                    elementList={[getElementList, setElementList]}
                                />
                            );
                        default:
                            return null; // Always return something (or null) to avoid map errors
                    }
                })
            }
            <CursorContext.Provider value={{ cursor, setCursor }}>
                <CreateBodyEditButtons elementList={[getElementList, setElementList]} />
            </CursorContext.Provider>
        </React.Fragment>
    );
}

function CreateBodyEditButtons(props) {

    // This hook remembers if the element creation form should be remembered. It's a switch that will help us keep track if the form
    // is being shown or not.
    const [getShowElementCreateForm, setShowElementCreateForm] = useState(false);
    const [getElementList, setElementList] = props.elementList;
    const [elementType, setElementType] = useState("");
    const { cursor, setCursor } = useContext(CursorContext);

    const handleClick = (type) => {
        setElementType(type)
        setShowElementCreateForm(true); // Set the state to true to show the element creation form
    };

    let buttonList;

    if (getShowElementCreateForm == false) {
        buttonList = (
            <React.Fragment>
                <button id="add-h1-btn" className="button is-rounded is-emerald cell add-buttons" onClick={() => handleClick("HEADER1")}>h1</button>
                <button id="add-h2-btn" className="button is-rounded is-teal-surge cell add-buttons" onClick={() => handleClick("HEADER2")}>h2</button>
                <button id="add-h3-btn" className="button is-rounded is-indigo cell add-buttons" onClick={() => handleClick('HEADER3')}>h3</button>
                <button id="add-p-btn" className="button is-rounded is-persimmon cell add-buttons" onClick={() => handleClick("PARAGRAPH")}>paragraph</button>
                <button id="add-code-btn" className="button is-rounded is-violet cell add-buttons" onClick={() => handleClick('CODE')}>code</button>
                <button id="add-br-btn" className="button is-rounded is-jungle cell add-buttons" onClick={() => handleClick('LINEBREAK')}>linebreak</button>
                <button id="add-li-btn" className="button is-rounded is-charcoal cell add-buttons" onClick={() => handleClick('LI')}>list</button>
                <button id="add-link-btn" className="button is-rounded is-mustard cell add-buttons" onClick={() => handleClick('LINK')}>link</button>
                <button id="add-img-btn" className="button is-rounded is-sandstone cell add-buttons" onClick={() => handleClick('IMG')}>img</button>
                <button id="add-note-btn" className="button is-rounded is-crimson cell add-buttons" onClick={() => handleClick('NOTE')}>note</button>
            </React.Fragment>
        );

    } else {
        buttonList = (
            <React.Fragment>
                <button className="cell button inactive-add-buttons" disabled>&lt;n&gt; h2</button>
                <button className="cell button inactive-add-buttons" disabled>&lt;p&gt; paragraph</button>
                <button className="cell button inactive-add-buttons" disabled>&lt;h&gt; header</button>
                <button className="cell button inactive-add-buttons" disabled>&lt;c&gt; code</button>
                <button className="cell button inactive-add-buttons" disabled>&lt;b&gt; linebreak</button>
                <button className="cell button inactive-add-buttons" disabled>&lt;l&gt; list</button>
                <button className="cell button inactive-add-buttons" disabled>&lt;q&gt; link</button>
                <button className="cell button inactive-add-buttons" disabled>&lt;i&gt; img</button>
                <button className="cell button inactive-add-buttons" disabled>&lt;n&gt; note</button>
            </React.Fragment>
        );
    }

    return (
        <div id="element-creation">
            {<ElementCreateForm tag={elementType} elementList={[getElementList, setElementList]} showElementCreateForm={[getShowElementCreateForm, setShowElementCreateForm]} />}
            <div className="grid">
                {buttonList}
            </div>
        </div>
    );
}


function NoElements(props) {
    return (
        <React.Fragment>
            &lt;{props.element} CONTENT MISSING&gt;
        </React.Fragment>
    );
}

function Header1(props) {
    const [getElementList, setElementList] = props.elementList;
    const element = getElementList.find(item => item.url === props.url);

    const [getShowElementDeleteForm, setShowElementDeleteForm] = useState(false);
    const [getShowElementEditForm, setShowElementEditForm] = useState(false);

    return (
        <React.Fragment>
            <div id={element.url} className="element-wrapper" order={element.order} tag="HEADER1" date={element.date}>
                <h1 className="header1-element">
                    <span className="element-order">#{element.order}</span>
                    <span className="title is-1" style={safeCssToObj(element.css)}>{element.text}</span>
                    <span className="element-date">{convertISO8601_to_intl(element.date)}</span>
                </h1>
                <ElementEditButtons elementList={[getElementList, setElementList]} url={element.url} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />
            </div>
            {getShowElementDeleteForm && <ElementDeleteForm element={element} elementList={[getElementList, setElementList]} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} />}
            {getShowElementEditForm && <ElementEditForm element={element} elementList={[getElementList, setElementList]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />}
        </React.Fragment>
    );
};

function Header2(props) {
    const [getElementList, setElementList] = props.elementList;
    const element = getElementList.find(item => item.url === props.url);

    const [getShowElementDeleteForm, setShowElementDeleteForm] = useState(false);
    const [getShowElementEditForm, setShowElementEditForm] = useState(false);

    return (
        <React.Fragment>
            <div id={element.url} className="element-wrapper" order={element.order} tag="HEADER2" date={element.date}>
                <h2>
                    <span className="element-order">#{element.order}</span>
                    <span className="title is-2" style={safeCssToObj(element.css)}>{element.text}</span>
                    <span className="element-date">{convertISO8601_to_intl(element.date)}</span>
                </h2>
                <ElementEditButtons elementList={[getElementList, setElementList]} url={element.url} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />
            </div>
            {getShowElementDeleteForm && <ElementDeleteForm element={element} elementList={[getElementList, setElementList]} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} />}
            {getShowElementEditForm && <ElementEditForm element={element} elementList={[getElementList, setElementList]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />}
        </React.Fragment>
    );
}

function Header3(props) {
    const [getElementList, setElementList] = props.elementList;
    const element = getElementList.find(item => item.url === props.url);

    const [getShowElementDeleteForm, setShowElementDeleteForm] = useState(false);
    const [getShowElementEditForm, setShowElementEditForm] = useState(false);

    return (
        <React.Fragment>
            <div id={element.url} className="element-wrapper" order={element.order} tag="HEADER3" date={element.date}>
                <h3>
                    <span className="element-order">#{element.order}</span>
                    <span className="title is-3" style={safeCssToObj(element.css)}>{element.text}</span>
                    <span className="element-date">{convertISO8601_to_intl(element.date)}</span>
                </h3>
                <ElementEditButtons elementList={[getElementList, setElementList]} url={element.url} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />
            </div>
            {getShowElementDeleteForm && <ElementDeleteForm element={element} elementList={[getElementList, setElementList]} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} />}
            {getShowElementEditForm && <ElementEditForm element={element} elementList={[getElementList, setElementList]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />}
        </React.Fragment>
    );
};

function Paragraph(props) {
    const [getElementList, setElementList] = props.elementList;
    const element = getElementList.find(item => item.url === props.url);

    const [getShowElementDeleteForm, setShowElementDeleteForm] = useState(false);
    const [getShowElementEditForm, setShowElementEditForm] = useState(false);

    return (
        <React.Fragment>
            <div id={element.url} style={safeCssToObj(element.css)} className="element-wrapper" order={element.order} tag="PARAGRAPH" date={element.date}>
                <span className="element-order">#{element.order}</span>
                <div className="content paragraphElement" dangerouslySetInnerHTML={{ __html: element.text }}></div>
                <span className="element-date">{convertISO8601_to_intl(element.date)}</span>
                <ElementEditButtons elementList={[getElementList, setElementList]} url={element.url} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />
            </div>
            {getShowElementDeleteForm && <ElementDeleteForm element={element} elementList={[getElementList, setElementList]} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} />}
            {getShowElementEditForm && <ElementEditForm element={element} elementList={[getElementList, setElementList]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />}
        </React.Fragment>
    );
};

function Code(props) {
    const [getElementList, setElementList] = props.elementList;
    const element = getElementList.find(item => item.url === props.url);

    const [getShowElementDeleteForm, setShowElementDeleteForm] = useState(false);
    const [getShowElementEditForm, setShowElementEditForm] = useState(false);

    return (
        <React.Fragment>
            <div id={element.url} className="element-wrapper" order={element.order} tag="CODE" date={element.date}>
                <div>
                    <span className="element-order">#{element.order}</span>
                    <span className="code" style={safeCssToObj(element.css)}>{element.text}</span>
                    <span className="element-date">{convertISO8601_to_intl(element.date)}</span>
                </div>
                <ElementEditButtons elementList={[getElementList, setElementList]} url={element.url} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />
            </div>
            {getShowElementDeleteForm && <ElementDeleteForm element={element} elementList={[getElementList, setElementList]} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} />}
            {getShowElementEditForm && <ElementEditForm element={element} elementList={[getElementList, setElementList]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />}
        </React.Fragment>
    );
};

function Linebreak(props) {
    const [getElementList, setElementList] = props.elementList;
    const element = getElementList.find(item => item.url === props.url);

    const [getShowElementDeleteForm, setShowElementDeleteForm] = useState(false);
    const [getShowElementEditForm, setShowElementEditForm] = useState(false);

    return (
        <React.Fragment>
            <div id={element.url} className="element-wrapper" order={element.order} tag="LINEBREAK" date={element.date}>
                <div>
                    <span className="element-order">#{element.order}</span>
                    <span className="pb-5 pt-5 br" style={{ display: "block" }}><figure className="image is-16x16" style={{ float: "right" }}><img src="/static/images/enter.png" alt="Description of image" /></figure></span>
                    <span className="element-date">{convertISO8601_to_intl(element.date)}</span>
                </div>
                <ElementEditButtons elementList={[getElementList, setElementList]} url={element.url} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />
            </div>
            {getShowElementDeleteForm && <ElementDeleteForm element={element} elementList={[getElementList, setElementList]} showElementDeleteForm={[getShowElementDeleteForm, setShowElementDeleteForm]} />}
            {getShowElementEditForm && <ElementEditForm element={element} elementList={[getElementList, setElementList]} showElementEditForm={[getShowElementEditForm, setShowElementEditForm]} />}
        </React.Fragment>
    );
};

function ElementEditButtons(props) {
    const [getElementList, setElementList] = props.elementList;
    const element = getElementList.find(item => item.url === props.url);
    const [getShowElementDeleteForm, setShowElementDeleteForm] = props.showElementDeleteForm;
    const [getShowElementEditForm, setShowElementEditForm] = props.showElementEditForm;

    // Helper to handle the XHR PUT request
    function sendElementUpdate(elementData) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", window.location.href, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
            xhr.responseType = "json";

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(new Error("Request failed with status " + xhr.status));
                }
            };

            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send(JSON.stringify(elementData));
        });
    }

    function shiftElement(direction) {
        // 1. Find index in the current live state
        const index = getElementList.findIndex(item => item.url === props.url);
        // 2. Guard Clauses: Stop execution before ANY side effects happen
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === getElementList.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // 3. Create deep copies of the objects to swap
        // This prevents the "both orders become the same" mutation bug
        const newList = [...getElementList];
        const itemA = { ...newList[index] };
        const itemB = { ...newList[targetIndex] };

        // 4. Swap the order values
        const tempOrder = itemA.order;
        itemA.order = itemB.order;
        itemB.order = tempOrder;

        // 5. Update the local array copy
        newList[index] = itemA;
        newList[targetIndex] = itemB;

        // 6. Perform network requests OUTSIDE of setElementList
        // This ensures they only run once per click
        Promise.all([
            sendElementUpdate(itemA),
            sendElementUpdate(itemB)
        ]).then(() => {
            // 7. Finally, update the UI state
            setElementList(newList);
        }).catch(error => {
            console.error("Failed to update element order:", error);
            // Optional: You could add an alert here to tell the user it failed
        });
    }

    return (
        <div className="element-buttons-wrapper">
            <div className="left-buttons">
                <button
                    className="el-edit-btn button is-small is-info"
                    onClick={() => shiftElement('up')}
                >⬆</button>
                <button
                    className="el-edit-btn button is-small is-warning"
                    onClick={() => shiftElement('down')}
                >⬇</button>
            </div>
            <div className="right-buttons">
                <button
                    className="action-copy button is-small is-info"
                    onClick={() => navigator.clipboard.writeText(element?.text || "")}
                >copy</button>
                <button
                    className="el-edit-btn button is-small is-warning"
                    onClick={() => setShowElementEditForm(true)}
                >edit</button>
                <button
                    className="el-del-btn button is-small is-danger"
                    onClick={() => setShowElementDeleteForm(true)}
                >delete</button>
            </div>
        </div>
    );
}

function CollapsibleCard({ title, content }) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleCard = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className="card">
            <header className="card-header">
                <p className="card-header-title">{title}</p>
                <button className="card-header-icon" aria-label="toggle" type="button" onClick={toggleCard}>
                    <span className="icon">
                        <i className={`fas ${isOpen ? "fa-angle-up" : "fa-angle-down"}`} aria-hidden="true"></i>
                    </span>
                </button>
            </header>
            <div className="card-content" style={{ display: isOpen ? "block" : "none" }}>
                {content}
            </div>
        </div>
    );
}

function ElementDeleteForm({ element, elementList, showElementDeleteForm }) {

    const formRef = useRef(null);
    useEffect(() => {
        if (formRef.current) {
            formRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center' // Positions the form in the middle of the viewport
            });
        }
    }, []);

    const [getElementList, setElementList] = elementList;
    const [getShowElementDeleteForm, setShowElementDeleteForm] = showElementDeleteForm;

    const handleDeleteSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(values));

        // This line updates the state to remove the deleted element from the list. It identifies the element by its URL.
        setElementList(prevList => prevList.filter(item => item.url !== element.url));

    };

    return (
        <form className="crud-form" ref={formRef} onSubmit={handleDeleteSubmit}>
            <header className="card-header">
                <p className="card-header-title">
                    Delete {element.tag}
                </p>
            </header>
            <input type="hidden" name="url" value={element.url} />
            <input type="hidden" name="order" value={parseInt(element.order, 10)} />

            <div className="form-group field">
                <label htmlFor="text" id="element-form-delete-label" className="form-label label">Are you sure
                    you want to delete this element?</label>
                <p className="help">this action can't be undone.</p>
            </div>
            <div className="form-group field">
                <input type="hidden" name="archive" value="False" />
                <label className="label">Access Controls</label>
                <div className="checkboxes">
                    <label id="element-form-archive-label" className="form-label checkbox">
                        <input type="checkbox" name="archive" value="True" id="element-form-archive"
                            className="checkbox form-field" style={{ "marginRight": "5px" }} />
                        Archive
                    </label>
                </div>
                <p className="help">Checking this box will ensure that this element is stored in your archive
                    section (graveyard).</p>
            </div>
            <CollapsibleCard
                title="Read Only Fields"
                content={
                    <React.Fragment>
                        <div className="form-group field">
                            <label className="label">Element Tag</label>
                            <input className="input is-static" name="tag" value={element.tag} readOnly />
                            <p className="help">this is the type of Element being deleted. In this case it's a
                                element</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element URL</label>
                            <input className="input is-static" name="url" value={element.url} readOnly />
                            <p className="help">"furl" stands for "full url". This is the complete identifier
                                for this element.</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element Ordering</label>
                            <input className="input is-static" name="order" value={element.order}
                                readOnly />
                            <p className="help">This is the order of this element on the page.</p>
                        </div>
                    </React.Fragment>
                }
            />
            <div className="form-submit-buttons" id="element-creation-text-align-right field">
                <input className="button is-dark" type="reset" onClick={() => setShowElementDeleteForm(false)} value="cancel" />
                <input className="button is-success is-right" type="submit" value="delete" />
            </div>
        </form>
    )
}

function ElementEditForm({ element, elementList, showElementEditForm }) {

    const formRef = useRef(null);
    useEffect(() => {
        if (formRef.current) {
            formRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center' // Positions the form in the middle of the viewport
            });
        }
    }, []);

    const [getElementList, setElementList] = elementList;
    const [getShowElementEditForm, setShowElementEditForm] = showElementEditForm;
    const [getParagraphFormValue, setParagraphFormValue] = useState(element.text || "");
    const [getCodeFormValue, setCodeFormValue] = useState(element.text || "");

    // This element's order can change as a result of the user click the order up/down buttons so we have to track
    // changes with the order of this element so that we can make the form react accordingly.
    const [orderValue, setOrderValue] = useState(element.order || 0);

    // Watch for changes in element.order and sync them to the input
    useEffect(() => {
        setOrderValue(element.order);
    }, [element.order]); // Only runs when element.order changes

    const closeForm = () => {
        setCodeFormValue("");
        setParagraphFormValue("");
        setShowElementEditForm(false);
    };

    // This variable stores the target element's order before the update so that we can track if it's order was changed.
    let original_order = element.order

    const handleEditSubmit = (e, submit_and_close) => {
        e.preventDefault(); // Prevent page refresh

        // Always get the form from the Ref, which is guaranteed to be the HTMLFormElement
        const form = formRef.current;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        // check if the user pressed submit button without updating anything. If so then don't send the request since
        // nothing would change and there's no reason to burden the server.
        if (original_order != values.order) {
            values.order = getUniqueOrder(values.order, getElementList);  // Automatically increment the order if there is a collision to avoid duplicate orders.
        }

        let xhr = new XMLHttpRequest();
        xhr.open("PUT", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(values));

        // This line merges ALL fields from 'values' into the matching item automatically
        setElementList(prevList => prevList.map(item =>
            item.url === element.url ? { ...item, ...values } : item
        ));

        // force the browser to focus back on the form.
        if (!submit_and_close) {
            setTimeout(() => {
                formRef.current?.scrollIntoView({
                    behavior: 'smooth', // 'auto' for instant jump
                    block: 'center'    // Keeps the form in the middle of the screen
                });
            }, 50); // Small timeout to wait for React to finish re-rendering the injected text
        }

        if (submit_and_close) {
            closeForm();

            // We use a small timeout to ensure the form has closed and the 
            // layout has "settled" before calculating the scroll position.
            setTimeout(() => {
                // Find the element using the unique URL (which you use as an ID)
                const targetElement = document.getElementById(element.url);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    // Optional: Add a brief "highlight" flash so they see exactly what changed
                    targetElement.classList.add('is-highlighted');
                    setTimeout(() => targetElement.classList.remove('is-highlighted'), 2000);
                }
            }, 100);
        }
    };

    return (
        <form className="crud-form" ref={formRef} onSubmit={(e) => handleEditSubmit(e, true)}>
            <header className="card-header">
                <p className="card-header-title">
                    Modify {element.tag}
                </p>
            </header>
            <input type="hidden" name="url" value={element.url} />
            <input type="hidden" name="order" value={parseInt(element.order, 10)} />
            {["HEADER1", "HEADER2", "HEADER3"].includes(String(element.tag)) &&
                <div className="form-group field">
                    <label htmlFor="text" id="element-form-text-label"
                        className="form-label label">Text</label>
                    <input autoFocus type="text" id="input element-form-text"
                        defaultValue={element.text}
                        name="text"
                        className="input form-field" />
                    <p className="help">enter a title to be used as the header name for this element</p>
                </div>
            }
            {["CODE"].includes(String(element.tag)) &&
                <div className="form-group field ">
                    <label htmlFor="text" id="element-form-text-label"
                        className="form-label label">Text</label>
                    <div className="textarea-wrapper" data-replicated-value={getCodeFormValue}>
                        <textarea autoFocus type="text" id="input element-form-text"
                            style={{ backgroundColor: '#282c34', color: '#abb2bf' }}
                            defaultValue={getCodeFormValue}
                            value={getCodeFormValue}
                            onChange={(e) => setCodeFormValue(e.target.value)}
                            name="text"
                            className="textarea input form-field"
                            rows="1">
                        </textarea>
                    </div>
                    <p className="help">enter the text content for this element.</p>
                </div>
            }
            {["PARAGRAPH"].includes(String(element.tag)) &&
                <div className="form-group field">
                    <label htmlFor="text" id="element-form-text-label" className="form-label label">Text</label>
                    {/* 1. The Rich Text Editor (Visible to User) */}
                    <ParagraphQuillEditor
                        value={getParagraphFormValue}
                        onChange={(html) => {
                            // This ensures your React state stays updated as they type
                            setParagraphFormValue(html);
                        }}
                    />

                    {/* 2. The Hidden Input (Visible to the Form/XHR) */}
                    <input
                        type="hidden"
                        name="text"
                        value={getParagraphFormValue}
                    />
                    <p className="help">enter a title to be used as the header name for this element</p>
                </div>
            }
            {"order" in element &&
                <div className="form-group field">
                    <label className="label">Element Ordering</label>
                    <input
                        className="input"
                        type="text" 
                        name="order"
                        value={orderValue}
                        onChange={(e) => setOrderValue(e.target.value)}
                    />
                    <p className="help">This is the order of this element on the page.</p>
                </div>
            }
            <CollapsibleCard
                title="Read Only Fields"
                content={
                    <React.Fragment>
                        <div className="form-group field">
                            <label className="label">Element Tag</label>
                            <input className="input is-static" name="tag" value={element.tag} readOnly />
                            <p className="help">this is the type of Element being deleted. In this case it's
                                a
                                element</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element URL</label>
                            <input className="input is-static" name="url" value={element.url} readOnly />
                        </div>
                        <div className="form-group field">
                            <label htmlFor="date" id="element-form-date-label"
                                className="form-label label">Date</label>
                            <input type="input" name="date" id="element-form-date"
                                className="input form-field is-static"
                                value={new Date().toISOString()} readOnly />
                            <p className="help">This value represents the creation time of this Element. It is
                                automatically set and updated whenever this element is updated.</p>
                        </div>
                    </React.Fragment>
                }
            />
            <div className="form-submit-buttons" id="element-creation-text-align-right field">
                <input className="button is-dark" type="reset" onClick={() => closeForm()} value="cancel" />
                {["PARAGRAPH", "CODE"].includes(String(element.tag)) &&
                    <input
                        type="button" // Change to type button so it doesn't trigger the form's native submit
                        className="button is-info is-right"
                        onClick={(e) => handleEditSubmit(e, false)} // Explicitly pass 'e' and 'false'
                        value="save changes"
                    />
                }
                <input className="button is-success" type="submit" value="submit & close" />
            </div>
        </form>
    );
}

function ElementCreateForm({ tag, elementList, showElementCreateForm }) {

    const formRef = useRef(null);
    const [getElementList, setElementList] = elementList;
    const [getShowElementCreateForm, setShowElementCreateForm] = showElementCreateForm;
    const [getParagraphFormValue, setParagraphFormValue] = useState("");
    const [getCodeFormValue, setCodeFormValue] = useState("");
    const [getNewElementUrl, setNewElementUrl] = useState("");  // If the user saves an element then we get the new element's url from the backend 
    // so that subsequent updates using the "Save" button can be sent as "PUT" updates

    // State to track if the form is collapsed
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Initialize order state
    const [getOrderFormValue, setOrderFormValue] = useState(0);

    // Keep the order value set appropriately. It should be reactive to order updates of surrounding elements if this element
    // has been rendered to the display using the "save now" button.
    useEffect(() => {
        // We only care about syncing if this form has successfully 
        // linked to a real element in the list (getNewElementUrl exists)
        if (getNewElementUrl) {
            const currentElement = getElementList.find(item => item.url === getNewElementUrl);
            
            if (currentElement && currentElement.order !== getOrderFormValue) {
                setOrderFormValue(currentElement.order);
            }
        } else {
            // If it's a brand new form, keep it synced to the "end of list" logic
            const nextOrder = getElementList.length > 0 
                ? Math.floor((Number(getElementList[getElementList.length - 1].order) + 100) / 100) * 100 
                : 0;
            setOrderFormValue(nextOrder);
        }
    }, [getElementList, getNewElementUrl]); // Watch the list and the URL status

    const closeForm = () => {
        setCodeFormValue("");
        setNewElementUrl("");
        setParagraphFormValue("");
        setShowElementCreateForm(false);
        setIsCollapsed(false);
    }

    const handleCreateSubmit = (e, submit_and_close) => {
        e.preventDefault(); // Prevent page refresh

        // Always get the form from the Ref, which is guaranteed to be the HTMLFormElement
        const form = formRef.current;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        // If we're creating an element without having clicked the "Save" button then do a "POST" request.
        if (!getNewElementUrl) {

            values.order = getUniqueOrder(values.order, getElementList);  // Automatically increment the order if there is a collision to avoid duplicate orders.

            let xhr = new XMLHttpRequest();
            xhr.open("POST", window.location.href, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
            xhr.responseType = "json";
            xhr.send(JSON.stringify(values));

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // 1. Automatically clone all fields from the response
                    const newComponent = { ...xhr.response };

                    // 2. Specific fix-ups (like ensuring order is a number)
                    if (newComponent.order) {
                        newComponent.order = parseInt(newComponent.order, 10);
                    }

                    // 3. Update the state
                    setElementList(prevList => [...prevList, newComponent]);

                    setNewElementUrl(newComponent.url);
                }
            }

            // This is reached if the user clicked the "Save" button before so the element has already been created and we're just submitting an update
        } else {
            let xhr = new XMLHttpRequest();
            xhr.open("PUT", window.location.href, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
            xhr.responseType = "json";
            values["url"] = getNewElementUrl;   // We have to set the url field with the value of the previously set URL that was returned by the backend
            xhr.send(JSON.stringify(values));

            // This line merges ALL fields from 'values' into the matching item automatically
            setElementList(prevList => prevList.map(item =>
                item.url === getNewElementUrl ? { ...item, ...values } : item
            ));
        }

        // force the browser to focus back on the form.
        if (!submit_and_close) {
            setTimeout(() => {
                formRef.current?.scrollIntoView({
                    behavior: 'smooth', // 'auto' for instant jump
                    block: 'center'    // Keeps the form in the middle of the screen
                });
            }, 50); // Small timeout to wait for React to finish re-rendering the injected text
        }

        if (submit_and_close) {
            closeForm();
            // We use a small timeout to ensure the form has closed and the 
            // layout has "settled" before calculating the scroll position.
            setTimeout(() => {
                // Find the element using the unique URL (which you use as an ID)
                const targetElement = document.getElementById(getNewElementUrl);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    // Optional: Add a brief "highlight" flash so they see exactly what changed
                    targetElement.classList.add('is-highlighted');
                    setTimeout(() => targetElement.classList.remove('is-highlighted'), 2000);
                }
            }, 100);
        }

    };

    return (
        <>
            {getShowElementCreateForm &&
                <form ref={formRef} onSubmit={(e) => handleCreateSubmit(e, true)} className="crud-form">
                    <header
                        className="card-header"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{ cursor: 'pointer', boxShadow: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #ededed' }}
                    >
                        <p className="card-header-title">
                            Create New {tag}
                        </p>


                        <div className="card-header-icon" style={{ gap: '0.5rem' }}>
                            {/* The X Button */}
                            <button
                                type="button"
                                className="button is-ghost p-0 m-0" // is-ghost makes it transparent; p-0 m-0 removes extra spacing
                                aria-label="close"
                                style={{ color: 'inherit', height: 'auto', border: 'none' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeForm();
                                }}
                            >
                                <CloseIcon />
                            </button>

                            {/* The Arrow Button */}
                            <AngleDownIcon isRotated={isCollapsed} />
                        </div>
                    </header>
                    <div className={`card-content ${isCollapsed ? 'is-hidden' : ''}`} style={{ padding: isCollapsed ? 0 : '1.5rem' }}>
                        {!isCollapsed && (
                            <div id="non-submit-fields" className="field">
                                {["HEADER1", "HEADER2", "HEADER3"].includes(String(tag)) &&
                                    <div className="form-group field">
                                        <label htmlFor="text" id="element-form-text-label" className="form-label label">Text</label>
                                        <input autoFocus type="text" id="input element-form-text"
                                            name="text"
                                            className="input form-field" />
                                        <p className="help">enter the text for this header.</p>
                                    </div>
                                }
                                {["CODE"].includes(String(tag)) &&
                                    <div className="form-group field ">
                                        <label htmlFor="text" id="element-form-text-label"
                                            className="form-label label">Text</label>
                                        <div className="textarea-wrapper" data-replicated-value={getCodeFormValue}>
                                            <textarea autoFocus type="text" id="input element-form-text"
                                                style={{ backgroundColor: '#282c34', color: '#abb2bf' }}
                                                defaultValue={getCodeFormValue}
                                                value={getCodeFormValue}
                                                onChange={(e) => setCodeFormValue(e.target.value)}
                                                name="text"
                                                className="textarea input form-field"
                                                rows="3">
                                            </textarea>
                                        </div>
                                        <p className="help">enter the text content for this element.</p>
                                    </div>
                                }
                                {["PARAGRAPH"].includes(String(tag)) &&
                                    <div className="form-group field">
                                        <label htmlFor="text" id="element-form-text-label" className="form-label label">Text</label>
                                        {/* 1. The Rich Text Editor (Visible to User) */}
                                        <ParagraphQuillEditor
                                            value={getParagraphFormValue}
                                            onChange={(html) => {
                                                // This ensures your React state stays updated as they type
                                                setParagraphFormValue(html);
                                            }}
                                        />

                                        {/* 2. The Hidden Input (Visible to the Form/XHR) */}
                                        <input
                                            type="hidden"
                                            name="text"
                                            value={getParagraphFormValue}
                                        />
                                        <p className="help">enter a title to be used as the header name for this element</p>
                                    </div>
                                }
                                <div className="form-group field">
                                    <label className="label">Element Ordering</label>
                                    <input 
                                        className="input" 
                                        name="order" 
                                        type="number"
                                        value={getOrderFormValue} // Controlled input
                                        onChange={(e) => setOrderFormValue(e.target.value)} // Manual editability
                                    />
                                    <p className="help">this is the order of this element relative to others on the
                                        page</p>
                                </div>
                                <div className="form-group field">
                                    <input type="hidden" name="archive" value="False" />
                                    <input type="hidden" name="public" value="False" />
                                    <label className="label">Access Controls</label>
                                    <div className="checkboxes">
                                        <label id="element-form-public-label" className="form-label checkbox">
                                            <input type="checkbox" name="public" value="True" id="element-form-archive"
                                                className="checkbox form-field" style={{ "marginRight": "5px" }} />
                                            Public
                                        </label>
                                        <label id="element-form-archive-label" className="form-label checkbox">
                                            <input type="checkbox" name="archive" value="True" id="element-form-archive"
                                                className="checkbox form-field" style={{ "marginRight": "5px" }} />
                                            Archive
                                        </label>
                                    </div>
                                    <p className="help">specify which viewers will be able to access the contents of this element
                                        and
                                        what will happen to this element if it's deleted</p>
                                </div>
                                <CollapsibleCard
                                    title="Read Only Fields"
                                    content={
                                        <React.Fragment>
                                            <div className="form-group field">
                                                <label className="label">Element Tag</label>
                                                <input className="input is-static" name="tag" value={tag} readOnly />
                                                <p className="help">this is the type of Element being instantiated</p>
                                            </div>
                                            <div className="form-group field">
                                                <label className="label">Element URL</label>
                                                <input className="input is-static" name="url" value="" readOnly />
                                                <p className="help">this is the unique identifier field for this element - if you
                                                    are
                                                    creating a new
                                                    element then this value will be empty until the backend sends us a response</p>
                                            </div>
                                            <div className="form-group field">
                                                <label htmlFor="date" id="element-form-date-label"
                                                    className="form-label label">Date</label>
                                                <input type="input" name="date" id="element-form-date"
                                                    className="input form-field is-static"
                                                    value={new Date().toISOString()} readOnly />
                                                <p className="help">This value represents the creation time of this Element. It is
                                                    automatically set and updated whenever this element is updated.</p>
                                            </div>
                                        </React.Fragment>
                                    }
                                />
                                <CollapsibleCard
                                    title="Advanced Fields"
                                    content={
                                        <React.Fragment>
                                            <div className="form-group field">
                                                <label htmlFor="css" id="element-form-css-label"
                                                    className="form-label label">CSS</label>
                                                <input type="input" name="css" id="element-form-css"
                                                    className="input form-field" />
                                                <p className="help">optionally include custom CSS to apply to the header <i>NOTE:
                                                    This is an
                                                    advanced feature</i></p>
                                            </div>
                                        </React.Fragment>
                                    }
                                />
                            </div>
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="form-submit-buttons" id="element-creation-text-align-right field">
                            <input className="button is-dark" type="reset" onClick={() => { closeForm(); }} value="cancel" />
                            {["PARAGRAPH", "CODE"].includes(String(tag)) &&
                                <input
                                    type="button" // Change to type button so it doesn't trigger the form's native submit
                                    className="button is-info is-right"
                                    onClick={(e) => handleCreateSubmit(e, false)} // Explicitly pass 'e' and 'false'
                                    value="save changes"
                                />
                            }
                            <input className="button is-success is-right" type="submit" value="create" />
                        </div>
                    )}
                </form>
            }
        </>
    );
}
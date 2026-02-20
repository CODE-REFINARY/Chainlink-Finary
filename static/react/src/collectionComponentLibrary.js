import React, {useEffect, createContext, useContext, useRef, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CursorContext = createContext(null);
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

function ParagraphQuillEditor({ value, onChange }) {
    const modules = useMemo(() => ({
        toolbar: [
            ['bold', 'italic', 'underline', 'link'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
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
                    switch(item.tag) {
                        case 'HEADER1':
                            return (
                                <li>    
                                    <a key={item.url} className="inline-url" href={`#${item.url}`}>{item.text}</a>  
                                </li>
                            );
                        case 'HEADER2':
                            return (
                                <li>    
                                    <a key={item.url} className="inline-url" href={`#${item.url}`}>&gt;&gt;{item.text}</a>  
                                </li>
                            );
                        case 'HEADER3':
                            return (
                                <li>    
                                    <a key={item.url} className="inline-url" href={`#${item.url}`}>&gt;&gt;&gt;&gt;{item.text}</a>
                                </li>
                            );
                    }}
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
                    <span className="pb-5 pt-5 br" style={{display: "block"}}><figure className="image is-16x16" style={{float: "right"}}><img src="/static/images/enter.png" alt="Description of image" /></figure></span>
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

function CollapsibleCard({title, content}) {
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

function ElementDeleteForm({element, elementList, showElementDeleteForm}) {
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
        <form className="crud-form" onSubmit={handleDeleteSubmit}>
            <input type="hidden" name="url" value={element.url}/>
            <input type="hidden" name="order" value={parseInt(element.order, 10)}/>

            <div className="form-group field">
                <label htmlFor="text" id="element-form-delete-label" className="form-label label">Are you sure
                    you want to delete this element?</label>
                <p className="help">this action can't be undone.</p>
            </div>
            <div className="form-group field">
                <input type="hidden" name="archive" value="False"/>
                <label className="label">Access Controls</label>
                <div className="checkboxes">
                    <label id="element-form-archive-label" className="form-label checkbox">
                        <input type="checkbox" name="archive" value="True" id="element-form-archive"
                                className="checkbox form-field" style={{"marginRight": "5px"}}/>
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
                            <input className="input is-static" name="tag" value={element.tag} readOnly/>
                            <p className="help">this is the type of Element being deleted. In this case it's a
                                element</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element URL</label>
                            <input className="input is-static" name="url" value={element.url} readOnly/>
                            <p className="help">"furl" stands for "full url". This is the complete identifier
                                for this element.</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element Ordering</label>
                            <input className="input is-static" name="order" value={element.order}
                                    readOnly/>
                            <p className="help">This is the order of this element on the page.</p>
                        </div>
                    </React.Fragment>
                }
            />
            <div className="form-submit-buttons" id="element-creation-text-align-right field">
                <input className="button is-dark" type="reset" onClick={() => setShowElementDeleteForm(false)} value="CANCEL"/>
                <input className="button is-success is-right" type="submit" value="DELETE"/>
            </div>
        </form>
    )
}

function ElementEditForm({element, elementList, showElementEditForm}) {

    const [getElementList, setElementList] = elementList;
    const [getShowElementEditForm, setShowElementEditForm] = showElementEditForm;
    const [getParagraphFormValue, setParagraphFormValue] = useState(element.text || "");
    const [getCodeFormValue, setCodeFormValue] = useState(element.text || "");

    // This variable stores the target element's order before the update so that we can track if it's order was changed.
    let original_order = element.order

    const handleEditSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
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

        setShowElementEditForm(false);
    };

    return (
        <form className="crud-form" onSubmit={handleEditSubmit}>
            <input type="hidden" name="url" value={element.url}/>
            <input type="hidden" name="order" value={parseInt(element.order, 10)}/>
            <div className="form-group field">
            <label htmlFor="text" id="element-form-delete-label" className="form-label label">Modify
                    this element</label>
            </div>
            {["HEADER1", "HEADER2", "HEADER3"].includes(String(element.tag)) &&
                <div className="form-group field">
                    <label htmlFor="text" id="element-form-text-label"
                            className="form-label label">Text</label>
                    <input autoFocus type="text" id="input element-form-text"
                            defaultValue={element.text}
                            name="text"
                            className="input form-field"/>
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
                <input className="input" type="text" name="order" defaultValue={element.order}/>
                <p className="help">This is the order of this element on the page.</p>
            </div>
            }
            <CollapsibleCard
                title="Read Only Fields"
                content={
                    <React.Fragment>
                        <div className="form-group field">
                            <label className="label">Element Tag</label>
                            <input className="input is-static" name="tag" value={element.tag} readOnly/>
                            <p className="help">this is the type of Element being deleted. In this case it's
                                a
                                element</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element URL</label>
                            <input className="input is-static" name="url" value={element.url} readOnly/>
                        </div>
                        <div className="form-group field">
                            <label htmlFor="date" id="element-form-date-label"
                                    className="form-label label">Date</label>
                            <input type="input" name="date" id="element-form-date"
                                    className="input form-field is-static"
                                    value={new Date().toISOString()} readOnly/>
                            <p className="help">This value represents the creation time of this Element. It is
                                automatically set and updated whenever this element is updated.</p>
                        </div>
                    </React.Fragment>
                }
            />
            <div className="form-submit-buttons" id="element-creation-text-align-right field">
                <input className="button is-dark" type="reset" onClick={() => setShowElementEditForm(false)} value="CANCEL"/>
                <input className="button is-success" type="submit" value="UPDATE"/>
            </div>
        </form>
    );
}

function ElementCreateForm({tag, elementList, showElementCreateForm}) {

    const [getElementList, setElementList] = elementList;
    const [getShowElementCreateForm, setShowElementCreateForm] = showElementCreateForm;
    const [getParagraphFormValue, setParagraphFormValue] = useState("");
    const [getCodeFormValue, setCodeFormValue] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

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

                console.log("Existing List:", getElementList);
                console.log("New Component:", newComponent);

                // 3. Update the state
                setElementList(prevList => [...prevList, newComponent]);
            }
        }
        
        setShowElementCreateForm(false);
    };

        return (
        <>
            {getShowElementCreateForm && <form onSubmit={handleSubmit} className="crud-form">
                <div id="non-submit-fields" className="field">
                    {["HEADER1", "HEADER2", "HEADER3"].includes(String(tag)) &&
                        <div className="form-group field">
                            <label htmlFor="text" id="element-form-text-label" className="form-label label">Text</label>
                            <input autoFocus type="text" id="input element-form-text"
                                name="text"
                                className="input form-field"/>
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
                        <input className="input" name="order" defaultValue={getElementList.length > 0 ? Math.floor((Number(getElementList[getElementList.length - 1].order) + 100) / 100) * 100 : 0}/>
                        <p className="help">this is the order of this element relative to others on the
                            page</p>
                    </div>
                    <div className="form-group field">
                        <input type="hidden" name="archive" value="False"/>
                        <input type="hidden" name="public" value="False"/>
                        <label className="label">Access Controls</label>
                        <div className="checkboxes">
                            <label id="element-form-public-label" className="form-label checkbox">
                                <input type="checkbox" name="public" value="True" id="element-form-archive"
                                       className="checkbox form-field" style={{"marginRight": "5px"}}/>
                                Public
                            </label>
                            <label id="element-form-archive-label" className="form-label checkbox">
                                <input type="checkbox" name="archive" value="True" id="element-form-archive"
                                       className="checkbox form-field" style={{"marginRight": "5px"}}/>
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
                                    <input className="input is-static" name="tag" value={tag} readOnly/>
                                    <p className="help">this is the type of Element being instantiated</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element URL</label>
                                    <input className="input is-static" name="url" value="" readOnly/>
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
                                           value={new Date().toISOString()} readOnly/>
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
                                           className="input form-field"/>
                                    <p className="help">optionally include custom CSS to apply to the header <i>NOTE:
                                        This is an
                                        advanced feature</i></p>
                                </div>
                            </React.Fragment>
                        }
                    />

                </div>
                <div className="form-submit-buttons" id="element-creation-text-align-right field">
                    <input className="button is-dark" type="reset" onClick={() => setShowElementCreateForm(false)} value="CANCEL"/>
                    <input className="button is-success is-right" type="submit" value="CREATE"/>
                </div>
            </form>}
        </>
    );
}
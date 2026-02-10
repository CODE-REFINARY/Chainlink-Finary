import React, {useEffect, createContext, useContext, useRef } from "react";
import { createPortal } from "react-dom";
import { useState } from "react";

const CursorContext = createContext(null);

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

function truncateLink(truncateLink) {
    if (truncateLink && truncateLink.length > 35) {
        return truncateLink.slice(0, 35) + "...";
    }
    return truncateLink;
}

function formatUrl(input) {
  if (!input || typeof input !== 'string') return '';

  // Trim whitespace
  let url = input.trim();

  // Ignore completely invalid entries
  if (url.length < 4) return '';

  // Add https:// if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    // Validate URL by trying to construct a new URL object
    const formatted = new URL(url);
    return formatted.href;
  } catch (e) {
    // Invalid URL format
    return '';
  }
}

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

        if (tag === "HEADER2") {
            const text = element.querySelector("h2")?.textContent || "";
            Object.assign(elementObj, { tag, url, order, text });
        } else if (tag === "HEADER3") {
            const text = element.querySelector("h3")?.textContent || "";
            Object.assign(elementObj, { tag, url, order, text });
        } else if (tag === "PARAGRAPH") {
            const text = element.querySelector("p")?.textContent || "";
            Object.assign(elementObj, { tag, url, order, text });
        } else if (tag === "CODE") {
            const text = element.querySelector("code")?.textContent || "";
            Object.assign(elementObj, { tag, url, order, text });
        } else if (tag === "LINEBREAK") {
            Object.assign(elementObj, { tag, url, order });
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
                .map(item => (
                    <li>
                        <a key={item.url} className="inline-url" href={`#${item.url}`}>&gt;&gt;&gt;{item.text}
                        </a>
                    </li>
                )),
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
                                external={item.external}
                                date={item.date}
                                order={item.order}
                                chainlinkElementsState={[getElementList, setElementList]}
                            />
                            );
                        default:
                            return null; // Always return something (or null) to avoid map errors
                    }
                })
            }
            <CursorContext.Provider value={{ cursor, setCursor }}>
                <CreateBodyEditButtons chainlinkElementsState={[getElementList, setElementList]} />
            </CursorContext.Provider>
        </React.Fragment>
  );
}

export function CreateBodyEditButtons(props) {

    // This hook remembers if the element creation form should be remembered. It's a switch that will help us keep track if the form
    // is being shown or not.
    const [showElementCreationForm, setShowElementCreationForm] = useState(false);
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;
    const [elementType, setElementType] = useState("");
    const { cursor, setCursor } = useContext(CursorContext);

        const handleClick = (type) => {
            setElementType(type)
            setShowElementCreationForm(true); // Set the state to true to show the element creation form
        };
        const handleHide = () => setShowElementCreationForm(false); // Set the state to false to hide the element creation form
        let chainlinkButton;
        let buttonList;

        if (showElementCreationForm == false) {
            buttonList = (
                <React.Fragment>
                    <button id="add-cl-btn" className="button is-rounded is-danger cell add-buttons" onClick={() => handleClick("HEADER2")}>&lt;n&gt; h2</button>
                    <button id="add-p-btn" className="button is-rounded is-black cell add-buttons" onClick={() => handleClick("PARAGRAPH")}>&lt;p&gt; paragraph
                    </button>
                    <button id="add-h3-btn" className="button is-rounded is-primary cell add-buttons" onClick={() => makeForm('HEADER3')}>&lt;h&gt; header</button>
                    <button id="add-code-btn" className="button is-rounded is-success cell add-buttons" onClick={() => makeForm('CODE')}>&lt;c&gt; code
                    </button>
                    <button id="add-br-btn" className="button is-rounded is-warning cell add-buttons" onClick={() => makeForm('LINEBREAK')}>&lt;b&gt; linebreak
                    </button>
                    <button id="add-li-btn" className="button is-rounded is-white cell add-buttons" onClick={() => makeForm('LI')}>&lt;l&gt; list</button>
                    <button id="add-link-btn" className="button is-rounded is-link cell add-buttons" onClick={() => makeForm('LINK')}>&lt;q&gt; link
                    </button>
                    <button id="add-img-btn" className="button is-rounded is-info cell add-buttons" onClick={() => makeForm('IMG')}>&lt;i&gt; img</button>
                    <button id="add-note-btn" className="button is-rounded is-dark cell add-buttons" onClick={() => makeForm('NOTE')}>&lt;n&gt; note
                    </button>
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
            <div className="crud-form">
                {<ElementCreationForm chainlinkElementsState={[getChainlinkElements, setChainlinkElements]} onHide={handleHide} elementCreationFormState={[showElementCreationForm, setShowElementCreationForm]} placeholder="enter content" method="POST" type={elementType} />}
                <div className="grid">
                    {buttonList}
                </div>
            </div>
        );
    }

export function ElementCreationForm(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;

    useEffect(() => {
    })
    if (props.type === 'HEADER3') {
        return (
            <React.Fragment>
                <ConstructHeader3Element value={props.value} type={props.type} url={props.url} order={props.order}/>
            </React.Fragment>
        );
    } else if (props.type === 'CODE') {
        return (
            <React.Fragment>
                <ConstructCodeElement value={props.value} type={props.type} url={props.url} order={props.order}/>
            </React.Fragment>
        );
    } else if (props.type === 'PARAGRAPH') {
        return (
            <React.Fragment>
                <ConstructParagraphElement value={props.value} type={props.type} onHide={props.onHide} method={props.method} />
            </React.Fragment>
        );
    } else if (props.type === 'LINEBREAK') {
        return (
            <React.Fragment>
                <ConstructLinebreakElement value={props.value} type={props.type} url={props.url} order={props.order}/>
            </React.Fragment>
        );
    } else if (props.type == "HEADER2") {
        return (
            <React.Fragment>
                <ConstructHeader2Element chainlinkElementsState={[getChainlinkElements, setChainlinkElements]} value={props.value} type={props.type} url={props.url} order={props.order} date={props.date} css={props.css} onHide={props.onHide} method={props.method} elementCreationFormState={props.elementCreationFormState} />
            </React.Fragment>
        )
    } else if (props.type == "HEADER1") {
        return (
            <React.Fragment>
                <ConstructHeader1Element value={props.value} type={props.type} url={props.url} order={props.order}/>
            </React.Fragment>
        )
    }
}

function ConstructHeader2Element(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;
    const [showFormState, setFormState] = props.elementCreationFormState;

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        console.log("Form Data:", values); // Access all values here

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        values.order = getUniqueOrder(values.order, getChainlinkElements);  // Automatically increment the order if there is a collision to avoid duplicate orders.
        let xhr = new XMLHttpRequest();
        xhr.open(props.method, window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(values));


        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                const newComponent = {
                    url: xhr.response.url,
                    external: xhr.response.external,
                    text: xhr.response.text,
                    order: parseInt(xhr.response.order),
                    date: xhr.response.date,
                    tag: xhr.response.tag,
                }
                console.log(getChainlinkElements)
                console.log(newComponent)
                setChainlinkElements(prevList => [...prevList, newComponent]);
            }
        }
        setFormState(false);
    };
    return (
        <>
            {showFormState && <form onSubmit={handleSubmit} className="crud-form">
                <div id="non-submit-fields" className="field">
                    <div className="form-group field">
                        <label htmlFor="text" id="element-form-text-label" className="form-label label">Text</label>
                        <input autoFocus type="text" id="input element-form-text"
                               name="text"
                               className="input form-field"/>
                        <p className="help">enter a title to be used as the header name for this element</p>
                    </div>
                    <div className="form-group field">
                        <label htmlFor="external" id="element-form-text-label" className="form-label label">External
                            URL</label>
                        <input type="text" id="input element-form-text" name="external" className="input form-field"/>
                        <p className="help">enter the external url for this element</p>
                    </div>
                    <div className="form-group field">
                        <label className="label">Element Ordering</label>
                        <input className="input" name="order" defaultValue={getChainlinkElements.length > 0 ? Math.floor((Number(getChainlinkElements[getChainlinkElements.length - 1].order) + 100) / 100) * 100 : 0}/>
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
                                    <input className="input is-static" name="tag" value="HEADER2" readOnly/>
                                    <p className="help">this is the type of Element being instantiated</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element URL</label>
                                    <input className="input is-static" name="url" value={props.url} readOnly/>
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
                    <input className="button is-dark" type="reset" onClick={() => setFormState(false)} value="CANCEL"/>
                    <input className="button is-success is-right" type="submit" value="CREATE"/>
                </div>
            </form>}
        </>
    );
};

export function NoElements(props) {
    return (
        <React.Fragment>
            &lt;{props.element} CONTENT MISSING&gt;
        </React.Fragment>
    );
}

export function Header2(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;
    const chainlink = getChainlinkElements.find(item => item.url === props.url);
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    let old_text = chainlink.text;
    let old_order = chainlink.order;
    let old_external = chainlink.external || "";

    const [showChainlinkDeleteForm, setShowChainlinkDeleteForm] = useState(false);
    const [showChainlinkEditForm, setShowChainlinkEditForm] = useState(false);
    const handleDeleteSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open("DELETE", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(values));

        // This line updates the state to remove the deleted element from the list. It identifies the element by its URL.
        setChainlinkElements(prevList => prevList.filter(item => item.url !== chainlink.url));

    };

    const handleEditSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        // check if the user pressed submit button without updating anything. If so then don't send the request since
        // nothing would change and there's no reason to burden the server.
        if (!(values.text == old_text && values.order == old_order && values.external == old_external)) {
            values.order = getUniqueOrder(values.order, getChainlinkElements);  // Automatically increment the order if there is a collision to avoid duplicate orders.

            let xhr = new XMLHttpRequest();
            xhr.open("PUT", window.location.href, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
            xhr.responseType = "json";
            xhr.send(JSON.stringify(values));

            // This line of code updates the element in the list by identifying it by its URL and then updated specific fields
            setChainlinkElements(prevList => prevList.map(item => item.url === chainlink.url ? { ...item, text: values.text, order: values.order, date: values.date, external: values.external } : item));
        }

        setShowChainlinkEditForm(false);
    };
    return (
        <section className="section is-medium">
            <div id={chainlink.url} className="element-wrapper title is-2" tag="HEADER2">
                <h2>
                    <span className="element-order">#{chainlink.order}</span>
                    <span className="element-inner-content" style={{}}>{chainlink.text}</span>
                    {chainlink.external && (<a className="inline-url header-url" href={formatUrl(chainlink.external)}>&gt;&gt;&gt;{truncateLink(chainlink.external)}</a>)}
                    <span className="element-date">{convertISO8601_to_intl(chainlink.date)}</span>
                </h2>
            <ChainlinkEditButtons1 chainlinkElementsState={[getChainlinkElements, setChainlinkElements]} url={chainlink.url} chainlinkDeleteFormState={[showChainlinkDeleteForm, setShowChainlinkDeleteForm]} chainlinkEditFormState={[showChainlinkEditForm, setShowChainlinkEditForm]} />
            </div>
            {showChainlinkDeleteForm && (
                <form className="crud-form" onSubmit={handleDeleteSubmit}>
                    <input type="hidden" name="url" value={chainlink.url}/>
                    <input type="hidden" name="order" value={parseInt(chainlink.order, 10)}/>

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
                                    <input className="input is-static" name="tag" value={chainlink.tag} readOnly/>
                                    <p className="help">this is the type of Element being deleted. In this case it's a
                                        element</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element URL</label>
                                    <input className="input is-static" name="url" value={chainlink.url} readOnly/>
                                    <p className="help">"furl" stands for "full url". This is the complete identifier
                                        for this element.</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element Ordering</label>
                                    <input className="input is-static" name="order" value={chainlink.order}
                                           readOnly/>
                                    <p className="help">This is the order of this element on the page.</p>
                                </div>
                            </React.Fragment>
                        }
                    />
                    <div className="form-submit-buttons" id="element-creation-text-align-right field">
                        <input className="button is-dark" type="reset" onClick={() => setShowChainlinkDeleteForm(false)} value="CANCEL"/>
                        <input className="button is-success is-right" type="submit" value="DELETE"/>
                    </div>
                </form>
            )}
            {showChainlinkEditForm && (
                <form className="crud-form" onSubmit={handleEditSubmit}>
                    <input type="hidden" name="url" value={chainlink.url}/>
                    <input type="hidden" name="order" value={parseInt(chainlink.order, 10)}/>
                    <div className="form-group field">
                    <label htmlFor="text" id="element-form-delete-label" className="form-label label">Modify
                            this element</label>
                    </div>
                    <div className="form-group field">
                        <label htmlFor="text" id="element-form-text-label"
                               className="form-label label">Text</label>
                        <input autoFocus type="text" id="input element-form-text"
                               defaultValue={chainlink.text}
                               name="text"
                               className="input form-field"/>
                        <p className="help">enter a title to be used as the header name for this element</p>
                    </div>
                    <div className="form-group field">
                        <label htmlFor="external" id="element-form-text-label" className="form-label label">External
                            URL</label>
                        <input type="text" defaultValue={chainlink.external} id="input element-form-text"
                               name="external" className="input form-field"/>
                        <p className="help">enter the external url for this element</p>
                    </div>
                    <div className="form-group field">
                        <label className="label">Element Ordering</label>
                        <input className="input" type="text" name="order" defaultValue={chainlink.order}/>
                        <p className="help">This is the order of this element on the page.</p>
                    </div>
                    <CollapsibleCard
                        title="Read Only Fields"
                        content={
                            <React.Fragment>
                                <div className="form-group field">
                                    <label className="label">Element Tag</label>
                                    <input className="input is-static" name="tag" value={chainlink.tag} readOnly/>
                                    <p className="help">this is the type of Element being deleted. In this case it's
                                        a
                                        element</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element URL</label>
                                    <input className="input is-static" name="url" value={chainlink.url} readOnly/>
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
                        <input className="button is-dark" type="reset" onClick={() => setShowChainlinkEditForm(false)} value="CANCEL"/>
                        <input className="button is-success" type="submit" value="UPDATE"/>
                    </div>
                </form>
            )}
            {chainlink.children && chainlink.children.sort((a, b) => a.order - b.order) // Sort children by order
                .map((el) => {
                    // Render the appropriate component based on the data structure
                    // Note: You may need to pass the tag in your useEffect for this logic
                    if (el.tag === "Header3") {
                            return <Header3 />;
                    } else if (el.tag === "Paragraph") {
                            return <Paragraph />;
                    } else if (el.tag === "Linebreak") {
                            return <Linebreak />;
                    } else if (el.tag === "Code") {
                            return <Code />;
                    }
                    // Default fallback
                    return <NoElements key={el.key} element="Body Element" />;
                })
            }
        </section>
    );
}

function ChainlinkEditButtons1(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;
    const chainlink = getChainlinkElements.find(item => item.url === props.url);
    const [showChainlinkDeleteFormState, setChainlinkDeleteFormState] = props.chainlinkDeleteFormState;
    const [showChainlinkEditFormState, setChainlinkEditFormState] = props.chainlinkEditFormState;

    // This function shifts the target Element up in the order by swapping its order with the previous Element. The order values of each is swapped. This causes a re-render of the Element list
    // We also send a PUT request to the backend to update the order in the database. We do this for both Elements so that the order values for both are updated.
    function shiftUp() {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const index = getChainlinkElements.findIndex(item => item.url === props.url);

        function sendChainlinkUpdate(chainlinkData) {
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
                xhr.send(JSON.stringify(chainlinkData));
            });
        }

        // Perform the update
        setChainlinkElements(prevList => {
            const newList = [...prevList];

            if (index === -1 || index < 1) {
                return prevList; // Invalid state, do nothing
            }

            // Swap orders
            const tempOrder = newList[index].order;
            newList[index].order = newList[index - 1].order;
            newList[index - 1].order = tempOrder;

            let list_obj_copy1 = newList[index]
            let list_obj_copy2 = newList[index - 1]

            // Send updates
            Promise.all([
                sendChainlinkUpdate(list_obj_copy1),
                sendChainlinkUpdate(list_obj_copy2)
            ]).then(() => {
                // After both succeed, commit changes to state
                setChainlinkElements(() => newList);
            }).catch(error => {
                console.error("Failed to update element order:", error);
            });

            return prevList; // temporarily return old list to defer update
        });
    }

    function shiftDown() {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const index = getChainlinkElements.findIndex(item => item.url === props.url);

        function sendChainlinkUpdate(chainlinkData) {
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
                xhr.send(JSON.stringify(chainlinkData));
            });
        }

        // Perform the update
        setChainlinkElements(prevList => {
            const newList = [...prevList];

            if (index === -1 || index + 1 >= newList.length) {
                return prevList; // Invalid state, do nothing
            }

            // Swap orders
            const tempOrder = newList[index].order;
            newList[index].order = newList[index + 1].order;
            newList[index + 1].order = tempOrder;

            let list_obj_copy1 = newList[index]
            let list_obj_copy2 = newList[index + 1]

            // Send updates
            Promise.all([
                sendChainlinkUpdate(list_obj_copy1),
                sendChainlinkUpdate(list_obj_copy2)
            ]).then(() => {
                // After both succeed, commit changes to state
                setChainlinkElements(() => newList);
            }).catch(error => {
                console.error("Failed to update element order:", error);
            });

            return prevList; // temporarily return old list to defer update
        });
    }
    return (
        <div className="element-buttons-wrapper">
            <div className="left-buttons">
                <button className="cl-edit-btn button is-small is-info" target={chainlink.url}
                        onClick={() => shiftUp()}>⬆
                </button>
                <button className="cl-edit-btn button is-small is-warning" target={chainlink.url}
                        onClick={() => shiftDown()}>⬇
                </button>
            </div>
            <div className="right-buttons">
                <button className="doc-action-copy-title button is-small is-info"
                        onClick={() => navigator.clipboard.writeText(chainlink.text)}>copy
                </button>
                <button className="cl-edit-btn button is-small is-warning" target={chainlink.url}
                        onClick={() => setChainlinkEditFormState(true)}>edit
                </button>
                <button className="cl-del-btn button is-small is-danger" target={chainlink.url}
                        onClick={() => setChainlinkDeleteFormState(true)}>delete
                </button>
            </div>
        </div>
    );
}

export function ContentEditButtons1(props) {
    let chainlinkId = "content-" + props.url + "-" + props.order
    return (
        <div className="context-buttons-wrapper">
            <button className="doc-action-copy-title button is-small is-info">copy</button>
            <button className="cont-edit-btn button is-small is-warning" target={chainlinkId}
                    onClick={() => editContent(chainlinkId)}>edit
            </button>
            <button className="cont-del-btn button is-small is-danger" target={chainlinkId}
                    onClick={() => deleteContent(chainlinkId)}>edit
            </button>
        </div>
    );
}

export function Header3(props) {
    let contentId = "content-" + props.curl + "-" + props.order
    return (
        <div id={contentId} className="title is-3 content-wrapper" tag="H3" index={12}>
            <h3 className="inner-content">{props.text}</h3>
            <ContentEditButtons1 curl={props.curl} order={props.order}/>
        </div>
    );
};

export function Linebreak(props) {
    let contentId = "content-" + props.curl + "-" + props.order
    return (
        <div id={contentId} className="content-wrapper" tag="BR" index={12}>
            <span className="pb-6 pt-6 inner-content br">
                <i>&lt;!-- linebreak insert --&gt;</i>
            </span>
            <ContentEditButtons1 curl={props.curl} order={props.order}/>
        </div>
    );
};

export function Code(props) {
    let contentId = "content-" + props.curl + "-" + props.order
    return (
        <div id={contentId} className="content-wrapper" tag="CODE" index={12}>
            <code className="code inner-content">{props.text}</code>
            <ContentEditButtons1 curl={props.curl} order={props.order}/>
        </div>
    );
};

export function Paragraph(props) {
    let contentId = "content-" + props.curl + "-" + props.order
    if (props.render_outer_div === true) {
        return (
            <div className="content-wrapper" id={contentId} tag="P">
                <p className="inner-content">{props.text}</p>
                <ContentEditButtons1 curl={props.curl} order={props.order} />
            </div>
        );
    } else {
        return (
            <React.Fragment>
                <p className="inner-content">{props.text}</p>
                <ContentEditButtons1 curl={props.curl} order={props.order}/>
            </React.Fragment>
        );
    }
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

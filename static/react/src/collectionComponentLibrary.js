import React, {useEffect, createContext, useContext, useRef } from "react";
import { createRoot, createPortal } from "react-dom";
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

export function ChainlinkDisplayAsComponents() {
  const [getChainlinkElements, setChainlinkElements] = useState([]);
  const [cursor, setCursor] = useState({ url: null, chainlinkOrder: -1, elementOrder: -1 });
  const chainlinks = document.querySelectorAll(".chainlink");

  let chainlinkManifestDomElement = document.getElementById("chainlink-manifest-entries");

  useEffect(() => {
    let chainlinkElements = [];
    let lastChainlinkUrl = null;
    let lastChainlinkOrder = -1;
    let lastElementOrder = -1;

    chainlinks.forEach((chainlink) => {
      let chainlinkObj = {};
      let innerElements = [];

      Array.from(chainlink.children).forEach((element) => {
        const tag = element.getAttribute("tag");

        if (tag === "Chainlink") {
          const url = element.id;
          const order = parseInt(element.getAttribute("order"), 10);
          const text = element.querySelector(".chainlink-inner-content")?.textContent || "";
          const date = element.querySelector(".chainlink-date")?.getAttribute("date") || "";
          let external = element.querySelector(".header-url")?.getAttribute("href") || "";

          Object.assign(chainlinkObj, { tag, url, order, text, date, external });

          lastChainlinkUrl = url;
          lastChainlinkOrder = order;
          lastElementOrder = -1;
        } else if (tag === "Header3") {
          innerElements.push(
            <Header3
              key={element.id}
              url={getUrlFromId(element.id)}
              text={element.querySelector(".inner-content")?.textContent || ""}
              order={getOrderFromId(element.id)}
            />
          );
          lastElementOrder = getOrderFromId(element.id);
        } else if (tag === "Paragraph") {
          innerElements.push(
            <Paragraph
              key={element.id}
              render_outer_div={true}
              url={getUrlFromId(element.id)}
              text={element.querySelector(".inner-content")?.textContent || ""}
              order={getOrderFromId(element.id)}
            />
          );
          lastElementOrder = getOrderFromId(element.id);
        } else if (tag === "Code") {
          innerElements.push(
            <Code
              key={element.id}
              url={getUrlFromId(element.id)}
              text={element.querySelector(".inner-content")?.textContent || ""}
              order={getOrderFromId(element.id)}
            />
          );
          lastElementOrder = getOrderFromId(element.id);
        } else if (tag === "Linebreak") {
          innerElements.push(
            <Linebreak
              key={element.id}
              url={getUrlFromId(element.id)}
              order={getOrderFromId(element.id)}
            />
          );
          lastElementOrder = getOrderFromId(element.id);
        }
      });

      chainlinkElements.push(chainlinkObj);
    });

    setChainlinkElements(chainlinkElements);
    setCursor({
      url: lastChainlinkUrl,
      chainlinkOrder: lastChainlinkOrder,
      elementOrder: lastElementOrder,
    });

  }, []); // Run once on mount

  return (
    <React.Fragment>
        {createPortal(
          getChainlinkElements
            .sort((a, b) => a.order - b.order)
            .map(item => (
                <li>
                    <a key={item.url} className="inline-url" href={`#${item.url}`}>&gt;&gt;&gt;{item.text}
                    </a>
                </li>
            )),
          chainlinkManifestDomElement
        )}
      {
        getChainlinkElements
          .sort((a, b) => a.order - b.order)
          .map(item => (
            <Chainlink
              key={item.url}
              url={item.url}
              text={item.text}
              external={item.external}
              date={item.date}
              order={item.order}
              chainlinkElementsState={[getChainlinkElements, setChainlinkElements]}
            />
          ))
      }
      <CursorContext.Provider value={{ cursor, setCursor }}>
        <CreateBodyEditButtons1 chainlinkElementsState={[getChainlinkElements, setChainlinkElements]} />
      </CursorContext.Provider>
    </React.Fragment>
  );
}

export function CreateBodyEditButtons1(props) {

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
        let restOfButtons;

        if (showElementCreationForm == false) {
            chainlinkButton = (
                <button id="add-cl-btn" className="button is-rounded is-danger cell add-buttons" onClick={() => handleClick("Chainlink")}>&lt;n&gt; chainlink</button>
            );

        } else if (showElementCreationForm == true) {
            chainlinkButton = (
                <button className="cell button inactive-add-buttons" disabled>&lt;n&gt; chainlink</button>
            );
        }
        console.log(cursor.elementOrder)
        if (!(cursor.elementOrder == -1 && cursor.chainlinkOrder == -1)) {
            restOfButtons = (
                <React.Fragment>
                    <button id="add-p-btn" className="button is-rounded is-black cell add-buttons" onClick={() => handleClick("Paragraph")}>&lt;p&gt; paragraph
                    </button>
                    <button id="add-h3-btn" className="button is-rounded is-primary cell add-buttons" onClick={() => makeForm('H3')}>&lt;h&gt; header</button>
                    <button id="add-code-btn" className="button is-rounded is-success cell add-buttons" onClick={() => makeForm('CODE')}>&lt;c&gt; code
                    </button>
                    <button id="add-br-btn" className="button is-rounded is-warning cell add-buttons" onClick={() => makeForm('BR')}>&lt;b&gt; linebreak
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
            restOfButtons = (
                <React.Fragment>
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
                {<ElementCreationForm1 chainlinkElementsState={[getChainlinkElements, setChainlinkElements]} onHide={handleHide} elementCreationFormState={[showElementCreationForm, setShowElementCreationForm]} placeholder="enter content" method="POST" type={elementType} />}
                <div className="grid">
                    {chainlinkButton}
                    {restOfButtons}
                </div>
            </div>
        );
    }

export function ElementCreationForm1(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;

    useEffect(() => {
    })
    if (props.type === 'H3') {
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
    } else if (props.type === 'P') {
        return (
            <React.Fragment>
                <ConstructParagraphElement value={props.value} type={props.type} onHide={props.onHide} method={props.method} />
            </React.Fragment>
        );
    } else if (props.type === 'BR') {
        return (
            <React.Fragment>
                <ConstructLinebreakElement value={props.value} type={props.type} url={props.url} order={props.order}/>
            </React.Fragment>
        );
    } else if (props.type == "Chainlink") {
        return (
            <React.Fragment>
                <ConstructChainlinkElement chainlinkElementsState={[getChainlinkElements, setChainlinkElements]} value={props.value} type={props.type} url={props.url} order={props.order} date={props.date} css={props.css} onHide={props.onHide} method={props.method} elementCreationFormState={props.elementCreationFormState} />
            </React.Fragment>
        )
    } else if (props.type == "H1") {
        return (
            <React.Fragment>
                <ConstructHeader1Element value={props.value} type={props.type} url={props.url} order={props.order}/>
            </React.Fragment>
        )
    } else if (props.type == "COL") {
        return (
            <React.Fragment>
                <ConstructColElement/>
            </React.Fragment>
        )
    }
}

function ConstructChainlinkElement(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;
    const [showFormState, setFormState] = props.elementCreationFormState;

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        console.log("Form Data:", values); // Access all values here

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
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
                        <label htmlFor="text" id="chainlink-form-text-label" className="form-label label">Text</label>
                        <input autoFocus type="text" id="input chainlink-form-text"
                               name="text"
                               className="input form-field"/>
                        <p className="help">enter a title to be used as the header name for this chainlink</p>
                    </div>
                    <div className="form-group field">
                        <label htmlFor="external" id="chainlink-form-text-label" className="form-label label">External
                            URL</label>
                        <input type="text" id="input chainlink-form-text" name="external" className="input form-field"/>
                        <p className="help">enter the external url for this chainlink</p>
                    </div>
                    <div className="form-group field">
                        <label className="label">Element Ordering</label>
                        <input className="input" name="order" defaultValue={getChainlinkElements.length > 0 ? Math.floor((Number(getChainlinkElements[getChainlinkElements.length - 1].order) + 100) / 100) * 100 : 0}/>
                        <p className="help">this is the order of this chainlink relative to others on the
                            page</p>
                    </div>
                    <div className="form-group field">
                        <input type="hidden" name="archive" value="False"/>
                        <input type="hidden" name="public" value="False"/>
                        <label className="label">Access Controls</label>
                        <div className="checkboxes">
                            <label id="chainlink-form-public-label" className="form-label checkbox">
                                <input type="checkbox" name="public" value="True" id="chainlink-form-archive"
                                       className="checkbox form-field" style={{"marginRight": "5px"}}/>
                                Public
                            </label>
                            <label id="chainlink-form-archive-label" className="form-label checkbox">
                                <input type="checkbox" name="archive" value="True" id="chainlink-form-archive"
                                       className="checkbox form-field" style={{"marginRight": "5px"}}/>
                                Archive
                            </label>
                        </div>
                        <p className="help">specify which viewers will be able to access the contents of this chainlink
                            and
                            what will happen to this chainlink if it's deleted</p>
                    </div>
                    <CollapsibleCard
                        title="Read Only Fields"
                        content={
                            <React.Fragment>
                                <div className="form-group field">
                                    <label className="label">Element Tag</label>
                                    <input className="input is-static" name="tag" value="Chainlink" readOnly/>
                                    <p className="help">this is the type of Element being instantiated</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element URL</label>
                                    <input className="input is-static" name="url" value={props.url} readOnly/>
                                    <p className="help">this is the unique identifier field for this element - if you
                                        are
                                        creating a new
                                        chainlink then this value will empty until the backend sends us a response</p>
                                </div>
                                <div className="form-group field">
                                    <label htmlFor="date" id="chainlink-form-date-label"
                                           className="form-label label">Date</label>
                                    <input type="input" name="date" id="chainlink-form-date"
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
                                    <label htmlFor="css" id="chainlink-form-css-label"
                                           className="form-label label">CSS</label>
                                    <input type="input" name="css" id="chainlink-form-css"
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

export function Chainlink(props) {
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

        // This line updates the state to remove the deleted chainlink from the list. It identifies the chainlink by its URL.
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


            let xhr = new XMLHttpRequest();
            xhr.open("PUT", window.location.href, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('X-CSRFToken', csrftoken);
            xhr.responseType = "json";
            xhr.send(JSON.stringify(values));

            // This line of code updates the chainlink in the list by identifying it by its URL and then updated specific fields
            setChainlinkElements(prevList => prevList.map(item => item.url === chainlink.url ? { ...item, text: values.text, order: values.order, date: values.date, external: values.external } : item));
        }

        setShowChainlinkEditForm(false);
    };
    return (
        <section className="section is-medium chainlink">
            <div id={chainlink.url} className="chainlink-wrapper title is-2" tag="Chainlink">
                <h2>
                    <span className="chainlink-order">#{chainlink.order}</span>
                    <span className="chainlink-inner-content" style={{}}>{chainlink.text}</span>
                    {chainlink.external && (<a className="inline-url header-url" href={formatUrl(chainlink.external)}>&gt;&gt;&gt;{truncateLink(chainlink.external)}</a>)}
                    <span className="chainlink-date">{convertISO8601_to_intl(chainlink.date)}</span>
                </h2>
            <ChainlinkEditButtons1 chainlinkElementsState={[getChainlinkElements, setChainlinkElements]} url={chainlink.url} chainlinkDeleteFormState={[showChainlinkDeleteForm, setShowChainlinkDeleteForm]} chainlinkEditFormState={[showChainlinkEditForm, setShowChainlinkEditForm]} />
            </div>
            {showChainlinkDeleteForm && (
                <form className="crud-form" onSubmit={handleDeleteSubmit}>
                    <input type="hidden" name="url" value={chainlink.url}/>
                    <input type="hidden" name="order" value={parseInt(chainlink.order, 10)}/>

                    <div className="form-group field">
                        <label htmlFor="text" id="chainlink-form-delete-label" className="form-label label">Are you sure
                            you want to delete this Chainlink?</label>
                        <p className="help">this action can't be undone.</p>
                    </div>
                    <div className="form-group field">
                        <input type="hidden" name="archive" value="False"/>
                        <label className="label">Access Controls</label>
                        <div className="checkboxes">
                            <label id="chainlink-form-archive-label" className="form-label checkbox">
                                <input type="checkbox" name="archive" value="True" id="chainlink-form-archive"
                                       className="checkbox form-field" style={{"marginRight": "5px"}}/>
                                Archive
                            </label>
                        </div>
                        <p className="help">Checking this box will ensure that this Chainlink is stored in your archive
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
                                        chainlink</p>
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
                                    <p className="help">This is the order of this Chainlink on the page.</p>
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
                    <label htmlFor="text" id="chainlink-form-delete-label" className="form-label label">Modify
                            this chainlink</label>
                    </div>
                    <div className="form-group field">
                        <label htmlFor="text" id="chainlink-form-text-label"
                               className="form-label label">Text</label>
                        <input autoFocus type="text" id="input chainlink-form-text"
                               defaultValue={chainlink.text}
                               name="text"
                               className="input form-field"/>
                        <p className="help">enter a title to be used as the header name for this chainlink</p>
                    </div>
                    <div className="form-group field">
                        <label htmlFor="external" id="chainlink-form-text-label" className="form-label label">External
                            URL</label>
                        <input type="text" defaultValue={chainlink.external} id="input chainlink-form-text"
                               name="external" className="input form-field"/>
                        <p className="help">enter the external url for this chainlink</p>
                    </div>
                    <div className="form-group field">
                        <label className="label">Element Ordering</label>
                        <input className="input" type="text" name="order" defaultValue={chainlink.order}/>
                        <p className="help">This is the order of this Chainlink on the page.</p>
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
                                        chainlink</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element URL</label>
                                    <input className="input is-static" name="url" value={chainlink.url} readOnly/>
                                </div>
                                <div className="form-group field">
                                    <label htmlFor="date" id="chainlink-form-date-label"
                                           className="form-label label">Date</label>
                                    <input type="input" name="date" id="chainlink-form-date"
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
                console.error("Failed to update chainlink order:", error);
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
                console.error("Failed to update chainlink order:", error);
            });

            return prevList; // temporarily return old list to defer update
        });
    }
    return (
        <div className="chainlink-buttons-wrapper">
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

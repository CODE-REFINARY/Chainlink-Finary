import React, {useEffect, createContext, useContext, useRef } from "react";
import { createRoot, createPortal } from "react-dom";
import {
    elementsEditButtonEventHandlers,
    deleteChainlink,
    deleteContent,
    editChainlink,
    editContent, instantiateEditButtons,
    makeForm, removeEditButtons, deleteChainlink1,
    refresh, storeEditButtonHandlers, parseKeyDown,
    numChainlinkElements
} from "./collectionStateManager";
import {
    getOrderFromId, getUrlFromId, formatDateString, getPrefixFromId, getMatchedChildren
} from "./staticUtils";
import { useState } from "react";

const CursorContext = createContext(null);

/**
 * Render the row of Element creation buttons that appear at the bottom of the collection
 *
 * @param {string} bitmask - indicate which buttons to enable and disable. This is regular string containing
 * 0s and 1s (bits) indicating which buttons should be active. The first bit sets the Chainlink button active.
 * The second bit sets the rest of the buttons active.
 * Example: 10 - this sets the chainlink button to active and the rest of the buttons to `inactive`. An instance where
 * this particular value would occur is when the user creates a new Collection. There are no Chainlinks defined for the
 * Collection yet and so the other Body Element buttons should be grayed out and only the Chainlink button should be
 * active.
 */
export function CreateBodyEditButtons(props) {
    let chainlinkButton;
    let restOfButtons;

    if (props.bitmask[0] === "1") {
        chainlinkButton = (
            <button id="add-cl-btn" className="button is-rounded is-danger cell add-buttons" onClick={() => makeForm("CL")}>&lt;n&gt; chainlink</button>
        );

    } else if (props.bitmask[0] === "0") {
        chainlinkButton = (
            <button className="cell button inactive-add-buttons" disabled>&lt;n&gt; chainlink</button>
        );
    }

    if (props.bitmask[1] === "1") {
        restOfButtons = (
            <React.Fragment>
                <button id="add-p-btn" className="button is-rounded is-black cell add-buttons" onClick={() => makeForm("P")}>&lt;p&gt; paragraph
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

    } else if (props.bitmask[1] === "0") {
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
        <React.Fragment>
            {chainlinkButton}
            {restOfButtons}
        </React.Fragment>
    );
}

export function CreateHeaderEditButtons(props) {
    let headerButton;

    if (props.bitmask[0] === "1") {
        headerButton = (
            <React.Fragment>
                <button id="add-h1-btn" className="add-buttons" onClick={() => makeForm("H1")}>Title</button>
                <button id="add-hbnr-btn" className="add-buttons" onClick={() => makeForm("HBNR")}>Header Banner
                </button>
            </React.Fragment>
        );

    } else if (props.bitmask[0] === "0") {
        headerButton = (
            <React.Fragment>
                <button className="inactive-add-buttons">Title</button>
                <button className="inactive-add-buttons">Header Banner</button>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            {headerButton}
        </React.Fragment>
    );
}

export function CreateFooterEditButtons(props) {
    let footerButton;

    if (props.bitmask[0] === "1") {
        footerButton = (
            <React.Fragment>
                <button id="add-en-btn" className="add-buttons" onClick={() => makeForm("EN")}>Endnote</button>
                <button id="add-ftrli-btn" className="add-buttons" onClick={() => makeForm("FTRLI")}>Footer List
                </button>
                z
            </React.Fragment>
        );

    } else if (props.bitmask[0] === "0") {
        footerButton = (
            <React.Fragment>
                <button className="inactive-add-buttons">Endnote</button>
                <button className="inactive-add-buttons">Footer List</button>
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            {footerButton}
        </React.Fragment>
    );
}

export function ChainlinkEditButtons(props) {
    const editFunction = function () {
        editChainlink(props.wrappers[props.i].id)
    };
    const deleteFunction = function () {
        deleteChainlink(props.wrappers[props.i].id)
    };
    storeEditButtonHandlers(editFunction, deleteFunction)
    return (
        <React.Fragment>
            <button className="doc-action-copy-title button is-small is-info">copy</button>
            <button className="cl-edit-btn button is-small is-warning" target={props.wrappers[props.i].id}
                    onClick={elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][0]}>edit
            </button>
            <button className="cl-del-btn button is-small is-danger" target={props.wrappers[props.i].id}
                    onClick={elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][1]}>delete
            </button>
        </React.Fragment>
    );
}

export function ContentEditButtons(props) {
    const editFunction = function () {
        editContent(props.wrappers[props.i].id)
    };
    const deleteFunction = function () {
        deleteContent(props.wrappers[props.i].id)
    };
    storeEditButtonHandlers(editFunction, deleteFunction)
    return (
        <React.Fragment>
            <button className="doc-action-copy-title button is-small is-info">copy</button>
            <button className="cont-edit-btn button is-small is-warning" target={props.wrappers[props.i].id}
                    onClick={elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][0]}>edit
            </button>
            <button className="cont-del-btn button is-small is-danger" target={props.wrappers[props.i].id}
                    onClick={elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][1]}>delete
            </button>
        </React.Fragment>
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

        if (tag === "chainlink") {
          const url = element.id;
          const order = parseInt(element.getAttribute("order"), 10);
          const text = element.querySelector(".chainlink-inner-content")?.textContent || "";
          const date = element.querySelector(".chainlink-date")?.textContent || "";
          let external = element.querySelector(".header-url")?.getAttribute("href") ?? null;

          Object.assign(chainlinkObj, { url, order, text, date, external });

          lastChainlinkUrl = url;
          lastChainlinkOrder = order;
          lastElementOrder = -1;
        } else if (tag === "H3") {
          innerElements.push(
            <Header3
              key={element.id}
              url={getUrlFromId(element.id)}
              text={element.querySelector(".inner-content")?.textContent || ""}
              order={getOrderFromId(element.id)}
            />
          );
          lastElementOrder = getOrderFromId(element.id);
        } else if (tag === "P") {
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
        } else if (tag === "CODE") {
          innerElements.push(
            <Code
              key={element.id}
              url={getUrlFromId(element.id)}
              text={element.querySelector(".inner-content")?.textContent || ""}
              order={getOrderFromId(element.id)}
            />
          );
          lastElementOrder = getOrderFromId(element.id);
        } else if (tag === "BR") {
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

      chainlinkObj.content = innerElements;
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

const getFormattedDateTime = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');

  const month = pad(now.getMonth() + 1); // getMonth is zero-based
  const day = pad(now.getDate());
  const year = now.getFullYear().toString().slice(-2);
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
};

function convertToLongDate(dateStr) {
  // Parse the date string
  const [datePart, timePart] = dateStr.split(" ");
  const [month, day, yearShort] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);

  // Create full 4-digit year
  const fullYear = yearShort + 2000;

  // Create a Date object (local time)
  const dateObj = new Date(fullYear, month - 1, day, hours, minutes, seconds);

  // Format using toLocaleString
  return dateObj.toLocaleString("en-US", {
    timeZoneName: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function NoElements(props) {
    return (
        <React.Fragment>
            &lt;{props.element} CONTENT MISSING&gt;
        </React.Fragment>
    );
}

export function ChainlinkHeader(props) {
    return (
        <React.Fragment>
            <span className="chainlink-inner-content">{props.title}</span>
        </React.Fragment>
    );
}

export function ElementCreationForm(props) {

    useEffect(() => {
        refresh();
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
                <ConstructParagraphElement value={props.value} type={props.type} url={props.url} order={props.order}/>
            </React.Fragment>
        );
    } else if (props.type === 'BR') {
        return (
            <React.Fragment>
                <ConstructLinebreakElement value={props.value} type={props.type} url={props.url} order={props.order}/>
            </React.Fragment>
        );
    } else if (props.type == "CL") {
        return (
            <React.Fragment>
                <ConstructChainlinkElement value={props.value} type={props.type} url={props.url} order={props.order}
                                           value={props.value} date={props.date} css={props.css}/>
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

export function ElementDeletionForm(props) {
    useEffect(() => {
        refresh();
    })

    return (
        <React.Fragment>
            <form className="crud-form">
                <input type="hidden" name="url" value={props.url}/>
                <input type="hidden" name="tag" value={props.type}/>
                {props.type === "CL" ? <div className="form-group">
                    <label htmlFor="archive content" id="chainlink-delete-form-archive-content"
                           className="form-label">archive content</label>
                    <input className="checkbox" type="checkbox" name="archive content" value="False"
                           id="chainlink-delete-form-archive-content" className="form-field"/>
                </div> : null}
                <div id="element-creation-text-align-right">
                    <input className="button is-danger is-medium is-outlined" type="submit" value="DELETE"/>
                </div>
            </form>
        </React.Fragment>
    );
}

export function ChainlinkDeletionForm(props) {
    useEffect(() => {
        refresh();
    })

    return (
        <React.Fragment>
            <form className="crud-form">
                <input type="hidden" name="furl" value={props.furl}/>
                <input type="hidden" name="order" value={parseInt(props.order, 10)}/>
                <input type="hidden" name="tag" value="CL"/>
                <div className="form-group">
                    <label htmlFor="archive content" id="chainlink-delete-form-archive-content"
                           className="form-label">archive content</label>
                    <input type="checkbox" name="archive content" value="False"
                           id="chainlink-delete-form-archive-content" className="form-field"/>
                </div>
                <div id="chainlink-deletion-text-align-right">
                    <input id="chainlink-deletion-submit" type="submit" value="Submit"/>
                </div>
            </form>
        </React.Fragment>
    );
}

/**
 * Create a Content Element. The type of Element to instantiate is specified by `props.type`.
 */
export function ContentElement(props) {

    useEffect(() => {
        refresh();
        removeEditButtons();
        instantiateEditButtons();
    }, []);

    let Tag;
    if (props.type === 'H3') {
        Tag = 'h3';
    } else if (props.type === 'CODE') {
        Tag = 'code';
    } else if (props.type === 'P') {
        Tag = 'p';
    } else if (props.type === 'BR') {
        Tag = 'br';
    } else {
        Tag = 'div';
    }

    if (Tag === 'br') {
        return (
            <React.Fragment>
                                <span className="pb-6 pt-6 inner-content br">
                                        <i>&lt;!-- linebreak insert --&gt;</i>
                                </span>
                <div className="context-buttons-wrapper">
                    <button className="cont-copy-btn">copy</button>
                    <button className="cont-edit-btn">edit</button>
                    <button className="cont-del-btn">delete</button>
                </div>
            </React.Fragment>
        );
    } else {
        return (
            <React.Fragment>
                <Tag className="inner-content">
                    {props.text}
                </Tag>
                <div className="context-buttons-wrapper">
                    <button className="cont-copy-btn">copy</button>
                    <button className="cont-edit-btn">edit</button>
                    <button className="cont-del-btn">delete</button>
                </div>
            </React.Fragment>
        );
    }
}

export function Chainlink(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;
    const chainlink = getChainlinkElements.find(item => item.url === props.url);
    let furl = "chainlink-" + chainlink.url + "-" + chainlink.order;

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

            console.log("Chainlink Edit Form Data:", values); // Access all values here

            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
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
            <div id={chainlink.url} className="chainlink-wrapper title is-2" tag="chainlink">
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
                    <input type="hidden" name="tag" value="CL"/>

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
                        <p className="help">Checking this box will ensure that this Chainlink is stored in your archive section (graveyard).</p>
                    </div>
                    <CollapsibleCard
                        title="Read Only Fields"
                        content={
                            <React.Fragment>
                                <div className="form-group field">
                                    <label className="label">Element Type</label>
                                    <input className="input is-static" name="type" value="CL" readOnly/>
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
                    <div id="element-creation-text-align-right field">
                        <input className="button is-success is-right" type="submit" value="DELETE"/>
                    </div>
                </form>
            )}
            {showChainlinkEditForm && (
                <form className="crud-form" onSubmit={handleEditSubmit}>
                    <input type="hidden" name="url" value={chainlink.url}/>
                    <input type="hidden" name="order" value={parseInt(chainlink.order, 10)}/>
                    <input type="hidden" name="tag" value="CL"/>
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
                                    <label className="label">Element Type</label>
                                    <input className="input is-static" name="type" value="CL" readOnly/>
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

/*
<Header3 url={props.url} order={0} text="This is a header 3"/>
<Linebreak url={props.url} order={1} />
<Code url={props.url} order={2} text="this is codeeeee" />
<Paragraph url={props.url} order={3} text="this is a paragraph" />*/

function ChainlinkEditButtons1(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;
    const chainlink = getChainlinkElements.find(item => item.url === props.url);
    let chainlinkId = "chainlink-" + chainlink.url + "-" + chainlink.order;
    const [showChainlinkDeleteFormState, setChainlinkDeleteFormState] = props.chainlinkDeleteFormState;
    const [showChainlinkEditFormState, setChainlinkEditFormState] = props.chainlinkEditFormState;
    return (
        <div className="chainlink-buttons-wrapper">
            <button className="doc-action-copy-title button is-small is-info" onClick={() => navigator.clipboard.writeText(chainlink.text)}>copy</button>
            <button className="cl-edit-btn button is-small is-warning" target={chainlinkId} onClick={() => setChainlinkEditFormState(true)}>edit</button>
            <button className="cl-del-btn button is-small is-danger" target={chainlinkId} onClick={() => setChainlinkDeleteFormState(true)}>delete</button>
        </div>
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
                <button id="add-cl-btn" className="button is-rounded is-danger cell add-buttons" onClick={() => handleClick("CL")}>&lt;n&gt; chainlink</button>
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
                    <button id="add-p-btn" className="button is-rounded is-black cell add-buttons" onClick={() => handleClick("P")}>&lt;p&gt; paragraph
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
        refresh();
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
    } else if (props.type == "CL") {
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

// Form components for individual Elements
// These are forms displayed whenever a user is creating or updating an Element. Every Element has its own form. These
// components are not exported because they are always called by ElementCreationForm.

// This form is instantiated whenever a new Paragraph is being created
function ConstructParagraphElement(props) {
    // The first thing we do is acquire the cursor variable. This is supplied as part of the context. Knowing where
    // the cursor is allowing us to know where to insert this Element (whether it is new, it might just be being
    // edited). We also want to update the cursor if we are inserting a new Element
    const { cursor, setCursor } = useContext(CursorContext);
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let xhr = new XMLHttpRequest();
        xhr.open(props.method, window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(values));

        // Render the paragraph
        const container = document.createElement("div");
        container.setAttribute("tag", "P"); // Set the tag attribute to P for paragraph
        container.setAttribute("id", "content-" + getUrlFromId(values.url) + "-" + values.order); // Set an id for the container
        container.setAttribute("class", "content-wrapperrff"); // Set the class
        let anchor = null;
        if (cursor.elementOrder == -1) {
            anchor = document.getElementById("chainlink-" + cursor.url + "-" + cursor.chainlinkOrder);
        } else {
            anchor = document.getElementById("content-" + cursor.url + "-" + cursor.elementOrder);
        }
        anchor.insertAdjacentElement("afterend", container);
        const root = createRoot(container);

        root.render(<Paragraph render_outer_div={false} text={values.text} order={values.order} curl={getUrlFromId(values.url)} />);
        setCursor({url: cursor.url, elementOrder: cursor.elementOrder + 1, chainlinkOrder: cursor.chainlinkOrder});
        props.onHide();
    };
    return (
        <form onSubmit={handleSubmit} className="crud-form">
            <input autoFocus type="text" id="input" placeholder="enter paragraph content" name="text"
                   defaultValue={props.value}/>
            <input type="hidden" name="url" value={"content-" + cursor.url + "-" + (cursor.elementOrder + 1)}/>
            <input type="hidden" name="order" value={cursor.elementOrder + 1}/>
            <input type="hidden" name="type" value="P"/>
            <input type="hidden" name="public" value="True"/>
            <input type="hidden" name="css" value=""/>
            <div id="element-creation-text-align-right">
                <input className="button is-success is-outlined" type="submit" value="CREATE"/>
            </div>
        </form>
    );
};

// This form is instantiated whenever a Code section is being created
//             <input autoFocus type="text" id="input" placeholder="Shift+Enter For New Line" name="text" defaultValue={props.value}/>
function ConstructCodeElement(props) {
    return (
        <form className="crud-form">
            <div className="form-group field">
                <label htmlFor="text" className="form-label label">Code</label>
                <textarea autoFocus type="text" defaultValue={props.value} name="text"
                          className="input form-field"
                          style={{resize: 'none', width: '100%', height: '100%'}}></textarea>
            </div>
            <div className="form-group field">
                <input type="hidden" name="archive" value="False"/>
                <input type="hidden" name="public" value="False"/>
                <label className="label">Access Controls</label>
                <div className="checkboxes">
                    <label id="header3-form-public-label" className="form-label checkbox">
                        <input type="checkbox" name="public" value="True" id="header3-form-archive"
                               className="checkbox form-field" style={{"marginRight": "5px"}}/>
                        Public
                    </label>
                    <label id="header3-form-archive-label" className="form-label checkbox">
                        <input type="checkbox" name="archive" value="True" id="header3-form-archive"
                               className="checkbox form-field is-static" style={{"marginRight": "5px"}} disabled/>
                        Archive
                    </label>
                </div>
                <p className="help">specify which viewers will be able to access the contents of this chainlink and what
                    will happen to this chainlink if it's deleted</p>
            </div>
            <CollapsibleCard
                title="Read Only Fields"
                content={
                    <React.Fragment>
                        <div className="form-group field">
                            <label className="label">Element Type</label>
                            <input className="input is-static" name="type" value="CODE" readOnly/>
                            <p className="help">this is the type of Element being instantiated</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element CURL</label>
                            <input className="input is-static" name="url" value={props.url} readOnly/>
                            <p className="help">this is the unique identifier field for this element - if you are
                                creating a new
                                chainlink then this value will empty until the backend sends us a response</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element Ordering</label>
                            <input className="input is-static" name="order" value={parseInt(props.order, 10)} readOnly/>
                            <p className="help">this is the order of this chainlink relative to others on the page</p>
                        </div>
                    </React.Fragment>
                }
            />
            <CollapsibleCard
                title="Advanced Fields"
                content={
                    <React.Fragment>
                        <div className="form-group field">
                            <label htmlFor="css" id="header3-form-css-label" className="form-label label">CSS</label>
                            <input type="input" name="css" id="header3-form-css" className="input form-field"/>
                            <p className="help">optionally include custom CSS to apply to the header <i>NOTE: This is an
                                advanced feature</i></p>
                        </div>
                    </React.Fragment>
                }
            />
            <div id="element-creation-text-align-right">
                <input className="button is-success is-outlined" type="submit" value="CREATE"/>
            </div>
        </form>
    );
};

// This form is instantiated whenever an H3 Element is being created
function ConstructHeader3Element(props) {
    return (
        <form className="crud-form">
            <div className="form-group field">
                <label htmlFor="text" id="chainlink-form-text-label" className="form-label label">Text</label>
                <input autoFocus type="text" defaultValue={props.value} name="text"
                       className="input form-field"/>
            </div>
            <div className="form-group field">
                <input type="hidden" name="archive" value="False"/>
                <input type="hidden" name="public" value="False"/>
                <label className="label">Access Controls</label>
                <div className="checkboxes">
                    <label id="header3-form-public-label" className="form-label checkbox">
                        <input type="checkbox" name="public" value="True" id="header3-form-archive"
                               className="checkbox form-field" style={{"marginRight": "5px"}}/>
                        Public
                    </label>
                    <label id="header3-form-archive-label" className="form-label checkbox">
                        <input type="checkbox" name="archive" value="True" id="header3-form-archive"
                               className="checkbox form-field is-static" style={{"marginRight": "5px"}} disabled/>
                        Archive
                    </label>
                </div>
                <p className="help">specify which viewers will be able to access the contents of this chainlink and what
                    will happen to this chainlink if it's deleted</p>
            </div>
            <CollapsibleCard
                title="Read Only Fields"
                content={
                    <React.Fragment>
                        <div className="form-group field">
                            <label className="label">Element Type</label>
                            <input className="input is-static" name="type" value="H3" readOnly/>
                            <p className="help">this is the type of Element being instantiated</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element CURL</label>
                            <input className="input is-static" name="url" value={props.url} readOnly/>
                            <p className="help">this is the unique identifier field for this element - if you are
                                creating a new
                                chainlink then this value will empty until the backend sends us a response</p>
                        </div>
                        <div className="form-group field">
                            <label className="label">Element Ordering</label>
                            <input className="input is-static" name="order" value={parseInt(props.order, 10)} readOnly/>
                            <p className="help">this is the order of this chainlink relative to others on the page</p>
                        </div>
                    </React.Fragment>
                }
            />
            <CollapsibleCard
                title="Advanced Fields"
                content={
                    <React.Fragment>
                        <div className="form-group field">
                            <label htmlFor="css" id="header3-form-css-label" className="form-label label">CSS</label>
                            <input type="input" name="css" id="header3-form-css" className="input form-field"/>
                            <p className="help">optionally include custom CSS to apply to the header <i>NOTE: This is an
                                advanced feature</i></p>
                        </div>
                    </React.Fragment>
                }
            />
            <div id="element-creation-text-align-right">
                <input className="button is-success is-outlined" type="submit" value="CREATE"/>
            </div>
        </form>
    );
};

// This form is instantiated whenever an H3 Element is being created
function ConstructLinebreakElement(props) {
    return (
        <form className="crud-form">
            <select name="height">
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="max">Max</option>
            </select>
            <input type="hidden" name="url" value={props.url}/>
            <input type="hidden" name="order" value={parseInt(props.order, 10)}/>
            <input type="hidden" name="type" value="BR"/>
            <input type="hidden" name="public" value="True"/>
            <input type="hidden" name="css" value=""/>
            <div id="element-creation-text-align-right">
                <input className="button is-success is-outlined" type="submit" value="CREATE"/>
            </div>
        </form>
    );
};

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

function ConstructChainlinkElement(props) {
    const [getChainlinkElements, setChainlinkElements] = props.chainlinkElementsState;

    // If we're creating a brand new chainlink then the element order will be equal to the number of chainlink elements (which means that the new chainlink will be added to the back).
    // Otherwise, if we're editing a chainlink then it's order gets passed down via a prop.
    let chainlinkOrder = 0; // this variable indicates the order of the chainlink.
    if (props.order === undefined || props.order === null) {
        chainlinkOrder = numChainlinkElements.value;
    } else {
        chainlinkOrder = parseInt(props.order, 10);
    }

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
                    order: xhr.response.order,
                    date: xhr.response.date,
                }
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
                        <label htmlFor="external" id="chainlink-form-text-label" className="form-label label">External URL</label>
                        <input type="text" id="input chainlink-form-text" name="external" className="input form-field"/>
                        <p className="help">enter the external url for this chainlink</p>
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
                                    <label className="label">Element Type</label>
                                    <input className="input is-static" name="type" value="CL" readOnly/>
                                    <p className="help">this is the type of Element being instantiated</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element CURL</label>
                                    <input className="input is-static" name="url" value={props.url} readOnly/>
                                    <p className="help">this is the unique identifier field for this element - if you
                                        are
                                        creating a new
                                        chainlink then this value will empty until the backend sends us a response</p>
                                </div>
                                <div className="form-group field">
                                    <label className="label">Element Ordering</label>
                                    <input className="input is-static" name="order" value={chainlinkOrder}
                                           readOnly/>
                                    <p className="help">this is the order of this chainlink relative to others on the
                                        page</p>
                                </div>
                                <div className="form-group field">
                                    <label htmlFor="date" id="chainlink-form-date-label"
                                           className="form-label label">Date</label>
                                    <input type="input" name="date" id="chainlink-form-date"
                                           className="input form-field is-static"
                                           value={new Date().toISOString()} readOnly/>
                                    <p className="help">This value represents the creation time of this Element. It is automatically set and updated whenever this element is updated.</p>
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
                <div id="element-creation-text-align-right field">
                    <input className="button is-success is-right" type="submit" value="CREATE"/>
                </div>
            </form>}
        </>
    );
};

function ConstructHeader1Element(props) {
    return (
        <form className="crud-form">
            <input autoFocus type="text" id="input" defaultValue={props.value} name="text"/>
            <input type="hidden" name="url" value={props.url}/>
            <input type="hidden" name="order" value={parseInt(props.order, 10)}/>
            <input type="hidden" name="type" value="H1"/>
            <input type="hidden" name="public" value="True"/>
            <input type="hidden" name="css" value=""/>
            <div id="element-creation-text-align-right">
                <input id="element-creation-submit" type="submit" value="Submit"/>
            </div>
        </form>
    );
};

function ConstructColElement(props) {
    return (
        <form className="crud-form">
            <input type="hidden" name="type" value="COL"/>
            <div className="form-group">
                <label htmlFor="text" id="col-form-text-label" className="form-label">text</label>
                <input autoFocus type="text" id="input col-form-text" defaultValue={props.value} name="text"
                       className="form-field"/>
            </div>
            <div className="form-group">
                <input type="hidden" name="public" value="False"/>
                <label htmlFor="public" id="col-form-public-label" className="form-label">public</label>
                <input type="checkbox" name="public" id="col-form-public" value="True" className="form-field"/>
            </div>
            <div className="form-group">
                <label htmlFor="date" id="col-form-date-label" className="form-label">date</label>
                <input type="input" name="date" id="col-form-date" placeholder="ex: 09/19/22 13:55:26"
                       className="form-field"/>
            </div>
            <div className="form-group">
                <label htmlFor="theme" id="col-form-theme-label" className="form-label">text</label>
                <input autoFocus type="text" id="input col-form-text" defaultValue="Patchwork" name="text"
                       className="form-field"/>
            </div>
            <div id="element-creation-text-align-right">
                <input id="element-creation-submit" type="submit" value="Submit"/>
            </div>
        </form>
    )
}
import React, {useEffect, createContext, useContext, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
    elementsEditButtonEventHandlers,
    deleteChainlink,
    deleteContent,
    editChainlink,
    editContent, instantiateEditButtons,
    makeForm, removeEditButtons,
    refresh, storeEditButtonHandlers, parseKeyDown
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


export function ElementDisplayAsComponents() {
  const chainlinkDisplayRef = useRef(null);
  const headerDisplayRef = useRef(null);
  const footerDisplayRef = useRef(null);
  let chainlinkDisplay = document.getElementById("chainlink-display");
  let headerDisplay = document.getElementById("header-display");
  let footerDisplay = document.getElementById("footer-display");
  let chainlinkElements = [];
  let headerElements = [];
  let footerElements = [];

   // Move existing DOM elements into React-managed div
    let chainlinkDisplayChild = chainlinkDisplay.firstChild;
    while (chainlinkDisplayChild) {
        chainlinkElements.push(chainlinkDisplayChild);
        chainlinkDisplayChild = chainlinkDisplayChild.nextSibling;
    }

    let headerDisplayChild = headerDisplay.firstChild;
    while (headerDisplayChild) {
        headerElements.push(headerDisplayChild);
        headerDisplayChild = headerDisplayChild.nextSibling;
    }

    let footerDisplayChild = footerDisplay.firstChild;
    while (footerDisplayChild) {
        footerElements.push(footerDisplayChild);
        footerDisplayChild = footerDisplayChild.nextSibling;
    }

  useEffect(() => {
        for (let i = 0; i < chainlinkElements.length; i++) {
            chainlinkDisplayRef.current.appendChild(chainlinkElements[i]);
        }
        for (let i = 0; i < headerElements.length; i++) {
            headerDisplayRef.current.appendChild(headerElements[i]);
        }
        for (let i = 0; i < footerElements.length; i++) {
            footerDisplayRef.current.appendChild(footerElements[i]);
        }
  }, []);

    return (
        <React.Fragment>
            <div id="header-display" ref={headerDisplayRef}></div>
            <div id="chainlink-display" ref={chainlinkDisplayRef}></div>
            <div id="footer-display" ref={footerDisplayRef}></div>
        </React.Fragment>
        )
}

export function ChainlinkDisplayAsComponents() {
    let chainlinks = document.querySelectorAll(".chainlink");
    let chainlinkElements = [];
    let lastChainlinkUrl = null;
    let lastElementOrder = -1;
    let lastChainlinkOrder = -1;
    let lastChainlinkText = null;
    chainlinks.forEach((chainlink) => {
        let innerElements = [];
        Array.from(chainlink.children).forEach((element) => {
            if (element.getAttribute("tag") === "chainlink") {
                lastChainlinkUrl = getUrlFromId(element.id);
                lastChainlinkOrder = getOrderFromId(element.id);
                lastChainlinkText = element.querySelector(".chainlink-inner-content").textContent;
                lastElementOrder = -1; // reset the element order to null once we've added a chainlink. A value of -1 says there's no child elements yet
            }
            else if (element.getAttribute("tag") === "H3") {
                lastElementOrder = getOrderFromId(element.id);
                innerElements.push(<Header3 curl={getUrlFromId(element.id)} text={element.querySelector(".inner-content").textContent} order={lastElementOrder} />);
            }
            else if (element.getAttribute("tag") === "P") {
                lastElementOrder = getOrderFromId(element.id);
                innerElements.push(<Paragraph render_outer_div={true} curl={getUrlFromId(element.id)} text="DDDDDDDD" /*text={element.querySelector(".inner-content").textContent}*/ order={lastElementOrder} />);
            }
            else if (element.getAttribute("tag") === "CODE") {
                lastElementOrder = getOrderFromId(element.id);
                innerElements.push(<Code curl={getUrlFromId(element.id)} text={element.querySelector(".inner-content").textContent} order={lastElementOrder} />);
            }
            else if (element.getAttribute("tag") === "BR") {
                lastElementOrder = getOrderFromId(element.id);
                innerElements.push(<Linebreak curl={getUrlFromId(element.id)} order={getOrderFromId(element.id)} />);
            }
        })
        // push this chainlink to the list of chainlinks to render. We pass all child elements to the chainlink component
        // view the children prop. Once done, the innerElements array is cleared out so that it can be populated for the next
        // chainlink. We stored the chainlink url and the order of the last element not only so that it can be referenced in
        // the creation of this chainlink but also so that it can be referenced when setting the cursor which is always initialized
        // to point to the location of the very last element which, when we are finished, will be the last element in the body
        // of the collection.
        chainlinkElements.push(<Chainlink curl={lastChainlinkUrl} order={lastChainlinkOrder} text={lastChainlinkText} children={innerElements} />);
    });
    const [cursor, setCursor] = useState({url: lastChainlinkUrl, chainlinkOrder: lastChainlinkOrder, elementOrder: lastElementOrder});
    return (
        <React.Fragment>
            {chainlinkElements}
            <CursorContext.Provider value={{cursor, setCursor}}>
                <CreateBodyEditButtons1 />
            </CursorContext.Provider>
        </React.Fragment>
    )
}
//            <Chainlink curl="asdf7sa80f7sadfjkj" order={0} text="This is a chainlink" />
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
            <form id="crud-form">
                <input type="hidden" name="furl" value={props.curl}/>
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
            <form id="crud-form">
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

export function ChainlinkElement(props) {

    useEffect(() => {
        // insert all child elements of this Chainlink now the Chainlink has been rendered
        if (props.children != null && props.children.length !== 0) {           // if the children parameter is not null then add append them to the Chainlink element
            let chainlink = document.getElementById(props.url).parentElement;       // This object represents the Chainlink that was just rendered
            for (let i = 0; i < props.children.length; i++) {
                chainlink.appendChild(props.children[i].cloneNode(true)); // Append every child to the Chainlink
            }
        }
        refresh();   // Now that the Chainlink and its children are instantiated assign indices
        removeEditButtons();
        instantiateEditButtons();
    }, []);

    return (
        <React.Fragment>
            <div id={props.url} className="chainlink-wrapper" tag="CL">
                <h2>
                    <span className="chainlink-order">{"#" + getOrderFromId(props.url).toString()}</span>
                    <span className="chainlink-inner-content">
                                                {props.text}
                                        </span>
                    <a className="inline-url header-url"
                       href={"/patchwork/chainlink/" + getUrlFromId(props.url) + ".html"}>
                        {">>>" + getUrlFromId(props.url).substring(0, 9)}
                    </a>
                    <span className="chainlink-date">{formatDateString(props.date)}</span>
                </h2>
            </div>
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
    let chainlinkId = "chainlink-" + props.curl + "-" + props.order
    return (
        <section className="section is-medium chainlink">
            <div
                id={chainlinkId}
                className="chainlink-wrapper title is-2"
                tag="chainlink"
            >
                <h2>
                    <span className="chainlink-order">#4</span>
                    <span className="chainlink-inner-content" style={{}}>{props.text}</span>
                    <a
                        className="inline-url header-url"
                        href="/patchwork/chainlink/0c192402c3ce5dbcb3025ac189db8da56bf37cffb1052d6f53404a10ad980a5a.html"
                    >
                        &gt;&gt;&gt;0c192402c
                    </a>
                    <span className="chainlink-date">Sep 19, 2022, 1:55 PM PDT</span>
                </h2>
            <ChainlinkEditButtons1 curl={props.curl} order={props.order} />
            </div>
            {props.children}
        </section>

    );
}
/*
<Header3 curl={props.curl} order={0} text="This is a header 3"/>
<Linebreak curl={props.curl} order={1} />
<Code curl={props.curl} order={2} text="this is codeeeee" />
<Paragraph curl={props.curl} order={3} text="this is a paragraph" />*/

function ChainlinkEditButtons1(props) {
    let chainlinkId = "chainlink-" + props.curl + "-" + props.order
    return (
        <div className="chainlink-buttons-wrapper">
            <button className="doc-action-copy-title button is-small is-info">copy</button>
            <button className="cl-edit-btn button is-small is-warning" target={chainlinkId}
                    onClick={() => editChainlink(chainlinkId)}>edit
            </button>
            <button className="cl-del-btn button is-small is-danger" target={chainlinkId}
                    onClick={() => deleteChainlink(chainlinkId)}>delete
            </button>
        </div>
    );
}

    export function CreateBodyEditButtons1(props) {

        // This hook remembers if the element creation form should be remembered. It's a switch that will help us keep track if the form
        // is being shown or not.
        const [showElementCreationForm, setShowElementCreationForm] = useState(false);
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
            <div id="chainlink-placeholder" className="grid">
                {showElementCreationForm && <ElementCreationForm1 onHide={handleHide} placeholder="enter content" method="POST" type={elementType} />}
                {chainlinkButton}
                {restOfButtons}
            </div>
        );
    }

export function ElementCreationForm1(props) {

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
                <ConstructChainlinkElement value={props.value} type={props.type} url={props.url} order={props.order}
                                           value={props.value} date={props.date} css={props.css} onHide={props.onHide} method={props.method} />
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
    let chainlinkId = "content-" + props.curl + "-" + props.order
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
        <form onSubmit={handleSubmit} id="crud-form">
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
        <form id="crud-form">
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
        <form id="crud-form">
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
        <form id="crud-form">
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

        props.onHide();
    };
    return (
        <form onSubmit={handleSubmit} id="crud-form">
            <div id="non-submit-fields" className="field">
                <div className="form-group field">
                    <label htmlFor="text" id="chainlink-form-text-label" className="form-label label">Text</label>
                    <input autoFocus type="text" id="input chainlink-form-text" defaultValue={props.value} name="text"
                           className="input form-field"/>
                    <p className="help">enter a title to be used as the header name for this chainlink</p>
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
                    <p className="help">specify which viewers will be able to access the contents of this chainlink and
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
                                <p className="help">this is the unique identifier field for this element - if you are
                                    creating a new
                                    chainlink then this value will empty until the backend sends us a response</p>
                            </div>
                            <div className="form-group field">
                                <label className="label">Element Ordering</label>
                                <input className="input is-static" name="order" value={parseInt(props.order, 10)}
                                       readOnly/>
                                <p className="help">this is the order of this chainlink relative to others on the
                                    page</p>
                            </div>
                            <div className="form-group field">
                                <label htmlFor="date" id="chainlink-form-date-label"
                                       className="form-label label">Date</label>
                                <input type="input" name="date" id="chainlink-form-date"
                                       className="input form-field is-static"
                                       value="09/19/22 13:55:26" readOnly/>
                                <p className="help">ex: 09/19/22 13:55:26</p>
                            </div>
                        </React.Fragment>
                        }
                    />
                <CollapsibleCard
                    title="Advanced Fields"
                    content={
                        <React.Fragment>
                            <div className="form-group field">
                                <label htmlFor="css" id="chainlink-form-css-label" className="form-label label">CSS</label>
                                <input type="input" name="css" id="chainlink-form-css" className="input form-field"/>
                                <p className="help">optionally include custom CSS to apply to the header <i>NOTE: This is an
                                    advanced feature</i></p>
                            </div>
                        </React.Fragment>
                    }
                />

            </div>
            <div id="element-creation-text-align-right field">
                <input className="button is-success is-right" type="submit" value="CREATE"/>
            </div>
        </form>
    );
};

function ConstructHeader1Element(props) {
    return (
        <form id="crud-form">
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
        <form id="crud-form">
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
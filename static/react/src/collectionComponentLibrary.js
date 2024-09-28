import React, { useEffect } from "react";
import {
    elementsEditButtonEventHandlers,
    deleteChainlink,
    deleteContent,
    deleteDoc,
    editChainlink,
    editContent, instantiateEditButtons,
    makeForm, removeEditButtons,
    renameDoc, refresh, storeEditButtonHandlers
} from "./collectionStateManager";
import {
        getOrderFromId, getUrlFromId, formatDateString, getPrefixFromId, getMatchedChildren
} from "./staticUtils";

/**
 * Render the row of Element creation buttons that appear at the bottom of the article
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
                        <button id="add-cl-btn" className="add-buttons" onClick={() => makeForm("CL")}>&lt;n&gt; chainlink</button>
                );

    } else if (props.bitmask[0] === "0") {
                chainlinkButton = (
                        <button className="inactive-add-buttons">&lt;n&gt; chainlink</button>
                );
    }

    if (props.bitmask[1] === "1") {
                restOfButtons = (
                        <React.Fragment>
                                <button id="add-p-btn" className="add-buttons" onClick={() => makeForm("P")}>&lt;p&gt; paragraph</button>
                                <button id="add-h3-btn" className="add-buttons" onClick={() => makeForm('H3')}>&lt;h&gt; header</button>
                                <button id="add-code-btn" className="add-buttons" onClick={() => makeForm('CODE')}>&lt;c&gt; code</button>
                                <button id="add-br-btn" className="add-buttons" onClick={() => makeForm('BR')}>&lt;b&gt; linebreak</button>
                                <button id="add-li-btn" className="add-buttons" onClick={() => makeForm('LI')}>&lt;l&gt; list</button>
                                <button id="add-link-btn" className="add-buttons" onClick={() => makeForm('LINK')}>&lt;q&gt; link</button>
                                <button id="add-img-btn" className="add-buttons" onClick={() => makeForm('IMG')}>&lt;i&gt; img</button>
                                <button id="add-note-btn" className="add-buttons" onClick={() => makeForm('NOTE')}>&lt;n&gt; note</button>
                        </React.Fragment>
                );

    } else if (props.bitmask[1] === "0") {
                restOfButtons = (
                        <React.Fragment>
                                <button className="inactive-add-buttons">&lt;p&gt; paragraph</button>
                                <button className="inactive-add-buttons">&lt;h&gt; header</button>
                                <button className="inactive-add-buttons">&lt;c&gt; code</button>
                                <button className="inactive-add-buttons">&lt;b&gt; linebreak</button>
                                <button className="inactive-add-buttons">&lt;l&gt; list</button>
                                <button className="inactive-add-buttons">&lt;q&gt; link</button>
                                <button className="inactive-add-buttons">&lt;i&gt; img</button>
                                <button className="inactive-add-buttons">&lt;n&gt; note</button>
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
                <button id="add-hbnr-btn" className="add-buttons" onClick={() => makeForm("HBNR")}>Header Banner</button>
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
                        <button id="add-ftrli-btn" className="add-buttons" onClick={() => makeForm("FTRLI")}>Footer List</button>z
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

export function FenceEditButtons() {
        const editFunction = function() { renameDoc() };
        const deleteFunction = function() { deleteDoc() };
        storeEditButtonHandlers(editFunction, deleteFunction)
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        <button className="doc-action-copy-title">copy</button>
                        <button id="doc-action-edit-title" onClick={ elementsEditButtonEventHandlers[0][0] }>edit</button>
                        <button id="doc-action-delete-title" onClick={ elementsEditButtonEventHandlers[0][1] }>delete</button>
                </React.Fragment>
        );
}

export function ChainlinkEditButtons(props) {
        const editFunction = function() { editChainlink(props.wrappers[props.i].id) };
        const deleteFunction = function() { deleteChainlink(props.wrappers[props.i].id) };
        storeEditButtonHandlers(editFunction, deleteFunction)
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        <button className="doc-action-copy-title">copy</button>
                        <button className="cl-edit-btn" target={props.wrappers[props.i].id} onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][0] }>edit</button>
                        <button className="cl-del-btn" target={props.wrappers[props.i].id} onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][1] }>delete</button>
                </React.Fragment>
        );
}

export function ContentEditButtons(props) {
        const editFunction = function() { editContent(props.wrappers[props.i].id) };
        const deleteFunction = function() { deleteContent(props.wrappers[props.i].id) };
        storeEditButtonHandlers(editFunction, deleteFunction)
        return (
                <React.Fragment>
                        <i className="context-span-message">context action &lt; - - - - - -</i>
                        <button className="doc-action-copy-title">copy</button>
                        <button className="cont-edit-btn" target={ props.wrappers[props.i].id } onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][0] }>edit</button>
                        <button className="cont-del-btn" target={ props.wrappers[props.i].id } onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][1] }>delete</button>
                </React.Fragment>
        );
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
                    <ConstructHeader3Element type={props.type} url={props.url} order={props.order} />
                </React.Fragment>
            );
        } else if (props.type === 'CODE') {
            return (
                <React.Fragment>
                    <ConstructCodeElement type={props.type} url={props.url} order={props.order} />
                </React.Fragment>
            );
        } else if (props.type === 'P') {
            return (
                <React.Fragment>
                    <ConstructParagraphElement type={props.type} url={props.url} order={props.order} />
                </React.Fragment>
            );
        } else if (props.type === 'BR') {
            return (
                <React.Fragment>
                    <ConstructLinebreakElement type={props.type} url={props.url} order={props.order} />
                </React.Fragment>
            );
        } else if (props.type == "CL") {
            return (
                <React.Fragment>
                    <ConstructChainlinkElement type={props.type} url={props.url} order={props.order}/>
                </React.Fragment>
            )
        } else {
            return (
                <form id="crud-form">
                    <input autoFocus type="text" id="input" placeholder={props.placeholder} defaultValue={props.value}/>
                    <select id="element-creation-select" name="element">
                        <option value="CL">chainlink</option>
                        <option value="H1">header</option>
                        <option value="P">paragraph</option>
                        <option value="CODE">code</option>
                        <option value="BR">linebreak</option>
                        <option value="unordered list">unordered list</option>
                        <option value="ordered list">ordered list</option>
                    </select>
                    <div id="element-creation-text-align-right">
                        <button id="element-creation-submit" type="submit">Submit</button>
                    </div>
                </form>
            );
        }
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
                                        <a className="inline-url header-url" href={"/patchwork/chainlink/" + getUrlFromId(props.url) + ".html"}>
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
                                <span className="inner-content br">
                                        <i>&lt;!-- linebreak insert --&gt;</i>
                                </span>
                                <div className="context-buttons-wrapper">
                                        <i className="context-span-message">context action &lt; - - - - - - </i>
                                        <button className="cont-copy-btn">copy</button>
                                        <button className="cont-edit-btn">edit</button>
                                        <button className="cont-del-btn">delete</button>
                                </div>
                        </React.Fragment>
                );
        }
        else {
                return (
                        <React.Fragment>
                                <Tag className="inner-content">
                                        {props.text}
                                </Tag>
                                <div className="context-buttons-wrapper">
                                        <i className="context-span-message">context action &lt; - - - - - - </i>
                                        <button className="cont-copy-btn">copy</button>
                                        <button className="cont-edit-btn">edit</button>
                                        <button className="cont-del-btn">delete</button>
                                </div>
                        </React.Fragment>
                );
        }
}

// Form components for individual Elements
// These are forms displayed whenever a user is creating or updating an Element. Every Element has its own form. These
// components are not exported because they are always called by ElementCreationForm.

// This form is instantiated whenever a new Paragraph is being created
function ConstructParagraphElement(props) {
    return (
        <form id="crud-form">
            <input autoFocus type="text" id="input" placeholder="enter paragraph content" name="text" defaultValue={props.value}/>
            <input type="hidden" name="url" value={props.url} />
            <input type="hidden" name="order" value={parseInt(props.order, 10)} />
            <input type="hidden" name="type" value="P" />
            <input type="hidden" name="public" value="True" />
            <input type="hidden" name="css" value="" />
            <div id="element-creation-text-align-right">
                <input id="element-creation-submit" type="submit" value="Submit" />
            </div>
        </form>
    );
};

// This form is instantiated whenever a Code section is being created
function ConstructCodeElement(props) {
    return (
        <form id="crud-form">
            <input autoFocus type="text" id="input" placeholder="Shift+Enter For New Line" name="text" defaultValue={props.value}/>
            <input type="hidden" name="url" value={props.url} />
            <input type="hidden" name="order" value={parseInt(props.order, 10)} />
            <input type="hidden" name="type" value="CODE" />
            <input type="hidden" name="public" value="True" />
            <input type="hidden" name="css" value="" />
            <div id="element-creation-text-align-right">
                <input id="element-creation-submit" type="submit" value="Submit" />
            </div>
        </form>
    );
};

// This form is instantiated whenever an H3 Element is being created
function ConstructHeader3Element(props) {
    return (
        <form id="crud-form">
            <input autoFocus type="text" id="input" defaultValue={props.value} name="text" />
            <input type="hidden" name="url" value={props.url} />
            <input type="hidden" name="order" value={parseInt(props.order, 10)} />
            <input type="hidden" name="type" value="H3" />
            <input type="hidden" name="public" value="True" />
            <input type="hidden" name="css" value="" />
            <div id="element-creation-text-align-right">
                <input id="element-creation-submit" type="submit" value="Submit" />
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
            <input type="hidden" name="url" value={props.url} />
            <input type="hidden" name="order" value={parseInt(props.order, 10)} />
            <input type="hidden" name="type" value="BR" />
            <input type="hidden" name="public" value="True" />
            <input type="hidden" name="css" value="" />
            <div id="element-creation-text-align-right">
                <input id="element-creation-submit" type="submit" value="Submit" />
            </div>
        </form>
    );
};

function ConstructChainlinkElement(props) {
    return (
        <form id="crud-form">
            <div id="non-submit-fields">
                <input type="hidden" name="type" value="CL" />
                <div className="form-group">
                    <label htmlFor="text" id="chainlink-form-text-label" className="form-label">text</label>
                    <input autoFocus type="text" id="input chainlink-form-text" defaultValue={props.value} name="text" className="form-field" />
                </div>
                <div className="form-group">
                    <input type="hidden" name="public" value="False" />
                    <label htmlFor="public" id="chainlink-form-public-label" className="form-label">public</label>
                    <input type="checkbox" name="public" id="chainlink-form-public" value="on" className="form-field" />
                </div>
                <div className="form-group">
                    <input type="hidden" name="archive" value="False" />
                    <label htmlFor="archive" id="chainlink-form-archive-label" className="form-label">archive</label>
                    <input type="checkbox" name="archive" value="on" id="chainlink-form-archive" className="form-field" />
                </div>
                <div className="form-group">
                    <label htmlFor="date" id="chainlink-form-date-label" className="form-label">date</label>
                    <input type="input" name="date" id="chainlink-form-date" placeholder="ex: 09/19/22 13:55:26" className="form-field" />
                </div>
                <div className="form-group">
                    <label htmlFor="css" id="chainlink-form-css-label" className="form-label">css</label>
                    <input type="input" name="css" id="chainlink-form-css" className="form-field" />
                </div>
            </div>
            <div id="element-creation-text-align-right">
                <input id="element-creation-submit" type="submit" value="Submit" />
            </div>
        </form>
    );
};
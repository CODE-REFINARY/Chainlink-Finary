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
 */
export function CreateBodyEditButtons(props) {
    let chainlinkButton;
    let restOfButtons;

    if (props.bitmask[0] === "1") {
                chainlinkButton = (
                        <button id="add-cl-btn" className="add-buttons" onClick={() => makeForm("chainlink")}>&lt;n&gt; chainlink</button>
                );

    } else if (props.bitmask[0] === "0") {
                chainlinkButton = (
                        <button className="inactive-add-buttons">&lt;n&gt; chainlink</button>
                );
    }

    if (props.bitmask[1] === "1") {
                restOfButtons = (
                        <React.Fragment>
                                <button id="add-p-btn" className="add-buttons" onClick={() => makeForm('paragraph')}>&lt;p&gt; paragraph</button>
                                <button id="add-h3-btn" className="add-buttons" onClick={() => makeForm('header3')}>&lt;h&gt; header</button>
                                <button id="add-code-btn" className="add-buttons" onClick={() => makeForm('code')}>&lt;c&gt; code</button>
                                <button id="add-br-btn" className="add-buttons" onClick={() => makeForm('linebreak')}>&lt;b&gt; linebreak</button>
                                <button className="add-buttons">&lt;inactive&gt; img</button>
                                <button className="add-buttons">&lt;inactive&gt; ul</button>
                                <button className="add-buttons">&lt;inactive&gt; ol</button>
                        </React.Fragment>
                );

    } else if (props.bitmask[1] === "0") {
                restOfButtons = (
                        <React.Fragment>
                                <button className="inactive-add-buttons">&lt;h&gt; header</button>
                                <button className="inactive-add-buttons">&lt;c&gt; code</button>
                                <button className="inactive-add-buttons">&lt;b&gt; linebreak</button>
                                <button className="inactive-add-buttons">&lt;inactive&gt; img</button>
                                <button className="inactive-add-buttons">&lt;inactive&gt; ul</button>
                                <button className="inactive-add-buttons">&lt;inactive&gt; ol</button>
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
                        <button id="add-h-btn" className="add-buttons" onClick={() => makeForm("header")}>header</button>
                );

    } else if (props.bitmask[0] === "0") {
                headerButton = (
                        <button className="inactive-add-buttons">header</button>
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
                        <button id="add-f-btn" className="add-buttons" onClick={() => makeForm("footer")}>footer</button>
                );

    } else if (props.bitmask[0] === "0") {
                footerButton = (
                        <button className="inactive-add-buttons">footer</button>
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
                        <button className="cont-edit-btn" target={ props.wrappers[props.i].id } onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][0] }>edit</button>
                        <button className="cont-del-btn" target={ props.wrappers[props.i].id } onClick={ elementsEditButtonEventHandlers[elementsEditButtonEventHandlers.length - 1][1] }>delete</button>
                </React.Fragment>
        );
}

export function NoElements() {
        return (
                <React.Fragment>
                        &lt;CONTENT MISSING&gt;
                </React.Fragment>
        );
}

export function ChainlinkHeader(props) {
        return (
               <React.Fragment>
                        <span className="chainlink-inner-text">{props.title}</span>
               </React.Fragment>
        );
}

export function ElementCreationForm(props) {

        useEffect(() => {
                refresh();
        })
        return (
                <form id="crud-form">
                        <input autoFocus type="text" id="input" placeholder={props.placeholder} defaultValue={props.value}/>
                        <select id="element-creation-select" name="element">
                                <option value="chainlink">chainlink</option>
                                <option value="header">header</option>
                                <option value="paragraph">paragraph</option>
                                <option value="code">code</option>
                                <option value="linebreak">linebreak</option>
                                <option value="unordered list">unordered list</option>
                                <option value="ordered list">ordered list</option>
                        </select>
                        <div id="element-creation-text-align-right">
                            <button id="element-creation-submit" type="submit">Submit</button>
                        </div>
                </form>
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
                        <div id={props.url} className="chainlink-wrapper" tag="chainlink">
                                <h2>
                                        <span className="chainlink-order">{"#" + getOrderFromId(props.url).toString()}</span>
                                        <span className="chainlink-inner-text">
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

export function ContentElement(props) {

        useEffect(() => {
                refresh();
                removeEditButtons();
                instantiateEditButtons();
        }, []);

        let Tag;
        if (props.type === 'header3') {
                Tag = 'h3';
        } else if (props.type === 'code') {
                Tag = 'code';
        } else if (props.type === 'paragraph') {
                Tag = 'p';
        } else if (props.type === 'linebreak') {
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
                                        <button className="cont-edit-btn">edit</button>
                                        <button className="cont-del-btn">delete</button>
                                </div>
                        </React.Fragment>
                );
        }
}
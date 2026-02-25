import React, { useState, useEffect } from "react";

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

function toggleEditMode(makeEditModeActive) {
    const url = new URL(window.location.href);

    if (!makeEditModeActive) {
        url.searchParams.delete('edit');
    } else {
        url.searchParams.set('edit', 'true');
    }

    window.location.href = url.pathname + url.search;
}

export function ViewOptionsSideMenu() {

    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const [showOrdering, setShowOrdering] = useState(true);
    const [showDates, setShowDates] = useState(true);
    const [showControls, setShowControls] = useState(true);

    // We're assuming edit mode is always on if this side menu has been rendered.
    const isEditMode = 'true';

    const handleToggle = (type, currentState, setter) => {
        const nextState = !currentState;
        setter(nextState);

        // 1. Update the DOM attribute for CSS selectors
        document.documentElement.setAttribute(`show-${type}`, nextState.toString());

        // 2. Broadcast the change to other React Roots
        window.dispatchEvent(new CustomEvent("viewOptionsChanged", { 
            detail: { type, value: nextState } 
        }));
    };

    return (
        <div id="toggle-switches" className="menu">
            <h2 className="menu-label">View Options</h2>
            <ul className="menu-list">
                <li>
                    <label className="switch is-outlined is-small">
                        <input type="checkbox"
                            checked={showOrdering} 
                            onChange={() => handleToggle('ordering', showOrdering, setShowOrdering)}
                        />
                        <span className="check"></span>
                        <span className="control-label">show ordering</span>
                    </label>
                </li>
                <li>
                    <label className="switch is-outlined is-small">
                        <input type="checkbox"
                            checked={showDates} 
                            onChange={() => handleToggle('dates', showDates, setShowDates)}
                        />
                        <span className="check"></span>
                        <span className="control-label">show dates</span>
                    </label>
                </li>
                <li>
                    <label className="switch is-outlined is-small">
                        <input 
                            type="checkbox" 
                            checked={showControls} 
                            onChange={() => handleToggle('controls', showControls, setShowControls)}
                        />
                        <span className="check"></span>
                        <span className="control-label">show controls</span>
                    </label>
                </li>
                <h2 className="menu-label">Edit Options</h2>
                <CollectionEditForm show={showEdit} setShow={setShowEdit} />
                <CollectionDeleteForm show={showDelete} setShow={setShowDelete} />
            </ul>
        </div>
    );
}

export function CollectionCreateForm({show, setShow}) {

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        let xhr = new XMLHttpRequest();
        xhr.open("POST", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(values));

        xhr.onload = function () {
            if (xhr.status === 200) {
                // SUCCESS: The collection was created
                setShow(false);
                window.location.replace("../collections/" + values["url"]);
            } else if (xhr.status === 422) {
                // ERROR: Title or URL not unique
                const errorMsg = xhr.responseText; // This will be "url_not_unique" or "title_not_unique"
                alert("Validation Error: " + errorMsg.replace(/_/g, ' '));
            } else {
                // OTHER ERRORS (500, 403, etc.)
                console.error("Server error: " + xhr.status);
            }
        };

        // It's also good practice to handle network-level failures
        xhr.onerror = function () {
            alert("Network error. Please check your connection.");
        };
    };

    return (
        <li className="activated-edit-list-element" id="create-collection-button">
            <input className="button is-small is-responsive is-light" value="Generate New Collection" type="submit" onClick={() => setShow(true)} />
            {show && <form onSubmit={handleSubmit} className="crud-form">
                <label className="form-label label">Create a new collection</label>
                <div className="form-group field">
                    <label htmlFor="title" id="element-form-text-label" className="form-label label">Title</label>
                    <input autoFocus type="text" id="input element-form-text"
                        name="title"
                        className="input form-field"/>
                    <p className="help">enter a title for this new collection</p>
                </div>
                <div className="form-group field">
                    <label htmlFor="url" id="element-form-text-label" className="form-label label">URL</label>
                    <input autoFocus type="text" id="input element-form-text"
                        name="url"
                        className="input form-field"/>
                    <p className="help">enter the url for this collection</p>
                </div>
                <input 
                    type="hidden" 
                    name="tag" 
                    value="COLLECTION"
                />
                <div className="form-submit-buttons" id="element-creation-text-align-right field">
                    <input className="button is-dark" type="reset" onClick={() => setShow(false)} value="CANCEL"/>
                    <input className="button is-success is-right" type="submit" value="CREATE"/>
                </div>
            </form>}
        </li>
    );
}

export function CollectionEditForm({show, setShow}) {

    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent page refresh

        const form = e.target;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        let xhr = new XMLHttpRequest();
        xhr.open("PUT", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(values));

        xhr.onload = function () {
            if (xhr.status === 200) {
                window.location.replace("../collections/" + values["url"]);
                setShow(false);        
            }
        }
    };

    return (
        <li className="activated-edit-list-element" id="edit-collection-button">
            <input className="button is-small is-responsive is-light" value="Adjust Collection Properties" type="submit" onClick={() => setShow(true)} />
            {show && <form onSubmit={handleSubmit} className="crud-form">
                <label className="form-label label">Edit this collection</label>
                <div className="form-group field">
                    <label htmlFor="title" id="element-form-text-label" className="form-label label">Title</label>
                    <input autoFocus type="text" id="input element-form-text"
                        name="title"
                        className="input form-field"
                        defaultValue={document.querySelector("html").getAttribute("title")}
                    />
                    <p className="help">enter a new title for this new collection</p>
                </div>
                <div className="form-group field">
                    <label htmlFor="url" id="element-form-text-label" className="form-label label">URL</label>
                    <input autoFocus type="text" id="input element-form-text"
                        name="url"
                        className="input form-field"
                        defaultValue={document.querySelector("html").getAttribute("url")}
                    />
                    <p className="help">enter the new url for this collection</p>
                </div>
                <input 
                    type="hidden" 
                    name="tag" 
                    value="COLLECTION"
                />
                <div className="form-submit-buttons" id="element-creation-text-align-right field">
                    <input className="button is-dark" type="reset" onClick={() => setShow(false)} value="CANCEL"/>
                    <input className="button is-success is-right" type="submit" value="EDIT"/>
                </div>
            </form>}
        </li>
    );
}

export function CollectionDeleteForm({show, setShow}) {

    const handleSubmit = (e) => {
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

        xhr.onload = function () {
            if (xhr.status === 200) {
                setShow(false);
                window.location.replace("../collections");
            }
        }
    };

    return (
        <li className="activated-edit-list-element" id="delete-collection-button">
            <input className="button is-small is-responsive is-danger" value="Delete This Collection" type="submit" onClick={() => setShow(true)} />
            {show && <form onSubmit={handleSubmit} className="crud-form">
                <label className="form-label label">Are you sure you want to delete this collection? Doing so will redirect you back to the landing page.</label>
                    <input 
                        type="hidden" 
                        name="url" 
                        value={document.querySelector("html").getAttribute("url")}
                    />
                    <input 
                        type="hidden" 
                        name="tag" 
                        value="COLLECTION"
                    />
                <div className="form-submit-buttons" id="element-creation-text-align-right field">
                    <input className="button is-dark" type="reset" onClick={() => setShow(false)} value="CANCEL"/>
                    <input className="button is-danger is-right" type="submit" value="DELETE"/>
                </div>
            </form>}
        </li>
    );
}

export function EnterEditModeButton() {
    return(
        <input className="button is-small is-responsive is-warning" value="Enter Edit Mode" type="submit" onClick={() => toggleEditMode(true)} />
    )
}

export function ExitEditModeButton() {
    return(
        <input className="button is-small is-responsive is-success" value="Finish Editing" type="submit" onClick={() => toggleEditMode(false)} />
    )
}
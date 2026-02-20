import React, { useState, useEffect } from "react";

const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

export function ViewOptionsSideMenu({ }) {


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

    // 2. Toggle Handler for URL-reloading (Edit Mode)
    const toggleEditMode = () => {
        const url = new URL(window.location.href);
        if (isEditMode) {
            url.searchParams.delete('edit');
        } else {
            url.searchParams.set('edit', 'true');
        }
        window.location.href = url.pathname + url.search;
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
            </ul>

            <h2 className="menu-label">Edit Options</h2>
            <ul className="menu-list">
                <li>
                    <label className="switch is-outlined is-small">
                        <input type="checkbox" checked={isEditMode} onChange={toggleEditMode} />
                        <span className="check"></span>
                        <span className="control-label">edit mode</span>
                    </label>
                </li>
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

        values.order = getUniqueOrder(values.order, getElementList);  // Automatically increment the order if there is a collision to avoid duplicate orders.
        let xhr = new XMLHttpRequest();
        xhr.open("POST", window.location.href, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('X-CSRFToken', csrftoken);
        xhr.responseType = "json";
        xhr.send(JSON.stringify(values));

        xhr.onload = function () {
        }
        
        setShow(false);
    };

    return (
        <li class="activated-edit-list-element" id="create-collection-button">
            <input class="button is-small is-responsive is-success" value="Create Collection" onClick={() => setShow(true)} />
            {show && <div>hi</div>}
        </li>
    );
}

export function CollectionEditForm({show, setShow}) {

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
        }
        
        setShow(false);
    };

    return (
        <li class="activated-edit-list-element" id="edit-collection-button">
            <input class="button is-small is-responsive is-warning" value="Edit Collection" />
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
        }
        
        setShow(false);
        window.location.replace("../collections");
    };

    return (
        <li class="activated-edit-list-element" id="delete-collection-button">
            <input class="button is-small is-responsive is-danger" value="Delete Collection" onClick={() => setShow(true)} />
            {show && <form onSubmit={handleSubmit} className="crud-form">
                <label className="form-label label">Are you sure you want to delete this collection? Doing so will redirect you back to the landing page.</label>
                    <input 
                        type="hidden" 
                        name="url" 
                        value={document.querySelector("html").getAttribute("url")}
                    />
                <div className="form-submit-buttons" id="element-creation-text-align-right field">
                    <input className="button is-dark" type="reset" onClick={() => setShow(false)} value="CANCEL"/>
                    <input className="button is-danger is-right" type="submit" value="DELETE"/>
                </div>
            </form>}
        </li>

    );
}
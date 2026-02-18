import React, { useState, useEffect } from "react";

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
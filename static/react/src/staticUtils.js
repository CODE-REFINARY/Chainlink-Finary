/**
 * Extracts and returns the order value from a given identifier. Every element identifier has 3 parts in this order:
 * Prefix - Url - Order. This function returns the Order (3rd part).
 *
 * @param {string} id - The identifier containing a dash-separated value.
 * @returns {number} The extracted order value. NOTE: This is a number not a string.
 * @throws {Error} Throws an error if the specified value after the dash is not a valid integer or if the identifier format is invalid.
 */
export function getOrderFromId(id) {
  if (typeof id !== 'string') {
    throw new TypeError("The argument must be a string");
  }

  const lastIndex = id.lastIndexOf("-");


  if (lastIndex !== -1) {
    let order = parseInt(id.slice(lastIndex + 1));
    if (isNaN(order)) {
        throw new Error("The value specified after the dash must be an int");
    }
    return order;
  } else {
        throw new Error("An invalid id was specified. Make sure the supplied id contains a dash.")
  }
}


/**
 * Extracts and returns the url from a given identifier. Every element identifier has 3 parts in this order:
 * Prefix - Url - Order. This function returns the Url (2nd part).
 *
 * @param {string} id - The identifier containing a dash-separated value.
 * @returns {string} The url of this id.
 * @throws {TypeError} Throws an error if the input is not a string.
 * @throws {Error} Throws an error if the identifier format is invalid (doesn't contain a dash).
 */
export function getUrlFromId(id) {
  if (typeof id !== 'string') {
    throw new TypeError("The argument must be a string");
  }

  const firstIndex = id.indexOf("-") + 1;
  const lastIndex = id.lastIndexOf("-");

  if (lastIndex !== -1) {
    return id.slice(firstIndex, lastIndex);

  } else {
        throw new Error("An invalid id was specified. Make sure the supplied id contains a dash.")
  }
}


/**
 * Extracts and returns the prefix from a given identifier. Every element identifier has 3 parts in this order:
 * Prefix - Url - Order. This function returns the Prefix (1st part).
 *
 * @param {string} id - The identifier containing a dash-separated value.
 * @returns {string} The extracted prefix.
 * @throws {TypeError} Throws an error if the input is not a string.
 * @throws {Error} Throws an error if the identifier format is invalid (doesn't contain a dash).
 */
export function getPrefixFromId(id) {
  if (typeof id !== 'string') {
    throw new TypeError("The argument must be a string");
  }

  const firstIndex = 0;
  const lastIndex = id.indexOf("-");

  if (lastIndex !== -1) {
    return id.slice(firstIndex, lastIndex);

  } else {
        throw new Error("An invalid id was specified. A prefix wasn't able to be identified for this id.")
  }
}

/**
 * Function: getMatchedChildren
 *
 * Description:
 * This function takes a parent element and an array of class names to match.
 * It queries the parent element for children with the specified classes and returns an array of matched elements.
 *
 * @param {HTMLElement} parent - The parent element to search for children.
 * @param {string[]} matchThis - An array of class names to match.
 * @returns {} - An array containing the matched child elements.
 *
 * Example Usage:
 * const parentElement = document.getElementById('parent');
 * const matchedChildren = getMatchedChildren(parentElement, ['class1', 'class2']);
 */
export function getMatchedChildren(parent, matchThis) {
        const selectors = matchThis.map(className => `.${className}`).join(', ');
        return (Array.from(parent.querySelectorAll(selectors)));
}

/**
 * Formats a date string into a human-readable date and time format.
 *
 * @param {string} originalDateString - The input date string in the format "YYYY-MM-DDTHH:mm:ss.SSSZ".
 * @returns {string} - The formatted date string in the format "Mon. 20, 2024, 11:43 p.m." or "Invalid date" if the input is not a valid date.
 */
export function formatDateString(originalDateString) {
  const originalDate = new Date(originalDateString);

  // Check if the date is valid
  if (isNaN(originalDate.getTime())) {
    return "Invalid date";
  }

  const formattedDate = originalDate.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZoneName: 'short'
  });

  return formattedDate;
}
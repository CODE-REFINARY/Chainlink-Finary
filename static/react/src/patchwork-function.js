/**
 * Creates a gallery with rows defined by a JSON file.
 * @param: Object selection: a subset of the img-manifest.json properties to display on the gallery
 * @param: String element: the name of the div object within which to place the gallery
 */
export function synthesizeGalleryBasic(selection, element) {
    // Counter and Constants for determining how many loops to display how many images in a row
    let vg = document.getElementById(element);
    let outerLoopCounter = 0;
    let numImages = Object.keys(selection).length 
    let div = document.createElement('div');
    div.className = "img-gallery"

    // display a grid of images row by row with width determined by the num images above
    for (let i = 0; i < numImages; i = i + 1) {
        let img = document.createElement("img");
        img.src = imgFolder + Object.keys(selection)[i] + "-sq500.jpg";
        img.className = "gallery-image";
        img.alt = Object.values(selection)[i];
        div.append(img); 
    }
    vg.append(div);
}

/**
 * Creates a gallery with rows defined by a JSON file. The rows are div elements. This is the appropriate
 * synthesize method for situations where the viewport won't change. The gallery isn't responsive with 
 * traditional flex methods so in the case of changing viewport use synthesizeGalleryBasic.
 * @param: Object selection: a subset of the img-manifest.json properties to display on the gallery
 */
export function synthesizeGallery(selection) {
    const imgFolder = "{% static 'images/' %}";
    // Transparent placeholder images
    let transImg = document.createElement("img"); 
    transImg.src = imgFolder + "transparent-sq500.jpg";    
    transImg.setAttribute('style', 'opacity:0');

    // Counter and Constants for determining how many loops to display how many images in a row
    var NUM_IMGS_PER_ROW = parseInt(window.getComputedStyle(document.documentElement).getPropertyValue('--NUM-IMGS-PER-ROW').trim());
    let vg = document.getElementById("vapor-gallery");
    let outerLoopCounter = 0;
    let numImages = Object.keys(selection).length 

    // display a grid of images row by row with width determined by the num images above
    for (let i = 0; i < numImages; i = i + NUM_IMGS_PER_ROW)
    {
        outerLoopCounter = i / NUM_IMGS_PER_ROW;
        let div = document.createElement('div');
        div.id = "row-" + outerLoopCounter;
        for (let j = 0; j < NUM_IMGS_PER_ROW; j++)
        {
            if (Object.keys(selection)[i + j] === undefined)
            {
                while ((i + j) % NUM_IMGS_PER_ROW != 0)
                {
                    div.append(transImg.cloneNode(false));
                    j = j + 1;
                }
                break;
            }
            let img = document.createElement("img");
            img.src = imgFolder + Object.keys(selection)[i + j] + "-sq500.jpg";
            img.className = "gallery-image";
            img.alt = Object.values(selection)[i + j];
            div.append(img);
        }

        // create an identifier for the last row of the grid
        if (i + NUM_IMGS_PER_ROW >= Object.keys(selection).length && i != 0)  // assign this element to class "last-row" if this it represents the last row and this is the last iteration
            div.className = "last-row";

        vg.append(div);
    }
}

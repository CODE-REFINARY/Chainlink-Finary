/**
 * Creates a form and associates a new ID with the new review card.
 * @param: Object selection: a subset of the img-manifest.json properties to display on the gallery
 */
function synthesizeGallery(selection) {
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

function createXHR()
{
    try { return new XMLHttpRequest(); } catch(e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch (e) {}
    try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch (e) {}
    alert("XMLHttpRequest not supported"); 
    return null;
}

function sendRequest(id)
{
    var xhr = createXHR(); // cross browser XHR creation
    if (xhr)
    {
        xhr.open("GET","http://ajaxref.com/ch1/sayhello.php",true);
    }
}
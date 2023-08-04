# Implementation Guide

## Within this document lies the many of the implementation details and decision behind this app

### ----- Calling Images in HTML -----
To invoke the image script code use this html:
~~~
<section>
    <script class = "img-gallery-create">
        var script = document.currentScript;
        divIdentifier = "gallery-" + mediaCounter; 
        div = document.createElement("div");
        div.id = divIdentifier;
        div.className = "media-section";
        script.insertAdjacentElement('afterend', div);
        $.get("{% static 'json/img-manifest-blue.json' %}",
            function createGallery(data) {
                synthesizeGalleryBasic(data, divIdentifier);
        });
        mediaCounter++;
    </script>
</section>
~~~

### ----- Another Topic ------
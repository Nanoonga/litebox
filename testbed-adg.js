

function adaptive_density(mode, id, axis, presentation_size) {

    // mode = 1 (contant area) or 2 (constant density)
    // id = id of photo in catalog
    // axis = WIDTH (0) or HEIGHT (1)
    // presentation_size = length of axis in density-independent pixels

    var
        adjusted_size,  // return value
        adr,    // adaptive density ratio (mode 1 only)
        aspect; // width or height

    mode = (dpr>1) ? mode : 1;  // force sd and hd screens to constant area mode

    if(mode == 1) {  // constant area mode

        adr = dpr;  // devicePixelRatio

        while(Math.floor(adr) > 1  && presentation_size * adr > catalog[id][axis]) {

            adr -= 1;   // decimate adr
        }

        adjusted_size = Math.floor(presentation_size * adr);

    } else {    // constant density mode

        aspect = Math.max(catalog[id][WIDTH],catalog[id][HEIGHT]);

        if(aspect <= presentation_size) {

            adjusted_size  = catalog[id][axis];

        } else if(aspect / dpr <= presentation_size) {

            adjusted_size = Math.floor(catalog[id][axis] / dpr);

        } else if(presentation_size * dpr <= catalog[id][axis]) {

            // askeered that in some degenerate case, adaptive density might
            // request an upsampled photo from the server, so we make sure
            // the server has enough pixels to cash the density cheque

            adjusted_size = Math.floor(presentation_size * dpr);

        } else {

            // if not, take all the pixels and let the browser fit them
            // to the window

            adjusted_size  = catalog[id][axis];
        }
    }

    return adjusted_size;
}


function lightbox_open(n) { // n = ROW

    // Show the selected photo in an overlay window

    var
        img_width,
        img_height,
        img_src,
        aspect = catalog[n][WIDTH] / catalog[n][HEIGHT],
        vumode;

    if(aspect<1) {

        // portrait
        img_height = adaptive_density(2,n,HEIGHT,window_height);
        img_width = Math.floor(aspect * img_height);

        vumode = (img_height>window_height) ? 'SuperHD' : ((img_height<720)? 'SD' : 'HD');

    } else {

        // landscape
        img_width = adaptive_density(2,n,WIDTH,window_width);
        img_height = Math.floor(img_width / aspect);

        vumode = (img_width>window_width) ? 'SuperHD' : ((img_width<1280)? 'SD' : 'HD');

    }

    $('nfobox').style.top = (window_height-260)/2 + 'px';
    $('nfobox').style.left = (window_width-260)/2 + 'px';

    $('nfobox').innerHTML = `
        <table>
            <tr><td class="stub">Picsum ID:</td><td class="col">#&thinsp;${catalog[n][ID]}</td></tr>
            <tr><td class="stub">Author:</td><td class="col"><a href="https://unsplash.com/photos/${catalog[n][UNSPL]}" target="_blank">${authors[catalog[n][AUTH]]}</a></td></tr>
            <tr><td class="stub">Catalog:</td><td class="col">${catalog[n][WIDTH]+'&thinsp;x&thinsp;'+catalog[n][HEIGHT]}</td></tr>
            <tr><td class="stub">Window:</td><td class="col">${window_width}&thinsp;x&thinsp;${window_height}</td></tr>
            <tr><td class="stub">Render:</td><td class="col">${img_width + '&thinsp;x&thinsp;' + img_height}</td></tr>
            <tr><td class="stub">Density:</td><td class="col">${vumode}</td></tr>
        </table>`;

    $('img01').src = `https://picsum.photos/id/${catalog[n][ID]}/${img_width}/${img_height}`;

    $('lightbox').style.display = 'block';
    $('menu').style.visibility = 'visible';
    $('nfobox').style.visibility = 'hidden';

    last_n = n;
}


function lightbox_close() {

    nfobox_close();
    $('img01').src = "1x1.gif";
    $('menu').style.visibility = 'hidden';
    $('lightbox').style.display = 'none';
}


function nfobox_toggle() {

    if($('nfobox').style.visibility == 'hidden') {
        $('nfobox').style.visibility = 'visible';
    } else {
        $('nfobox').style.visibility = 'hidden';
    }
}


function nfobox_close() {

    if($('nfobox').style.visibility == 'visible') {
        $('nfobox').style.visibility = 'hidden';
    }
}


function get_window_geometry() {

    window_width = function() {
        var x = 0;
        if (self.innerHeight) {
            x = self.innerWidth;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            x = document.documentElement.clientWidth;
        } else if (document.body) {
            x = document.body.clientWidth;
        }
        return x;
    }(),

    window_height = function() {
        var y = 0;
        if (self.innerHeight) {
            y = self.innerHeight;
        } else if (document.documentElement && document.documentElement.clientHeight) {
            y = document.documentElement.clientHeight;
        } else if (document.body) {
            y = document.body.clientHeight;
        }
        return y;
    }(),

    scrollbar_width = function() {
        // Creating invisible container
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll'; // forcing scrollbar to appear
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
        document.body.appendChild(outer);

        // Creating inner element and placing it in the container
        const inner = document.createElement('div');
        outer.appendChild(inner);

        // Calculating difference between container's full width and the child width
        const scrollbar_width = (outer.offsetWidth - inner.offsetWidth);

        // Removing temporary elements from the DOM
        outer.parentNode.removeChild(outer);

        return scrollbar_width;
    }();

    viewport_width = window_width - scrollbar_width;
}

function print_r(obj) {
    console.log(JSON.stringify(obj));
}

function print_r(obj) {
    console.log(JSON.stringify(obj));
}

function debounce(func) {

    // pause execution if window is being resized

    var timer;

    return function(event) {
        if(timer) clearTimeout(timer);
        timer = setTimeout(func,100,event);
    };
}


window.addEventListener("resize",debounce(function(e){

    // re-render gallery after resize or orientation change

    get_window_geometry();

    if (viewport_width != last_width) {

         $('gallery').innerHTML='';
         init();

        if($('lightbox').style.display == 'block') {
            lightbox_open(last_n);
        }

        auto_paginate();
    }
}));

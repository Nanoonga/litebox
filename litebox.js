/***************************************************************************
 *
 *   LiteBox
 *   An Adaptive Density Graphical Photo Browser written in Computed HTML
 *   © Copyright Gary Royal 2022, 2023
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 2 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *   GNU General Public License for more details.
 *
 ***************************************************************************/

// globals

var 
    last_width,             
    columns_per_row, 
    total_gutter_width, 
    max_img_width, 
    render_width, 
    gallery_width, 
    left_offset,
    page_length, 
    total_pages, 
    page_number, 
    column_height, 
    last_n, 
    start, 
    t, 
    page_length;

var
    window_width, 
    window_height, 
    scrollbar_width, 
    viewport_width;


// scroll position indicator 

var
    page_ranges,
    min_idx,
    max_idx,
    lastScrollTop = 0; 


const
    responsive_columns = [0, 0, 2, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 6, 6, 7, 7, 8, 8, 9],
    gutter_size = 8,
    alt_max_width = 192,
    dpr = devicePixelRatio,
    WIDTH = 0, HEIGHT = 1, ID = 2, AUTH = 3, UNSPL = 4, ROW = 5, // pointers into the catalog
    no = 0, yes = 1;

// preferences

const
    PAGINATE = yes,
    DOWNLOAD_LIMIT = 0; // 0 = no limit, else truncate catalog to n = DOWNLOAD_LIMIT photos

if(DOWNLOAD_LIMIT) {
    catalog = catalog.slice(0,DOWNLOAD_LIMIT-1);
}


function $(el) {

    // that handy $('foo') shortcut thing

    try {
        return (typeof el == 'string') ? document.getElementById(el) : el;
    } catch (e) {
        if (debug) {
            alert(el);
        }
    }
}


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

// scroll position indicator functions


function print_r(obj) {

    // dump an object to the console for debugging

    console.log(JSON.stringify(obj));
}

function pageToPercent(pageNo) {
    
    pageNo = (pageNo<0) ? total_pages : pageNo;

    var pct = Math.floor((pageNo / total_pages) * 100);
    // print_r([pageNo,total_pages,pct]);
    return pct;
}

function update_scroll_position_indicator(pageNo) {

    if(pageNo === undefined) {

        pageNo = 1;

        if(page_ranges.length > 0) {

            var pst = $('pga').scrollTop;

            for(var p = pageNo; p < page_ranges.length + 1; p++) {

                if(pst >= page_ranges[p][0] && pst <= page_ranges[p][1]) {

                    pageNo = p; break;
                }
            }
        }
    }

    $('prog-hilite').style.left = pageToPercent(pageNo) + '%'; 
}


function onScroll() {

    var st = $('pga').scrollTop;

    if (st > lastScrollTop) {
        
        // downscroll

        if(page_number <= total_pages) {

            if($('pga').scrollHeight - $('pga').scrollTop - $('pga').clientHeight < 1) {

                page_number++;
                auto_paginate();
            
            }
        }  

    } else if (st < lastScrollTop) {
        
        // upscroll

        update_scroll_position_indicator();
    } 

    lastScrollTop = st <= 0 ? 0 : st; 
}


function init() {

    last_width = viewport_width,

    columns_per_row = (viewport_width < 300) ? 1 : ((viewport_width > 2100) ? 12 : responsive_columns[Math.floor(viewport_width / 100)]);

    total_gutter_width = (columns_per_row + 1) * gutter_size,

    max_img_width = (Math.floor((viewport_width - total_gutter_width) / columns_per_row) * 4) / 4,

    render_width = (max_img_width >= alt_max_width) ? alt_max_width : max_img_width,

    gallery_width = (render_width * columns_per_row) + total_gutter_width,

    left_offset = Math.floor((viewport_width - gallery_width) / 2);

    page_length = (PAGINATE) ? Math.ceil(window_height / render_width) * columns_per_row * 2 : catalog.length,

    total_pages = Math.ceil(catalog.length / page_length),

    page_number = 0,

    column_height = new Array(columns_per_row),

    page_ranges=[], min_idx = max_idx = 0;

    column_height.fill(gutter_size);

    /*print_r({
        'catalog length':catalog.length,
        'page_length':page_length,
        'total_pages:':total_pages
    });*/
}


function fetch_page() {

    // fetch the next page from the catalog

    // rewritten to fix bug induced by php-itis:
    // element.slice(start, end) not element.slice(start, length)

    if(page_number > 0 && page_number <= total_pages) {

        var slice_start = (page_number * page_length) - page_length;

        // print_r({'page_number':page_number,'slice_start':slice_start,'page_length':page_length});

        return catalog.slice(slice_start, slice_start + page_length).map(function(value,index) {
            return value[ROW];
        });

    } else {
        return [];
    }
}

// -------------------------------

function auto_paginate() {

    // stream a page of thumbnails to the browser

    if(total_pages > 0) {

        var page = fetch_page();

        print_r(page);        

        page_length = page.length;

        if(page_length > 0) {

            var adr,
                render_height,
                image,
                i, // current image
                j, // current column
                chtml = [],
                el;

            // For each photo in the page,

            for(i = 0; i < page_length; i++) {

                // find the column with the shortest height,

                j = column_height.indexOf(Math.min(...column_height)),

                // compute the adaptive density ratio,

                img_width = adaptive_density(1, page[i], WIDTH, render_width);

                // and compile a thumbnail image.

                aspect = catalog[page[i]][HEIGHT] / catalog[page[i]][WIDTH];

                img_height = Math.floor(aspect * img_width);

                render_height = Math.floor(aspect * render_width);
                
                filespec = `https://picsum.photos/id/${catalog[page[i]][ID]}/${img_width}/${img_height}`;

                chtml[i] = `<img class="brick" style="top:${ 
                    column_height[j]
                }px;left:${
                    left_offset + gutter_size + (j * (render_width + gutter_size))
                }px;width:${
                    render_width
                }px;height:${
                    render_height
                }px;" src="${ filespec }" loading=lazy onclick="lightbox_open(${
                    page[i]
                });">`; // <div class="brick-id"></div>

                // adjust the column height and continue with the next picture

                column_height[j] += render_height + gutter_size;
            }

            // submit the page to the HTML interpreter

            el = document.createElement('div');
            el.innerHTML = chtml.join('');
            $('gallery').appendChild(el);

            // set render position indicators

            $('prog-lite').style.width = pageToPercent(page_number) + '%';
            update_scroll_position_indicator(page_number);            
        }
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


// And Here. We. Go.

document.addEventListener("DOMContentLoaded", function(){

    get_window_geometry();

    init();

    // render the user interface

    var icon_pad = 16; // Math.floor((viewport_width - gallery_width)/2) - 16;

    $('form1').innerHTML = `
    <div id="browser">

        <header>
            <nav class="left" style="padding:0 ${icon_pad}px 0 ${icon_pad}px;">
                <span class="material-icons md-24 md-light md-inactive">menu</span>
            </nav>
            <nav id="rspeed"></nav>
            <nav></nav>
        </header>

        <div id="prog-dark">
          <div id="prog-lite"></div>
          <div id="prog-hilite"></div>       
        </div>
           
        <div id="pga">
            <div id="gallery"></div>
        </div>

    </div>

    <div id="lightbox">
        <div id="imgdiv" class="cover" onclick="nfobox_toggle();">
            <img class="slide" id="img01" src="1x1.gif" onclick="">
        </div>
    </div>

    <div id="nfobox" style="top:${(window_height-260)/2}px;left:${(window_width-260)/2}px;" onclick="nfobox_toggle();"></div>

    <nav id="menu" class="menu" style="visibility:hidden;">
        <span class="material-icons md-24 md-light" onclick="nfobox_toggle();">info_outline</span>
        <span class="material-icons md-24 md-light" onclick="lightbox_close();">close</span>
    </nav>`;

    if(PAGINATE) {

        // fetch and render the next page on scroll
        
        $('pga').addEventListener("scroll", onScroll);
    }

    // fetch and render the first page

    auto_paginate();
});
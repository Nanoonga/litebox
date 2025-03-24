# LiteBox

> An Adaptive Density Graphical Photo Browser written in Computed HTML

![litebox.jpg](litebox.jpg)

## 

## Overview

**LiteBox** is a dpi-aware media browser that tries to render photos with the finest practical image detail on all devices. It does not require a SuperHD video display, but takes full advantage of one if available.

LiteBox is a written in **Computed HTML**, a programming model where the tags describing a web page are assembled in JavaScript and rendered by the browser's HTML interpreter. 

LiteBox introduces **Adaptive Density**, a strategy for optimizing image quality by adjusting the download resolution for each image to match the pixel density of the screen it's being displayed on. 

## Getting Started

* [**View the Live Demo**](https://nanoonga.github.io/litebox/) on your PC, notebook, phone and tablet, or

* Clone or download the repo, and drag the file index.html into an open browser window, then

* Browse the source and adapt what you like to your own projects

## Computed HTML

Computed HTML (CHTML) is a method for developing arbitrarily complex web applications in JavaScript, independent of any framework or library. CHTML is orders of magnitude faster than conventional Dynamic HTML (DHTML).

CHTML uses JavaScript to compile a document layout in RAM and pushes it through the browser's HTML interpreter, which renders the layout in a single pass. 

Because all necessary attributes are specified, the browser never has to backtrack or repaint. The user interface is rendered instantly, and becomes interactive in less than a second regardless of layout complexity. 

## Adaptive Density

Most people who buy SuperHD computers, tablets, and phones would enjoy browsing websites that take advantage of that fancy hardware, but every brand and model of video display has a different size, resolution, and pixel density. 

But the HTML `srcset` attribute, which allows the browser to select between pre-rendered images, is not suitable for large, heterogenous, or dynamic media collections. 

Adaptive Density is an algorithm that holds either the presentation size or the pixel density constant, and computes the resolution necessary to display an image that fulfills the primary constraint. The image may then be downloaded from a server capable of scaling pictures to arbitrary dimensions.  

We define a `SuperHD display` to be any device with a devicePixelRatio > 1, and a `SuperHD rendition` to be any rendition on a SuperHD display in which there is a 1:1 ratio of image pixels to screen pixels.

**Constant Area Mode** scales photos to the presentation size, even if the browser has to upsample the image to fit. This mode is used primarily for thumbnails, because upsampling only occurs in the event that the native size of an image is smaller than the presentation size, which is rare. 

**Constant Density Mode** scales photos to the (presentation size * devicePixelRatio). It will always render an image in SuperHD on a SuperHD display, but the image area may be smaller than the presentation size.

### notes

- High resolution does not necessarily mean high detail. There are low resolution pictures with high detail, and high resolution pictures with low detail. The origin media (film or digital), source (casual uploads or managed collections), and subject (people, places, artwork) will vary from one picture to the next.

- Adaptive Density is a function of image resolution vs devicePixelRatio vs presentation size. This function may be applied to an image whenever the window geometry changes. The rendition may shift between SD, HD, and SuperHD as the window is resized, or the device is rotated.

- None of the above applies for SD or HD displays (devicePixelRatio == 1), or *constant area* mode when the Adaptive Density Ratio (ADR) has been decimated to 1. In that case, the image is downloaded at the presentation size, which conserves bandwidth on SD and HD devices by not downloading more image detail than the display can resolve.

---

**Table 1: geometries of a small sample of video displays**

| device                    | resolution | dpr  | ppi             | viewport  |
| ------------------------- | ---------- | ---- | --------------- | --------- |
| 27" PC monitor            | 1920x1080  | 1.00 | 82              | 1920x1080 |
| 9.7" iPad                 | 768x1024   | 1.00 | 132<sup>1</sup> | 768x1024  |
| 27" iMac 2020             | 2560x1440  | 2.00 | 109<sup>1</sup> | 1280x720  |
| 12.9" iPad Pro            | 2048x2732  | 2.00 | 264             | 1024x1366 |
| 3.5" iPhone 4             | 640x960    | 2.00 | 326             | 320x480   |
| 5.8" Pixel 4a             | 1080x2340  | 2.75 | 443             | 393x851   |
| 6.1" iPhone 13            | 1170x2532  | 3.00 | 460             | 390x844   |
| 6.8" Galaxy S23 Ultra     | 1440x3088  | 4.00 | 501             | 360x772   |
| 14.6" Galaxy Tab S8 Ultra | 1848x2960  | 4.00 | 240             | 462x740   |

<sup>1</sup> It's interesting that a 2011 iPad has a finer dot pitch than a 2020 iMac, despite the iMac being a SuperHD ( "Retina 5K") display.

---

**Listing 1: Adaptive Density**

```javascript
function adaptive_density(mode, id, axis, presentation_size) {

    // mode = 1 (contant area) or 2 (constant density)
    // id = id of photo in catalog
    // axis = WIDTH (0) or HEIGHT (1)
    // presentation_size = length of axis in density-independent pixels

    var
        adjusted_size,  // return value
        adr,    // adaptive density ratio (mode 1 only)
        aspect; // width or height

    mode = (dpr>1) ? mode : 1;  // force sd and hd screens to constant size mode

    if(mode == 1) {  // constant area mode

        adr = devicePixelRatio;  

        while(Math.floor(adr) > 1 
            && presentation_size * adr > catalog[id][axis]) {
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

            // askeered that in some degenerate case, adaptive density 
            // might request an upsampled photo from the server, so we 
            // make sure the server has enough pixels to cash the 
            // density cheque

            adjusted_size = Math.floor(presentation_size * dpr);

        } else {

            // if not, take all the pixels and let the browser fit them 
            // to the window

            adjusted_size  = catalog[id][axis];
        }
    }

    return adjusted_size;
}
```

---

## Meta Paginaton

In testing, with a production-scale version of the masonry layout algorithm, with pagination turned off, we discovered that it's both possible and easy to dump a corpus of several thousand Super HD thumbnail images into the browser in a single render. After scrolling all the way down to the last row of images, we discovered it was difficult to scroll back up again, probably due to the sheer number of previously rendered but off-screen elements the browser needed to keep track of in order to reverse the scroll direction and work its way back to the top.

We believe this means that even with pagination turned on, there is a practical limit to the number of thumbail images that can be effectively managed by the browser in a single render. Our pagination algorithm must be subject to a higher-order pagination algorithm in order to achieve "infinite" scrolling to the end of a large catalog.

To help us explore strategies for a meta-pagination, we introduced on-screen indicators to help us navigate within a render. 

![](indicator1.png)

The **Render Position Indicator** shows how much of the catalog has been rendered, from 0% to 100%. Embedded in this indicator is a **Scroll Position Indicator**, which shows the position of the display window within the rendered portion of the catalog.

## Predicted Quality

Adaptive Density is a function of image size vs render size vs DevicePixelRatio, computed independently for each rendition of that image. The objective is to display the image at the highest quality on all displays at all times, and may shift between standard, adaptive, and super HD renditions as the render size or window geometry changes.

Adaptive Density is enabled only for Super HD displays (DevicePixelRatio > 1). However, it is a property of raster graphic images that downsampling increases sharpness of definition, so nearly all images will exhibit improved detail simply by being properly scaled for the display context they're being viewed in. For that reason, Adaptive Density's Standard HD mode is probably objectively better than any naive presentation strategy (e.g. the *srcset* attribute of the HTML IMG element).

During thumbnail generation, the full-size rendition quality for each image is predicted and displayed as a colored ball in the upper left corner of the thumbnail image:

![](indicator2.png)

| Color  | Mode              | Image Size vs Render Size vs DevicePixelRatio                                          |
| ------ |:----------------- |:-------------------------------------------------------------------------------------- |
| Blue   | Standard HD (SHD) | Standard HD displays (DPR < 2), and Super HD displays where image area <= display area |
| Orange | Adaptive HD (ADR) | Super HD displays where image area < dpr * display area                                |
| Red    | Super HD (SHD)    | Super HD displays where image area >= dpr * display area                               |

## Lorem Picsum

**[Lorem Picsum](https://picsum.photos/)** is an image placeholder service that allows us to download arbitrary photos at arbitrary sizes to demonstrate the placement of images in a layout.

Their generous contribution of a scaling image server and photo collection to the public interest made this project possible.

Information about Picsum placeholders is stored in an array called the *catalog*:

```javascript
const catalog = [
    // [width, height, picsum ID, author ID, unsplash ID, row]
    [5000,3333,396,482,"ko-wCySsj-I",0],
    [4240,2832,667,283,"XMcoTHgNcQA",1],
    ...
    [3872,2592,348,40,"mVhd5QVlDWw",892]
];
```

*Author ID* = Index of the author's name in the author table for photo credit

*Unsplash ID* = URL path to the photo on [**Unsplash**](https://unsplash.com/about), an archive of free-to-use high-resolution photos

*Row* = the ordinal number of the item in the catalog array

## Inspiration

The Request/Response nature of the HTTP protocol is similar to, and probably a spritual descendent of, mainframe terminal protocols such as IBM 3270 and Burroughs Poll/Select which were so efficient that dozens of terminals could be run (comfortably) over a 56K leased telephone line.  Your broadband connection at home is at least 1,785 times faster than that, yet 3270 and PSP were favored for real-time applications like airline reservation systems in the 1980s.

Computed HTML was developed near the end of the dialup era to achieve broadband-like HTML performance over dialup Internet connections by applying many of the same optimizations, such as structuring a website as a set of pages that are cached in their entirety on the browser, eliminating 99% of redundant data traffic. CHTML goes a step farther by caching procedures that render HTML in situ rather than caching HTML rendered on a remote server, and once the cache is populated only ephemeral data (session credentials, query results) need be exchanged with the server at all.

In the broadband era, computed HTML makes web applications as performant as native ones by driving the HTML interpreter programmatically rather than streaming markup from a remote server. This elementary web application is an example. 

## Wisdom

*"It is the customary fate of new truths to begin as heresies and end as superstitions"*

-- Thomas Henry Huxley

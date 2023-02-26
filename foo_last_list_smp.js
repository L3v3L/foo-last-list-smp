'use strict';

include("docs/Flags.js");
include("docs/Helpers.js");

window.DefineScript("Last List",
{
    author: "Ivo Barros",
    version: "0.1",
});

const g_theme = window.CreateThemeManager("Button");
const g_font = gdi.Font("Segoe UI", 12);
const ButtonStates = {
    normal: 0,
    hover: 1,
    down: 2,
    hide: 3,
};

let buttonTemplate = {
    x: 5,
    y: 5,
    w: 60,
    h: 26,
    rowSize: 35,
};

const buttons = {
    LastListButton: new columnButton(buttonTemplate, 0, "Last List", function () {
        try {
            let url = utils.InputBox(0, "Enter the URL:", "Download", '', true);
            // if url has page as parameter, set directPage to true
            let regexPattern = /\/.*\?.*(page=(\d+))/gmi;

            let matches = [...url.matchAll(regexPattern)];

            let startPage = 1;
            if (matches.length > 0) {
                startPage = parseInt(matches[0][2]);
                if (isNaN(startPage) || startPage < 1) {
                    startPage = 1;
                }

                url = url.replace(matches[0][1], "");
            }

            let pages = utils.InputBox(0, "Enter the number of pages:", "Download", '1', true);
            pages = parseInt(pages);
            if (isNaN(pages) || pages < 1) {
                pages = 1;
            }

            let playlistName = utils.InputBox(0, "Enter the playlist name:", "Download", 'LastList', true);
            scrapeUrl(url, startPage, pages, playlistName);
        } catch (e) {
            // show error message
            log("Error - " + e.message);
        }
    }),
};

let g_down = false;
let cur_btn = null;

function log(msg) {
    console.log('Last List: ' + msg);
}

function scrapeUrl(url, startPage, pages, playlistName) {
    // create an index of the library
    let indexedLibrary = [];
    fb.GetLibraryItems().Convert().forEach((item) => {
        let fileInfo = item.GetFileInfo();
        let titleLib = fileInfo.MetaValue(fileInfo.MetaFind("TITLE"), 0).toLowerCase().trim();
        let artistLib = fileInfo.MetaValue(fileInfo.MetaFind("ARTIST"), 0).toLowerCase().trim();
        indexedLibrary[`${artistLib} - ${titleLib}`] = item;
    });

    // regex patterns to match
    let regexElement = /data-youtube-id=[^>]*>/gmi;
    let regexYoutube = /data-youtube-id=\"([^\"]*)\"/gmi;
    let regexTitle = /data-track-name=\"([^\"]*)\"/gmi;
    let regexArtist = /data-artist-name=\"([^\"]*)\"/gmi;

    // create playlist
    let playlist = plman.FindOrCreatePlaylist(playlistName, false);
    plman.ClearPlaylist(playlist);
    let itemsToAdd = [];

    let promises = [];
    for (let i = startPage; i < (startPage + pages); i++) {
        promises.push(new Promise((resolve, reject) => {
            let xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            let urlAppend = url.includes("?") ? "&" : "?";

            xmlhttp.open("GET", `${url}${urlAppend}page=${i}`, true);

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    log(`searching page ${i}...`);
                    let content = xmlhttp.responseText;

                    // find all youtube links with title and artist
                    let matches = [...content.matchAll(regexElement)];
                    log(`${matches.length} matches found`);
                    matches.every((match) => {

                        let youtube = [...match[0].matchAll(regexYoutube)];
                        let title = [...match[0].matchAll(regexTitle)];
                        let artist = [...match[0].matchAll(regexArtist)];

                        // TODO what if only youtube doesn't exist but have track in library?
                        if (title.length == 0 || artist.length == 0 || youtube.length == 0) {
                            return true;
                        }

                        youtube = youtube[0][1];
                        title = cleanString(decodeURI(title[0][1]));
                        artist = cleanString(decodeURI(artist[0][1]));

                        // add to items to add
                        itemsToAdd.push({
                            youtube: youtube,
                            title: title,
                            artist: artist,
                            file: indexedLibrary[`${artist.toLowerCase()} - ${title.toLowerCase()}`]
                        });

                        return true;
                    });
                    // add items to playlist
                    resolve();
                }
            };

            setTimeout(function () {
                xmlhttp.send();
            }, 5000 * (i - startPage));
        }));
    }

    Promise.all(promises).then(() => {
        addItemsToPlaylist(itemsToAdd, playlist);
        // TODO remove duplicates from playlist
        /*
        let playlistItems = plman.GetPlaylistItems(playlist);
        plman.ClearPlaylist(playlist);
        plman.InsertPlaylistItemsFilter(playlist, 0, playlistItems);
        */

        // activate playlist
        plman.ActivePlaylist = playlist;
        log("finished");
    });
}

function addItemsToPlaylist(items, playlist) {
    // remove duplicates
    items = [...new Set(items)];
    // check if there are items to add
    if (items.length == 0) {
        log("No items to add");
        return false;
    }

    let lastType = 'youtube';
    let queue = [];
    // add items to playlist
    items.forEach((itemToAdd) => {
        let type = itemToAdd.file ? "local" : "youtube";
        // submit queue
        if (type != lastType) {
            if (lastType == "youtube") {
                plman.AddLocations(playlist, queue);
                queue = new FbMetadbHandleList();
            }
            if (lastType == "local") {
                plman.InsertPlaylistItems(playlist, plman.PlaylistItemCount(playlist), queue);
                queue = [];
            }

            lastType = type;
        }

        if (type == "youtube") {
            queue.push(`3dydfy://www.youtube.com/watch?v=${itemToAdd.youtube}&fb2k_artist=${encodeURIComponent(itemToAdd.artist)}&fb2k_title=${encodeURIComponent(itemToAdd.title)}`);
        }
        if (type == "local") {
            queue.Insert(queue.Count, itemToAdd.file);
        }
    });
    if (lastType == "youtube") {
        plman.AddLocations(playlist, queue);
    }
    if (lastType == "local") {
        plman.InsertPlaylistItems(playlist, plman.PlaylistItemCount(playlist), queue);
    }
}

function columnButton(buttonTemplate, row, text, fonClick, state) {
    return new SimpleButton(
        buttonTemplate["x"],
        buttonTemplate["y"] + row * buttonTemplate["rowSize"],
        buttonTemplate["w"],
        buttonTemplate["h"],
        text,
        fonClick,
        state
    );
}

function SimpleButton(x, y, w, h, text, fonClick, state) {
    this.state = state ? state : ButtonStates.normal;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.text = text;
    this.fonClick = fonClick;

    this.containXY = function (x, y) {
        return (
            this.x <= x && x <= this.x + this.w && this.y <= y && y <= this.y + this.h
        );
    };

    this.changeState = function (state) {
        let old = this.state;
        this.state = state;
        return old;
    };

    this.draw = function (gr) {
        if (this.state === ButtonStates.hide) {
            return;
        }

        switch (this.state) {
            case ButtonStates.normal:
                g_theme.SetPartAndStateID(1, 1);
                break;

            case ButtonStates.hover:
                g_theme.SetPartAndStateID(1, 2);
                break;

            case ButtonStates.down:
                g_theme.SetPartAndStateID(1, 3);
                break;

            case ButtonStates.hide:
                return;
        }

        g_theme.DrawThemeBackground(gr, this.x, this.y, this.w, this.h);
        gr.GdiDrawText(
            this.text,
            g_font,
            RGB(0, 0, 0),
            this.x,
            this.y,
            this.w,
            this.h,
            DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX
        );
    };

    this.onClick = function () {
        this.fonClick && this.fonClick();
    };
}

function drawAllButtons(gr) {
    for (let i in buttons) {
        buttons[i].draw(gr);
    }
}

function chooseButton(x, y) {
    for (let i in buttons) {
        if (buttons[i].containXY(x, y) && buttons[i].state !== ButtonStates.hide) {
            return buttons[i];
        }
    }

    return null;
}

function on_paint(gr) {
    gr.FillSolidRect(0, 0, window.Width, window.Height, utils.GetSysColour(15));
    drawAllButtons(gr);
}

function on_mouse_move(x, y) {
    let old = cur_btn;
    cur_btn = chooseButton(x, y);

    if (old === cur_btn) {
        if (g_down) {
            return;
        }
    } else if (g_down && cur_btn && cur_btn.state !== ButtonStates.down) {
        cur_btn.changeState(ButtonStates.down);
        window.Repaint();
        return;
    }

    old && old.changeState(ButtonStates.normal);
    cur_btn && cur_btn.changeState(ButtonStates.hover);
    window.Repaint();
}

function on_mouse_leave() {
    g_down = false;

    if (cur_btn) {
        cur_btn.changeState(ButtonStates.normal);
        window.Repaint();
    }
}

function on_mouse_lbtn_down(x, y) {
    g_down = true;

    if (cur_btn) {
        cur_btn.changeState(ButtonStates.down);
        window.Repaint();
    }
}

function on_mouse_lbtn_up(x, y) {
    g_down = false;

    if (cur_btn) {
        cur_btn.onClick();
        cur_btn.changeState(ButtonStates.hover);
        window.Repaint();
    }
}

function cleanString(str) {
    return str.replace(/&#39;/g, "'")
        .replace(/&#38;/g, "&")
        .replace(/&#34;/g, "\"")
        .replace(/&#60;/g, "<")
        .replace(/&#62;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, "\"")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .trim();
}

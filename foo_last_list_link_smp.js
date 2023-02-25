window.DefineScript("last-list-link", { author: "Ivo Barros" });
include("docs/Flags.js");
include("docs/Helpers.js");

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
    w: 110,
    h: 26,
    rowSize: 35,
};

const buttons = {
    ScrapeForYoutube: new columnButton(buttonTemplate, 0, "Last List Link", function () {
        let url = utils.InputBox("Enter the URL:", "Download", "");
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
        let playlist = plman.FindOrCreatePlaylist("LastLinkList", false);
        plman.ClearPlaylist(playlist);

        for (let i = 1; i <= 1; i++) {
            console.log("Scraping page " + i);
            let xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            xmlhttp.open("GET", url, true);
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    console.log("Scraping for youtube links from page " + i + " ...");
                    let content = xmlhttp.responseText;

                    // find all youtube links with title and artist
                    let itemsToAdd = [];
                    let matches = [...content.matchAll(regexElement)];
                    console.log(matches.length + " matches found");
                    matches.every((match) => {
                        // scrape youtube id
                        let youtube = match[0].match(regexYoutube);
                        youtube = youtube[0]
                        .replace("data-youtube-id=\"", "")
                        .replace("\"", "");
                        // scrape title
                        let title = match[0].match(regexTitle);
                        title = cleanString(decodeURI(title[0]
                            .replace("data-track-name=\"", "")
                            .replace("\"", "")
                        ));
                        // scrape artist
                        let artist = match[0].match(regexArtist);
                        artist = cleanString(decodeURI(artist[0]
                            .replace("data-artist-name=\"", "")
                            .replace("\"", "")
                            ));
                        // TODO what if only youtube doesn't exist but have track in library?
                        // continue if any of the values is empty
                        if (!youtube || !title || !artist) {
                            return true;
                        }
                        // add to items to add
                        itemsToAdd.push({
                            youtube: youtube,
                            title: title,
                            artist: artist,
                            file: indexedLibrary[`${artist.toLowerCase()} - ${title.toLowerCase()}`]
                        });

                        return true;
                    });
                    // remove duplicates
                    itemsToAdd = [...new Set(itemsToAdd)];
                    // check if there are items to add
                    if (itemsToAdd.length == 0) {
                        console.log("No items to add");
                        return false;
                    }

                    let lastType = 'youtube';
                    let queue = [];
                    // add items to playlist
                    itemsToAdd.forEach((itemToAdd) => {
                        let type = itemToAdd.file ? "local" : "youtube";
                        // submit queue
                        if (type != lastType) {
                            if (lastType == "youtube") {
                                plman.AddLocations(playlist, queue);
                                queue = new FbMetadbHandleList();
                            }
                            if (lastType == "local") {
                                plman.InsertPlaylistItemsFilter(playlist, plman.PlaylistItemCount(playlist), queue);
                                queue = [];
                            }

                            lastType = type;
                        }

                        if (type == "youtube") {
                            queue.push(`3dydfy://www.youtube.com/watch?v=${itemToAdd.youtube}&fb2k_artist=${encodeURIComponent(itemToAdd.artist)}&fb2k_title=${encodeURIComponent(itemToAdd.title)}`);
                        }
                        if (type == "local") {
                            queue.Add(itemToAdd.file);
                        }
                    });

                    // activate playlist
                    plman.ActivePlaylist = playlist;
                }
            };

            setTimeout(function () {
                xmlhttp.send();
            }, 5000 * i);
        }

    }),
};

let g_down = false;
let cur_btn = null;


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

'use strict';

// InputError
class InputError extends Error {
    constructor(message) {
        super(message);
        this.name = "InputError";
    }
}


function _lastList() {

    this.run = () => {
        try {
            let url;
            try {
                url = utils.InputBox(0, "Enter the URL:", "Download", '', true);
            } catch (e) {
                throw new InputError('Cancelled Input');
            }

            if (!url) {
                throw new InputError('No URL');
            }

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

            let pages;
            try {
                pages = utils.InputBox(0, "Enter the number of pages:", "Download", '1', true);
            } catch (e) {
                throw new InputError('Cancelled Input');
            }
            pages = parseInt(pages);
            if (isNaN(pages) || pages < 1) {
                pages = 1;
            }

            let playlistName;
            try {
                playlistName = utils.InputBox(0, "Enter the playlist name:", "Download", 'LastList', true);
            } catch (e) {
                throw new InputError('Cancelled Input');
            }

            if (!playlistName) {
                throw new InputError('No playlist name');
            }

            this.scrapeUrl(url, startPage, pages, playlistName);
        } catch (e) {
            if (e instanceof InputError) {
                // do nothing
            } else {
                //show error message
                this.log("Error - " + e.message);
            }

        }
    };

    this.log = (msg) => {
        console.log('Last List: ' + msg);
    };

    this.scrapeUrl = (url, startPage, pages, playlistName) => {
        // create an index of the library
        let indexedLibrary = {};
        fb.GetLibraryItems().Convert().every((item) => {
            let fileInfo = item.GetFileInfo();
            const titleIdx = fileInfo.MetaFind("TITLE");
            const artistIdx = fileInfo.MetaFind("ARTIST");

            if (titleIdx == -1 || artistIdx == -1) {
                return true;
            }

            let titleLib = fileInfo.MetaValue(titleIdx, 0).toLowerCase().trim();
            let artistLib = fileInfo.MetaValue(artistIdx, 0).toLowerCase().trim();

            if (titleLib.length && artistLib.length) {
                indexedLibrary[`${artistLib} - ${titleLib}`] = item;
            }

            return true;
        });

        // regex patterns to match
        let regexElement = /<tr\s((.|\n)*?)chartlist-love-button((.|\n)*?)<\/tr>/gmi;
        let regexYoutube = /data-youtube-id=\"(.*?)\"/gmi;
        let regexTitle = /data-track-name=\"(.*?)\"/gmi;
        let regexArtist = /data-artist-name=\"(.*?)\"/gmi;
        let regexFallBack = /href=\"\/music\/([^\/]+)\/_\/([^\"]+)\"/gmi;

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

                xmlhttp.onreadystatechange = () => {
                    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        this.log(`searching page ${i}...`);
                        let content = xmlhttp.responseText;

                        // find all youtube links with title and artist
                        let matches = [...content.matchAll(regexElement)];
                        this.log(`${matches.length} matches found`);
                        matches.every((match) => {
                            // get track info from youtube data element
                            let youtube = [...match[0].matchAll(regexYoutube)];
                            let title = [...match[0].matchAll(regexTitle)];
                            let artist = [...match[0].matchAll(regexArtist)];

                            if (title.length && artist.length) {
                                // clean strings
                                title = this.cleanString(decodeURI(title[0][1]));
                                artist = this.cleanString(decodeURI(artist[0][1]));
                            } else { // fallback to href if youtube data element is not available
                                let fallbackData = [...match[0].matchAll(regexFallBack)];
                                if (!fallbackData.length) {
                                    return true;
                                }
                                // clean strings
                                artist = decodeURIComponent(fallbackData[0][1]).replace(/\+/g, " ");
                                title = decodeURIComponent(fallbackData[0][2]).replace(/\+/g, " ");
                            }

                            // if no title or artist, skip
                            if (!title.length || !artist.length) {
                                return true;
                            }

                            // get file from library
                            let file = indexedLibrary[`${artist.toLowerCase()} - ${title.toLowerCase()}`];
                            // if no file and no youtube link, skip
                            if (!file && !youtube.length) {
                                return true;
                            }

                            // add to items to add
                            itemsToAdd.push({
                                youtube: youtube.length ? youtube[0][1] : null,
                                title: title,
                                artist: artist,
                                file: file
                            });

                            return true;
                        });
                        // add items to playlist
                        resolve();
                    }

                    if (xmlhttp.readyState == 4 && xmlhttp.status != 200) {
                        resolve();
                    }
                };

                setTimeout(function () {
                    xmlhttp.send();
                }, 5000 * (i - startPage));
            }));
        }

        Promise.all(promises).then(() => {
            this.addItemsToPlaylist(itemsToAdd, playlist);
            // TODO remove duplicates from playlist
            /*
            let playlistItems = plman.GetPlaylistItems(playlist);
            plman.ClearPlaylist(playlist);
            plman.InsertPlaylistItemsFilter(playlist, 0, playlistItems);
            */

            // activate playlist
            plman.ActivePlaylist = playlist;
            this.log("finished");
        });
    };

    this.addItemsToPlaylist = (items, playlist) => {
        // remove duplicates
        items = [...new Set(items)];
        // check if there are items to add
        if (items.length == 0) {
            this.log("No items to add");
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
    };

    this.cleanString = (str) => {
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
    };
}
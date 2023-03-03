'use strict';

// InputError
class InputError extends Error {
    constructor(message) {
        super(message);
        this.name = "InputError";
    }
}


function _lastList() {
    this.cachedUrls = [];

    this.run = ({ url = '', pages = 1, playlistName = 'Last List', cacheTime = 86400000 } = {}) => {
        try {
            if (!url) {
                try {
                    url = utils.InputBox(0, "Enter the URL:", "Download", this.cachedUrls.length ? this.cachedUrls[0] : '', true);
                } catch (e) {
                    throw new InputError('Cancelled Input');
                }

                if (!url) {
                    throw new InputError('No URL');
                }
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

            if (!pages || isNaN(pages) || pages < 1) {
                try {
                    pages = utils.InputBox(0, "Enter the number of pages:", "Download", '1', true);
                } catch (e) {
                    throw new InputError('Cancelled Input');
                }

                pages = parseInt(pages);
                if (isNaN(pages) || pages < 1) {
                    pages = 1;
                }
            }

            if (!playlistName) {
                try {
                    playlistName = utils.InputBox(0, "Enter the playlist name:", "Download", 'Last List', true);
                } catch (e) {
                    throw new InputError('Cancelled Input');
                }

                if (!playlistName) {
                    throw new InputError('No playlist name');
                }
            }

            this.scrapeUrl(url, startPage, pages, playlistName, cacheTime);

            // removes url from cache if it exists and slices the cache to 9 items
            this.cachedUrls = this.cachedUrls.filter((cachedUrl) => {
                return cachedUrl !== url;
            }).slice(0, 9);
            // add url to the beginning of the cache
            this.cachedUrls.unshift(url);
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

    this.scrapeUrl = (url, startPage, pages, playlistName, cacheTime) => {
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
        let regexCover = /\"cover-art\">\s*<img\s+src=\"(.*?)\"/gmi;
        let regexFallBack = /href=\"\/music\/([^\/]+)\/_\/([^\"]+)\"/gmi;

        // create playlist
        let playlist = plman.FindOrCreatePlaylist(playlistName, false);
        plman.ClearPlaylist(playlist);
        let itemsToAdd = [];

        let hasYoutubeComponent = utils.CheckComponent('foo_youtube', true);

        let promises = [];
        for (let i = startPage; i < (startPage + pages); i++) {
            promises.push(new Promise((resolve, reject) => {
                let xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
                let urlAppend = url.includes("?") ? "&" : "?";

                let urlToUse = `${url}${urlAppend}page=${i}`;

                let cachePath = fb.ProfilePath + "LastListCache\\";
                // check if cache valid
                let urlHash = this.hashCode(urlToUse);
                let cachedFilePath = cachePath + urlHash + ".json";

                if (utils.IsFile(cachedFilePath)) {
                    let cachedResultString = utils.ReadTextFile(cachedFilePath);
                    let cachedResult = JSON.parse(cachedResultString);
                    if (cachedResult.created_at > (Date.now() - cacheTime)) {
                        cachedResult = this.decompressCache(cachedResult);
                        cachedResult.trackItems.forEach((track) => {
                            // if no title or artist, skip
                            if (!track.title || !track.artist) {
                                return true;
                            }

                            // get file from library
                            let file = indexedLibrary[`${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`];
                            // if no file and no youtube link or no foo_youtube, skip
                            if (!file && (!track.youtube || !hasYoutubeComponent)) {
                                return true;
                            }

                            // add to items to add
                            itemsToAdd.push({
                                youtube: track.youtube,
                                title: track.title,
                                artist: track.artist,
                                cover: track.coverArt,
                                file: file
                            });
                        });
                        this.log(`Cached Used`);
                        resolve();
                        return;
                    }
                }

                xmlhttp.open("GET", urlToUse, true);
                xmlhttp.onreadystatechange = () => {
                    this.log(`Cached Not Used`);
                    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                        this.log(`searching page ${i}...`);
                        let content = xmlhttp.responseText;
                        // check if content is json

                        let trackItems = [];

                        if (content.startsWith('{')) {
                            try {
                                let json = JSON.parse(content);
                                if (json.error) {
                                    this.log(`Error - ${json.error}`);
                                    resolve();
                                    return;
                                }
                                json.playlist.every((track) => {
                                    // check everthing needed is present
                                    if (!track.name || !track.artists || !track.artists.length || !track.playlinks || !track.playlinks.length) {
                                        return true;
                                    }

                                    trackItems.push({
                                        youtube: track.playlinks[0].id,
                                        title: track.name,
                                        artist: track.artists[0].name,
                                        coverArt: null
                                    });
                                    return true;
                                });
                            } catch (e) {
                                this.log(`Error - ${e.message}`);
                                resolve();
                                return;
                            }
                        } else {
                            let matches = [...content.matchAll(regexElement)];
                            this.log(`${matches.length} matches found`);
                            matches.every((match) => {
                                // get track info from youtube data element
                                let youtube = [...match[0].matchAll(regexYoutube)];
                                let title = [...match[0].matchAll(regexTitle)];
                                let artist = [...match[0].matchAll(regexArtist)];
                                let coverArt = [...match[0].matchAll(regexCover)];

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

                                trackItems.push({
                                    youtube: youtube.length ? youtube[0][1] : null,
                                    title: title,
                                    artist: artist,
                                    coverArt: coverArt.length && !coverArt[0][1].includes('4128a6eb29f94943c9d206c08e625904.jpg') ? coverArt[0][1] : null
                                });

                                return true;
                            });
                        }

                        if (cacheTime) {
                            // record cache
                            let jsonString = JSON.stringify(this.compressCache({
                                ver: 1,
                                url: url,
                                created_at: new Date().getTime(),
                                trackItems: trackItems
                            }));
                            utils.WriteTextFile(cachedFilePath, jsonString);
                        }

                        trackItems.forEach((track) => {
                            // if no title or artist, skip
                            if (!track.title || !track.artist) {
                                return true;
                            }

                            // get file from library
                            let file = indexedLibrary[`${track.artist.toLowerCase()} - ${track.title.toLowerCase()}`];
                            // if no file and no youtube link or no foo_youtube, skip
                            if (!file && (!track.youtube || !hasYoutubeComponent)) {
                                return true;
                            }

                            // add to items to add
                            itemsToAdd.push({
                                youtube: track.youtube,
                                title: track.title,
                                artist: track.artist,
                                cover: track.coverArt,
                                file: file
                            });
                        });

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
                let fooYoutubeUrl = `3dydfy://www.youtube.com/watch?v=${itemToAdd.youtube}&fb2k_artist=${encodeURIComponent(itemToAdd.artist)}&fb2k_title=${encodeURIComponent(itemToAdd.title)}`;
                if (itemToAdd.cover) {
                    // upscale cover art link
                    itemToAdd.cover = itemToAdd.cover.replace(/\/64s\//g, "/300x300/");
                    // append cover url to youtube url
                    fooYoutubeUrl += `&fb2kx_thumbnail_url=${encodeURIComponent(itemToAdd.cover)}`;
                    fooYoutubeUrl += `&fb2k_last_list_thumbnail_url=${encodeURIComponent(itemToAdd.cover)}`;
                }
                queue.push(fooYoutubeUrl);
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

    this.hashCode = (str, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed,
            h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }

        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    };

    this.compressCache = (cacheObject) => {
        let artistCounts = {};
        let coverArtCounts = {};

        // make cacheObject an array withouth the keys
        let trackItems = cacheObject.trackItems.map((track) => {
            // process coverArt
            if (track.coverArt) {
                track.coverArt = track.coverArt.replace('https://lastfm.freetls.fastly.net/i/u/64s/', '-').replace(/\.jpg$/g, '-');

                if (track.coverArt in coverArtCounts) {
                    coverArtCounts[track.coverArt]++;
                } else {
                    coverArtCounts[track.coverArt] = 1;
                }
            }

            if (track.artist in artistCounts) {
                artistCounts[track.artist]++;
            } else {
                artistCounts[track.artist] = 1;
            }

            return [
                track.youtube,
                track.title,
                track.artist,
                track.coverArt,
            ];
        });
        // keep only the artists with more than 1 track
        let artists = Object.keys(artistCounts).filter((artist) => {
            return artistCounts[artist] > 1;
        });

        let coverArts = Object.keys(coverArtCounts).filter((coverArt) => {
            return coverArtCounts[coverArt] > 1;
        });

        // replace artist names with artist position in artistCounts array
        cacheObject.trackItems = trackItems.map((track) => {
            let artistIndex = artists.indexOf(track[2]);
            if (artistIndex > -1) {
                track[2] = artistIndex;
            }

            if (track[3] !== null) {
                let coverArtIndex = coverArts.indexOf(track[3]);
                if (coverArtIndex > -1) {
                    track[3] = coverArtIndex;
                }
            }

            return track;
        }).flat();

        cacheObject.artists = artists;
        cacheObject.coverArts = coverArts;
        return cacheObject;
    }

    this.decompressCache = (cacheObject) => {
        // unflatten trackItems array
        let trackItems = [];
        for (let i = 0; i < cacheObject.trackItems.length; i += 4) {
            trackItems.push(cacheObject.trackItems.slice(i, i + 4));
        }

        let artists = cacheObject.artists;
        let coverArts = cacheObject.coverArts;

        cacheObject.trackItems = trackItems.map((track) => {
            if (!isNaN(track[2])) {
                track[2] = artists[track[2]];
            }

            if (track[3] !== null) {
                if (!isNaN(track[3])) {
                    track[3] = coverArts[track[3]];
                }
                track[3] = track[3].replace(/^-/, 'https://lastfm.freetls.fastly.net/i/u/64s/').replace(/-$/g, '.jpg');
            } else {
                track[3] = null;
            }

            return {
                'youtube': track[0],
                'title': track[1],
                'artist': track[2],
                'coverArt': track[3]
            };
        });

        return cacheObject;
    }

}
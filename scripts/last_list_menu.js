'use strict';

include('menu_xxx.js');

function getMetaValues(fileInfo, tagIds) {
    let values = [];

    tagIds.every((tagId) => {
        const idx = fileInfo.MetaFind(tagId);
        if (idx === -1) {
            return true;
        }

        let count = fileInfo.MetaValueCount(idx);
        for (let i = 0; i < count; i++) {
            let value = fileInfo.MetaValue(idx, i).trim();
            if (value) {
                values.push(value);
            }
        }
        return true;
    });
    // Remove duplicates
    values = [...new Set(values)];
    return values;
}

function createButtonConfig(selectionInfo, label, metaIds, funcType) {
    let values = getMetaValues(selectionInfo, metaIds);
    let config = {
        entryText: label,
        flags: MF_GRAYED
    };

    if (!values.length) {
        return config;
    }

    config.entryText += '\t' + values[0];
    config.url = buildUrl(funcType, [values[0]]);
    config.flags = MF_STRING;

    return config;
}

function buildUrl(type, meta) {
    if (meta.length == 1) {
        switch (type) {
            case 'TAG_TRACKS':
                return `https://www.last.fm/tag/${encodeURIComponent(meta[0])}/tracks`;
            case 'ARTIST_TRACKS':
                return `https://www.last.fm/music/${encodeURIComponent(meta[0])}/+tracks`;
            case 'ARTIST_RADIO':
                return `https://www.last.fm/player/station/music/${encodeURIComponent(meta[0])}`;
            case 'USER_RADIO':
                return `https://www.last.fm/player/station/user/${encodeURIComponent(meta[0])}/library`;
            case 'USER_MIX':
                return `https://www.last.fm/player/station/user/${encodeURIComponent(meta[0])}/mix`;
            case 'USER_RECOMMENDATIONS':
                return `https://www.last.fm/player/station/user/${encodeURIComponent(meta[0])}/recommended`;
            case 'USER_LIBRARY':
                return `https://www.last.fm/user/${encodeURIComponent(meta[0])}/library/tracks`;
            case 'USER_LOVED':
                return `https://www.last.fm/user/${encodeURIComponent(meta[0])}/loved`;
            default:
                return null;
        }
    }

    if (meta.length == 2) {
        switch (type) {
            case 'ALBUM_TRACKS':
                return `https://www.last.fm/music/${encodeURIComponent(meta[0])}/${encodeURIComponent(meta[1])}`;
            case 'USER_PLAYLIST':
                return `https://www.last.fm/user/${encodeURIComponent(meta[0])}/playlists/${encodeURIComponent(meta[1])}`;
            default:
                return null;
        }
    }

    return null;
}

function _lastListMenu(parent) {
    const menu = new _menu();
    // Get current selection and metadata
    menu.newEntry({ entryText: 'Search on Last.fm:', flags: MF_GRAYED });
    menu.newEntry({ entryText: 'sep' });

    let trackButtonsArgs = [
        ['Artist tracks', ['ARTIST', 'ALBUMARTIST'], 'ARTIST_TRACKS'],
        ['Genre & Style(s)', ['GENRE', 'STYLE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC'], 'TAG_TRACKS'],
        ['Folsonomy & Date(s)', ['FOLKSONOMY', 'OCCASION', 'ALBUMOCCASION', 'DATE'], 'TAG_TRACKS'],
        ['Mood & Theme(s)', ['MOOD', 'THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'], 'TAG_TRACKS'],
    ];

    // Playing track Submenu
    const currentPlaying = fb.IsPlaying ? fb.GetNowPlaying() : null;
    const currentPlayingInfo = currentPlaying ? currentPlaying.GetFileInfo() : null;
    if (currentPlayingInfo) {
        let playingSubMenu = menu.newMenu('Playing Track');
        trackButtonsArgs.forEach((args) => {
            let config = createButtonConfig(currentPlayingInfo, ...args);
            menu.newEntry(
                {
                    menuName: playingSubMenu,
                    entryText: config.entryText,
                    func: () => { parent.run(config.url) },
                    flags: config.flags
                }
            );
        });
    }

    // Selected track Submenu
    const selection = plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
    const selectionInfo = selection ? selection.GetFileInfo() : null;
    if (selectionInfo && (!currentPlaying || !selection.Compare(currentPlaying))) {
        let selectedSubMenu = menu.newMenu('Selected Track');
        trackButtonsArgs.forEach((args) => {
            let config = createButtonConfig(selectionInfo, ...args);
            menu.newEntry(
                {
                    menuName: selectedSubMenu,
                    entryText: config.entryText,
                    func: () => { parent.run(config.url) },
                    flags: config.flags
                }
            );
        });
    }



    menu.newEntry({ entryText: 'sep' });

    menu.newEntry({ entryText: 'Custom URL', func: () => { parent.run(null, null, null) } });
    let customUserSubMenu = menu.newMenu('Custom User');
    menu.newEntry({
        menuName: customUserSubMenu, entryText: 'Top Tracks', func: () => {
            try {
                let customValue = utils.InputBox(window.ID, 'Last.fm Username', 'Enter Last.fm user', '');
                if (customValue) {
                    parent.run(buildUrl('USER_LIBRARY', [customValue]));
                }
            } catch (e) {
            }
        }
    });

    menu.newEntry({
        menuName: customUserSubMenu, entryText: 'Loved Tracks', func: () => {
            try {
                let customValue = utils.InputBox(window.ID, 'Last.fm Username', 'Enter Last.fm user', '');
                if (customValue) {
                    parent.run(buildUrl('USER_LOVED', [customValue]));
                }
            } catch (e) {
            }
        }
    });

    let customArtistSubMenu = menu.newMenu('Custom Artist');
    menu.newEntry({
        menuName: customArtistSubMenu, entryText: 'Top Tracks', func: () => {
            try {
                let customValue = utils.InputBox(window.ID, 'Last.fm Artist', 'Enter Last.fm Artist', '');
                if (customValue) {
                    parent.run(buildUrl('ARTIST_TRACKS', [customValue]));
                }
            } catch (e) {
            }
        }
    });
    menu.newEntry({
        menuName: customArtistSubMenu, entryText: 'Album', func: () => {
            try {
                let customValueArtist = utils.InputBox(window.ID, 'Last.fm Artist', 'Enter Last.fm Artist', '');
                let customValueAlbum = utils.InputBox(window.ID, 'Last.fm Album', 'Enter Last.fm Album', '');
                if (customValueArtist && customValueAlbum) {
                    parent.run(buildUrl('ALBUM_TRACKS', [customValueArtist, customValueAlbum]));
                }
            } catch (e) {
            }
        }
    });

    menu.newEntry({
        entryText: 'Custom Tag', func: () => {
            try {
                let customValue = utils.InputBox(window.ID, 'Last.fm Tag', 'Enter Last.fm Tag', '');
                if (customValue) {
                    parent.run(buildUrl('TAG_TRACKS', [customValue]));
                }
            } catch (e) {
            }
        }
    });

    menu.newEntry({ entryText: 'sep' });
    let lastFMGlobalSubMenu = menu.newMenu('Last.fm Global');
    menu.newEntry({ menuName: lastFMGlobalSubMenu, entryText: 'Top tracks this year', func: () => { parent.run(buildUrl('TAG_TRACKS', [new Date().getFullYear().toString()])) } });

    menu.newEntry({
        menuName: lastFMGlobalSubMenu,
        entryText: 'Top tracks previous year', func: () => { parent.run(buildUrl('TAG_TRACKS', [(new Date().getFullYear() - 1).toString()])) }
    });

    // Last.fm Account Submenu
    let lastfm_username = window.GetProperty('lastfm_username', false);
    let lastFMAccountSubMenu;
    if (lastfm_username) {
        lastFMAccountSubMenu = menu.newMenu('Last.fm ' + lastfm_username);
        menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'My Top Tracks', func: () => { parent.run(buildUrl('USER_LIBRARY', [lastfm_username])) } });
        menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'My Loved', func: () => { parent.run(buildUrl('USER_LOVED', [lastfm_username])) } });
        menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'sep' });
    }
    menu.newEntry({
        menuName: lastfm_username ? lastFMAccountSubMenu : 'main',
        entryText: 'Set Last.fm Username', func: () => {
            try {
                lastfm_username = utils.InputBox(window.ID, 'Last.fm Username', 'Enter your Last.fm username', '');
                if (lastfm_username) {
                    window.SetProperty('lastfm_username', lastfm_username.trim());
                }
            } catch (e) {
            }
        }
    });

    return menu;
}
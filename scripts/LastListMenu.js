'use strict';

include('menu_xxx.js');
include('LastListFactory.js');
include('LastListFoobar.js');

class LastListMenu {

    static createButtonConfig(selectionInfo, label, metaIds, funcType) {
        let values = LastListFoobar.getMetaValues(selectionInfo, metaIds);
        if (!values.length) {
            return null;
        }

        let config = {
            entryText: label,
            flags: MF_GRAYED
        };

        // Add tabe if there is a label
        if (config.entryText) {
            config.entryText += '\t';
        }

        config.entryText += values[0];
        config.lastList = LastListFactory.create(funcType, [values[0]]);
        config.flags = MF_STRING;

        return config;
    }

    static getMenu() {
        const menu = new _menu();
        // Get current selection and metadata
        menu.newEntry({ entryText: 'Search on Last.fm:', flags: MF_GRAYED });
        menu.newEntry({ entryText: 'sep' });

        let trackButtonsArgs = [
            ['Artist tracks', ['ARTIST', 'ALBUMARTIST'], 'ARTIST_TRACKS'],
            ['Artist Radio', ['ARTIST', 'ALBUMARTIST'], 'ARTIST_RADIO'],
            ['Genre & Style(s)', ['GENRE', 'STYLE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC'], 'TAG_TRACKS'],
            ['Folsonomy & Date(s)', ['FOLKSONOMY', 'OCCASION', 'ALBUMOCCASION', 'DATE'], 'TAG_TRACKS'],
            ['Mood & Theme(s)', ['MOOD', 'THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'], 'TAG_TRACKS'],
        ];

        // Playing track Submenu
        const currentPlaying = fb.IsPlaying ? fb.GetNowPlaying() : null;
        const currentPlayingInfo = currentPlaying ? currentPlaying.GetFileInfo() : null;
        if (currentPlayingInfo) {
            let playingSubMenu = menu.newMenu('Playing Track');
            trackButtonsArgs.every((args) => {
                let config = LastListMenu.createButtonConfig(currentPlayingInfo, ...args);
                if (!config) {
                    return true;
                }
                menu.newEntry(
                    {
                        menuName: playingSubMenu,
                        entryText: config.entryText,
                        func: () => { config.lastList.run() },
                        flags: config.flags
                    }
                );

                return true;
            });
        }

        // Selected track Submenu
        const selection = plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
        const selectionInfo = selection ? selection.GetFileInfo() : null;
        if (selectionInfo && (!currentPlaying || !selection.Compare(currentPlaying))) {
            let selectedSubMenu = menu.newMenu('Selected Track');
            trackButtonsArgs.every((args) => {
                let config = LastListMenu.createButtonConfig(selectionInfo, ...args);
                if (!config) {
                    return true;
                }
                menu.newEntry(
                    {
                        menuName: selectedSubMenu,
                        entryText: config.entryText,
                        func: () => { config.lastList.run() },
                        flags: config.flags
                    }
                );

                return true;
            });
        }

        menu.newEntry({ entryText: 'sep' });

        menu.newEntry({ entryText: 'Custom URL', func: () => { (new LastList()).run() } });
        let customUserSubMenu = menu.newMenu('Custom User');
        menu.newEntry({
            menuName: customUserSubMenu, entryText: 'Top Tracks', func: () => {
                try {
                    let customValue = utils.InputBox(window.ID, 'Last.fm Username', 'Enter Last.fm user', '');
                    if (customValue) {
                        LastListFactory.create('USER_LIBRARY', [customValue]).run();
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
                        LastListFactory.create('USER_LOVED', [customValue]).run();
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
                        LastListFactory.create('ARTIST_TRACKS', [customValue]).run();
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
                        LastListFactory.create('ALBUM_TRACKS', [customValueArtist, customValueAlbum]).run();
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
                        LastListFactory.create('TAG_TRACKS', [customValue]).run();
                    }
                } catch (e) {
                }
            }
        });

        menu.newEntry({ entryText: 'sep' });
        let lastFMGlobalSubMenu = menu.newMenu('Last.fm Global');
        menu.newEntry({ menuName: lastFMGlobalSubMenu, entryText: 'Top tracks this year', func: () => { LastListFactory.create('TAG_TRACKS', [new Date().getFullYear().toString()]).run() } });

        menu.newEntry({
            menuName: lastFMGlobalSubMenu,
            entryText: 'Top tracks previous year', func: () => { LastListFactory.create('TAG_TRACKS', [(new Date().getFullYear() - 1).toString()]).run() }
        });

        // Last.fm Account Submenu
        let lastfm_username = window.GetProperty('lastfm_username', false);
        let lastFMAccountSubMenu;
        if (lastfm_username) {
            lastFMAccountSubMenu = menu.newMenu('Last.fm ' + lastfm_username);
            menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'My Top Tracks', func: () => { LastListFactory.create('USER_LIBRARY', [lastfm_username]).run() } });
            menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'My Loved', func: () => { LastListFactory.create('USER_LOVED', [lastfm_username]).run() } });
            menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'My Radio', func: () => { LastListFactory.create('USER_RADIO', [lastfm_username]).run() } });
            menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'My Mix', func: () => { LastListFactory.create('USER_MIX', [lastfm_username]).run() } });
            menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'My Recommended', func: () => { LastListFactory.create('USER_RECOMMENDATIONS', [lastfm_username]).run() } });
            menu.newEntry({ menuName: lastFMAccountSubMenu, entryText: 'My Neighbours', func: () => { LastListFactory.create('USER_NEIGHBOURS', [lastfm_username]).run() } });
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
}
'use strict';

include('menu_xxx.js');
include('LastListFactory.js');
include('LastListFoobar.js');

class LastListMenu {

    static createButtonConfig(selectionInfo, label, metaIdsArray, funcType) {
        // if metaIdsArray is not an array of arrays, make it one
        if (!Array.isArray(metaIdsArray[0])) {
            metaIdsArray = [metaIdsArray];
        }

        let values = [];
        metaIdsArray.every((metaIdsCollection) => {
            let metaValue = LastListFoobar.getFirstMetaValue(selectionInfo, metaIdsCollection);
            if (!metaValue) {
                values = [];
                return false;
            }

            values.push(metaValue);
            return true;
        });

        if (!values.length) {
            return null;
        }

        let config = {
            entryText: label,
        };

        // Add tabe if there is a label
        if (config.entryText) {
            config.entryText += '\t';
        }

        config.entryText += values[values.length - 1];
        config.lastList = LastListFactory.create(funcType, values);

        return config;
    }

    static getMenu() {
        let menu = new _menu();
        // Get current selection and metadata
        let trackButtonsArgs = [
            ['Artist Top', ['ARTIST', 'ALBUMARTIST'], 'ARTIST_TRACKS'],
            ['Artist Shuffle', ['ARTIST', 'ALBUMARTIST'], 'ARTIST_RADIO'],
            ['Similar Artists', ['ARTIST', 'ALBUMARTIST'], 'ARTIST_SIMILAR'],
            ['Album', [['ARTIST', 'ALBUMARTIST'], ['ALBUM']], 'ALBUM_TRACKS'],
            ['Genre & Style', ['GENRE', 'STYLE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC'], 'TAG_TRACKS'],
            ['Folsonomy & Date', ['FOLKSONOMY', 'OCCASION', 'ALBUMOCCASION', 'DATE'], 'TAG_TRACKS'],
            ['Mood & Theme', ['MOOD', 'THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'], 'TAG_TRACKS'],
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
                        flags: MF_STRING
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
                        flags: MF_STRING
                    }
                );

                return true;
            });
        }

        menu.newEntry({ entryText: 'sep' });
        menu.newEntry({ entryText: 'Custom URL', func: () => { (new LastList()).run() } });

        let customUserSubMenu = menu.newMenu('Custom User');
        menu = this.createQuestionButton(menu, customUserSubMenu, 'Top Tracks', ['Enter Last.fm user'], 'USER_LIBRARY');
        menu = this.createQuestionButton(menu, customUserSubMenu, 'Loved Tracks', ['Enter Last.fm user'], 'USER_LOVED');

        let customArtistSubMenu = menu.newMenu('Custom Artist');
        menu = this.createQuestionButton(menu, customArtistSubMenu, 'Top Tracks', ['Enter Artist'], 'ARTIST_TRACKS');
        menu = this.createQuestionButton(menu, customArtistSubMenu, 'Similar Artists', ['Enter Artist'], 'ARTIST_SIMILAR');
        menu = this.createQuestionButton(menu, customArtistSubMenu, 'Album', ['Enter Artist', 'Enter Album'], 'ALBUM_TRACKS');

        menu = this.createQuestionButton(menu, 'main', 'Custom Tag', ['Enter Last.fm Tag'], 'TAG_TRACKS');

        menu.newEntry({ entryText: 'sep' });
        let lastFMGlobalSubMenu = menu.newMenu('Last.fm Global');
        let thisYearString = new Date().getFullYear().toString();
        menu.newEntry({ menuName: lastFMGlobalSubMenu, entryText: `Top ${thisYearString}`, func: () => { LastListFactory.create('TAG_TRACKS', [thisYearString]).run() } });

        let lastYearString = (new Date().getFullYear() - 1).toString();
        menu.newEntry({ menuName: lastFMGlobalSubMenu, entryText: `Top ${lastYearString}`, func: () => { LastListFactory.create('TAG_TRACKS', [lastYearString]).run() } });

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

    static createQuestionButton(menu, submenu, label, questions, factory) {
        menu.newEntry({
            menuName: submenu, entryText: label, func: () => {
                try {
                    let answers = [];
                    questions.forEach((question) => {
                        answers.push(utils.InputBox(window.ID, question, label, ''));
                    });
                    if (answers.length !== questions.length) {
                        return;
                    }
                    LastListFactory.create(factory, answers).run();
                } catch (e) {
                }
            }
        });

        return menu;
    }
}
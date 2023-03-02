'use strict';

include('menu_xxx.js');

function _lastListMenu(parent) {
    const menu = new _menu();
    // Get current selection and metadata
    const selection = plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
    const selectionInfo = selection ? selection.GetFileInfo() : null;
    const tags = [
        { name: 'Artist(s)', tagIds: ['ARTIST', 'ALBUMARTIST'], value: [], valueSet: new Set(), type: 'ARTIST' },
        // {name: 'Title', tagIds: ['TITLE'], value: [], valueSet: new Set(), type: 'TITLE'},
        { name: 'Genre & Style(s)', tagIds: ['GENRE', 'STYLE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC'], value: [], valueSet: new Set(), type: 'TAG' },
        { name: 'Folsonomy & Date(s)', tagIds: ['FOLKSONOMY', 'OCCASION', 'ALBUMOCCASION', 'DATE'], value: [], valueSet: new Set(), type: 'TAG' },
        { name: 'Mood & Theme(s)', tagIds: ['MOOD', 'THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'], value: [], valueSet: new Set(), type: 'TAG' },
    ];

    if (selectionInfo) {
        tags.forEach((tag) => {
            tag.tagIds.forEach((tagId, i) => {
                const idx = selectionInfo.MetaFind(tagId);
                tag.value.push([]);
                if (idx !== -1) {
                    let count = selectionInfo.MetaValueCount(idx);
                    while (count--) {
                        const value = selectionInfo.MetaValue(idx, count).trim();
                        tag.value[i].push(value);
                        tag.valueSet.add(value);
                    };
                }
            });
        });
    }

    menu.newEntry({ entryText: 'Search on Last.fm:', flags: MF_GRAYED });
    menu.newEntry({ entryText: 'sep' });

    tags.forEach((tag) => {
        const bSingle = tag.valueSet.size <= 1;
        const subMenu = bSingle ? menu.getMainMenuName() : menu.newMenu('Current ' + tag.name + '...');

        if (tag.valueSet.size === 0) {
            tag.valueSet.add('');
        }

        [...tag.valueSet].sort((a, b) => a.localeCompare(b, 'en', { 'sensitivity': 'base' })).forEach((value) => {
            menu.newEntry({
                menuName: subMenu, entryText: bSingle ? 'Current ' + tag.name + '\t[' + (value || (selection ? 'no tag' : 'no selection')) + ']' : value, func: () => {
                    let url;
                    switch (tag.type) {
                        case 'TAG': {
                            url = 'https://www.last.fm/tag/' + encodeURIComponent(value.toLowerCase()) + '/tracks';
                            break;
                        }
                        case 'ARTIST': {
                            url = 'https://www.last.fm/music/' + encodeURIComponent(value.toLowerCase()) + '/+tracks?date_preset=LAST_7_DAYS';
                            break;
                        }
                        case 'TITLE': {
                            const artist = tags.find((tag) => tag.type === 'ARTIST').value[0][0] || null;
                            url = artist ? 'https://www.last.fm/music/' + encodeURIComponent(artist) + '/_/' + encodeURIComponent(value.toLowerCase()) : null;
                            break;
                        }
                    }
                    console.log('Searching at: ' + url);
                    if (url) {
                        parent.run(url);
                    }
                }, flags: value ? MF_STRING : MF_GRAYED
            });
        });
    });

    menu.newEntry({ entryText: 'sep' });

    const staticURLS = [
        // {name: 'Charts', url: 'https://www.last.fm/charts'},
        { name: 'Top tracks this year', url: 'https://www.last.fm/tag/' + new Date().getFullYear().toString() + '/tracks' },
        { name: 'Top tracks previous year', url: 'https://www.last.fm/tag/' + (new Date().getFullYear() - 1).toString() + '/tracks' }
    ];

    staticURLS.forEach((entry) => {
        menu.newEntry({
            entryText: entry.name, func: () => {
                parent.run(entry.url);
            }
        });
    })

    menu.newEntry({ entryText: 'sep' });

    menu.newEntry({
        entryText: 'By url', func: () => {
            parent.run(null, null, null);
        }
    });

    return menu;
}
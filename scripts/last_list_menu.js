'use strict';
//02/03/23

include('..\\..\\helpers\\menu_xxx.js');

function _lastListMenu(parent) {
	const menu = new _menu();
	// Get current selection and metadata
	const sel = plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
	const info = sel ? sel.GetFileInfo() : null;
	const tags = [
		{name: 'Artist(s)',tf: ['ARTIST', 'ALBUMARTIST'], val: [], valSet: new Set(), type: 'ARTIST'},
		// {name: 'Title', tf: ['TITLE'], val: [], valSet: new Set(), type: 'TITLE'},
		{name: 'Genre & Style(s)', tf: ['GENRE', 'STYLE', 'ARTIST GENRE LAST.FM', 'ARTIST GENRE ALLMUSIC'], val: [], valSet: new Set(), type: 'TAG'},
		{name: 'Folsonomy & Date(s)', tf: ['FOLKSONOMY', 'OCCASION','ALBUMOCCASION','DATE'], val: [], valSet: new Set(), type: 'TAG'},
		{name: 'Mood & Theme(s)', tf: ['MOOD','THEME', 'ALBUMMOOD', 'ALBUM THEME ALLMUSIC', 'ALBUM MOOD ALLMUSIC'], val: [], valSet: new Set(), type: 'TAG'},
	];
	if (info) {
		tags.forEach((tag) => {
			tag.tf.forEach((tf, i) => {
				const idx = info.MetaFind(tf);
				tag.val.push([]);
				if (idx !== -1) {
					let count = info.MetaValueCount(idx);
					while (count--) {
						const val = info.MetaValue(idx, count).trim();
						tag.val[i].push(val);
						tag.valSet.add(val);
					};
				}
			});
		});
	}
	
	menu.newEntry({entryText: 'Search on Last.fm:', flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	
	tags.forEach((tag) => {
		const bSingle = tag.valSet.size <= 1;
		const subMenu = bSingle ? menu.getMainMenuName() : menu.newMenu('Current ' + tag.name + '...');
		if (tag.valSet.size === 0) {tag.valSet.add('');}
		[...tag.valSet].sort((a,b) => a.localeCompare(b, 'en', {'sensitivity': 'base'})).forEach((val) => {
			menu.newEntry({menuName: subMenu, entryText: bSingle ? 'Current ' + tag.name + '\t[' + (val || (sel ? 'no tag' : 'no sel')) + ']' : val, func: () => {
				let url;
				switch (tag.type) {
					case 'TAG': {
						url = 'https://www.last.fm/tag/' + encodeURIComponent(val.toLowerCase()) + '/tracks';
						break;
					}
					case 'ARTIST': {
						url = 'https://www.last.fm/music/' + encodeURIComponent(val.toLowerCase()) + '/+tracks?date_preset=LAST_7_DAYS';
						break;
					}
					case 'TITLE': {
						const artist = tags.find((tag) => tag.type === 'ARTIST').val[0][0] || null;
						url = artist ? 'https://www.last.fm/music/' + encodeURIComponent(artist) + '/_/' + encodeURIComponent(val.toLowerCase()) : null;
						break;
					}
				}
				console.log('Searching at: ' + url);
				if (url) {parent.run(url);}
			}, flags: val ? MF_STRING : MF_GRAYED});
		});
	});
	
	menu.newEntry({entryText: 'sep'});
	
	const staticURLS = [
		// {name: 'Charts', url: 'https://www.last.fm/charts'},
		{name: 'Top tracks this year', url: 'https://www.last.fm/tag/' + new Date().getFullYear().toString() +'/tracks'},
		{name: 'Top tracks previous year', url: 'https://www.last.fm/tag/' + (new Date().getFullYear() - 1).toString() +'/tracks'}
	];
	staticURLS.forEach((entry) => {
		menu.newEntry({entryText: entry.name, func: () => {
			parent.run(entry.url);
		}});
	})
	
	menu.newEntry({entryText: 'sep'});
	
	menu.newEntry({entryText: 'By url', func: () => {
		parent.run(null, null, null);
	}});
	
	return menu;
}
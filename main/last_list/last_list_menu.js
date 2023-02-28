'use strict';
//28/02/23

include('..\\..\\helpers\\menu_xxx.js');

function _lastListMenu(parent) {
	const menu = new _menu();
	// Get current selection and metadata
	const sel = plman.ActivePlaylist !== -1 ? fb.GetFocusItem(true) : null;
	const info = sel ? sel.GetFileInfo() : null;
	const tags = [
		{tf: 'ARTIST', val: ''},
		{tf: 'TITLE', val: ''},
		{tf: 'GENRE', val: ''},
		{tf: 'STYLE', val: ''},
		{tf: 'FOLKSONOMY', val: ''},
	];
	if (info) {
		tags.forEach((tag) => {
			const idx = info.MetaFind(tag.tf);
			tag.val =  idx !== -1 ? info.MetaValue(idx, 0).trim() : '';
		});
	}
	
	menu.newEntry({entryText: 'Search on Last.fm:', flags: MF_GRAYED});
	menu.newEntry({entryText: 'sep'});
	
	tags.forEach((tag) => {
		menu.newEntry({entryText: 'Current ' + tag.tf.toLowerCase() + '\t[' + (tag.val || 'no sel') + ']', func: () => {
			let url = '';
			switch (tag.tf) {
				case 'STYLE':
				case 'FOLKSONOMY':
				case 'GENRE': {
					url = 'https://www.last.fm/tag/' + encodeURIComponent(tag.val.toLowerCase()) + '/tracks';
					break;
				}
				case 'ARTIST': {
					url = 'https://www.last.fm/music/' + encodeURIComponent(tag.val.toLowerCase()) + '/+tracks?date_preset=LAST_7_DAYS';
					break;
				}
				case 'TITLE': {
					const artist = tags.find((tag) => tag.tf === 'ARTIST').val;
					url = 'https://www.last.fm/music/' + encodeURIComponent(artist) + '/_/' + encodeURIComponent(tag.val.toLowerCase());
					break;
				}
			}
			console.log('Searching at: ' + url);
			parent.run(url);
		}, flags: tag.val ? MF_STRING : MF_GRAYED})
	});
	
	menu.newEntry({entryText: 'sep'});
	
	menu.newEntry({entryText: 'By url', func: () => {
		parent.run(null, null, null);
	}});
	
	return menu;
}
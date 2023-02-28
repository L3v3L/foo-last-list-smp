'use strict';
//28/02/23

/* 
	Integrates Last.fm recommendations statistics within foobar2000 library.
*/

include('..\\helpers\\helpers_xxx.js');
include('..\\helpers\\buttons_xxx.js');
include('..\\helpers\\helpers_xxx_properties.js');
include('..\\main\\last_list\\last_list.js');
var prefix = 'lfm';

try {window.DefineScript('Last.f, List Button', {author:'xxx', features: {drag_n_drop: false}});} catch (e) {/* console.log('Last.fm List Button loaded.'); */} //May be loaded along other buttons
prefix = getUniquePrefix(prefix, ''); // Puts new ID before '_'

var newButtonsProperties = { //You can simply add new properties here
};
// setProperties(newButtonsProperties, prefix, 0); //This sets all the panel properties at once
// newButtonsProperties = getPropertiesPairs(newButtonsProperties, prefix, 0);
buttonsBar.list.push(newButtonsProperties);

const lastList = new _lastList();

addButton({
	'Last.fm List': new themedButton({x: 0, y: 0, w: _gr.CalcTextWidth('Last.fm List', _gdiFont(globFonts.button.name, globFonts.button.size * buttonsBar.config.scale)) + 25 * _scale(1, false) / _scale(buttonsBar.config.scale), h: 22}, 'Last.fm List', function (mask) {
		lastList.run();
	}, null, void(0), (parent) => {
		const bShift = utils.IsKeyPressed(VK_SHIFT);
		const bInfo = typeof menu_panelProperties === 'undefined' || menu_panelProperties.bTooltipInfo[1];
		let info = 'Last List:';
		if (bShift || bInfo) {
			info += '\n-----------------------------------------------------';
			info += '\n(Shift + L. Click to open config menu)';
		}
		return info;
	}, prefix, newButtonsProperties, folders.xxx + 'images\\icons\\lastfm_64.png', null),
});
'use strict';

include('scripts\\last_list.js');
include('scripts\\button.js');
include('scripts\\last_list_menu.js');

// check if cache folder exists and create it if not
try {
    let cachePath = fb.ProfilePath + "LastListCache\\";
    if (!utils.IsDirectory(cachePath)) {
        let fso = new ActiveXObject('Scripting.FileSystemObject');
        fso.CreateFolder(cachePath);
    }
} catch (e) {
    console.log(e);
}

// show notice to user
let messageTimeStamp = 1677757460;
if (!utils.CheckComponent('foo_youtube', true) && window.GetProperty('show_popup', false) != messageTimeStamp) {
    fb.ShowPopupMessage(`
Want to play tracks missing in your library?

Install foo_youtube component:
https://www.foobar2000.org/components/view/foo_youtube
`, 'Last List');
    window.SetProperty('show_popup', messageTimeStamp);
}

const lastList = new _lastList();

// Button
const buttons = {
    LastListButton: new columnButton(buttonTemplate, 0, "Last List", function () {
        _lastListMenu(lastList).btn_up(this.x, this.y + this.h)
    }),
};
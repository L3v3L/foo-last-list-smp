'use strict';

include('scripts\\last_list.js');
include('scripts\\button.js');

const lastList = new _lastList();

// Button
const buttons = {
    LastListButton: new columnButton(buttonTemplate, 0, "Last List", function () {
        lastList.run(null, null, null);
    }),
};
'use strict';

include('main\\last_list\\last_list.js');
include('main\\last_list\\last_list_button.js');

window.DefineScript("Last List",
    {
        author: "Ivo Barros",
        version: "0.3",
    });

const lastList = new _lastList();

// Button
const buttons = {
    LastListButton: new columnButton(buttonTemplate, 0, "Last List", function () {
        lastList.run();
    }),
};


// Callbacks
let g_down = false;
let cur_btn = null;

function on_paint(gr) {
    gr.FillSolidRect(0, 0, window.Width, window.Height, utils.GetSysColour(15));
    drawAllButtons(gr);
}

function on_mouse_move(x, y) {
    let old = cur_btn;
    cur_btn = chooseButton(x, y);

    if (old === cur_btn) {
        if (g_down) {
            return;
        }
    } else if (g_down && cur_btn && cur_btn.state !== ButtonStates.down) {
        cur_btn.changeState(ButtonStates.down);
        window.Repaint();
        return;
    }

    old && old.changeState(ButtonStates.normal);
    cur_btn && cur_btn.changeState(ButtonStates.hover);
    window.Repaint();
}

function on_mouse_leave() {
    g_down = false;

    if (cur_btn) {
        cur_btn.changeState(ButtonStates.normal);
        window.Repaint();
    }
}

function on_mouse_lbtn_down(x, y) {
    g_down = true;

    if (cur_btn) {
        cur_btn.changeState(ButtonStates.down);
        window.Repaint();
    }
}

function on_mouse_lbtn_up(x, y) {
    g_down = false;

    if (cur_btn) {
        cur_btn.onClick();
        cur_btn.changeState(ButtonStates.hover);
        window.Repaint();
    }
}
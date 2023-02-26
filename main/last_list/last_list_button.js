'use strict';

include(fb.ComponentPath + 'docs\\Flags.js');
include(fb.ComponentPath + 'docs\\Helpers.js');

const g_theme = window.CreateThemeManager("Button");
const g_font = gdi.Font("Segoe UI", 12);
const ButtonStates = {
    normal: 0,
    hover: 1,
    down: 2,
    hide: 3,
};

let buttonTemplate = {
    x: 5,
    y: 5,
    w: 60,
    h: 26,
    rowSize: 35,
};

function columnButton(buttonTemplate, row, text, fonClick, state) {
    return new SimpleButton(
        buttonTemplate["x"],
        buttonTemplate["y"] + row * buttonTemplate["rowSize"],
        buttonTemplate["w"],
        buttonTemplate["h"],
        text,
        fonClick,
        state
    );
}

function SimpleButton(x, y, w, h, text, fonClick, state) {
    this.state = state ? state : ButtonStates.normal;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.text = text;
    this.fonClick = fonClick;

    this.containXY = function (x, y) {
        return (
            this.x <= x && x <= this.x + this.w && this.y <= y && y <= this.y + this.h
        );
    };

    this.changeState = function (state) {
        let old = this.state;
        this.state = state;
        return old;
    };

    this.draw = function (gr) {
        if (this.state === ButtonStates.hide) {
            return;
        }

        switch (this.state) {
            case ButtonStates.normal:
                g_theme.SetPartAndStateID(1, 1);
                break;

            case ButtonStates.hover:
                g_theme.SetPartAndStateID(1, 2);
                break;

            case ButtonStates.down:
                g_theme.SetPartAndStateID(1, 3);
                break;

            case ButtonStates.hide:
                return;
        }

        g_theme.DrawThemeBackground(gr, this.x, this.y, this.w, this.h);
        gr.GdiDrawText(
            this.text,
            g_font,
            RGB(0, 0, 0),
            this.x,
            this.y,
            this.w,
            this.h,
            DT_CENTER | DT_VCENTER | DT_CALCRECT | DT_NOPREFIX
        );
    };

    this.onClick = function () {
        this.fonClick && this.fonClick();
    };
}

function drawAllButtons(gr) {
    for (let i in buttons) {
        buttons[i].draw(gr);
    }
}

function chooseButton(x, y) {
    for (let i in buttons) {
        if (buttons[i].containXY(x, y) && buttons[i].state !== ButtonStates.hide) {
            return buttons[i];
        }
    }

    return null;
}
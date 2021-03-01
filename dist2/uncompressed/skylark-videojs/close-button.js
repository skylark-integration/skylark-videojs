define([
    './button',
    './component',
    './utils/keycode'
], function (Button, Component, keycode) {
    'use strict';
    class CloseButton extends Button {
        constructor(player, options) {
            super(player, options);
            this.controlText(options && options.controlText || this.localize('Close'));
        }
        buildCSSClass() {
            return `vjs-close-button ${ super.buildCSSClass() }`;
        }
        handleClick(event) {
            this.trigger({
                type: 'close',
                bubbles: false
            });
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Esc')) {
                event.preventDefault();
                event.stopPropagation();
                this.trigger('click');
            } else {
                super.handleKeyDown(event);
            }
        }
    }
    Component.registerComponent('CloseButton', CloseButton);
    return CloseButton;
});
define([
    '../menu/menu-button',
    '../component',
    '../utils/fn'
], function (MenuButton, Component, Fn) {
    'use strict';
    class TrackButton extends MenuButton {
        constructor(player, options) {
            const tracks = options.tracks;
            super(player, options);
            if (this.items.length <= 1) {
                this.hide();
            }
            if (!tracks) {
                return;
            }
            const updateHandler = Fn.bind(this, this.update);
            tracks.addEventListener('removetrack', updateHandler);
            tracks.addEventListener('addtrack', updateHandler);
            tracks.addEventListener('labelchange', updateHandler);
            this.player_.on('ready', updateHandler);
            this.player_.on('dispose', function () {
                tracks.removeEventListener('removetrack', updateHandler);
                tracks.removeEventListener('addtrack', updateHandler);
                tracks.removeEventListener('labelchange', updateHandler);
            });
        }
    }
    Component.registerComponent('TrackButton', TrackButton);
    return TrackButton;
});
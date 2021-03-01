define([
    './text-track-menu-item',
    '../../component'
], function (TextTrackMenuItem, Component) {
    'use strict';
    class CaptionSettingsMenuItem extends TextTrackMenuItem {
        constructor(player, options) {
            options.track = {
                player,
                kind: options.kind,
                label: options.kind + ' settings',
                selectable: false,
                default: false,
                mode: 'disabled'
            };
            options.selectable = false;
            options.name = 'CaptionSettingsMenuItem';
            super(player, options);
            this.addClass('vjs-texttrack-settings');
            this.controlText(', opens ' + options.kind + ' settings dialog');
        }
        handleClick(event) {
            this.player().getChild('textTrackSettings').open();
        }
    }
    Component.registerComponent('CaptionSettingsMenuItem', CaptionSettingsMenuItem);
    return CaptionSettingsMenuItem;
});
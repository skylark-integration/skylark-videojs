define([
    '../../menu/menu-item',
    '../../component',
    '../../utils/fn'
], function (MenuItem, Component, Fn) {
    'use strict';
    class ChaptersTrackMenuItem extends MenuItem {
        constructor(player, options) {
            const track = options.track;
            const cue = options.cue;
            const currentTime = player.currentTime();
            options.selectable = true;
            options.multiSelectable = false;
            options.label = cue.text;
            options.selected = cue.startTime <= currentTime && currentTime < cue.endTime;
            super(player, options);
            this.track = track;
            this.cue = cue;
            track.addEventListener('cuechange', Fn.bind(this, this.update));
        }
        handleClick(event) {
            super.handleClick();
            this.player_.currentTime(this.cue.startTime);
            this.update(this.cue.startTime);
        }
        update(event) {
            const cue = this.cue;
            const currentTime = this.player_.currentTime();
            this.selected(cue.startTime <= currentTime && currentTime < cue.endTime);
        }
    }
    Component.registerComponent('ChaptersTrackMenuItem', ChaptersTrackMenuItem);
    return ChaptersTrackMenuItem;
});
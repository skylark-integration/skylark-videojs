define([
    '../../menu/menu-item',
    '../../component'
], function (MenuItem, Component) {
    'use strict';
    class PlaybackRateMenuItem extends MenuItem {
        constructor(player, options) {
            const label = options.rate;
            const rate = parseFloat(label, 10);
            options.label = label;
            options.selected = rate === 1;
            options.selectable = true;
            options.multiSelectable = false;
            super(player, options);
            this.label = label;
            this.rate = rate;
            this.on(player, 'ratechange', this.update);
        }
        handleClick(event) {
            super.handleClick();
            this.player().playbackRate(this.rate);
        }
        update(event) {
            this.selected(this.player().playbackRate() === this.rate);
        }
    }
    PlaybackRateMenuItem.prototype.contentElType = 'button';
    Component.registerComponent('PlaybackRateMenuItem', PlaybackRateMenuItem);
    return PlaybackRateMenuItem;
});
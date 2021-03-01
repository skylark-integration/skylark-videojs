define([
    '../track-button',
    '../../component',
    './text-track-menu-item',
    './off-text-track-menu-item'
], function (TrackButton, Component, TextTrackMenuItem, OffTextTrackMenuItem) {
    'use strict';
    class TextTrackButton extends TrackButton {
        constructor(player, options = {}) {
            options.tracks = player.textTracks();
            super(player, options);
        }
        createItems(items = [], TrackMenuItem = TextTrackMenuItem) {
            let label;
            if (this.label_) {
                label = `${ this.label_ } off`;
            }
            items.push(new OffTextTrackMenuItem(this.player_, {
                kinds: this.kinds_,
                kind: this.kind_,
                label
            }));
            this.hideThreshold_ += 1;
            const tracks = this.player_.textTracks();
            if (!Array.isArray(this.kinds_)) {
                this.kinds_ = [this.kind_];
            }
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                if (this.kinds_.indexOf(track.kind) > -1) {
                    const item = new TrackMenuItem(this.player_, {
                        track,
                        kinds: this.kinds_,
                        kind: this.kind_,
                        selectable: true,
                        multiSelectable: false
                    });
                    item.addClass(`vjs-${ track.kind }-menu-item`);
                    items.push(item);
                }
            }
            return items;
        }
    }
    Component.registerComponent('TextTrackButton', TextTrackButton);
    return TextTrackButton;
});
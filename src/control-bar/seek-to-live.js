define([
    '../button',
    '../component',
    '../utils/dom'
], function (Button, Component, Dom) {
    'use strict';
    class SeekToLive extends Button {
        constructor(player, options) {
            super(player, options);
            this.updateLiveEdgeStatus();
            if (this.player_.liveTracker) {
                this.listenTo(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatus);
            }
        }
        createEl() {
            const el = super.createEl('button', { className: 'vjs-seek-to-live-control vjs-control' });
            this.textEl_ = Dom.createEl('span', {
                className: 'vjs-seek-to-live-text',
                innerHTML: this.localize('LIVE')
            }, { 'aria-hidden': 'true' });
            el.appendChild(this.textEl_);
            return el;
        }
        updateLiveEdgeStatus() {
            if (!this.player_.liveTracker || this.player_.liveTracker.atLiveEdge()) {
                this.setAttribute('aria-disabled', true);
                this.addClass('vjs-at-live-edge');
                this.controlText('Seek to live, currently playing live');
            } else {
                this.setAttribute('aria-disabled', false);
                this.removeClass('vjs-at-live-edge');
                this.controlText('Seek to live, currently behind live');
            }
        }
        handleClick() {
            this.player_.liveTracker.seekToLiveEdge();
        }
        dispose() {
            if (this.player_.liveTracker) {
                this.unlistenTo(this.player_.liveTracker, 'liveedgechange', this.updateLiveEdgeStatus);
            }
            this.textEl_ = null;
            super.dispose();
        }
    }
    SeekToLive.prototype.controlText_ = 'Seek to live, currently playing live';
    Component.registerComponent('SeekToLive', SeekToLive);
    return SeekToLive;
});
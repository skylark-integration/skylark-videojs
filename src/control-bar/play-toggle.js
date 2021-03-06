define([
    '../button',
    '../component'
], function (Button, Component) {
    'use strict';
    class PlayToggle extends Button {
        constructor(player, options = {}) {
            super(player, options);
            options.replay = options.replay === undefined || options.replay;
            this.listenTo(player, 'play', this.handlePlay);
            this.listenTo(player, 'pause', this.handlePause);
            if (options.replay) {
                this.listenTo(player, 'ended', this.handleEnded);
            }
        }
        buildCSSClass() {
            return `vjs-play-control ${ super.buildCSSClass() }`;
        }
        handleClick(event) {
            if (this.player_.paused()) {
                this.player_.play();
            } else {
                this.player_.pause();
            }
        }
        handleSeeked(event) {
            this.removeClass('vjs-ended');
            if (this.player_.paused()) {
                this.handlePause(event);
            } else {
                this.handlePlay(event);
            }
        }
        handlePlay(event) {
            this.removeClass('vjs-ended');
            this.removeClass('vjs-paused');
            this.addClass('vjs-playing');
            this.controlText('Pause');
        }
        handlePause(event) {
            this.removeClass('vjs-playing');
            this.addClass('vjs-paused');
            this.controlText('Play');
        }
        handleEnded(event) {
            this.removeClass('vjs-playing');
            this.addClass('vjs-ended');
            this.controlText('Replay');
            this.listenToOnce(this.player_, 'seeked', this.handleSeeked);
        }
    }
    PlayToggle.prototype.controlText_ = 'Play';
    Component.registerComponent('PlayToggle', PlayToggle);
    return PlayToggle;
});
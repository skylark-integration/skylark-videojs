define([
    './button',
    './component',
    './utils/promise',
    './utils/browser'
], function (Button, Component, promise, browser) {
    'use strict';
    class BigPlayButton extends Button {
        constructor(player, options) {
            super(player, options);
            this.mouseused_ = false;
            this.listenTo('mousedown', this.handleMouseDown);
        }
        buildCSSClass() {
            return 'vjs-big-play-button';
        }
        handleClick(event) {
            const playPromise = this.player_.play();
            if (this.mouseused_ && event.clientX && event.clientY) {
                const sourceIsEncrypted = this.player_.usingPlugin('eme') && this.player_.eme.sessions && this.player_.eme.sessions.length > 0;
                promise.silencePromise(playPromise);
                if (this.player_.tech(true) && !((browser.IE_VERSION || browser.IS_EDGE) && sourceIsEncrypted)) {
                    this.player_.tech(true).focus();
                }
                return;
            }
            const cb = this.player_.getChild('controlBar');
            const playToggle = cb && cb.getChild('playToggle');
            if (!playToggle) {
                this.player_.tech(true).focus();
                return;
            }
            const playFocus = () => playToggle.focus();
            if (promise.isPromise(playPromise)) {
                playPromise.then(playFocus, () => {
                });
            } else {
                this.setTimeout(playFocus, 1);
            }
        }
        handleKeyDown(event) {
            this.mouseused_ = false;
            super.handleKeyDown(event);
        }
        handleMouseDown(event) {
            this.mouseused_ = true;
        }
    }
    BigPlayButton.prototype.controlText_ = 'Play Video';
    Component.registerComponent('BigPlayButton', BigPlayButton);
    return BigPlayButton;
});
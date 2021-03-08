define([
    './clickable-component',
    './component',
    './utils/fn',
    './utils/dom',
    './utils/promise',
    './utils/browser'
], function (ClickableComponent, Component, Fn, Dom, promise, browser) {
    'use strict';
    class PosterImage extends ClickableComponent {
        constructor(player, options) {
            super(player, options);
            this.update();
            this.listenTo(player,'posterchange',this.update);
        }
        dispose() {
            this.unlistenTo(this.player(),'posterchange', this.update);
            super.dispose();
        }
        createEl() {
            const el = Dom.createEl('div', {
                className: 'vjs-poster',
                tabIndex: -1
            });
            return el;
        }
        update(event) {
            const url = this.player().poster();
            this.setSrc(url);
            if (url) {
                this.show();
            } else {
                this.hide();
            }
        }
        setSrc(url) {
            let backgroundImage = '';
            if (url) {
                backgroundImage = `url("${ url }")`;
            }
            this.el_.style.backgroundImage = backgroundImage;
        }
        handleClick(event) {
            if (!this.player_.controls()) {
                return;
            }
            const sourceIsEncrypted = this.player_.usingPlugin('eme') && this.player_.eme.sessions && this.player_.eme.sessions.length > 0;
            if (this.player_.tech(true) && !((browser.IE_VERSION || browser.IS_EDGE) && sourceIsEncrypted)) {
                this.player_.tech(true).focus();
            }
            if (this.player_.paused()) {
                promise.silencePromise(this.player_.play());
            } else {
                this.player_.pause();
            }
        }
    }
    Component.registerComponent('PosterImage', PosterImage);
    return PosterImage;
});
define([
    '../component',
    '../utils/dom'
], function (Component, Dom) {
    'use strict';
    class LiveDisplay extends Component {
        constructor(player, options) {
            super(player, options);
            this.updateShowing();
            this.listenTo(this.player(), 'durationchange', this.updateShowing);
        }
        createEl() {
            const el = super.createEl('div', { className: 'vjs-live-control vjs-control' });
            this.contentEl_ = Dom.createEl('div', {
                className: 'vjs-live-display',
                innerHTML: `<span class="vjs-control-text">${ this.localize('Stream Type') }\u00a0</span>${ this.localize('LIVE') }`
            }, { 'aria-live': 'off' });
            el.appendChild(this.contentEl_);
            return el;
        }
        dispose() {
            this.contentEl_ = null;
            super.dispose();
        }
        updateShowing(event) {
            if (this.player().duration() === Infinity) {
                this.show();
            } else {
                this.hide();
            }
        }
    }
    Component.registerComponent('LiveDisplay', LiveDisplay);
    return LiveDisplay;
});
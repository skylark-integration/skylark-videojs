define([
    './component',
    './utils/dom'
], function (Component, dom) {
    'use strict';
    class LoadingSpinner extends Component {
        createEl() {
            const isAudio = this.player_.isAudio();
            const playerType = this.localize(isAudio ? 'Audio Player' : 'Video Player');
            const controlText = dom.createEl('span', {
                className: 'vjs-control-text',
                innerHTML: this.localize('{1} is loading.', [playerType])
            });
            const el = super.createEl('div', {
                className: 'vjs-loading-spinner',
                dir: 'ltr'
            });
            el.appendChild(controlText);
            return el;
        }
    }
    Component.registerComponent('LoadingSpinner', LoadingSpinner);
    return LoadingSpinner;
});
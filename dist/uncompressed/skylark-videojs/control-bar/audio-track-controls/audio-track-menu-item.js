define([
    '../../menu/menu-item',
    '../../component',
    '../../utils/obj'
], function (MenuItem, Component, obj) {
    'use strict';
    class AudioTrackMenuItem extends MenuItem {
        constructor(player, options) {
            const track = options.track;
            const tracks = player.audioTracks();
            options.label = track.label || track.language || 'Unknown';
            options.selected = track.enabled;
            super(player, options);
            this.track = track;
            this.addClass(`vjs-${ track.kind }-menu-item`);
            const changeHandler = (...args) => {
                this.handleTracksChange.apply(this, args);
            };
            tracks.addEventListener('change', changeHandler);
            this.listenTo('dispose', () => {
                tracks.removeEventListener('change', changeHandler);
            });
        }
        createEl(type, props, attrs) {
            let innerHTML = `<span class="vjs-menu-item-text">${ this.localize(this.options_.label) }`;
            if (this.options_.track.kind === 'main-desc') {
                innerHTML += `
        <span aria-hidden="true" class="vjs-icon-placeholder"></span>
        <span class="vjs-control-text"> ${ this.localize('Descriptions') }</span>
      `;
            }
            innerHTML += '</span>';
            const el = super.createEl(type, obj.assign({ innerHTML }, props), attrs);
            return el;
        }
        handleClick(event) {
            const tracks = this.player_.audioTracks();
            super.handleClick(event);
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                track.enabled = track === this.track;
            }
        }
        handleTracksChange(event) {
            this.selected(this.track.enabled);
        }
    }
    Component.registerComponent('AudioTrackMenuItem', AudioTrackMenuItem);
    return AudioTrackMenuItem;
});
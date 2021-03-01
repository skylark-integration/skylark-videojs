define([
    './text-track-menu-item',
    '../../component',
    '../../utils/obj'
], function (TextTrackMenuItem, Component, obj) {
    'use strict';
    class SubsCapsMenuItem extends TextTrackMenuItem {
        createEl(type, props, attrs) {
            let innerHTML = `<span class="vjs-menu-item-text">${ this.localize(this.options_.label) }`;
            if (this.options_.track.kind === 'captions') {
                innerHTML += `
        <span aria-hidden="true" class="vjs-icon-placeholder"></span>
        <span class="vjs-control-text"> ${ this.localize('Captions') }</span>
      `;
            }
            innerHTML += '</span>';
            const el = super.createEl(type, obj.assign({ innerHTML }, props), attrs);
            return el;
        }
    }
    Component.registerComponent('SubsCapsMenuItem', SubsCapsMenuItem);
    return SubsCapsMenuItem;
});
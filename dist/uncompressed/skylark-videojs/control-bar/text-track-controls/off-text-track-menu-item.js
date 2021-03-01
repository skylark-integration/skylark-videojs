define([
    './text-track-menu-item',
    '../../component'
], function (TextTrackMenuItem, Component) {
    'use strict';
    class OffTextTrackMenuItem extends TextTrackMenuItem {
        constructor(player, options) {
            options.track = {
                player,
                kind: options.kind,
                kinds: options.kinds,
                default: false,
                mode: 'disabled'
            };
            if (!options.kinds) {
                options.kinds = [options.kind];
            }
            if (options.label) {
                options.track.label = options.label;
            } else {
                options.track.label = options.kinds.join(' and ') + ' off';
            }
            options.selectable = true;
            options.multiSelectable = false;
            super(player, options);
        }
        handleTracksChange(event) {
            const tracks = this.player().textTracks();
            let shouldBeSelected = true;
            for (let i = 0, l = tracks.length; i < l; i++) {
                const track = tracks[i];
                if (this.options_.kinds.indexOf(track.kind) > -1 && track.mode === 'showing') {
                    shouldBeSelected = false;
                    break;
                }
            }
            if (shouldBeSelected !== this.isSelected_) {
                this.selected(shouldBeSelected);
            }
        }
        handleSelectedLanguageChange(event) {
            const tracks = this.player().textTracks();
            let allHidden = true;
            for (let i = 0, l = tracks.length; i < l; i++) {
                const track = tracks[i];
                if ([
                        'captions',
                        'descriptions',
                        'subtitles'
                    ].indexOf(track.kind) > -1 && track.mode === 'showing') {
                    allHidden = false;
                    break;
                }
            }
            if (allHidden) {
                this.player_.cache_.selectedLanguage = { enabled: false };
            }
        }
    }
    Component.registerComponent('OffTextTrackMenuItem', OffTextTrackMenuItem);
    return OffTextTrackMenuItem;
});
define([
    'skylark-langx-globals/document',
    '../../menu/menu-item',
    '../../component'
], function (document,MenuItem, Component) {
    'use strict';
    class TextTrackMenuItem extends MenuItem {
        constructor(player, options) {
            const track = options.track;
            const tracks = player.textTracks();
            options.label = track.label || track.language || 'Unknown';
            options.selected = track.mode === 'showing';
            super(player, options);
            this.track = track;
            this.kinds = (options.kinds || [options.kind || this.track.kind]).filter(Boolean);
            const changeHandler = (...args) => {
                this.handleTracksChange.apply(this, args);
            };
            const selectedLanguageChangeHandler = (...args) => {
                this.handleSelectedLanguageChange.apply(this, args);
            };
            player.on([
                'loadstart',
                'texttrackchange'
            ], changeHandler);
            tracks.addEventListener('change', changeHandler);
            tracks.addEventListener('selectedlanguagechange', selectedLanguageChangeHandler);
            this.on('dispose', function () {
                player.off([
                    'loadstart',
                    'texttrackchange'
                ], changeHandler);
                tracks.removeEventListener('change', changeHandler);
                tracks.removeEventListener('selectedlanguagechange', selectedLanguageChangeHandler);
            });
            if (tracks.onchange === undefined) {
                let event;
                this.on([
                    'tap',
                    'click'
                ], function () {
                    if (typeof window.Event !== 'object') {
                        try {
                            event = new window.Event('change');
                        } catch (err) {
                        }
                    }
                    if (!event) {
                        event = document.createEvent('Event');
                        event.initEvent('change', true, true);
                    }
                    tracks.dispatchEvent(event);
                });
            }
            this.handleTracksChange();
        }
        handleClick(event) {
            const referenceTrack = this.track;
            const tracks = this.player_.textTracks();
            super.handleClick(event);
            if (!tracks) {
                return;
            }
            for (let i = 0; i < tracks.length; i++) {
                const track = tracks[i];
                if (this.kinds.indexOf(track.kind) === -1) {
                    continue;
                }
                if (track === referenceTrack) {
                    if (track.mode !== 'showing') {
                        track.mode = 'showing';
                    }
                } else if (track.mode !== 'disabled') {
                    track.mode = 'disabled';
                }
            }
        }
        handleTracksChange(event) {
            const shouldBeSelected = this.track.mode === 'showing';
            if (shouldBeSelected !== this.isSelected_) {
                this.selected(shouldBeSelected);
            }
        }
        handleSelectedLanguageChange(event) {
            if (this.track.mode === 'showing') {
                const selectedLanguage = this.player_.cache_.selectedLanguage;
                if (selectedLanguage && selectedLanguage.enabled && selectedLanguage.language === this.track.language && selectedLanguage.kind !== this.track.kind) {
                    return;
                }
                this.player_.cache_.selectedLanguage = {
                    enabled: true,
                    language: this.track.language,
                    kind: this.track.kind
                };
            }
        }
        dispose() {
            this.track = null;
            super.dispose();
        }
    }
    Component.registerComponent('TextTrackMenuItem', TextTrackMenuItem);
    return TextTrackMenuItem;
});
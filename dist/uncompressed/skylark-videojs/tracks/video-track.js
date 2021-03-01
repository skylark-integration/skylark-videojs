define([
    './track-enums',
    './track',
    '../utils/merge-options'
], function (TrackEnums, Track, merge) {
    'use strict';
    class VideoTrack extends Track {
        constructor(options = {}) {
            const settings = merge(options, { kind: TrackEnums.VideoTrackKind[options.kind] || '' });
            super(settings);
            let selected = false;
            Object.defineProperty(this, 'selected', {
                get() {
                    return selected;
                },
                set(newSelected) {
                    if (typeof newSelected !== 'boolean' || newSelected === selected) {
                        return;
                    }
                    selected = newSelected;
                    this.trigger('selectedchange');
                }
            });
            if (settings.selected) {
                this.selected = settings.selected;
            }
        }
    }
    return VideoTrack;
});
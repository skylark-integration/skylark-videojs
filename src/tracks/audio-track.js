define([
    './track-enums',
    './track',
    '../utils/merge-options'
], function (TrackEnums, Track, merge) {
    'use strict';
    class AudioTrack extends Track {
        constructor(options = {}) {
            const settings = merge(options, { kind: TrackEnums.AudioTrackKind[options.kind] || '' });
            super(settings);
            let enabled = false;
            Object.defineProperty(this, 'enabled', {
                get() {
                    return enabled;
                },
                set(newEnabled) {
                    if (typeof newEnabled !== 'boolean' || newEnabled === enabled) {
                        return;
                    }
                    enabled = newEnabled;
                    this.trigger('enabledchange');
                }
            });
            if (settings.enabled) {
                this.enabled = settings.enabled;
            }
            this.loaded_ = true;
        }
    }
    return AudioTrack;
});
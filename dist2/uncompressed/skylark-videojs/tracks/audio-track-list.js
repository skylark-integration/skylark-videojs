define([
    './track-list'
], function (TrackList) {
    'use strict';
    const disableOthers = function (list, track) {
        for (let i = 0; i < list.length; i++) {
            if (!Object.keys(list[i]).length || track.id === list[i].id) {
                continue;
            }
            list[i].enabled = false;
        }
    };
    class AudioTrackList extends TrackList {
        constructor(tracks = []) {
            for (let i = tracks.length - 1; i >= 0; i--) {
                if (tracks[i].enabled) {
                    disableOthers(tracks, tracks[i]);
                    break;
                }
            }
            super(tracks);
            this.changing_ = false;
        }
        addTrack(track) {
            if (track.enabled) {
                disableOthers(this, track);
            }
            super.addTrack(track);
            if (!track.addEventListener) {
                return;
            }
            track.enabledChange_ = () => {
                if (this.changing_) {
                    return;
                }
                this.changing_ = true;
                disableOthers(this, track);
                this.changing_ = false;
                this.trigger('change');
            };
            track.addEventListener('enabledchange', track.enabledChange_);
        }
        removeTrack(rtrack) {
            super.removeTrack(rtrack);
            if (rtrack.removeEventListener && rtrack.enabledChange_) {
                rtrack.removeEventListener('enabledchange', rtrack.enabledChange_);
                rtrack.enabledChange_ = null;
            }
        }
    }
    return AudioTrackList;
});
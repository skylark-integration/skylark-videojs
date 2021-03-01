define(['./track-list'], function (TrackList) {
    'use strict';
    const disableOthers = function (list, track) {
        for (let i = 0; i < list.length; i++) {
            if (!Object.keys(list[i]).length || track.id === list[i].id) {
                continue;
            }
            list[i].selected = false;
        }
    };
    class VideoTrackList extends TrackList {
        constructor(tracks = []) {
            for (let i = tracks.length - 1; i >= 0; i--) {
                if (tracks[i].selected) {
                    disableOthers(tracks, tracks[i]);
                    break;
                }
            }
            super(tracks);
            this.changing_ = false;
            Object.defineProperty(this, 'selectedIndex', {
                get() {
                    for (let i = 0; i < this.length; i++) {
                        if (this[i].selected) {
                            return i;
                        }
                    }
                    return -1;
                },
                set() {
                }
            });
        }
        addTrack(track) {
            if (track.selected) {
                disableOthers(this, track);
            }
            super.addTrack(track);
            if (!track.addEventListener) {
                return;
            }
            track.selectedChange_ = () => {
                if (this.changing_) {
                    return;
                }
                this.changing_ = true;
                disableOthers(this, track);
                this.changing_ = false;
                this.trigger('change');
            };
            track.addEventListener('selectedchange', track.selectedChange_);
        }
        removeTrack(rtrack) {
            super.removeTrack(rtrack);
            if (rtrack.removeEventListener && rtrack.selectedChange_) {
                rtrack.removeEventListener('selectedchange', rtrack.selectedChange_);
                rtrack.selectedChange_ = null;
            }
        }
    }
    return VideoTrackList;
});
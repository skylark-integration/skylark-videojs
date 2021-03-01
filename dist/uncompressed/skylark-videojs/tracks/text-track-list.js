define([
    './track-list'
], function (TrackList) {

    'use strict';
    
    class TextTrackList extends TrackList {
        addTrack(track) {
            super.addTrack(track);
            if (!this.queueChange_) {
                this.queueChange_ = () => this.queueTrigger('change');
            }
            if (!this.triggerSelectedlanguagechange) {
                this.triggerSelectedlanguagechange_ = () => this.trigger('selectedlanguagechange');
            }
            track.addEventListener('modechange', this.queueChange_);
            const nonLanguageTextTrackKind = [
                'metadata',
                'chapters'
            ];
            if (nonLanguageTextTrackKind.indexOf(track.kind) === -1) {
                track.addEventListener('modechange', this.triggerSelectedlanguagechange_);
            }
        }
        removeTrack(rtrack) {
            super.removeTrack(rtrack);
            if (rtrack.removeEventListener) {
                if (this.queueChange_) {
                    rtrack.removeEventListener('modechange', this.queueChange_);
                }
                if (this.selectedlanguagechange_) {
                    rtrack.removeEventListener('modechange', this.triggerSelectedlanguagechange_);
                }
            }
        }
    }

    return TextTrackList;
});
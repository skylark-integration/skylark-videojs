define(function () {
    'use strict';
    class TextTrackCueList {
        constructor(cues) {
            TextTrackCueList.prototype.setCues_.call(this, cues);
            Object.defineProperty(this, 'length', {
                get() {
                    return this.length_;
                }
            });
        }
        setCues_(cues) {
            const oldLength = this.length || 0;
            let i = 0;
            const l = cues.length;
            this.cues_ = cues;
            this.length_ = cues.length;
            const defineProp = function (index) {
                if (!('' + index in this)) {
                    Object.defineProperty(this, '' + index, {
                        get() {
                            return this.cues_[index];
                        }
                    });
                }
            };
            if (oldLength < l) {
                i = oldLength;
                for (; i < l; i++) {
                    defineProp.call(this, i);
                }
            }
        }
        getCueById(id) {
            let result = null;
            for (let i = 0, l = this.length; i < l; i++) {
                const cue = this[i];
                if (cue.id === id) {
                    result = cue;
                    break;
                }
            }
            return result;
        }
    }
    return TextTrackCueList;
});
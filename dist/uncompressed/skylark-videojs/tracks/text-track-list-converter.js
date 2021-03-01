define(function () {
    'use strict';
    const trackToJson_ = function (track) {
        const ret = [
            'kind',
            'label',
            'language',
            'id',
            'inBandMetadataTrackDispatchType',
            'mode',
            'src'
        ].reduce((acc, prop, i) => {
            if (track[prop]) {
                acc[prop] = track[prop];
            }
            return acc;
        }, {
            cues: track.cues && Array.prototype.map.call(track.cues, function (cue) {
                return {
                    startTime: cue.startTime,
                    endTime: cue.endTime,
                    text: cue.text,
                    id: cue.id
                };
            })
        });
        return ret;
    };
    const textTracksToJson = function (tech) {
        const trackEls = tech.$$('track');
        const trackObjs = Array.prototype.map.call(trackEls, t => t.track);
        const tracks = Array.prototype.map.call(trackEls, function (trackEl) {
            const json = trackToJson_(trackEl.track);
            if (trackEl.src) {
                json.src = trackEl.src;
            }
            return json;
        });
        return tracks.concat(Array.prototype.filter.call(tech.textTracks(), function (track) {
            return trackObjs.indexOf(track) === -1;
        }).map(trackToJson_));
    };
    const jsonToTextTracks = function (json, tech) {
        json.forEach(function (track) {
            const addedTrack = tech.addRemoteTextTrack(track).track;
            if (!track.src && track.cues) {
                track.cues.forEach(cue => addedTrack.addCue(cue));
            }
        });
        return tech.textTracks();
    };
    return {
        textTracksToJson,
        jsonToTextTracks,
        trackToJson_
    };
});
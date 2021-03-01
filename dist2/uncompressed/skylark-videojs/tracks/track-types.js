define([
    './audio-track-list',
    './video-track-list',
    './text-track-list',
    './html-track-element-list',
    './text-track',
    './audio-track',
    './video-track',
    './html-track-element'
], function (AudioTrackList, VideoTrackList, TextTrackList, HtmlTrackElementList, TextTrack, AudioTrack, VideoTrack, HTMLTrackElement) {
    'use strict';
    const NORMAL = {
        audio: {
            ListClass: AudioTrackList,
            TrackClass: AudioTrack,
            capitalName: 'Audio'
        },
        video: {
            ListClass: VideoTrackList,
            TrackClass: VideoTrack,
            capitalName: 'Video'
        },
        text: {
            ListClass: TextTrackList,
            TrackClass: TextTrack,
            capitalName: 'Text'
        }
    };
    Object.keys(NORMAL).forEach(function (type) {
        NORMAL[type].getterName = `${ type }Tracks`;
        NORMAL[type].privateName = `${ type }Tracks_`;
    });
    const REMOTE = {
        remoteText: {
            ListClass: TextTrackList,
            TrackClass: TextTrack,
            capitalName: 'RemoteText',
            getterName: 'remoteTextTracks',
            privateName: 'remoteTextTracks_'
        },
        remoteTextEl: {
            ListClass: HtmlTrackElementList,
            TrackClass: HTMLTrackElement,
            capitalName: 'RemoteTextTrackEls',
            getterName: 'remoteTextTrackEls',
            privateName: 'remoteTextTrackEls_'
        }
    };
    const ALL = Object.assign({}, NORMAL, REMOTE);
    REMOTE.names = Object.keys(REMOTE);
    NORMAL.names = Object.keys(NORMAL);
    ALL.names = [].concat(REMOTE.names).concat(NORMAL.names);
    return {
        NORMAL,
        REMOTE,
        ALL
    };
});
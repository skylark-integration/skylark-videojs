define(function () {
    'use strict';
    const VideoTrackKind = {
        alternative: 'alternative',
        captions: 'captions',
        main: 'main',
        sign: 'sign',
        subtitles: 'subtitles',
        commentary: 'commentary'
    };
    const AudioTrackKind = {
        'alternative': 'alternative',
        'descriptions': 'descriptions',
        'main': 'main',
        'main-desc': 'main-desc',
        'translation': 'translation',
        'commentary': 'commentary'
    };
    const TextTrackKind = {
        subtitles: 'subtitles',
        captions: 'captions',
        descriptions: 'descriptions',
        chapters: 'chapters',
        metadata: 'metadata'
    };
    const TextTrackMode = {
        disabled: 'disabled',
        hidden: 'hidden',
        showing: 'showing'
    };
    return {
        VideoTrackKind: VideoTrackKind,
        AudioTrackKind: AudioTrackKind,
        TextTrackKind: TextTrackKind,
        TextTrackMode: TextTrackMode
    };
});
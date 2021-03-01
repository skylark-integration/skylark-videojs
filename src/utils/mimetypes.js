define(['./url'], function (Url) {
    'use strict';
    const MimetypesKind = {
        opus: 'video/ogg',
        ogv: 'video/ogg',
        mp4: 'video/mp4',
        mov: 'video/mp4',
        m4v: 'video/mp4',
        mkv: 'video/x-matroska',
        m4a: 'audio/mp4',
        mp3: 'audio/mpeg',
        aac: 'audio/aac',
        caf: 'audio/x-caf',
        flac: 'audio/flac',
        oga: 'audio/ogg',
        wav: 'audio/wav',
        m3u8: 'application/x-mpegURL',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        png: 'image/png',
        svg: 'image/svg+xml',
        webp: 'image/webp'
    };
    const getMimetype = function (src = '') {
        const ext = Url.getFileExtension(src);
        const mimetype = MimetypesKind[ext.toLowerCase()];
        return mimetype || '';
    };
    const findMimetype = (player, src) => {
        if (!src) {
            return '';
        }
        if (player.cache_.source.src === src && player.cache_.source.type) {
            return player.cache_.source.type;
        }
        const matchingSources = player.cache_.sources.filter(s => s.src === src);
        if (matchingSources.length) {
            return matchingSources[0].type;
        }
        const sources = player.$$('source');
        for (let i = 0; i < sources.length; i++) {
            const s = sources[i];
            if (s.type && s.src && s.src === src) {
                return s.type;
            }
        }
        return getMimetype(src);
    };
    return {
        MimetypesKind: MimetypesKind,
        getMimetype: getMimetype,
        findMimetype: findMimetype
    };
});
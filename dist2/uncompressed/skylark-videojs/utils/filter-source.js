define([
    './obj',
    './mimetypes'
], function (obj, mimetypes) {
    'use strict';
    const filterSource = function (src) {
        if (Array.isArray(src)) {
            let newsrc = [];
            src.forEach(function (srcobj) {
                srcobj = filterSource(srcobj);
                if (Array.isArray(srcobj)) {
                    newsrc = newsrc.concat(srcobj);
                } else if (obj.isObject(srcobj)) {
                    newsrc.push(srcobj);
                }
            });
            src = newsrc;
        } else if (typeof src === 'string' && src.trim()) {
            src = [fixSource({ src })];
        } else if (obj.isObject(src) && typeof src.src === 'string' && src.src && src.src.trim()) {
            src = [fixSource(src)];
        } else {
            src = [];
        }
        return src;
    };
    function fixSource(src) {
        if (!src.type) {
            const mimetype = mimetypes.getMimetype(src.src);
            if (mimetype) {
                src.type = mimetype;
            }
        }
        return src;
    }
    return filterSource;
});
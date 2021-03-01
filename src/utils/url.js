define([
    'skylark-langx-globals/document'
], function (document) {
    'use strict';
    const parseUrl = function (url) {
        const props = [
            'protocol',
            'hostname',
            'port',
            'pathname',
            'search',
            'hash',
            'host'
        ];
        let a = document.createElement('a');
        a.href = url;
        const addToBody = a.host === '' && a.protocol !== 'file:';
        let div;
        if (addToBody) {
            div = document.createElement('div');
            div.innerHTML = `<a href="${ url }"></a>`;
            a = div.firstChild;
            div.setAttribute('style', 'display:none; position:absolute;');
            document.body.appendChild(div);
        }
        const details = {};
        for (let i = 0; i < props.length; i++) {
            details[props[i]] = a[props[i]];
        }
        if (details.protocol === 'http:') {
            details.host = details.host.replace(/:80$/, '');
        }
        if (details.protocol === 'https:') {
            details.host = details.host.replace(/:443$/, '');
        }
        if (!details.protocol) {
            details.protocol = window.location.protocol;
        }
        if (addToBody) {
            document.body.removeChild(div);
        }
        return details;
    };
    const getAbsoluteURL = function (url) {
        if (!url.match(/^https?:\/\//)) {
            const div = document.createElement('div');
            div.innerHTML = `<a href="${ url }">x</a>`;
            url = div.firstChild.href;
        }
        return url;
    };
    const getFileExtension = function (path) {
        if (typeof path === 'string') {
            const splitPathRe = /^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/;
            const pathParts = splitPathRe.exec(path);
            if (pathParts) {
                return pathParts.pop().toLowerCase();
            }
        }
        return '';
    };
    const isCrossOrigin = function (url, winLoc = window.location) {
        const urlInfo = parseUrl(url);
        const srcProtocol = urlInfo.protocol === ':' ? winLoc.protocol : urlInfo.protocol;
        const crossOrigin = srcProtocol + urlInfo.host !== winLoc.protocol + winLoc.host;
        return crossOrigin;
    };
    return {
        parseUrl: parseUrl,
        getAbsoluteURL: getAbsoluteURL,
        getFileExtension: getFileExtension,
        isCrossOrigin: isCrossOrigin
    };
});
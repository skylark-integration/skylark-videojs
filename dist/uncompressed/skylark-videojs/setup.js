define([
    'skylark-langx-globals/document',
    './utils/dom'
], function (document,Dom) {
    'use strict';
    let _windowLoaded = false;
    let videojs;
    const autoSetup = function () {
        if (!Dom.isReal() || videojs.options.autoSetup === false) {
            return;
        }
        const vids = Array.prototype.slice.call(document.getElementsByTagName('video'));
        const audios = Array.prototype.slice.call(document.getElementsByTagName('audio'));
        const divs = Array.prototype.slice.call(document.getElementsByTagName('video-js'));
        const mediaEls = vids.concat(audios, divs);
        if (mediaEls && mediaEls.length > 0) {
            for (let i = 0, e = mediaEls.length; i < e; i++) {
                const mediaEl = mediaEls[i];
                if (mediaEl && mediaEl.getAttribute) {
                    if (mediaEl.player === undefined) {
                        const options = mediaEl.getAttribute('data-setup');
                        if (options !== null) {
                            videojs(mediaEl);
                        }
                    }
                } else {
                    autoSetupTimeout(1);
                    break;
                }
            }
        } else if (!_windowLoaded) {
            autoSetupTimeout(1);
        }
    };
    function autoSetupTimeout(wait, vjs) {
        if (vjs) {
            videojs = vjs;
        }
        window.setTimeout(autoSetup, wait);
    }
    function setWindowLoaded() {
        _windowLoaded = true;
        window.removeEventListener('load', setWindowLoaded);
    }
    if (Dom.isReal()) {
        if (document.readyState === 'complete') {
            setWindowLoaded();
        } else {
            window.addEventListener('load', setWindowLoaded);
        }
    }
    const hasLoaded = function () {
        return _windowLoaded;
    };
    return {
        autoSetup,
        autoSetupTimeout,
        hasLoaded
    };
});
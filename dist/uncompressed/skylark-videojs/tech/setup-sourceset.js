define([
    'skylark-langx-globals/document',
    '../utils/merge-options',
    '../utils/url'
], function (document,mergeOptions, url) {
    'use strict';
    const sourcesetLoad = tech => {
        const el = tech.el();
        if (el.hasAttribute('src')) {
            tech.triggerSourceset(el.src);
            return true;
        }
        const sources = tech.$$('source');
        const srcUrls = [];
        let src = '';
        if (!sources.length) {
            return false;
        }
        for (let i = 0; i < sources.length; i++) {
            const url = sources[i].src;
            if (url && srcUrls.indexOf(url) === -1) {
                srcUrls.push(url);
            }
        }
        if (!srcUrls.length) {
            return false;
        }
        if (srcUrls.length === 1) {
            src = srcUrls[0];
        }
        tech.triggerSourceset(src);
        return true;
    };
    const innerHTMLDescriptorPolyfill = Object.defineProperty({}, 'innerHTML', {
        get() {
            return this.cloneNode(true).innerHTML;
        },
        set(v) {
            const dummy = document.createElement(this.nodeName.toLowerCase());
            dummy.innerHTML = v;
            const docFrag = document.createDocumentFragment();
            while (dummy.childNodes.length) {
                docFrag.appendChild(dummy.childNodes[0]);
            }
            this.innerText = '';
            window.Element.prototype.appendChild.call(this, docFrag);
            return this.innerHTML;
        }
    });
    const getDescriptor = (priority, prop) => {
        let descriptor = {};
        for (let i = 0; i < priority.length; i++) {
            descriptor = Object.getOwnPropertyDescriptor(priority[i], prop);
            if (descriptor && descriptor.set && descriptor.get) {
                break;
            }
        }
        descriptor.enumerable = true;
        descriptor.configurable = true;
        return descriptor;
    };
    const getInnerHTMLDescriptor = tech => getDescriptor([
        tech.el(),
        window.HTMLMediaElement.prototype,
        window.Element.prototype,
        innerHTMLDescriptorPolyfill
    ], 'innerHTML');
    const firstSourceWatch = function (tech) {
        const el = tech.el();
        if (el.resetSourceWatch_) {
            return;
        }
        const old = {};
        const innerDescriptor = getInnerHTMLDescriptor(tech);
        const appendWrapper = appendFn => (...args) => {
            const retval = appendFn.apply(el, args);
            sourcesetLoad(tech);
            return retval;
        };
        [
            'append',
            'appendChild',
            'insertAdjacentHTML'
        ].forEach(k => {
            if (!el[k]) {
                return;
            }
            old[k] = el[k];
            el[k] = appendWrapper(old[k]);
        });
        Object.defineProperty(el, 'innerHTML', mergeOptions(innerDescriptor, { set: appendWrapper(innerDescriptor.set) }));
        el.resetSourceWatch_ = () => {
            el.resetSourceWatch_ = null;
            Object.keys(old).forEach(k => {
                el[k] = old[k];
            });
            Object.defineProperty(el, 'innerHTML', innerDescriptor);
        };
        tech.one('sourceset', el.resetSourceWatch_);
    };
    const srcDescriptorPolyfill = Object.defineProperty({}, 'src', {
        get() {
            if (this.hasAttribute('src')) {
                return url.getAbsoluteURL(window.Element.prototype.getAttribute.call(this, 'src'));
            }
            return '';
        },
        set(v) {
            window.Element.prototype.setAttribute.call(this, 'src', v);
            return v;
        }
    });
    const getSrcDescriptor = tech => getDescriptor([
        tech.el(),
        window.HTMLMediaElement.prototype,
        srcDescriptorPolyfill
    ], 'src');
    const setupSourceset = function (tech) {
        if (!tech.featuresSourceset) {
            return;
        }
        const el = tech.el();
        if (el.resetSourceset_) {
            return;
        }
        const srcDescriptor = getSrcDescriptor(tech);
        const oldSetAttribute = el.setAttribute;
        const oldLoad = el.load;
        Object.defineProperty(el, 'src', mergeOptions(srcDescriptor, {
            set: v => {
                const retval = srcDescriptor.set.call(el, v);
                tech.triggerSourceset(el.src);
                return retval;
            }
        }));
        el.setAttribute = (n, v) => {
            const retval = oldSetAttribute.call(el, n, v);
            if (/src/i.test(n)) {
                tech.triggerSourceset(el.src);
            }
            return retval;
        };
        el.load = () => {
            const retval = oldLoad.call(el);
            if (!sourcesetLoad(tech)) {
                tech.triggerSourceset('');
                firstSourceWatch(tech);
            }
            return retval;
        };
        if (el.currentSrc) {
            tech.triggerSourceset(el.currentSrc);
        } else if (!sourcesetLoad(tech)) {
            firstSourceWatch(tech);
        }
        el.resetSourceset_ = () => {
            el.resetSourceset_ = null;
            el.load = oldLoad;
            el.setAttribute = oldSetAttribute;
            Object.defineProperty(el, 'src', srcDescriptor);
            if (el.resetSourceWatch_) {
                el.resetSourceWatch_();
            }
        };
    };
    return setupSourceset;
});
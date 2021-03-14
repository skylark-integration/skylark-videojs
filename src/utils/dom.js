define([
    "skylark-langx-globals/window",
    "skylark-langx-globals/document",   
    "skylark-domx",
    './log',
    './obj',
    './computed-style',
    './browser'
], function (window,document,domx, log, obj, computedStyle, browser) {
    'use strict';
    function isNonBlankString(str) {
        return typeof str === 'string' && Boolean(str.trim());
    }
    function throwIfWhitespace(str) {
        if (str.indexOf(' ') >= 0) {
            throw new Error('class has illegal whitespace characters');
        }
    }
    function classRegExp(className) {
        return new RegExp('(^|\\s)' + className + '($|\\s)');
    }

    function isEl(value) {
        return obj.isObject(value) && value.nodeType === 1;
    }
    function isInFrame() {
        try {
            return window.parent !== window.self;
        } catch (x) {
            return true;
        }
    }
    function createQuerier(method) {
        return function (selector, context) {
            if (!isNonBlankString(selector)) {
                return document[method](null);
            }
            if (isNonBlankString(context)) {
                context = document.querySelector(context);
            }
            const ctx = isEl(context) ? context : document;
            return ctx[method] && ctx[method](selector);
        };
    }
    function createEl(tagName = 'div', properties = {}, attributes = {}, content) {
        const el = document.createElement(tagName);
        Object.getOwnPropertyNames(properties).forEach(function (propName) {
            const val = properties[propName];
            if (propName.indexOf('aria-') !== -1 || propName === 'role' || propName === 'type') {
                log.warn('Setting attributes in the second argument of createEl()\n' + 'has been deprecated. Use the third argument instead.\n' + `createEl(type, properties, attributes). Attempting to set ${ propName } to ${ val }.`);
                el.setAttribute(propName, val);
            } else if (propName === 'textContent') {
                textContent(el, val);
            } else if (el[propName] !== val || propName === 'tabIndex') {
                el[propName] = val;
            }
        });
        Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
            el.setAttribute(attrName, attributes[attrName]);
        });
        if (content) {
            appendContent(el, content);
        }
        return el;
    }
    function textContent(el, text) {
        if (typeof el.textContent === 'undefined') {
            el.innerText = text;
        } else {
            el.textContent = text;
        }
        return el;
    }
    function prependTo(child, parent) {
        if (parent.firstChild) {
            parent.insertBefore(child, parent.firstChild);
        } else {
            parent.appendChild(child);
        }
    }
    function hasClass(element, classToCheck) {
        throwIfWhitespace(classToCheck);
        if (element.classList) {
            return element.classList.contains(classToCheck);
        }
        return classRegExp(classToCheck).test(element.className);
    }
    function addClass(element, classToAdd) {
        if (element.classList) {
            element.classList.add(classToAdd);
        } else if (!hasClass(element, classToAdd)) {
            element.className = (element.className + ' ' + classToAdd).trim();
        }
        return element;
    }
    function removeClass(element, classToRemove) {
        if (element.classList) {
            element.classList.remove(classToRemove);
        } else {
            throwIfWhitespace(classToRemove);
            element.className = element.className.split(/\s+/).filter(function (c) {
                return c !== classToRemove;
            }).join(' ');
        }
        return element;
    }
    function toggleClass(element, classToToggle, predicate) {
        const has = hasClass(element, classToToggle);
        if (typeof predicate === 'function') {
            predicate = predicate(element, classToToggle);
        }
        if (typeof predicate !== 'boolean') {
            predicate = !has;
        }
        if (predicate === has) {
            return;
        }
        if (predicate) {
            addClass(element, classToToggle);
        } else {
            removeClass(element, classToToggle);
        }
        return element;
    }
    function setAttributes(el, attributes) {
        Object.getOwnPropertyNames(attributes).forEach(function (attrName) {
            const attrValue = attributes[attrName];
            if (attrValue === null || typeof attrValue === 'undefined' || attrValue === false) {
                el.removeAttribute(attrName);
            } else {
                el.setAttribute(attrName, attrValue === true ? '' : attrValue);
            }
        });
    }
    function getAttributes(tag) {
        const obj = {};
        const knownBooleans = ',' + 'autoplay,controls,playsinline,loop,muted,default,defaultMuted' + ',';
        if (tag && tag.attributes && tag.attributes.length > 0) {
            const attrs = tag.attributes;
            for (let i = attrs.length - 1; i >= 0; i--) {
                const attrName = attrs[i].name;
                let attrVal = attrs[i].value;
                if (typeof tag[attrName] === 'boolean' || knownBooleans.indexOf(',' + attrName + ',') !== -1) {
                    attrVal = attrVal !== null ? true : false;
                }
                obj[attrName] = attrVal;
            }
        }
        return obj;
    }
    function getAttribute(el, attribute) {
        return el.getAttribute(attribute);
    }
    function setAttribute(el, attribute, value) {
        el.setAttribute(attribute, value);
    }
    function removeAttribute(el, attribute) {
        el.removeAttribute(attribute);
    }
    function blockTextSelection() {
        document.body.focus();
        document.onselectstart = function () {
            return false;
        };
    }
    function unblockTextSelection() {
        document.onselectstart = function () {
            return true;
        };
    }
    function getBoundingClientRect(el) {
        if (el && el.getBoundingClientRect && el.parentNode) {
            const rect = el.getBoundingClientRect();
            const result = {};
            [
                'bottom',
                'height',
                'left',
                'right',
                'top',
                'width'
            ].forEach(k => {
                if (rect[k] !== undefined) {
                    result[k] = rect[k];
                }
            });
            if (!result.height) {
                result.height = parseFloat(computedStyle(el, 'height'));
            }
            if (!result.width) {
                result.width = parseFloat(computedStyle(el, 'width'));
            }
            return result;
        }
    }
    function findPosition(el) {
        if (!el || el && !el.offsetParent) {
            return {
                left: 0,
                top: 0,
                width: 0,
                height: 0
            };
        }
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        let left = 0;
        let top = 0;
        ///while (el.offsetParent && el !== document[fs.fullscreenElement]) {
        while (el.offsetParent && !domx.noder.isFullscreen(el)) {
            left += el.offsetLeft;
            top += el.offsetTop;
            el = el.offsetParent;
        }
        return {
            left,
            top,
            width,
            height
        };
    }
    function getPointerPosition(el, event) {
        const translated = {
            x: 0,
            y: 0
        };
        if (browser.IS_IOS) {
            let item = el;
            while (item && item.nodeName.toLowerCase() !== 'html') {
                const transform = computedStyle(item, 'transform');
                if (/^matrix/.test(transform)) {
                    const values = transform.slice(7, -1).split(/,\s/).map(Number);
                    translated.x += values[4];
                    translated.y += values[5];
                } else if (/^matrix3d/.test(transform)) {
                    const values = transform.slice(9, -1).split(/,\s/).map(Number);
                    translated.x += values[12];
                    translated.y += values[13];
                }
                item = item.parentNode;
            }
        }
        const position = {};
        const boxTarget = findPosition(event.target);
        const box = findPosition(el);
        const boxW = box.width;
        const boxH = box.height;
        let offsetY = event.offsetY - (box.top - boxTarget.top);
        let offsetX = event.offsetX - (box.left - boxTarget.left);
        if (event.changedTouches) {
            offsetX = event.changedTouches[0].pageX - box.left;
            offsetY = event.changedTouches[0].pageY + box.top;
            if (browser.IS_IOS) {
                offsetX -= translated.x;
                offsetY -= translated.y;
            }
        }
        position.y = 1 - Math.max(0, Math.min(1, offsetY / boxH));
        position.x = Math.max(0, Math.min(1, offsetX / boxW));
        return position;
    }
    function isTextNode(value) {
        return obj.isObject(value) && value.nodeType === 3;
    }
    function emptyEl(el) {
        while (el.firstChild) {
            el.removeChild(el.firstChild);
        }
        return el;
    }
    function normalizeContent(content) {
        if (typeof content === 'function') {
            content = content();
        }
        return (Array.isArray(content) ? content : [content]).map(value => {
            if (typeof value === 'function') {
                value = value();
            }
            if (isEl(value) || isTextNode(value)) {
                return value;
            }
            if (typeof value === 'string' && /\S/.test(value)) {
                return document.createTextNode(value);
            }
        }).filter(value => value);
    }
    function appendContent(el, content) {
        normalizeContent(content).forEach(node => el.appendChild(node));
        return el;
    }
    function insertContent(el, content) {
        return appendContent(emptyEl(el), content);
    }
    function isSingleLeftClick(event) {
        if (event.button === undefined && event.buttons === undefined) {
            return true;
        }
        if (event.button === 0 && event.buttons === undefined) {
            return true;
        }
        if (event.type === 'mouseup' && event.button === 0 && event.buttons === 0) {
            return true;
        }
        if (event.button !== 0 || event.buttons !== 1) {
            return false;
        }
        return true;
    }
    const $ = createQuerier('querySelector');
    const $$ = createQuerier('querySelectorAll');
    return {
        isReal: browser.isReal,
        isEl: domx.noder.isElement,// isEl,
        isInFrame: domx.noder.isInFrame, //isInFrame,
        createEl:  function (tagName = 'div', properties = {}, attributes = {}, content) { //createEl,
            var el  = domx.noder.createElement(tagName,properties,attributes);
            if (content) {
                domx.noder.append(el,content)
            }
            return el;
        }, 
        textContent: domx.data.text, //textContent,
        prependTo: function (child, parent) { //prependTo,
            domx.noder.prepend(parent,child);
        },
        hasClass: domx.styler.hasClass, //hasClass,
        addClass: domx.styler.addClass,  //addClass,
        removeClass: domx.styler.removeClass, //removeClass,
        toggleClass: domx.styler.toogleClass, //toggleClass,
        setAttributes: domx.data.attr, // setAttributes,
        getAttributes: getAttributes,
        getAttribute: domx.data.attr, //getAttribute,
        setAttribute: domx.data.attr, //setAttribute,
        removeAttribute: domx.data.removeAttr, //removeAttribute,
        blockTextSelection: blockTextSelection,
        unblockTextSelection: unblockTextSelection,
        getBoundingClientRect: getBoundingClientRect,
        findPosition: domx.geom.pageRect, //findPosition,
        getPointerPosition: getPointerPosition,
        isTextNode: domx.noder.isTextNode,// isTextNode,
        emptyEl: domx.noder.empty, //emptyEl,
        normalizeContent: normalizeContent,
        appendContent: domx.noder.append,//appendContent,
        insertContent: function(el,content) { //insertContent,
            domx.noder.empty(el);
            domx.noder.append(el,content);
            return el;
        },
        isSingleLeftClick: isSingleLeftClick,
        $: function(selector,context) {
            context = context || document;
            return domx.finder.find(context,selector);
        },
        $$: function(selector,context) {
            context = context || document;
            return domx.finder.findAll(context,selector);
        }
    };
});
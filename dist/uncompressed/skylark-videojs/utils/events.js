define([
    'skylark-langx-globals/document',
    "skylark-domx",
    './dom-data',
    './guid',
    './log'
], function (document, domx, DomData, Guid, log) {
    'use strict';
    function _cleanUpEvents(elem, type) {
        if (!DomData.has(elem)) {
            return;
        }
        const data = DomData.get(elem);
        if (data.handlers[type].length === 0) {
            delete data.handlers[type];
            if (elem.removeEventListener) {
                elem.removeEventListener(type, data.dispatcher, false);
            } else if (elem.detachEvent) {
                elem.detachEvent('on' + type, data.dispatcher);
            }
        }
        if (Object.getOwnPropertyNames(data.handlers).length <= 0) {
            delete data.handlers;
            delete data.dispatcher;
            delete data.disabled;
        }
        if (Object.getOwnPropertyNames(data).length === 0) {
            DomData.delete(elem);
        }
    }
    function _handleMultipleEvents(fn, elem, types, callback) {
        types.forEach(function (type) {
            fn(elem, type, callback);
        });
    }
    function fixEvent(event) {
        if (event.fixed_) {
            return event;
        }
        function returnTrue() {
            return true;
        }
        function returnFalse() {
            return false;
        }
        if (!event || !event.isPropagationStopped) {
            const old = event || window.event;
            event = {};
            for (const key in old) {
                if (key !== 'layerX' && key !== 'layerY' && key !== 'keyLocation' && key !== 'webkitMovementX' && key !== 'webkitMovementY') {
                    if (!(key === 'returnValue' && old.preventDefault)) {
                        event[key] = old[key];
                    }
                }
            }
            if (!event.target) {
                event.target = event.srcElement || document;
            }
            if (!event.relatedTarget) {
                event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
            }
            event.preventDefault = function () {
                if (old.preventDefault) {
                    old.preventDefault();
                }
                event.returnValue = false;
                old.returnValue = false;
                event.defaultPrevented = true;
            };
            event.defaultPrevented = false;
            event.stopPropagation = function () {
                if (old.stopPropagation) {
                    old.stopPropagation();
                }
                event.cancelBubble = true;
                old.cancelBubble = true;
                event.isPropagationStopped = returnTrue;
            };
            event.isPropagationStopped = returnFalse;
            event.stopImmediatePropagation = function () {
                if (old.stopImmediatePropagation) {
                    old.stopImmediatePropagation();
                }
                event.isImmediatePropagationStopped = returnTrue;
                event.stopPropagation();
            };
            event.isImmediatePropagationStopped = returnFalse;
            if (event.clientX !== null && event.clientX !== undefined) {
                const doc = document.documentElement;
                const body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
            }
            event.which = event.charCode || event.keyCode;
            if (event.button !== null && event.button !== undefined) {
                event.button = event.button & 1 ? 0 : event.button & 4 ? 1 : event.button & 2 ? 2 : 0;
            }
        }
        event.fixed_ = true;
        return event;
    }
    let _supportsPassive;
    const supportsPassive = function () {
        if (typeof _supportsPassive !== 'boolean') {
            _supportsPassive = false;
            try {
                const opts = Object.defineProperty({}, 'passive', {
                    get() {
                        _supportsPassive = true;
                    }
                });
                window.addEventListener('test', null, opts);
                window.removeEventListener('test', null, opts);
            } catch (e) {
            }
        }
        return _supportsPassive;
    };
    const passiveEvents = [
        'touchstart',
        'touchmove'
    ];
    function on(elem, type, fn) {
        if (Array.isArray(type)) {
            return _handleMultipleEvents(on, elem, type, fn);
        }
        if (!DomData.has(elem)) {
            DomData.set(elem, {});
        }
        const data = DomData.get(elem);
        if (!data.handlers) {
            data.handlers = {};
        }
        if (!data.handlers[type]) {
            data.handlers[type] = [];
        }
        if (!fn.guid) {
            fn.guid = Guid.newGUID();
        }
        data.handlers[type].push(fn);
        if (!data.dispatcher) {
            data.disabled = false;
            data.dispatcher = function (event, hash) {
                if (data.disabled) {
                    return;
                }
                event = fixEvent(event);
                const handlers = data.handlers[event.type];
                if (handlers) {
                    const handlersCopy = handlers.slice(0);
                    for (let m = 0, n = handlersCopy.length; m < n; m++) {
                        if (event.isImmediatePropagationStopped()) {
                            break;
                        } else {
                            try {
                                handlersCopy[m].call(elem, event, hash);
                            } catch (e) {
                                log.error(e);
                            }
                        }
                    }
                }
            };
        }
        if (data.handlers[type].length === 1) {
            if (elem.addEventListener) {
                let options = false;
                if (supportsPassive() && passiveEvents.indexOf(type) > -1) {
                    options = { passive: true };
                }
                elem.addEventListener(type, data.dispatcher, options);
            } else if (elem.attachEvent) {
                elem.attachEvent('on' + type, data.dispatcher);
            }
        }
    }
    function off(elem, type, fn) {
        if (!DomData.has(elem)) {
            return;
        }
        const data = DomData.get(elem);
        if (!data.handlers) {
            return;
        }
        if (Array.isArray(type)) {
            return _handleMultipleEvents(off, elem, type, fn);
        }
        const removeType = function (el, t) {
            data.handlers[t] = [];
            _cleanUpEvents(el, t);
        };
        if (type === undefined) {
            for (const t in data.handlers) {
                if (Object.prototype.hasOwnProperty.call(data.handlers || {}, t)) {
                    removeType(elem, t);
                }
            }
            return;
        }
        const handlers = data.handlers[type];
        if (!handlers) {
            return;
        }
        if (!fn) {
            removeType(elem, type);
            return;
        }
        if (fn.guid) {
            for (let n = 0; n < handlers.length; n++) {
                if (handlers[n].guid === fn.guid) {
                    handlers.splice(n--, 1);
                }
            }
        }
        _cleanUpEvents(elem, type);
    }
    function trigger(elem, event, hash) {
        const elemData = DomData.has(elem) ? DomData.get(elem) : {};
        const parent = elem.parentNode || elem.ownerDocument;
        if (typeof event === 'string') {
            event = {
                type: event,
                target: elem
            };
        } else if (!event.target) {
            event.target = elem;
        }
        event = fixEvent(event);
        if (elemData.dispatcher) {
            elemData.dispatcher.call(elem, event, hash);
        }
        if (parent && !event.isPropagationStopped() && event.bubbles === true) {
            trigger.call(null, parent, event, hash);
        } else if (!parent && !event.defaultPrevented && event.target && event.target[event.type]) {
            if (!DomData.has(event.target)) {
                DomData.set(event.target, {});
            }
            const targetData = DomData.get(event.target);
            if (event.target[event.type]) {
                targetData.disabled = true;
                if (typeof event.target[event.type] === 'function') {
                    event.target[event.type]();
                }
                targetData.disabled = false;
            }
        }
        return !event.defaultPrevented;
    }
    function one(elem, type, fn) {
        if (Array.isArray(type)) {
            return _handleMultipleEvents(one, elem, type, fn);
        }
        const func = function () {
            off(elem, type, func);
            fn.apply(this, arguments);
        };
        func.guid = fn.guid = fn.guid || Guid.newGUID();
        on(elem, type, func);
    }
    function any(elem, type, fn) {
        const func = function () {
            off(elem, type, func);
            fn.apply(this, arguments);
        };
        func.guid = fn.guid = fn.guid || Guid.newGUID();
        on(elem, type, func);
    }
    return {
        fixEvent: fixEvent,
        on: domx.eventer.on, //on,
        off: domx.eventer.off, //off,
        trigger: domx.eventer.trigger, //trigger,
        one: domx.eventer.one, //one,
        any: domx.eventer.one //any
    };
});
define([
    '../utils/dom',
    '../utils/events',
    '../utils/fn',
    '../utils/obj',
    '../event-target',
    '../utils/log'
], function (Dom, Events, Fn, Obj, EventTarget, log) {
    'use strict';
    const objName = obj => {
        if (typeof obj.name === 'function') {
            return obj.name();
        }
        if (typeof obj.name === 'string') {
            return obj.name;
        }
        if (obj.name_) {
            return obj.name_;
        }
        if (obj.constructor && obj.constructor.name) {
            return obj.constructor.name;
        }
        return typeof obj;
    };
    const isEvented = object => object instanceof EventTarget || !!object.eventBusEl_ && [
        'on',
        'one',
        'off',
        'trigger'
    ].every(k => typeof object[k] === 'function');
    const addEventedCallback = (target, callback) => {
        if (isEvented(target)) {
            callback();
        } else {
            if (!target.eventedCallbacks) {
                target.eventedCallbacks = [];
            }
            target.eventedCallbacks.push(callback);
        }
    };
    const isValidEventType = type => typeof type === 'string' && /\S/.test(type) || Array.isArray(type) && !!type.length;
    const validateTarget = (target, obj, fnName) => {
        if (!target || !target.nodeName && !isEvented(target)) {
            throw new Error(`Invalid target for ${ objName(obj) }#${ fnName }; must be a DOM node or evented object.`);
        }
    };
    const validateEventType = (type, obj, fnName) => {
        if (!isValidEventType(type)) {
            throw new Error(`Invalid event type for ${ objName(obj) }#${ fnName }; must be a non-empty string or array.`);
        }
    };
    const validateListener = (listener, obj, fnName) => {
        if (typeof listener !== 'function') {
            throw new Error(`Invalid listener for ${ objName(obj) }#${ fnName }; must be a function.`);
        }
    };
    const normalizeListenArgs = (self, args, fnName) => {
        const isTargetingSelf = args.length < 3 || args[0] === self || args[0] === self.eventBusEl_;
        let target;
        let type;
        let listener;
        if (isTargetingSelf) {
            target = self.eventBusEl_;
            if (args.length >= 3) {
                args.shift();
            }
            [type, listener] = args;
        } else {
            [target, type, listener] = args;
        }
        validateTarget(target, self, fnName);
        validateEventType(type, self, fnName);
        validateListener(listener, self, fnName);
        listener = Fn.bind(self, listener);
        return {
            isTargetingSelf,
            target,
            type,
            listener
        };
    };
    const listen = (target, method, type, listener) => {
        validateTarget(target, target, method);
        if (target.nodeName) {
            Events[method](target, type, listener);
        } else {
            target[method](type, listener);
        }
    };
    const EventedMixin = {
        on(...args) {
            const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args, 'on');
            listen(target, 'on', type, listener);
            if (!isTargetingSelf) {
                const removeListenerOnDispose = () => this.unlistenTo(target, type, listener);
                removeListenerOnDispose.guid = listener.guid;
                const removeRemoverOnTargetDispose = () => this.unlistenTo('dispose', removeListenerOnDispose);
                removeRemoverOnTargetDispose.guid = listener.guid;
                listen(this, 'on', 'dispose', removeListenerOnDispose);
                listen(target, 'on', 'dispose', removeRemoverOnTargetDispose);
            }
        },
        one(...args) {
            const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args, 'one');
            if (isTargetingSelf) {
                listen(target, 'one', type, listener);
            } else {
                const wrapper = (...largs) => {
                    this.unlistenTo(target, type, wrapper);
                    listener.apply(null, largs);
                };
                wrapper.guid = listener.guid;
                listen(target, 'one', type, wrapper);
            }
        },
        any(...args) {
            const {isTargetingSelf, target, type, listener} = normalizeListenArgs(this, args, 'any');
            if (isTargetingSelf) {
                listen(target, 'any', type, listener);
            } else {
                const wrapper = (...largs) => {
                    this.unlistenTo(target, type, wrapper);
                    listener.apply(null, largs);
                };
                wrapper.guid = listener.guid;
                listen(target, 'any', type, wrapper);
            }
        },
        off(targetOrType, typeOrListener, listener) {
            if (!targetOrType || isValidEventType(targetOrType)) {
                Events.off(this.eventBusEl_, targetOrType, typeOrListener);
            } else {
                const target = targetOrType;
                const type = typeOrListener;
                validateTarget(target, this, 'off');
                validateEventType(type, this, 'off');
                validateListener(listener, this, 'off');
                listener = Fn.bind(this, listener);
                this.unlistenTo('dispose', listener);
                if (target.nodeName) {
                    Events.off(target, type, listener);
                    Events.off(target, 'dispose', listener);
                } else if (isEvented(target)) {
                    target.off(type, listener);
                    target.off('dispose', listener);
                }
            }
        },
        trigger(event, hash) {
            validateTarget(this.eventBusEl_, this, 'trigger');
            const type = event && typeof event !== 'string' ? event.type : event;
            if (!isValidEventType(type)) {
                const error = `Invalid event type for ${ objName(this) }#trigger; ` + 'must be a non-empty string or object with a type key that has a non-empty value.';
                if (event) {
                    (this.log || log).error(error);
                } else {
                    throw new Error(error);
                }
            }
            return Events.trigger(this.eventBusEl_, event, hash);
        }
    };
    function evented(target, options = {}) {
        const {eventBusKey} = options;
        if (eventBusKey) {
            if (!target[eventBusKey].nodeName) {
                throw new Error(`The eventBusKey "${ eventBusKey }" does not refer to an element.`);
            }
            target.eventBusEl_ = target[eventBusKey];
        } else {
            target.eventBusEl_ = Dom.createEl('span', { className: 'vjs-event-bus' });
        }
        Obj.assign(target, EventedMixin);
        if (target.eventedCallbacks) {
            target.eventedCallbacks.forEach(callback => {
                callback();
            });
        }
        target.on('dispose', () => {
            target.off();
            window.setTimeout(() => {
                target.eventBusEl_ = null;
            }, 0);
        });
        return target;
    }

    evented.isEvented = isEvented;
    evented.addEventedCallback = addEventedCallback;

    return evented;
    
});
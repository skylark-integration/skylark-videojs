define([
    "skylark-langx-events/Emitter",
    './utils/events'
], function (Emitter,Events) {
    'use strict';

    /*
    const EventTarget = function () {
    };
    EventTarget.prototype.allowedEvents_ = {};
    EventTarget.prototype.on = function (type, fn) {
        const ael = this.addEventListener;
        this.addEventListener = () => {
        };
        Events.on(this, type, fn);
        this.addEventListener = ael;
    };
    EventTarget.prototype.addEventListener = EventTarget.prototype.on;
    EventTarget.prototype.off = function (type, fn) {
        Events.off(this, type, fn);
    };
    EventTarget.prototype.removeEventListener = EventTarget.prototype.off;
    EventTarget.prototype.one = function (type, fn) {
        const ael = this.addEventListener;
        this.addEventListener = () => {
        };
        Events.one(this, type, fn);
        this.addEventListener = ael;
    };
    EventTarget.prototype.any = function (type, fn) {
        const ael = this.addEventListener;
        this.addEventListener = () => {
        };
        Events.any(this, type, fn);
        this.addEventListener = ael;
    };
    EventTarget.prototype.trigger = function (event) {
        const type = event.type || event;
        if (typeof event === 'string') {
            event = { type };
        }
        event = Events.fixEvent(event);
        if (this.allowedEvents_[type] && this['on' + type]) {
            this['on' + type](event);
        }
        Events.trigger(this, event);
    };
    EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;

    */

    var EventTarget = Emitter.inherit({});
    EventTarget.prototype.addEventListener = EventTarget.prototype.on;
    EventTarget.prototype.dispatchEvent = EventTarget.prototype.trigger;
    EventTarget.prototype.removeEventListener = EventTarget.prototype.off;
    EventTarget.prototype.any = EventTarget.prototype.one;

    let EVENT_MAP;
    EventTarget.prototype.queueTrigger = function (event) {
        if (!EVENT_MAP) {
            EVENT_MAP = new Map();
        }
        const type = event.type || event;
        let map = EVENT_MAP.get(this);
        if (!map) {
            map = new Map();
            EVENT_MAP.set(this, map);
        }
        const oldTimeout = map.get(type);
        map.delete(type);
        window.clearTimeout(oldTimeout);
        const timeout = window.setTimeout(() => {
            if (map.size === 0) {
                map = null;
                EVENT_MAP.delete(this);
            }
            this.trigger(event);
        }, 0);
        map.set(type, timeout);
    };

    return EventTarget;
});
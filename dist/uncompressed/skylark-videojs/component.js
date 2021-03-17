define([
    "skylark-langx",
    "skylark-domx-eventer",
    "skylark-widgets-base/Widget",
    ///'./mixins/evented',
    './mixins/stateful',
    './utils/dom',
    './utils/dom-data',
    './utils/fn',
    './utils/guid',
    './utils/string-cases',
    './utils/merge-options',
    './utils/computed-style',
    './utils/map',
    './utils/set'
], function (langx,eventer,Widget, stateful, Dom, DomData, Fn, Guid, stringCases, mergeOptions, computedStyle, Map, Set) {
    'use strict';

    function isNativeEvent(el,events) {
        if (langx.isString(events)) {
            return el["on"+ events] !== undefined;
        } else if (langx.isArray(events)) {
            for (var i=0; i<events.length; i++) {
                if (el["on"+ events[i]] !== undefined) {
                    return true;
                }
            }
            return events.length > 0;
        }
    }


    class Component extends Widget {
        _construct(player, options, ready) {
            if (!player && this.play) {
                this.player_ = player = this;
            } else {
                this.player_ = player;
            }
            this.options_ = mergeOptions({}, this.options_);
            this.options_ = mergeOptions(this.options_, options);
            this.ready_ = ready;

            super._construct(this.options_,ready);

        }

        _create() {
            var options = this.options_ = this.options;

            if (options.el) {
               this.el_ = options.el;
            } else if (options.createEl !== false) {
                this.el_ = this.createEl();
            }

            return this.elmx(this.el_)
        }

        _init() {
            var options = this.options_,
                player = this.player_;

            this.isDisposed_ = false;
            this.parentComponent_ = null;
            this.id_ = options.id || options.el && options.el.id;
            if (!this.id_) {
                const id = player && player.id && player.id() || 'no_player';
                this.id_ = `${ id }_component_${ Guid.newGUID() }`;
            }
            this.name_ = options.name || null;


            if (options.evented !== false) {
                ///evented(this, { eventBusKey: this.el_ ? 'el_' : null });
                this.handleLanguagechange = this.handleLanguagechange.bind(this);
                ///this.listenTo(this.player_, 'languagechange', this.handleLanguagechange);
                this.listenTo(this.player_, 'languagechange', this.handleLanguagechange);
            }


            ///stateful(this, this.constructor.defaultState);
            this.children_ = [];
            this.childIndex_ = {};
            this.childNameIndex_ = {};
            this.setTimeoutIds_ = new Set();
            this.setIntervalIds_ = new Set();
            this.rafIds_ = new Set();
            this.namedRafs_ = new Map();
            this.clearingTimersOnDispose_ = false;
            if (options.initChildren !== false) {
                this.initChildren();
            }
            this.ready(this.ready_);
            if (options.reportTouchActivity !== false) {
                this.enableTouchActivity();
            }

        }

        dispose() {
            if (this.isDisposed_) {
                return;
            }
            if (this.readyQueue_) {
                this.readyQueue_.length = 0;
            }
            this.trigger({
                type: 'dispose',
                bubbles: false
            });
            this.isDisposed_ = true;
            if (this.children_) {
                for (let i = this.children_.length - 1; i >= 0; i--) {
                    if (this.children_[i].dispose) {
                        this.children_[i].dispose();
                    }
                }
            }
            this.children_ = null;
            this.childIndex_ = null;
            this.childNameIndex_ = null;
            this.parentComponent_ = null;
            if (this.el_) {
                if (this.el_.parentNode) {
                    this.el_.parentNode.removeChild(this.el_);
                }
                ///if (DomData.has(this.el_)) {
                ///    DomData.delete(this.el_);
                ///}
                eventer.clear(this.el_);
                this.el_ = null;
            }
            this.player_ = null;
        }
        isDisposed() {
            return Boolean(this.isDisposed_);
        }
        player() {
            return this.player_;
        }
        options(obj) {
            if (!obj) {
                return this.options_;
            }
            this.options_ = mergeOptions(this.options_, obj);
            return this.options_;
        }
        el() {
            return this.el_;
        }
        createEl(tagName, properties, attributes) {
            return Dom.createEl(tagName, properties, attributes);
        }
        localize(string, tokens, defaultValue = string) {
            const code = this.player_.language && this.player_.language();
            const languages = this.player_.languages && this.player_.languages();
            const language = languages && languages[code];
            const primaryCode = code && code.split('-')[0];
            const primaryLang = languages && languages[primaryCode];
            let localizedString = defaultValue;
            if (language && language[string]) {
                localizedString = language[string];
            } else if (primaryLang && primaryLang[string]) {
                localizedString = primaryLang[string];
            }
            if (tokens) {
                localizedString = localizedString.replace(/\{(\d+)\}/g, function (match, index) {
                    const value = tokens[index - 1];
                    let ret = value;
                    if (typeof value === 'undefined') {
                        ret = match;
                    }
                    return ret;
                });
            }
            return localizedString;
        }
        handleLanguagechange() {
        }
        contentEl() {
            return this.contentEl_ || this.el_;
        }
        id() {
            return this.id_;
        }
        name() {
            return this.name_;
        }
        children() {
            return this.children_;
        }
        getChildById(id) {
            return this.childIndex_[id];
        }
        getChild(name) {
            if (!name) {
                return;
            }
            return this.childNameIndex_[name];
        }
        getDescendant(...names) {
            names = names.reduce((acc, n) => acc.concat(n), []);
            let currentChild = this;
            for (let i = 0; i < names.length; i++) {
                currentChild = currentChild.getChild(names[i]);
                if (!currentChild || !currentChild.getChild) {
                    return;
                }
            }
            return currentChild;
        }
        addChild(child, options = {}, index = this.children_.length) {
            let component;
            let componentName;
            if (typeof child === 'string') {
                componentName = stringCases.toTitleCase(child);
                const componentClassName = options.componentClass || componentName;
                options.name = componentName;
                const ComponentClass = Component.getComponent(componentClassName);
                if (!ComponentClass) {
                    throw new Error(`Component ${ componentClassName } does not exist`);
                }
                if (typeof ComponentClass !== 'function') {
                    return null;
                }
                component = new ComponentClass(this.player_ || this, options);
            } else {
                component = child;
            }
            if (component.parentComponent_) {
                component.parentComponent_.removeChild(component);
            }
            this.children_.splice(index, 0, component);
            component.parentComponent_ = this;
            if (typeof component.id === 'function') {
                this.childIndex_[component.id()] = component;
            }
            componentName = componentName || component.name && stringCases.toTitleCase(component.name());
            if (componentName) {
                this.childNameIndex_[componentName] = component;
                this.childNameIndex_[stringCases.toLowerCase(componentName)] = component;
            }
            if (typeof component.el === 'function' && component.el()) {
                let refNode = null;
                if (this.children_[index + 1]) {
                    if (this.children_[index + 1].el_) {
                        refNode = this.children_[index + 1].el_;
                    } else if (Dom.isEl(this.children_[index + 1])) {
                        refNode = this.children_[index + 1];
                    }
                }
                this.contentEl().insertBefore(component.el(), refNode);
            }
            return component;
        }
        removeChild(component) {
            if (typeof component === 'string') {
                component = this.getChild(component);
            }
            if (!component || !this.children_) {
                return;
            }
            let childFound = false;
            for (let i = this.children_.length - 1; i >= 0; i--) {
                if (this.children_[i] === component) {
                    childFound = true;
                    this.children_.splice(i, 1);
                    break;
                }
            }
            if (!childFound) {
                return;
            }
            component.parentComponent_ = null;
            this.childIndex_[component.id()] = null;
            this.childNameIndex_[stringCases.toTitleCase(component.name())] = null;
            this.childNameIndex_[stringCases.toLowerCase(component.name())] = null;
            const compEl = component.el();
            if (compEl && compEl.parentNode === this.contentEl()) {
                this.contentEl().removeChild(component.el());
            }
        }
        initChildren() {
            const children = this.options_.children;
            if (children) {
                const parentOptions = this.options_;
                const handleAdd = child => {
                    const name = child.name;
                    let opts = child.opts;
                    if (parentOptions[name] !== undefined) {
                        opts = parentOptions[name];
                    }
                    if (opts === false) {
                        return;
                    }
                    if (opts === true) {
                        opts = {};
                    }
                    opts.playerOptions = this.options_.playerOptions;
                    const newChild = this.addChild(name, opts);
                    if (newChild) {
                        this[name] = newChild;
                    }
                };
                let workingChildren;
                const Tech = Component.getComponent('Tech');
                if (Array.isArray(children)) {
                    workingChildren = children;
                } else {
                    workingChildren = Object.keys(children);
                }
                workingChildren.concat(Object.keys(this.options_).filter(function (child) {
                    return !workingChildren.some(function (wchild) {
                        if (typeof wchild === 'string') {
                            return child === wchild;
                        }
                        return child === wchild.name;
                    });
                })).map(child => {
                    let name;
                    let opts;
                    if (typeof child === 'string') {
                        name = child;
                        opts = children[name] || this.options_[name] || {};
                    } else {
                        name = child.name;
                        opts = child;
                    }
                    return {
                        name,
                        opts
                    };
                }).filter(child => {
                    const c = Component.getComponent(child.opts.componentClass || stringCases.toTitleCase(child.name));
                    return c && !Tech.isTech(c);
                }).forEach(handleAdd);
            }
        }
        buildCSSClass() {
            return '';
        }
        ready(fn, sync = false) {
            if (!fn) {
                return;
            }
            if (!this.isReady_) {
                this.readyQueue_ = this.readyQueue_ || [];
                this.readyQueue_.push(fn);
                return;
            }
            if (sync) {
                fn.call(this);
            } else {
                this.setTimeout(fn, 1);
            }
        }
        triggerReady() {
            this.isReady_ = true;
            this.setTimeout(function () {
                const readyQueue = this.readyQueue_;
                this.readyQueue_ = [];
                if (readyQueue && readyQueue.length > 0) {
                    readyQueue.forEach(function (fn) {
                        fn.call(this);
                    }, this);
                }
                this.trigger('ready');
            }, 1);
        }
        $(selector, context) {
            return Dom.$(selector, context || this.contentEl());
        }
        $$(selector, context) {
            return Dom.$$(selector, context || this.contentEl());
        }
/*
        hasClass(classToCheck) {
            return Dom.hasClass(this.el_, classToCheck);
        }
        addClass(classToAdd) {
            Dom.addClass(this.el_, classToAdd);
        }
        removeClass(classToRemove) {
            Dom.removeClass(this.el_, classToRemove);
        }
        toggleClass(classToToggle, predicate) {
            Dom.toggleClass(this.el_, classToToggle, predicate);
        }
        show() {
            this.removeClass('vjs-hidden');
        }
        hide() {
            this.addClass('vjs-hidden');
        }
*/  
        lockShowing() {
            this.addClass('vjs-lock-showing');
        }
        unlockShowing() {
            this.removeClass('vjs-lock-showing');
        }
/*
        getAttribute(attribute) {
            return Dom.getAttribute(this.el_, attribute);
        }
        setAttribute(attribute, value) {
            Dom.setAttribute(this.el_, attribute, value);
        }
        removeAttribute(attribute) {
            Dom.removeAttribute(this.el_, attribute);
        }
*/
        width(num, skipListeners) {
            return this.dimension('width', num, skipListeners);
        }
        height(num, skipListeners) {
            return this.dimension('height', num, skipListeners);
        }
        dimensions(width, height) {
            this.width(width, true);
            this.height(height);
        }
        dimension(widthOrHeight, num, skipListeners) {
            if (num !== undefined) {
                if (num === null || num !== num) {
                    num = 0;
                }
                if (('' + num).indexOf('%') !== -1 || ('' + num).indexOf('px') !== -1) {
                    this.el_.style[widthOrHeight] = num;
                } else if (num === 'auto') {
                    this.el_.style[widthOrHeight] = '';
                } else {
                    this.el_.style[widthOrHeight] = num + 'px';
                }
                if (!skipListeners) {
                    this.trigger('componentresize');
                }
                return;
            }
            if (!this.el_) {
                return 0;
            }
            const val = this.el_.style[widthOrHeight];
            const pxIndex = val.indexOf('px');
            if (pxIndex !== -1) {
                return parseInt(val.slice(0, pxIndex), 10);
            }
            return parseInt(this.el_['offset' + stringCases.toTitleCase(widthOrHeight)], 10);
        }
        currentDimension(widthOrHeight) {
            let computedWidthOrHeight = 0;
            if (widthOrHeight !== 'width' && widthOrHeight !== 'height') {
                throw new Error('currentDimension only accepts width or height value');
            }
            computedWidthOrHeight = computedStyle(this.el_, widthOrHeight);
            computedWidthOrHeight = parseFloat(computedWidthOrHeight);
            if (computedWidthOrHeight === 0 || isNaN(computedWidthOrHeight)) {
                const rule = `offset${ stringCases.toTitleCase(widthOrHeight) }`;
                computedWidthOrHeight = this.el_[rule];
            }
            return computedWidthOrHeight;
        }
        currentDimensions() {
            return {
                width: this.currentDimension('width'),
                height: this.currentDimension('height')
            };
        }
        currentWidth() {
            return this.currentDimension('width');
        }
        currentHeight() {
            return this.currentDimension('height');
        }
/*
        focus() {
            this.el_.focus();
        }
        blur() {
            this.el_.blur();
        }
*/
        handleKeyDown(event) {
            if (this.player_) {
                event.stopPropagation();
                this.player_.handleKeyDown(event);
            }
        }
        handleKeyPress(event) {
            this.handleKeyDown(event);
        }
        emitTapEvents() {
            let touchStart = 0;
            let firstTouch = null;
            const tapMovementThreshold = 10;
            const touchTimeThreshold = 200;
            let couldBeTap;
            this.listenTo('touchstart', function (event) {
                if (event.touches.length === 1) {
                    firstTouch = {
                        pageX: event.touches[0].pageX,
                        pageY: event.touches[0].pageY
                    };
                    touchStart = window.performance.now();
                    couldBeTap = true;
                }
            });
            this.listenTo('touchmove', function (event) {
                if (event.touches.length > 1) {
                    couldBeTap = false;
                } else if (firstTouch) {
                    const xdiff = event.touches[0].pageX - firstTouch.pageX;
                    const ydiff = event.touches[0].pageY - firstTouch.pageY;
                    const touchDistance = Math.sqrt(xdiff * xdiff + ydiff * ydiff);
                    if (touchDistance > tapMovementThreshold) {
                        couldBeTap = false;
                    }
                }
            });
            const noTap = function () {
                couldBeTap = false;
            };
            this.listenTo('touchleave', noTap);
            this.listenTo('touchcancel', noTap);
            this.listenTo('touchend', function (event) {
                firstTouch = null;
                if (couldBeTap === true) {
                    const touchTime = window.performance.now() - touchStart;
                    if (touchTime < touchTimeThreshold) {
                        event.preventDefault();
                        this.trigger('tap');
                    }
                }
            });
        }
        enableTouchActivity() {
            if (!this.player() || !this.player().reportUserActivity) {
                return;
            }
            const report = Fn.bind(this.player(), this.player().reportUserActivity);
            let touchHolding;
            this.listenTo('touchstart', function () {
                report();
                this.clearInterval(touchHolding);
                touchHolding = this.setInterval(report, 250);
            });
            const touchEnd = function (event) {
                report();
                this.clearInterval(touchHolding);
            };
            this.listenTo('touchmove', report);
            this.listenTo('touchend', touchEnd);
            this.listenTo('touchcancel', touchEnd);
        }
        setTimeout(fn, timeout) {
            var timeoutId, disposeFn;
            fn = Fn.bind(this, fn);
            this.clearTimersOnDispose_();
            timeoutId = window.setTimeout(() => {
                if (this.setTimeoutIds_.has(timeoutId)) {
                    this.setTimeoutIds_.delete(timeoutId);
                }
                fn();
            }, timeout);
            this.setTimeoutIds_.add(timeoutId);
            return timeoutId;
        }
        clearTimeout(timeoutId) {
            if (this.setTimeoutIds_.has(timeoutId)) {
                this.setTimeoutIds_.delete(timeoutId);
                window.clearTimeout(timeoutId);
            }
            return timeoutId;
        }
        setInterval(fn, interval) {
            fn = Fn.bind(this, fn);
            this.clearTimersOnDispose_();
            const intervalId = window.setInterval(fn, interval);
            this.setIntervalIds_.add(intervalId);
            return intervalId;
        }
        clearInterval(intervalId) {
            if (this.setIntervalIds_.has(intervalId)) {
                this.setIntervalIds_.delete(intervalId);
                window.clearInterval(intervalId);
            }
            return intervalId;
        }
        requestAnimationFrame(fn) {
            if (!this.supportsRaf_) {
                return this.setTimeout(fn, 1000 / 60);
            }
            this.clearTimersOnDispose_();
            var id;
            fn = Fn.bind(this, fn);
            id = window.requestAnimationFrame(() => {
                if (this.rafIds_.has(id)) {
                    this.rafIds_.delete(id);
                }
                fn();
            });
            this.rafIds_.add(id);
            return id;
        }
        requestNamedAnimationFrame(name, fn) {
            if (this.namedRafs_.has(name)) {
                return;
            }
            this.clearTimersOnDispose_();
            fn = Fn.bind(this, fn);
            const id = this.requestAnimationFrame(() => {
                fn();
                if (this.namedRafs_.has(name)) {
                    this.namedRafs_.delete(name);
                }
            });
            this.namedRafs_.set(name, id);
            return name;
        }
        cancelNamedAnimationFrame(name) {
            if (!this.namedRafs_.has(name)) {
                return;
            }
            this.cancelAnimationFrame(this.namedRafs_.get(name));
            this.namedRafs_.delete(name);
        }
        cancelAnimationFrame(id) {
            if (!this.supportsRaf_) {
                return this.clearTimeout(id);
            }
            if (this.rafIds_.has(id)) {
                this.rafIds_.delete(id);
                window.cancelAnimationFrame(id);
            }
            return id;
        }
        clearTimersOnDispose_() {
            if (this.clearingTimersOnDispose_) {
                return;
            }
            this.clearingTimersOnDispose_ = true;
            this.listenToOnce('dispose', () => {
                [
                    [
                        'namedRafs_',
                        'cancelNamedAnimationFrame'
                    ],
                    [
                        'rafIds_',
                        'cancelAnimationFrame'
                    ],
                    [
                        'setTimeoutIds_',
                        'clearTimeout'
                    ],
                    [
                        'setIntervalIds_',
                        'clearInterval'
                    ]
                ].forEach(([idName, cancelName]) => {
                    this[idName].forEach((val, key) => this[cancelName](key));
                });
                this.clearingTimersOnDispose_ = false;
            });
        }
        static registerComponent(name, ComponentToRegister) {
            if (typeof name !== 'string' || !name) {
                throw new Error(`Illegal component name, "${ name }"; must be a non-empty string.`);
            }
            const Tech = Component.getComponent('Tech');
            const isTech = Tech && Tech.isTech(ComponentToRegister);
            const isComp = Component === ComponentToRegister || Component.prototype.isPrototypeOf(ComponentToRegister.prototype);
            if (isTech || !isComp) {
                let reason;
                if (isTech) {
                    reason = 'techs must be registered using Tech.registerTech()';
                } else {
                    reason = 'must be a Component subclass';
                }
                throw new Error(`Illegal component, "${ name }"; ${ reason }.`);
            }
            name = stringCases.toTitleCase(name);
            if (!Component.components_) {
                Component.components_ = {};
            }
            const Player = Component.getComponent('Player');
            if (name === 'Player' && Player && Player.players) {
                const players = Player.players;
                const playerNames = Object.keys(players);
                if (players && playerNames.length > 0 && playerNames.map(pname => players[pname]).every(Boolean)) {
                    throw new Error('Can not register Player component after player has been created.');
                }
            }
            Component.components_[name] = ComponentToRegister;
            Component.components_[stringCases.toLowerCase(name)] = ComponentToRegister;
            return ComponentToRegister;
        }
        static getComponent(name) {
            if (!name || !Component.components_) {
                return;
            }
            return Component.components_[name];
        }
    }

    Component.prototype.getAttribute = Component.prototype.getAttr;
    Component.prototype.setAttribute = Component.prototype.getAttr;
    Component.prototype.removeAttribute = Component.prototype.removeAttr;


    Component.prototype.supportsRaf_ = typeof window.requestAnimationFrame === 'function' && typeof window.cancelAnimationFrame === 'function';
    Component.registerComponent('Component', Component);
    return Component;
});
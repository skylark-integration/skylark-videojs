define([
    './component',
    './utils/dom',
    './utils/log',
    './utils/obj',
    './utils/keycode'
], function (Component, Dom, log, obj, keycode) {
    'use strict';
    class ClickableComponent extends Component {
        constructor(player, options) {
            super(player, options);
            this.emitTapEvents();
            this.enable();
        }
        createEl(tag = 'div', props = {}, attributes = {}) {
            props = obj.assign({
                innerHTML: '<span aria-hidden="true" class="vjs-icon-placeholder"></span>',
                className: this.buildCSSClass(),
                tabIndex: 0
            }, props);
            if (tag === 'button') {
                log.error(`Creating a ClickableComponent with an HTML element of ${ tag } is not supported; use a Button instead.`);
            }
            attributes = obj.assign({ role: 'button' }, attributes);
            this.tabIndex_ = props.tabIndex;
            const el = super.createEl(tag, props, attributes);
            this.createControlTextEl(el);
            return el;
        }
        dispose() {
            this.controlTextEl_ = null;
            super.dispose();
        }
        createControlTextEl(el) {
            this.controlTextEl_ = Dom.createEl('span', { className: 'vjs-control-text' }, { 'aria-live': 'polite' });
            if (el) {
                el.appendChild(this.controlTextEl_);
            }
            this.controlText(this.controlText_, el);
            return this.controlTextEl_;
        }
        controlText(text, el = this.el()) {
            if (text === undefined) {
                return this.controlText_ || 'Need Text';
            }
            const localizedText = this.localize(text);
            this.controlText_ = text;
            Dom.textContent(this.controlTextEl_, localizedText);
            if (!this.nonIconControl) {
                el.setAttribute('title', localizedText);
            }
        }
        buildCSSClass() {
            return `vjs-control vjs-button ${ super.buildCSSClass() }`;
        }
        enable() {
            if (!this.enabled_) {
                this.enabled_ = true;
                this.removeClass('vjs-disabled');
                this.el_.setAttribute('aria-disabled', 'false');
                if (typeof this.tabIndex_ !== 'undefined') {
                    this.el_.setAttribute('tabIndex', this.tabIndex_);
                }
                this.on([
                    'tap',
                    'click'
                ], this.handleClick);
                this.on('keydown', this.handleKeyDown);
            }
        }
        disable() {
            this.enabled_ = false;
            this.addClass('vjs-disabled');
            this.el_.setAttribute('aria-disabled', 'true');
            if (typeof this.tabIndex_ !== 'undefined') {
                this.el_.removeAttribute('tabIndex');
            }
            this.off('mouseover', this.handleMouseOver);
            this.off('mouseout', this.handleMouseOut);
            this.off([
                'tap',
                'click'
            ], this.handleClick);
            this.off('keydown', this.handleKeyDown);
        }
        handleLanguagechange() {
            this.controlText(this.controlText_);
        }
        handleClick(event) {
            if (this.options_.clickHandler) {
                this.options_.clickHandler.call(this, arguments);
            }
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
                event.preventDefault();
                event.stopPropagation();
                this.trigger('click');
            } else {
                super.handleKeyDown(event);
            }
        }
    }
    Component.registerComponent('ClickableComponent', ClickableComponent);
    return ClickableComponent;
});
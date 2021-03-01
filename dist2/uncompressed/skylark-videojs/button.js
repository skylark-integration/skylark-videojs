define([
    './clickable-component',
    './component',
    './utils/log',
    './utils/obj',
    './utils/keycode'
], function (ClickableComponent, Component, log, obj, keycode) {
    'use strict';
    class Button extends ClickableComponent {
        createEl(tag, props = {}, attributes = {}) {
            tag = 'button';
            props = obj.assign({
                innerHTML: '<span aria-hidden="true" class="vjs-icon-placeholder"></span>',
                className: this.buildCSSClass()
            }, props);
            attributes = obj.assign({ type: 'button' }, attributes);
            const el = Component.prototype.createEl.call(this, tag, props, attributes);
            this.createControlTextEl(el);
            return el;
        }
        addChild(child, options = {}) {
            const className = this.constructor.name;
            log.warn(`Adding an actionable (user controllable) child to a Button (${ className }) is not supported; use a ClickableComponent instead.`);
            return Component.prototype.addChild.call(this, child, options);
        }
        enable() {
            super.enable();
            this.el_.removeAttribute('disabled');
        }
        disable() {
            super.disable();
            this.el_.setAttribute('disabled', 'disabled');
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Space') || keycode.isEventKey(event, 'Enter')) {
                event.stopPropagation();
                return;
            }
            super.handleKeyDown(event);
        }
    }
    Component.registerComponent('Button', Button);
    return Button;
});
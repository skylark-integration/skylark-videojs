define([
    'skylark-langx-globals/document',
    '../component',
    '../utils/dom',
    '../utils/fn',
    '../utils/events',
    '../utils/keycode'
], function (document,Component, Dom, Fn, Events, keycode) {
    'use strict';
    class Menu extends Component {
        constructor(player, options) {
            super(player, options);
            if (options) {
                this.menuButton_ = options.menuButton;
            }
            this.focusedChild_ = -1;
            this.listenTo('keydown', this.handleKeyDown);
            this.boundHandleBlur_ = Fn.bind(this, this.handleBlur);
            this.boundHandleTapClick_ = Fn.bind(this, this.handleTapClick);
        }
        addEventListenerForItem(component) {
            if (!(component instanceof Component)) {
                return;
            }
            this.listenTo(component, 'blur', this.boundHandleBlur_);
            this.listenTo(component, [
                'tap',
                'click'
            ], this.boundHandleTapClick_);
        }
        removeEventListenerForItem(component) {
            if (!(component instanceof Component)) {
                return;
            }
            this.unlistenTo(component, 'blur', this.boundHandleBlur_);
            this.unlistenTo(component, [
                'tap',
                'click'
            ], this.boundHandleTapClick_);
        }
        removeChild(component) {
            if (typeof component === 'string') {
                component = this.getChild(component);
            }
            this.removeEventListenerForItem(component);
            super.removeChild(component);
        }
        addItem(component) {
            const childComponent = this.addChild(component);
            if (childComponent) {
                this.addEventListenerForItem(childComponent);
            }
        }
        createEl() {
            const contentElType = this.options_.contentElType || 'ul';
            this.contentEl_ = Dom.createEl(contentElType, { className: 'vjs-menu-content' });
            this.contentEl_.setAttribute('role', 'menu');
            const el = super.createEl('div', {
                append: this.contentEl_,
                className: 'vjs-menu'
            });
            el.appendChild(this.contentEl_);
            Events.on(el, 'click', function (event) {
                event.preventDefault();
                event.stopImmediatePropagation();
            });
            return el;
        }
        dispose() {
            this.contentEl_ = null;
            this.boundHandleBlur_ = null;
            this.boundHandleTapClick_ = null;
            super.dispose();
        }
        handleBlur(event) {
            const relatedTarget = event.relatedTarget || document.activeElement;
            if (!this.children().some(element => {
                    return element.el() === relatedTarget;
                })) {
                const btn = this.menuButton_;
                if (btn && btn.buttonPressed_ && relatedTarget !== btn.el().firstChild) {
                    btn.unpressButton();
                }
            }
        }
        handleTapClick(event) {
            if (this.menuButton_) {
                this.menuButton_.unpressButton();
                const childComponents = this.children();
                if (!Array.isArray(childComponents)) {
                    return;
                }
                const foundComponent = childComponents.filter(component => component.el() === event.target)[0];
                if (!foundComponent) {
                    return;
                }
                if (foundComponent.name() !== 'CaptionSettingsMenuItem') {
                    this.menuButton_.focus();
                }
            }
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Left') || keycode.isEventKey(event, 'Down')) {
                event.preventDefault();
                event.stopPropagation();
                this.stepForward();
            } else if (keycode.isEventKey(event, 'Right') || keycode.isEventKey(event, 'Up')) {
                event.preventDefault();
                event.stopPropagation();
                this.stepBack();
            }
        }
        stepForward() {
            let stepChild = 0;
            if (this.focusedChild_ !== undefined) {
                stepChild = this.focusedChild_ + 1;
            }
            this.focus(stepChild);
        }
        stepBack() {
            let stepChild = 0;
            if (this.focusedChild_ !== undefined) {
                stepChild = this.focusedChild_ - 1;
            }
            this.focus(stepChild);
        }
        focus(item = 0) {
            const children = this.children().slice();
            const haveTitle = children.length && children[0].hasClass('vjs-menu-title');
            if (haveTitle) {
                children.shift();
            }
            if (children.length > 0) {
                if (item < 0) {
                    item = 0;
                } else if (item >= children.length) {
                    item = children.length - 1;
                }
                this.focusedChild_ = item;
                children[item].el_.focus();
            }
        }
    }
    Component.registerComponent('Menu', Menu);
    return Menu;
});
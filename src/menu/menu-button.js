define([
    '../button',
    '../component',
    './menu',
    '../utils/dom',
    '../utils/fn',
    '../utils/events',
    '../utils/string-cases',
    '../utils/browser',
    '../utils/keycode'
], function (Button, Component, Menu, Dom, Fn, Events, stringCases, browser, keycode) {
    'use strict';
    class MenuButton extends Component {
        constructor(player, options = {}) {
            super(player, options);
            this.menuButton_ = new Button(player, options);
            this.menuButton_.controlText(this.controlText_);
            this.menuButton_.el_.setAttribute('aria-haspopup', 'true');
            const buttonClass = Button.prototype.buildCSSClass();
            this.menuButton_.el_.className = this.buildCSSClass() + ' ' + buttonClass;
            this.menuButton_.removeClass('vjs-control');
            this.addChild(this.menuButton_);
            this.update();
            this.enabled_ = true;
            this.listenTo(this.menuButton_, 'tap', this.handleClick);
            this.listenTo(this.menuButton_, 'click', this.handleClick);
            this.listenTo(this.menuButton_, 'keydown', this.handleKeyDown);
            this.listenTo(this.menuButton_, 'mouseenter', () => {
                this.addClass('vjs-hover');
                this.menu.show();
                Events.on(document, 'keyup', Fn.bind(this, this.handleMenuKeyUp));
            });
            this.listenTo('mouseleave', this.handleMouseLeave);
            this.listenTo('keydown', this.handleSubmenuKeyDown);
        }
        update() {
            const menu = this.createMenu();
            if (this.menu) {
                this.menu.dispose();
                this.removeChild(this.menu);
            }
            this.menu = menu;
            this.addChild(menu);
            this.buttonPressed_ = false;
            this.menuButton_.el_.setAttribute('aria-expanded', 'false');
            if (this.items && this.items.length <= this.hideThreshold_) {
                this.hide();
            } else {
                this.show();
            }
        }
        createMenu() {
            const menu = new Menu(this.player_, { menuButton: this });
            this.hideThreshold_ = 0;
            if (this.options_.title) {
                const titleEl = Dom.createEl('li', {
                    className: 'vjs-menu-title',
                    innerHTML: stringCases.toTitleCase(this.options_.title),
                    tabIndex: -1
                });
                this.hideThreshold_ += 1;
                const titleComponent = new Component(this.player_, { el: titleEl });
                menu.addItem(titleComponent);
            }
            this.items = this.createItems();
            if (this.items) {
                for (let i = 0; i < this.items.length; i++) {
                    menu.addItem(this.items[i]);
                }
            }
            return menu;
        }
        createItems() {
        }
        createEl() {
            return super.createEl('div', { className: this.buildWrapperCSSClass() }, {});
        }
        buildWrapperCSSClass() {
            let menuButtonClass = 'vjs-menu-button';
            if (this.options_.inline === true) {
                menuButtonClass += '-inline';
            } else {
                menuButtonClass += '-popup';
            }
            const buttonClass = Button.prototype.buildCSSClass();
            return `vjs-menu-button ${ menuButtonClass } ${ buttonClass } ${ super.buildCSSClass() }`;
        }
        buildCSSClass() {
            let menuButtonClass = 'vjs-menu-button';
            if (this.options_.inline === true) {
                menuButtonClass += '-inline';
            } else {
                menuButtonClass += '-popup';
            }
            return `vjs-menu-button ${ menuButtonClass } ${ super.buildCSSClass() }`;
        }
        controlText(text, el = this.menuButton_.el()) {
            return this.menuButton_.controlText(text, el);
        }
        dispose() {
            this.handleMouseLeave();
            super.dispose();
        }
        handleClick(event) {
            if (this.buttonPressed_) {
                this.unpressButton();
            } else {
                this.pressButton();
            }
        }
        handleMouseLeave(event) {
            this.removeClass('vjs-hover');
            Events.off(document, 'keyup', Fn.bind(this, this.handleMenuKeyUp));
        }
        focus() {
            this.menuButton_.focus();
        }
        blur() {
            this.menuButton_.blur();
        }
        handleKeyDown(event) {
            if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
                if (this.buttonPressed_) {
                    this.unpressButton();
                }
                if (!keycode.isEventKey(event, 'Tab')) {
                    event.preventDefault();
                    this.menuButton_.focus();
                }
            } else if (keycode.isEventKey(event, 'Up') || keycode.isEventKey(event, 'Down')) {
                if (!this.buttonPressed_) {
                    event.preventDefault();
                    this.pressButton();
                }
            }
        }
        handleMenuKeyUp(event) {
            if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
                this.removeClass('vjs-hover');
            }
        }
        handleSubmenuKeyPress(event) {
            this.handleSubmenuKeyDown(event);
        }
        handleSubmenuKeyDown(event) {
            if (keycode.isEventKey(event, 'Esc') || keycode.isEventKey(event, 'Tab')) {
                if (this.buttonPressed_) {
                    this.unpressButton();
                }
                if (!keycode.isEventKey(event, 'Tab')) {
                    event.preventDefault();
                    this.menuButton_.focus();
                }
            } else {
            }
        }
        pressButton() {
            if (this.enabled_) {
                this.buttonPressed_ = true;
                this.menu.show();
                this.menu.lockShowing();
                this.menuButton_.el_.setAttribute('aria-expanded', 'true');
                if (browser.IS_IOS && Dom.isInFrame()) {
                    return;
                }
                this.menu.focus();
            }
        }
        unpressButton() {
            if (this.enabled_) {
                this.buttonPressed_ = false;
                this.menu.unlockShowing();
                this.menu.hide();
                this.menuButton_.el_.setAttribute('aria-expanded', 'false');
            }
        }
        disable() {
            this.unpressButton();
            this.enabled_ = false;
            this.addClass('vjs-disabled');
            this.menuButton_.disable();
        }
        enable() {
            this.enabled_ = true;
            this.removeClass('vjs-disabled');
            this.menuButton_.enable();
        }
    }
    Component.registerComponent('MenuButton', MenuButton);
    return MenuButton;
});
define([
    '../clickable-component',
    '../component',
    '../utils/obj',
    './menu-keys',
    '../utils/keycode'
], function (ClickableComponent, Component, obj, MenuKeys, keycode) {
    'use strict';
    class MenuItem extends ClickableComponent {
        constructor(player, options) {
            super(player, options);
            this.selectable = options.selectable;
            this.isSelected_ = options.selected || false;
            this.multiSelectable = options.multiSelectable;
            this.selected(this.isSelected_);
            if (this.selectable) {
                if (this.multiSelectable) {
                    this.el_.setAttribute('role', 'menuitemcheckbox');
                } else {
                    this.el_.setAttribute('role', 'menuitemradio');
                }
            } else {
                this.el_.setAttribute('role', 'menuitem');
            }
        }
        createEl(type, props, attrs) {
            this.nonIconControl = true;
            return super.createEl('li', obj.assign({
                className: 'vjs-menu-item',
                innerHTML: `<span class="vjs-menu-item-text">${ this.localize(this.options_.label) }</span>`,
                tabIndex: -1
            }, props), attrs);
        }
        handleKeyDown(event) {
            if (!MenuKeys.some(key => keycode.isEventKey(event, key))) {
                super.handleKeyDown(event);
            }
        }
        handleClick(event) {
            this.selected(true);
        }
        selected(selected) {
            if (this.selectable) {
                if (selected) {
                    this.addClass('vjs-selected');
                    this.el_.setAttribute('aria-checked', 'true');
                    this.controlText(', selected');
                    this.isSelected_ = true;
                } else {
                    this.removeClass('vjs-selected');
                    this.el_.setAttribute('aria-checked', 'false');
                    this.controlText('');
                    this.isSelected_ = false;
                }
            }
        }
    }
    Component.registerComponent('MenuItem', MenuItem);
    return MenuItem;
});
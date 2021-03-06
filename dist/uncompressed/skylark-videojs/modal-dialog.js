define([
    'skylark-langx-globals/document',
    './utils/dom',
    './component',
    './utils/keycode'
], function (document,Dom, Component, keycode) {
    'use strict';
    const MODAL_CLASS_NAME = 'vjs-modal-dialog';
    class ModalDialog extends Component {
        constructor(player, options) {
            super(player, options);
            this.opened_ = this.hasBeenOpened_ = this.hasBeenFilled_ = false;
            this.closeable(!this.options_.uncloseable);
            this.content(this.options_.content);
            this.contentEl_ = Dom.createEl('div', { className: `${ MODAL_CLASS_NAME }-content` }, { role: 'document' });
            this.descEl_ = Dom.createEl('p', {
                className: `${ MODAL_CLASS_NAME }-description vjs-control-text`,
                id: this.el().getAttribute('aria-describedby')
            });
            Dom.textContent(this.descEl_, this.description());
            this.el_.appendChild(this.descEl_);
            this.el_.appendChild(this.contentEl_);
        }
        createEl() {
            return super.createEl('div', {
                className: this.buildCSSClass(),
                tabIndex: -1
            }, {
                'aria-describedby': `${ this.id() }_description`,
                'aria-hidden': 'true',
                'aria-label': this.label(),
                'role': 'dialog'
            });
        }
        dispose() {
            this.contentEl_ = null;
            this.descEl_ = null;
            this.previouslyActiveEl_ = null;
            super.dispose();
        }
        buildCSSClass() {
            return `${ MODAL_CLASS_NAME } vjs-hidden ${ super.buildCSSClass() }`;
        }
        label() {
            return this.localize(this.options_.label || 'Modal Window');
        }
        description() {
            let desc = this.options_.description || this.localize('This is a modal window.');
            if (this.closeable()) {
                desc += ' ' + this.localize('This modal can be closed by pressing the Escape key or activating the close button.');
            }
            return desc;
        }
        open() {
            if (!this.opened_) {
                const player = this.player();
                this.trigger('beforemodalopen');
                this.opened_ = true;
                if (this.options_.fillAlways || !this.hasBeenOpened_ && !this.hasBeenFilled_) {
                    this.fill();
                }
                this.wasPlaying_ = !player.paused();
                if (this.options_.pauseOnOpen && this.wasPlaying_) {
                    player.pause();
                }
                this.listenTo('keydown', this.handleKeyDown);
                this.hadControls_ = player.controls();
                player.controls(false);
                this.show();
                this.conditionalFocus_();
                this.el().setAttribute('aria-hidden', 'false');
                this.trigger('modalopen');
                this.hasBeenOpened_ = true;
            }
        }
        opened(value) {
            if (typeof value === 'boolean') {
                this[value ? 'open' : 'close']();
            }
            return this.opened_;
        }
        close() {
            if (!this.opened_) {
                return;
            }
            const player = this.player();
            this.trigger('beforemodalclose');
            this.opened_ = false;
            if (this.wasPlaying_ && this.options_.pauseOnOpen) {
                player.play();
            }
            this.unlistenTo('keydown', this.handleKeyDown);
            if (this.hadControls_) {
                player.controls(true);
            }
            this.hide();
            this.el().setAttribute('aria-hidden', 'true');
            this.trigger('modalclose');
            this.conditionalBlur_();
            if (this.options_.temporary) {
                this.dispose();
            }
        }
        closeable(value) {
            if (typeof value === 'boolean') {
                const closeable = this.closeable_ = !!value;
                let close = this.getChild('closeButton');
                if (closeable && !close) {
                    const temp = this.contentEl_;
                    this.contentEl_ = this.el_;
                    close = this.addChild('closeButton', { controlText: 'Close Modal Dialog' });
                    this.contentEl_ = temp;
                    this.listenTo(close, 'close', this.close);
                }
                if (!closeable && close) {
                    this.unlistenTo(close, 'close', this.close);
                    this.removeChild(close);
                    close.dispose();
                }
            }
            return this.closeable_;
        }
        fill() {
            this.fillWith(this.content());
        }
        fillWith(content) {
            const contentEl = this.contentEl();
            const parentEl = contentEl.parentNode;
            const nextSiblingEl = contentEl.nextSibling;
            this.trigger('beforemodalfill');
            this.hasBeenFilled_ = true;
            parentEl.removeChild(contentEl);
            this.empty();
            Dom.insertContent(contentEl, content);
            this.trigger('modalfill');
            if (nextSiblingEl) {
                parentEl.insertBefore(contentEl, nextSiblingEl);
            } else {
                parentEl.appendChild(contentEl);
            }
            const closeButton = this.getChild('closeButton');
            if (closeButton) {
                parentEl.appendChild(closeButton.el_);
            }
        }
        empty() {
            this.trigger('beforemodalempty');
            Dom.emptyEl(this.contentEl());
            this.trigger('modalempty');
        }
        content(value) {
            if (typeof value !== 'undefined') {
                this.content_ = value;
            }
            return this.content_;
        }
        conditionalFocus_() {
            const activeEl = document.activeElement;
            const playerEl = this.player_.el_;
            this.previouslyActiveEl_ = null;
            if (playerEl.contains(activeEl) || playerEl === activeEl) {
                this.previouslyActiveEl_ = activeEl;
                this.focus();
            }
        }
        conditionalBlur_() {
            if (this.previouslyActiveEl_) {
                this.previouslyActiveEl_.focus();
                this.previouslyActiveEl_ = null;
            }
        }
        handleKeyDown(event) {
            event.stopPropagation();
            if (keycode.isEventKey(event, 'Escape') && this.closeable()) {
                event.preventDefault();
                this.close();
                return;
            }
            if (!keycode.isEventKey(event, 'Tab')) {
                return;
            }
            const focusableEls = this.focusableEls_();
            const activeEl = this.el_.querySelector(':focus');
            let focusIndex;
            for (let i = 0; i < focusableEls.length; i++) {
                if (activeEl === focusableEls[i]) {
                    focusIndex = i;
                    break;
                }
            }
            if (document.activeElement === this.el_) {
                focusIndex = 0;
            }
            if (event.shiftKey && focusIndex === 0) {
                focusableEls[focusableEls.length - 1].focus();
                event.preventDefault();
            } else if (!event.shiftKey && focusIndex === focusableEls.length - 1) {
                focusableEls[0].focus();
                event.preventDefault();
            }
        }
        focusableEls_() {
            const allChildren = this.el_.querySelectorAll('*');
            return Array.prototype.filter.call(allChildren, child => {
                return (child instanceof window.HTMLAnchorElement || child instanceof window.HTMLAreaElement) && child.hasAttribute('href') || (child instanceof window.HTMLInputElement || child instanceof window.HTMLSelectElement || child instanceof window.HTMLTextAreaElement || child instanceof window.HTMLButtonElement) && !child.hasAttribute('disabled') || (child instanceof window.HTMLIFrameElement || child instanceof window.HTMLObjectElement || child instanceof window.HTMLEmbedElement) || child.hasAttribute('tabindex') && child.getAttribute('tabindex') !== -1 || child.hasAttribute('contenteditable');
            });
        }
    }
    ModalDialog.prototype.options_ = {
        pauseOnOpen: true,
        temporary: true
    };
    Component.registerComponent('ModalDialog', ModalDialog);
    return ModalDialog;
});
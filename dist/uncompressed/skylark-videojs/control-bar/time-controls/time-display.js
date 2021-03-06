define([
    'skylark-langx-globals/document',
    '../../component',
    '../../utils/dom',
    '../../utils/format-time',
    '../../utils/log'
], function (document, Component, Dom, formatTime, log) {
    'use strict';
    class TimeDisplay extends Component {
        constructor(player, options) {
            super(player, options);
            this.listenTo(player, [
                'timeupdate',
                'ended'
            ], this.updateContent);
            this.updateTextNode_();
        }
        createEl() {
            const className = this.buildCSSClass();
            const el = super.createEl('div', {
                className: `${ className } vjs-time-control vjs-control`,
                innerHTML: `<span class="vjs-control-text" role="presentation">${ this.localize(this.labelText_) }\u00a0</span>`
            });
            this.contentEl_ = Dom.createEl('span', { className: `${ className }-display` }, {
                'aria-live': 'off',
                'role': 'presentation'
            });
            el.appendChild(this.contentEl_);
            return el;
        }
        dispose() {
            this.contentEl_ = null;
            this.textNode_ = null;
            super.dispose();
        }
        updateTextNode_(time = 0) {
            time = formatTime(time);
            if (this.formattedTime_ === time) {
                return;
            }
            this.formattedTime_ = time;
            this.requestNamedAnimationFrame('TimeDisplay#updateTextNode_', () => {
                if (!this.contentEl_) {
                    return;
                }
                let oldNode = this.textNode_;
                if (oldNode && this.contentEl_.firstChild !== oldNode) {
                    oldNode = null;
                    log.warn('TimeDisplay#updateTextnode_: Prevented replacement of text node element since it was no longer a child of this node. Appending a new node instead.');
                }
                this.textNode_ = document.createTextNode(this.formattedTime_);
                if (!this.textNode_) {
                    return;
                }
                if (oldNode) {
                    this.contentEl_.replaceChild(this.textNode_, oldNode);
                } else {
                    this.contentEl_.appendChild(this.textNode_);
                }
            });
        }
        updateContent(event) {
        }
    }
    TimeDisplay.prototype.labelText_ = 'Time';
    TimeDisplay.prototype.controlText_ = 'Time';
    Component.registerComponent('TimeDisplay', TimeDisplay);
    return TimeDisplay;
});
define([
    'skylark-langx-globals/document',
    '../../component',
    '../../utils/dom',
    '../../utils/clamp'
], function (document,Component, Dom, clamp) {
    'use strict';
    const percentify = (time, end) => clamp(time / end * 100, 0, 100).toFixed(2) + '%';
    class LoadProgressBar extends Component {
        constructor(player, options) {
            super(player, options);
            this.partEls_ = [];
            this.listenTo(player, 'progress', this.update);
        }
        createEl() {
            const el = super.createEl('div', { className: 'vjs-load-progress' });
            const wrapper = Dom.createEl('span', { className: 'vjs-control-text' });
            const loadedText = Dom.createEl('span', { textContent: this.localize('Loaded') });
            const separator = document.createTextNode(': ');
            this.percentageEl_ = Dom.createEl('span', {
                className: 'vjs-control-text-loaded-percentage',
                textContent: '0%'
            });
            el.appendChild(wrapper);
            wrapper.appendChild(loadedText);
            wrapper.appendChild(separator);
            wrapper.appendChild(this.percentageEl_);
            return el;
        }
        dispose() {
            this.partEls_ = null;
            this.percentageEl_ = null;
            super.dispose();
        }
        update(event) {
            this.requestNamedAnimationFrame('LoadProgressBar#update', () => {
                const liveTracker = this.player_.liveTracker;
                const buffered = this.player_.buffered();
                const duration = liveTracker && liveTracker.isLive() ? liveTracker.seekableEnd() : this.player_.duration();
                const bufferedEnd = this.player_.bufferedEnd();
                const children = this.partEls_;
                const percent = percentify(bufferedEnd, duration);
                if (this.percent_ !== percent) {
                    this.el_.style.width = percent;
                    Dom.textContent(this.percentageEl_, percent);
                    this.percent_ = percent;
                }
                for (let i = 0; i < buffered.length; i++) {
                    const start = buffered.start(i);
                    const end = buffered.end(i);
                    let part = children[i];
                    if (!part) {
                        part = this.el_.appendChild(Dom.createEl());
                        children[i] = part;
                    }
                    if (part.dataset.start === start && part.dataset.end === end) {
                        continue;
                    }
                    part.dataset.start = start;
                    part.dataset.end = end;
                    part.style.left = percentify(start, bufferedEnd);
                    part.style.width = percentify(end - start, bufferedEnd);
                }
                for (let i = children.length; i > buffered.length; i--) {
                    this.el_.removeChild(children[i - 1]);
                }
                children.length = buffered.length;
            });
        }
    }
    Component.registerComponent('LoadProgressBar', LoadProgressBar);
    return LoadProgressBar;
});
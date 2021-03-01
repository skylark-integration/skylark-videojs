define([
    '../utils/guid',
    '../event-target'
], function (Guid, EventTarget) {
    'use strict';
    class Track extends EventTarget {
        constructor(options = {}) {
            super();
            const trackProps = {
                id: options.id || 'vjs_track_' + Guid.newGUID(),
                kind: options.kind || '',
                language: options.language || ''
            };
            let label = options.label || '';
            for (const key in trackProps) {
                Object.defineProperty(this, key, {
                    get() {
                        return trackProps[key];
                    },
                    set() {
                    }
                });
            }
            Object.defineProperty(this, 'label', {
                get() {
                    return label;
                },
                set(newLabel) {
                    if (newLabel !== label) {
                        label = newLabel;
                        this.trigger('labelchange');
                    }
                }
            });
        }
    }
    return Track;
});
define([
    ///'./evented',
    '../utils/obj'
], function (Obj) {
    'use strict';
    const StatefulMixin = {
        state: {},
        setState(stateUpdates) {
            if (typeof stateUpdates === 'function') {
                stateUpdates = stateUpdates();
            }
            let changes;
            Obj.each(stateUpdates, (value, key) => {
                if (this.state[key] !== value) {
                    changes = changes || {};
                    changes[key] = {
                        from: this.state[key],
                        to: value
                    };
                }
                this.state[key] = value;
            });
            //if (changes && evented.isEvented(this)) {
            if (changes && this.trigger) {
                this.trigger({
                    changes,
                    type: 'statechanged'
                });
            }
            return changes;
        }
    };
    function stateful(target, defaultState) {
        Obj.assign(target, StatefulMixin);
        target.state = Obj.assign({}, target.state, defaultState);
        ///if (typeof target.handleStateChanged === 'function' && evented.isEvented(target)) {
        if (typeof target.handleStateChanged === 'function' && target.on) {
            target.on('statechanged', target.handleStateChanged);
        }
        return target;
    }
    return stateful;
});
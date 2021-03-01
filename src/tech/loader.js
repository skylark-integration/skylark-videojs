define([
    '../component',
    './tech',
    '../utils/string-cases',
    '../utils/merge-options'
], function (Component, Tech, stringCases, mergeOptions) {
    'use strict';
    class MediaLoader extends Component {
        constructor(player, options, ready) {
            const options_ = mergeOptions({ createEl: false }, options);
            super(player, options_, ready);
            if (!options.playerOptions.sources || options.playerOptions.sources.length === 0) {
                for (let i = 0, j = options.playerOptions.techOrder; i < j.length; i++) {
                    const techName = stringCases.toTitleCase(j[i]);
                    let tech = Tech.getTech(techName);
                    if (!techName) {
                        tech = Component.getComponent(techName);
                    }
                    if (tech && tech.isSupported()) {
                        player.loadTech_(techName);
                        break;
                    }
                }
            } else {
                player.src(options.playerOptions.sources);
            }
        }
    }
    Component.registerComponent('MediaLoader', MediaLoader);
    return MediaLoader;
});
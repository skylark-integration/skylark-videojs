define([
    ///'./mixins/evented',
    './mixins/stateful',
    './utils/events',
    './utils/fn',
    './utils/log',
    "./event-target",
    './player'
], function ( stateful, Events, Fn, log, EventTarget, Player) {
    'use strict';
    const BASE_PLUGIN_NAME = 'plugin';
    const PLUGIN_CACHE_KEY = 'activePlugins_';
    const pluginStorage = {};
    const pluginExists = name => pluginStorage.hasOwnProperty(name);
    const getPlugin = name => pluginExists(name) ? pluginStorage[name] : undefined;
    const markPluginAsActive = (player, name) => {
        player[PLUGIN_CACHE_KEY] = player[PLUGIN_CACHE_KEY] || {};
        player[PLUGIN_CACHE_KEY][name] = true;
    };
    const triggerSetupEvent = (player, hash, before) => {
        const eventName = (before ? 'before' : '') + 'pluginsetup';
        player.trigger(eventName, hash);
        player.trigger(eventName + ':' + hash.name, hash);
    };
    const createBasicPlugin = function (name, plugin) {
        const basicPluginWrapper = function () {
            triggerSetupEvent(this, {
                name,
                plugin,
                instance: null
            }, true);
            const instance = plugin.apply(this, arguments);
            markPluginAsActive(this, name);
            triggerSetupEvent(this, {
                name,
                plugin,
                instance
            });
            return instance;
        };
        Object.keys(plugin).forEach(function (prop) {
            basicPluginWrapper[prop] = plugin[prop];
        });
        return basicPluginWrapper;
    };
    const createPluginFactory = (name, PluginSubClass) => {
        PluginSubClass.prototype.name = name;
        return function (...args) {
            triggerSetupEvent(this, {
                name,
                plugin: PluginSubClass,
                instance: null
            }, true);
            const instance = new PluginSubClass(...[
                this,
                ...args
            ]);
            this[name] = () => instance;
            triggerSetupEvent(this, instance.getEventHash());
            return instance;
        };
    };
    class Plugin  extends EventTarget{
        constructor(player) {
            if (this.constructor === Plugin) {
                throw new Error('Plugin must be sub-classed; not directly instantiated.');
            }
            this.player = player;
            if (!this.log) {
                this.log = this.player.log.createLogger(this.name);
            }
            ///evented(this);
            ///delete this.trigger;
            stateful(this, this.constructor.defaultState);
            markPluginAsActive(player, this.name);
            this.dispose = Fn.bind(this, this.dispose);
            player.on('dispose', this.dispose);
        }
        version() {
            return this.constructor.VERSION;
        }
        /*
        getEventHash(hash = {}) {
            hash.name = this.name;
            hash.plugin = this.constructor;
            hash.instance = this;
            return hash;
        }
        trigger(event, hash = {}) {
            return Events.trigger(this.eventBusEl_, event, this.getEventHash(hash));
        }
        */
        handleStateChanged(e) {
        }
        dispose() {
            const {name, player} = this;
            this.trigger('dispose');
            this.unlistenTo();
            player.off('dispose', this.dispose);
            player[PLUGIN_CACHE_KEY][name] = false;
            this.player = this.state = null;
            player[name] = createPluginFactory(name, pluginStorage[name]);
        }
        static isBasic(plugin) {
            const p = typeof plugin === 'string' ? getPlugin(plugin) : plugin;
            return typeof p === 'function' && !Plugin.prototype.isPrototypeOf(p.prototype);
        }
        static registerPlugin(name, plugin) {
            if (typeof name !== 'string') {
                throw new Error(`Illegal plugin name, "${ name }", must be a string, was ${ typeof name }.`);
            }
            if (pluginExists(name)) {
                log.warn(`A plugin named "${ name }" already exists. You may want to avoid re-registering plugins!`);
            } else if (Player.prototype.hasOwnProperty(name)) {
                throw new Error(`Illegal plugin name, "${ name }", cannot share a name with an existing player method!`);
            }
            if (typeof plugin !== 'function') {
                throw new Error(`Illegal plugin for "${ name }", must be a function, was ${ typeof plugin }.`);
            }
            pluginStorage[name] = plugin;
            if (name !== BASE_PLUGIN_NAME) {
                if (Plugin.isBasic(plugin)) {
                    Player.prototype[name] = createBasicPlugin(name, plugin);
                } else {
                    Player.prototype[name] = createPluginFactory(name, plugin);
                }
            }
            return plugin;
        }
        static deregisterPlugin(name) {
            if (name === BASE_PLUGIN_NAME) {
                throw new Error('Cannot de-register base plugin.');
            }
            if (pluginExists(name)) {
                delete pluginStorage[name];
                delete Player.prototype[name];
            }
        }
        static getPlugins(names = Object.keys(pluginStorage)) {
            let result;
            names.forEach(name => {
                const plugin = getPlugin(name);
                if (plugin) {
                    result = result || {};
                    result[name] = plugin;
                }
            });
            return result;
        }
        static getPluginVersion(name) {
            const plugin = getPlugin(name);
            return plugin && plugin.VERSION || '';
        }
    }
    Plugin.getPlugin = getPlugin;
    Plugin.BASE_PLUGIN_NAME = BASE_PLUGIN_NAME;
    Plugin.registerPlugin(BASE_PLUGIN_NAME, Plugin);
    Player.prototype.usingPlugin = function (name) {
        return !!this[PLUGIN_CACHE_KEY] && this[PLUGIN_CACHE_KEY][name] === true;
    };
    Player.prototype.hasPlugin = function (name) {
        return !!pluginExists(name);
    };
    return Plugin;
});
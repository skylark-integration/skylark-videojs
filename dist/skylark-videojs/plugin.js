/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./mixins/evented","./mixins/stateful","./utils/events","./utils/fn","./utils/log","./player"],function(t,e,i,n,s,r){"use strict";const o="plugin",a="activePlugins_",u={},l=t=>u.hasOwnProperty(t),g=t=>l(t)?u[t]:void 0,p=(t,e)=>{t[a]=t[a]||{},t[a][e]=!0},h=(t,e,i)=>{const n=(i?"before":"")+"pluginsetup";t.trigger(n,e),t.trigger(n+":"+e.name,e)},c=function(t,e){const i=function(){h(this,{name:t,plugin:e,instance:null},!0);const i=e.apply(this,arguments);return p(this,t),h(this,{name:t,plugin:e,instance:i}),i};return Object.keys(e).forEach(function(t){i[t]=e[t]}),i},f=(t,e)=>(e.prototype.name=t,function(...i){h(this,{name:t,plugin:e,instance:null},!0);const n=new e(...[this,...i]);return this[t]=(()=>n),h(this,n.getEventHash()),n});class y{constructor(i){if(this.constructor===y)throw new Error("Plugin must be sub-classed; not directly instantiated.");this.player=i,this.log||(this.log=this.player.log.createLogger(this.name)),t(this),delete this.trigger,e(this,this.constructor.defaultState),p(i,this.name),this.dispose=n.bind(this,this.dispose),i.on("dispose",this.dispose)}version(){return this.constructor.VERSION}getEventHash(t={}){return t.name=this.name,t.plugin=this.constructor,t.instance=this,t}trigger(t,e={}){return i.trigger(this.eventBusEl_,t,this.getEventHash(e))}handleStateChanged(t){}dispose(){const{name:t,player:e}=this;this.trigger("dispose"),this.unlistenTo(),e.off("dispose",this.dispose),e[a][t]=!1,this.player=this.state=null,e[t]=f(t,u[t])}static isBasic(t){const e="string"==typeof t?g(t):t;return"function"==typeof e&&!y.prototype.isPrototypeOf(e.prototype)}static registerPlugin(t,e){if("string"!=typeof t)throw new Error(`Illegal plugin name, "${t}", must be a string, was ${typeof t}.`);if(l(t))s.warn(`A plugin named "${t}" already exists. You may want to avoid re-registering plugins!`);else if(r.prototype.hasOwnProperty(t))throw new Error(`Illegal plugin name, "${t}", cannot share a name with an existing player method!`);if("function"!=typeof e)throw new Error(`Illegal plugin for "${t}", must be a function, was ${typeof e}.`);return u[t]=e,t!==o&&(y.isBasic(e)?r.prototype[t]=c(t,e):r.prototype[t]=f(t,e)),e}static deregisterPlugin(t){if(t===o)throw new Error("Cannot de-register base plugin.");l(t)&&(delete u[t],delete r.prototype[t])}static getPlugins(t=Object.keys(u)){let e;return t.forEach(t=>{const i=g(t);i&&((e=e||{})[t]=i)}),e}static getPluginVersion(t){const e=g(t);return e&&e.VERSION||""}}return y.getPlugin=g,y.BASE_PLUGIN_NAME=o,y.registerPlugin(o,y),r.prototype.usingPlugin=function(t){return!!this[a]&&!0===this[a][t]},r.prototype.hasPlugin=function(t){return!!l(t)},y});
//# sourceMappingURL=sourcemaps/plugin.js.map

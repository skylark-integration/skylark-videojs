/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./utils/events"],function(t){"use strict";const e=function(){};let n;return e.prototype.allowedEvents_={},e.prototype.on=function(e,n){const o=this.addEventListener;this.addEventListener=(()=>{}),t.on(this,e,n),this.addEventListener=o},e.prototype.addEventListener=e.prototype.on,e.prototype.off=function(e,n){t.off(this,e,n)},e.prototype.removeEventListener=e.prototype.off,e.prototype.one=function(e,n){const o=this.addEventListener;this.addEventListener=(()=>{}),t.one(this,e,n),this.addEventListener=o},e.prototype.any=function(e,n){const o=this.addEventListener;this.addEventListener=(()=>{}),t.any(this,e,n),this.addEventListener=o},e.prototype.trigger=function(e){const n=e.type||e;"string"==typeof e&&(e={type:n}),e=t.fixEvent(e),this.allowedEvents_[n]&&this["on"+n]&&this["on"+n](e),t.trigger(this,e)},e.prototype.dispatchEvent=e.prototype.trigger,e.prototype.queueTrigger=function(t){n||(n=new Map);const e=t.type||t;let o=n.get(this);o||(o=new Map,n.set(this,o));const i=o.get(e);o.delete(e),window.clearTimeout(i);const s=window.setTimeout(()=>{0===o.size&&(o=null,n.delete(this)),this.trigger(t)},0);o.set(e,s)},e});
//# sourceMappingURL=sourcemaps/event-target.js.map

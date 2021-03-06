/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-events/Emitter","./utils/events"],function(t,e){"use strict";var o=t.inherit({});let n;return o.prototype.addEventListener=o.prototype.on,o.prototype.dispatchEvent=o.prototype.trigger,o.prototype.removeEventListener=o.prototype.off,o.prototype.any=o.prototype.one,o.prototype.queueTrigger=function(t){n||(n=new Map);const e=t.type||t;let o=n.get(this);o||(o=new Map,n.set(this,o));const r=o.get(e);o.delete(e),window.clearTimeout(r);const i=window.setTimeout(()=>{0===o.size&&(o=null,n.delete(this)),this.trigger(t)},0);o.set(e,i)},o});
//# sourceMappingURL=sourcemaps/event-target.js.map

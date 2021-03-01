/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define([],function(){"use strict";return window.Set?window.Set:class{constructor(){this.set_={}}has(t){return t in this.set_}delete(t){const s=this.has(t);return delete this.set_[t],s}add(t){return this.set_[t]=1,this}forEach(t,s){for(const e in this.set_)t.call(s,e,e,this)}}});
//# sourceMappingURL=../sourcemaps/utils/set.js.map

/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define([],function(){"use strict";return window.Map?window.Map:class{constructor(){this.map_={}}has(t){return t in this.map_}delete(t){const s=this.has(t);return delete this.map_[t],s}set(t,s){return this.map_[t]=s,this}forEach(t,s){for(const i in this.map_)t.call(s,this.map_[i],i,this)}}});
//# sourceMappingURL=../sourcemaps/utils/map.js.map

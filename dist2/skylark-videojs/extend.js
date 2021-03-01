/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./utils/inherits"],function(t){"use strict";return function(o,n={}){let r=function(){o.apply(this,arguments)},e={};"object"==typeof n?(n.constructor!==Object.prototype.constructor&&(r=n.constructor),e=n):"function"==typeof n&&(r=n),t(r,o),o&&(r.super_=o);for(const t in e)e.hasOwnProperty(t)&&(r.prototype[t]=e[t]);return r}});
//# sourceMappingURL=sourcemaps/extend.js.map

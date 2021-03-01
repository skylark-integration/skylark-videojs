/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";const t=Object.prototype.toString,n=function(t){return e(t)?Object.keys(t):[]};function c(t,c){n(t).forEach(n=>c(t[n],n))}function e(t){return!!t&&"object"==typeof t}return{each:c,reduce:function(t,c,e=0){return n(t).reduce((n,e)=>c(n,t[e],e),e)},assign:function(t,...n){return Object.assign?Object.assign(t,...n):(n.forEach(n=>{n&&c(n,(n,c)=>{t[c]=n})}),t)},isObject:e,isPlain:function(n){return e(n)&&"[object Object]"===t.call(n)&&n.constructor===Object}}});
//# sourceMappingURL=../sourcemaps/utils/obj.js.map

/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";const e=function(e){return"string"!=typeof e?e:e.replace(/./,e=>e.toUpperCase())};return{toLowerCase:function(e){return"string"!=typeof e?e:e.replace(/./,e=>e.toLowerCase())},toTitleCase:e,titleCaseEquals:function(t,n){return e(t)===e(n)}}});
//# sourceMappingURL=../sourcemaps/utils/string-cases.js.map

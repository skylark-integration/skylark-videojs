/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";function e(e,n,t,r){return function(e,n,t){if("number"!=typeof n||n<0||n>t)throw new Error(`Failed to execute '${e}' on 'TimeRanges': The index provided (${n}) is non-numeric or out of bounds (0-${t}).`)}(e,r,t.length-1),t[r][n]}function n(n){return void 0===n||0===n.length?{length:0,start(){throw new Error("This TimeRanges object is empty")},end(){throw new Error("This TimeRanges object is empty")}}:{length:n.length,start:e.bind(null,"start",0,n),end:e.bind(null,"end",1,n)}}function t(e,t){return Array.isArray(e)?n(e):void 0===e||void 0===t?n():n([[e,t]])}return{createTimeRanges:t,createTimeRanges:t}});
//# sourceMappingURL=../sourcemaps/utils/time-ranges.js.map

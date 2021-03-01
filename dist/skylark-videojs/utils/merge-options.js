/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./obj"],function(n){"use strict";return function i(...t){const c={};return t.forEach(t=>{t&&n.each(t,(t,e)=>{n.isPlain(t)?(n.isPlain(c[e])||(c[e]={}),c[e]=i(c[e],t)):c[e]=t})}),c}});
//# sourceMappingURL=../sourcemaps/utils/merge-options.js.map

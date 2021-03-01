/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./guid"],function(n){"use strict";return{UPDATE_REFRESH_INTERVAL:30,bind:function(t,e,u){e.guid||(e.guid=n.newGUID());const i=e.bind(t);return i.guid=u?u+"_"+e.guid:e.guid,i},throttle:function(n,t){let e=window.performance.now();return function(...u){const i=window.performance.now();i-e>=t&&(n(...u),e=i)}},debounce:function(n,t,e,u=window){let i;const o=function(){const o=this,c=arguments;let r=function(){i=null,r=null,e||n.apply(o,c)};!i&&e&&n.apply(o,c),u.clearTimeout(i),i=u.setTimeout(r,t)};return o.cancel=(()=>{u.clearTimeout(i),i=null}),o}}});
//# sourceMappingURL=../sourcemaps/utils/fn.js.map

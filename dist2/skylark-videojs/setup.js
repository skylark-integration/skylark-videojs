/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","./utils/dom"],function(e,t){"use strict";let o,n=!1;const a=function(){if(!t.isReal()||!1===o.options.autoSetup)return;const a=Array.prototype.slice.call(e.getElementsByTagName("video")),l=Array.prototype.slice.call(e.getElementsByTagName("audio")),r=Array.prototype.slice.call(e.getElementsByTagName("video-js")),s=a.concat(l,r);if(s&&s.length>0)for(let e=0,t=s.length;e<t;e++){const t=s[e];if(!t||!t.getAttribute){i(1);break}if(void 0===t.player){null!==t.getAttribute("data-setup")&&o(t)}}else n||i(1)};function i(e,t){t&&(o=t),window.setTimeout(a,e)}function l(){n=!0,window.removeEventListener("load",l)}t.isReal()&&("complete"===e.readyState?l():window.addEventListener("load",l));return{autoSetup:a,autoSetupTimeout:i,hasLoaded:function(){return n}}});
//# sourceMappingURL=sourcemaps/setup.js.map

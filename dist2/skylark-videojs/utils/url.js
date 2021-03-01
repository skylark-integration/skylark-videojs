/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document"],function(o){"use strict";const t=function(t){const e=["protocol","hostname","port","pathname","search","hash","host"];let r=o.createElement("a");r.href=t;const n=""===r.host&&"file:"!==r.protocol;let s;n&&((s=o.createElement("div")).innerHTML=`<a href="${t}"></a>`,r=s.firstChild,s.setAttribute("style","display:none; position:absolute;"),o.body.appendChild(s));const l={};for(let o=0;o<e.length;o++)l[e[o]]=r[e[o]];return"http:"===l.protocol&&(l.host=l.host.replace(/:80$/,"")),"https:"===l.protocol&&(l.host=l.host.replace(/:443$/,"")),l.protocol||(l.protocol=window.location.protocol),n&&o.body.removeChild(s),l};return{parseUrl:t,getAbsoluteURL:function(t){if(!t.match(/^https?:\/\//)){const e=o.createElement("div");e.innerHTML=`<a href="${t}">x</a>`,t=e.firstChild.href}return t},getFileExtension:function(o){if("string"==typeof o){const t=/^(\/?)([\s\S]*?)((?:\.{1,2}|[^\/]+?)(\.([^\.\/\?]+)))(?:[\/]*|[\?].*)$/.exec(o);if(t)return t.pop().toLowerCase()}return""},isCrossOrigin:function(o,e=window.location){const r=t(o);return(":"===r.protocol?e.protocol:r.protocol)+r.host!==e.protocol+e.host}}});
//# sourceMappingURL=../sourcemaps/utils/url.js.map

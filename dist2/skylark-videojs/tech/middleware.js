/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../utils/obj","../utils/string-cases"],function(e,t){"use strict";const n={},u={},r={};function s(e){return(t,n)=>t===r?r:n[e]?n[e](t):t}return{TERMINATOR:r,use:function(e,t){n[e]=n[e]||[],n[e].push(t)},getMiddleware:function(e){return e?n[e]:n},setSource:function(t,r,s){t.setTimeout(()=>(function t(r={},s=[],o,i,l=[],c=!1){const[f,...d]=s;if("string"==typeof f)t(r,n[f],o,i,l,c);else if(f){const s=function(e,t){const n=u[e.id()];let r=null;if(void 0===n||null===n)return r=t(e),u[e.id()]=[[t,r]],r;for(let e=0;e<n.length;e++){const[u,s]=n[e];u===t&&(r=s)}return null===r&&(r=t(e),n.push([t,r])),r}(i,f);if(!s.setSource)return l.push(s),t(r,d,o,i,l,c);s.setSource(e.assign({},r),function(e,u){if(e)return t(r,d,o,i,l,c);l.push(s),t(u,r.type===u.type?d:n[u.type],o,i,l,c)})}else d.length?t(r,d,o,i,l,c):c?o(r,l):t(r,n["*"],o,i,l,!0)})(r,n[r.type],s,t),1)},setTech:function(e,t){e.forEach(e=>e.setTech&&e.setTech(t))},get:function(e,t,n){return e.reduceRight(s(n),t[n]())},set:function(e,t,n,u){return t[n](e.reduce(s(n),u))},mediate:function(e,n,u,o=null){const i="call"+t.toTitleCase(u),l=e.reduce(s(i),o),c=l===r,f=c?null:n[u](l);return function(e,t,n,u){for(let r=e.length-1;r>=0;r--){const s=e[r];s[t]&&s[t](u,n)}}(e,u,f,c),f},allowedGetters:{buffered:1,currentTime:1,duration:1,muted:1,played:1,paused:1,seekable:1,volume:1},allowedSetters:{setCurrentTime:1,setMuted:1,setVolume:1},allowedMediators:{play:1,pause:1},clearCacheForPlayer:function(e){u[e.id()]=null}}});
//# sourceMappingURL=../sourcemaps/tech/middleware.js.map

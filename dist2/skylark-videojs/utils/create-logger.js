/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define([],function(){"use strict";let e=[];return function r(o){let n,l="info";const t=function(...e){n("log",l,e)};return n=((r,o)=>(n,l,t)=>{const i=o.levels[l],s=new RegExp(`^(${i})$`);if("log"!==n&&t.unshift(n.toUpperCase()+":"),t.unshift(r+":"),e){e.push([].concat(t));const r=e.length-1e3;e.splice(0,r>0?r:0)}if(!window.console)return;let a=window.console[n];a||"debug"!==n||(a=window.console.info||window.console.log),a&&i&&s.test(n)&&a[Array.isArray(t)?"apply":"call"](window.console,t)})(o,t),t.createLogger=(e=>r(o+": "+e)),t.levels={all:"debug|log|warn|error",off:"",debug:"debug|log|warn|error",info:"log|warn|error",warn:"warn|error",error:"error",DEFAULT:l},t.level=(e=>{if("string"==typeof e){if(!t.levels.hasOwnProperty(e))throw new Error(`"${e}" in not a valid log level`);l=e}return l}),(t.history=(()=>e?[].concat(e):[])).filter=(r=>(e||[]).filter(e=>new RegExp(`.*${r}.*`).test(e[0]))),t.history.clear=(()=>{e&&(e.length=0)}),t.history.disable=(()=>{null!==e&&(e.length=0,e=null)}),t.history.enable=(()=>{null===e&&(e=[])}),t.error=((...e)=>n("error",l,e)),t.warn=((...e)=>n("warn",l,e)),t.debug=((...e)=>n("debug",l,e)),t}});
//# sourceMappingURL=../sourcemaps/utils/create-logger.js.map

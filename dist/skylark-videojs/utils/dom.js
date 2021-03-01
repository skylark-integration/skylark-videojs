/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/window","skylark-langx-globals/document","../fullscreen-api","./log","./obj","./computed-style","./browser"],function(t,e,n,o,r,i,s){"use strict";function u(t){return"string"==typeof t&&Boolean(t.trim())}function c(t){if(t.indexOf(" ")>=0)throw new Error("class has illegal whitespace characters")}function a(t){return r.isObject(t)&&1===t.nodeType}function f(t){return function(n,o){if(!u(n))return e[t](null);u(o)&&(o=e.querySelector(o));const r=a(o)?o:e;return r[t]&&r[t](n)}}function l(t,e){return void 0===t.textContent?t.innerText=e:t.textContent=e,t}function d(t,e){return c(e),t.classList?t.classList.contains(e):(n=e,new RegExp("(^|\\s)"+n+"($|\\s)")).test(t.className);var n}function h(t,e){return t.classList?t.classList.add(e):d(t,e)||(t.className=(t.className+" "+e).trim()),t}function p(t,e){return t.classList?t.classList.remove(e):(c(e),t.className=t.className.split(/\s+/).filter(function(t){return t!==e}).join(" ")),t}function g(t){if(!t||t&&!t.offsetParent)return{left:0,top:0,width:0,height:0};const o=t.offsetWidth,r=t.offsetHeight;let i=0,s=0;for(;t.offsetParent&&t!==e[n.fullscreenElement];)i+=t.offsetLeft,s+=t.offsetTop,t=t.offsetParent;return{left:i,top:s,width:o,height:r}}function b(t){return r.isObject(t)&&3===t.nodeType}function m(t){for(;t.firstChild;)t.removeChild(t.firstChild);return t}function y(t){return"function"==typeof t&&(t=t()),(Array.isArray(t)?t:[t]).map(t=>("function"==typeof t&&(t=t()),a(t)||b(t)?t:"string"==typeof t&&/\S/.test(t)?e.createTextNode(t):void 0)).filter(t=>t)}function x(t,e){return y(e).forEach(e=>t.appendChild(e)),t}const C=f("querySelector"),w=f("querySelectorAll");return{isReal:s.isReal,isEl:a,isInFrame:function(){try{return t.parent!==t.self}catch(t){return!0}},createEl:function(t="div",n={},r={},i){const s=e.createElement(t);return Object.getOwnPropertyNames(n).forEach(function(t){const e=n[t];-1!==t.indexOf("aria-")||"role"===t||"type"===t?(o.warn("Setting attributes in the second argument of createEl()\nhas been deprecated. Use the third argument instead.\n"+`createEl(type, properties, attributes). Attempting to set ${t} to ${e}.`),s.setAttribute(t,e)):"textContent"===t?l(s,e):s[t]===e&&"tabIndex"!==t||(s[t]=e)}),Object.getOwnPropertyNames(r).forEach(function(t){s.setAttribute(t,r[t])}),i&&x(s,i),s},textContent:l,prependTo:function(t,e){e.firstChild?e.insertBefore(t,e.firstChild):e.appendChild(t)},hasClass:d,addClass:h,removeClass:p,toggleClass:function(t,e,n){const o=d(t,e);if("function"==typeof n&&(n=n(t,e)),"boolean"!=typeof n&&(n=!o),n!==o)return n?h(t,e):p(t,e),t},setAttributes:function(t,e){Object.getOwnPropertyNames(e).forEach(function(n){const o=e[n];null===o||void 0===o||!1===o?t.removeAttribute(n):t.setAttribute(n,!0===o?"":o)})},getAttributes:function(t){const e={},n=",autoplay,controls,playsinline,loop,muted,default,defaultMuted,";if(t&&t.attributes&&t.attributes.length>0){const o=t.attributes;for(let r=o.length-1;r>=0;r--){const i=o[r].name;let s=o[r].value;"boolean"!=typeof t[i]&&-1===n.indexOf(","+i+",")||(s=null!==s),e[i]=s}}return e},getAttribute:function(t,e){return t.getAttribute(e)},setAttribute:function(t,e,n){t.setAttribute(e,n)},removeAttribute:function(t,e){t.removeAttribute(e)},blockTextSelection:function(){e.body.focus(),e.onselectstart=function(){return!1}},unblockTextSelection:function(){e.onselectstart=function(){return!0}},getBoundingClientRect:function(t){if(t&&t.getBoundingClientRect&&t.parentNode){const e=t.getBoundingClientRect(),n={};return["bottom","height","left","right","top","width"].forEach(t=>{void 0!==e[t]&&(n[t]=e[t])}),n.height||(n.height=parseFloat(i(t,"height"))),n.width||(n.width=parseFloat(i(t,"width"))),n}},findPosition:g,getPointerPosition:function(t,e){const n={x:0,y:0};if(s.IS_IOS){let e=t;for(;e&&"html"!==e.nodeName.toLowerCase();){const t=i(e,"transform");if(/^matrix/.test(t)){const e=t.slice(7,-1).split(/,\s/).map(Number);n.x+=e[4],n.y+=e[5]}else if(/^matrix3d/.test(t)){const e=t.slice(9,-1).split(/,\s/).map(Number);n.x+=e[12],n.y+=e[13]}e=e.parentNode}}const o={},r=g(e.target),u=g(t),c=u.width,a=u.height;let f=e.offsetY-(u.top-r.top),l=e.offsetX-(u.left-r.left);return e.changedTouches&&(l=e.changedTouches[0].pageX-u.left,f=e.changedTouches[0].pageY+u.top,s.IS_IOS&&(l-=n.x,f-=n.y)),o.y=1-Math.max(0,Math.min(1,f/a)),o.x=Math.max(0,Math.min(1,l/c)),o},isTextNode:b,emptyEl:m,normalizeContent:y,appendContent:x,insertContent:function(t,e){return x(m(t),e)},isSingleLeftClick:function(t){return void 0===t.button&&void 0===t.buttons||0===t.button&&void 0===t.buttons||"mouseup"===t.type&&0===t.button&&0===t.buttons||0===t.button&&1===t.buttons},$:C,$$:w}});
//# sourceMappingURL=../sourcemaps/utils/dom.js.map

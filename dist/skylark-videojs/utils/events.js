/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","skylark-domx","./dom-data","./guid","./log"],function(e,t,n,o,r){"use strict";function a(t){if(t.fixed_)return t;function n(){return!0}function o(){return!1}if(!t||!t.isPropagationStopped){const r=t||window.event;t={};for(const e in r)"layerX"!==e&&"layerY"!==e&&"keyLocation"!==e&&"webkitMovementX"!==e&&"webkitMovementY"!==e&&("returnValue"===e&&r.preventDefault||(t[e]=r[e]));if(t.target||(t.target=t.srcElement||e),t.relatedTarget||(t.relatedTarget=t.fromElement===t.target?t.toElement:t.fromElement),t.preventDefault=function(){r.preventDefault&&r.preventDefault(),t.returnValue=!1,r.returnValue=!1,t.defaultPrevented=!0},t.defaultPrevented=!1,t.stopPropagation=function(){r.stopPropagation&&r.stopPropagation(),t.cancelBubble=!0,r.cancelBubble=!0,t.isPropagationStopped=n},t.isPropagationStopped=o,t.stopImmediatePropagation=function(){r.stopImmediatePropagation&&r.stopImmediatePropagation(),t.isImmediatePropagationStopped=n,t.stopPropagation()},t.isImmediatePropagationStopped=o,null!==t.clientX&&void 0!==t.clientX){const n=e.documentElement,o=e.body;t.pageX=t.clientX+(n&&n.scrollLeft||o&&o.scrollLeft||0)-(n&&n.clientLeft||o&&o.clientLeft||0),t.pageY=t.clientY+(n&&n.scrollTop||o&&o.scrollTop||0)-(n&&n.clientTop||o&&o.clientTop||0)}t.which=t.charCode||t.keyCode,null!==t.button&&void 0!==t.button&&(t.button=1&t.button?0:4&t.button?1:2&t.button?2:0)}return t.fixed_=!0,t}return{fixEvent:a,on:t.eventer.on,off:t.eventer.off,trigger:t.eventer.trigger,one:t.eventer.one,any:t.eventer.one}});
//# sourceMappingURL=../sourcemaps/utils/events.js.map

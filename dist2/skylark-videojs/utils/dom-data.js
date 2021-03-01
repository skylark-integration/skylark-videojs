/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./log","./guid"],function(t,a){"use strict";let e;return window.WeakMap||(e=class{constructor(){this.vdata="vdata"+Math.floor(window.performance&&window.performance.now()||Date.now()),this.data={}}set(t,e){const i=t[this.vdata]||a.newGUID();return t[this.vdata]||(t[this.vdata]=i),this.data[i]=e,this}get(a){const e=a[this.vdata];if(e)return this.data[e];t("We have no data for this element",a)}has(t){return t[this.vdata]in this.data}delete(t){const a=t[this.vdata];a&&(delete this.data[a],delete t[this.vdata])}}),window.WeakMap?new WeakMap:new e});
//# sourceMappingURL=../sourcemaps/utils/dom-data.js.map

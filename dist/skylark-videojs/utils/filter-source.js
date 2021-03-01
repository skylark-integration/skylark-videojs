/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./obj","./mimetypes"],function(t,r){"use strict";const e=function(r){if(Array.isArray(r)){let i=[];r.forEach(function(r){r=e(r),Array.isArray(r)?i=i.concat(r):t.isObject(r)&&i.push(r)}),r=i}else r="string"==typeof r&&r.trim()?[i({src:r})]:t.isObject(r)&&"string"==typeof r.src&&r.src&&r.src.trim()?[i(r)]:[];return r};function i(t){if(!t.type){const e=r.getMimetype(t.src);e&&(t.type=e)}return t}return e});
//# sourceMappingURL=../sourcemaps/utils/filter-source.js.map

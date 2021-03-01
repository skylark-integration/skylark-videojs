/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./url"],function(e){"use strict";const i={opus:"video/ogg",ogv:"video/ogg",mp4:"video/mp4",mov:"video/mp4",m4v:"video/mp4",mkv:"video/x-matroska",m4a:"audio/mp4",mp3:"audio/mpeg",aac:"audio/aac",caf:"audio/x-caf",flac:"audio/flac",oga:"audio/ogg",wav:"audio/wav",m3u8:"application/x-mpegURL",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",png:"image/png",svg:"image/svg+xml",webp:"image/webp"},o=function(o=""){const a=e.getFileExtension(o);return i[a.toLowerCase()]||""};return{MimetypesKind:i,getMimetype:o,findMimetype:(e,i)=>{if(!i)return"";if(e.cache_.source.src===i&&e.cache_.source.type)return e.cache_.source.type;const a=e.cache_.sources.filter(e=>e.src===i);if(a.length)return a[0].type;const t=e.$$("source");for(let e=0;e<t.length;e++){const o=t[e];if(o.type&&o.src&&o.src===i)return o.type}return o(i)}}});
//# sourceMappingURL=../sourcemaps/utils/mimetypes.js.map

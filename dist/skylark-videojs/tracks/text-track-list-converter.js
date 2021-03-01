/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(function(){"use strict";const t=function(t){return["kind","label","language","id","inBandMetadataTrackDispatchType","mode","src"].reduce((r,c,e)=>(t[c]&&(r[c]=t[c]),r),{cues:t.cues&&Array.prototype.map.call(t.cues,function(t){return{startTime:t.startTime,endTime:t.endTime,text:t.text,id:t.id}})})};return{textTracksToJson:function(r){const c=r.$$("track"),e=Array.prototype.map.call(c,t=>t.track);return Array.prototype.map.call(c,function(r){const c=t(r.track);return r.src&&(c.src=r.src),c}).concat(Array.prototype.filter.call(r.textTracks(),function(t){return-1===e.indexOf(t)}).map(t))},jsonToTextTracks:function(t,r){return t.forEach(function(t){const c=r.addRemoteTextTrack(t).track;!t.src&&t.cues&&t.cues.forEach(t=>c.addCue(t))}),r.textTracks()},trackToJson_:t}});
//# sourceMappingURL=../sourcemaps/tracks/text-track-list-converter.js.map

/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/window","skylark-langx-globals/document","../component","../utils/merge-options","../utils/fn","../utils/log","../utils/time-ranges","../utils/buffer","../media-error","../utils/obj","../tracks/track-types","../utils/string-cases","skylark-videojs-vtt"],function(e,t,r,s,a,i,n,o,c,u,h,l,d){"use strict";class T extends r{constructor(e={},t=function(){}){e.reportTouchActivity=!1,super(null,e,t),this.hasStarted_=!1,this.listenTo("playing",function(){this.hasStarted_=!0}),this.listenTo("loadstart",function(){this.hasStarted_=!1}),h.ALL.names.forEach(t=>{const r=h.ALL[t];e&&e[r.getterName]&&(this[r.privateName]=e[r.getterName])}),this.featuresProgressEvents||this.manualProgressOn(),this.featuresTimeupdateEvents||this.manualTimeUpdatesOn(),["Text","Audio","Video"].forEach(t=>{!1===e[`native${t}Tracks`]&&(this[`featuresNative${t}Tracks`]=!1)}),!1===e.nativeCaptions||!1===e.nativeTextTracks?this.featuresNativeTextTracks=!1:!0!==e.nativeCaptions&&!0!==e.nativeTextTracks||(this.featuresNativeTextTracks=!0),this.featuresNativeTextTracks||this.emulateTextTracks(),this.preloadTextTracks=!1!==e.preloadTextTracks,this.autoRemoteTextTracks_=new h.ALL.text.ListClass,this.initTrackListeners(),e.nativeControlsForTouch||this.emitTapEvents(),this.constructor&&(this.name_=this.constructor.name||"Unknown Tech")}triggerSourceset(e){this.isReady_||this.listenToOnce("ready",()=>this.setTimeout(()=>this.triggerSourceset(e),1)),this.trigger({src:e,type:"sourceset"})}manualProgressOn(){this.listenTo("durationchange",this.listenToDurationChange),this.manualProgress=!0,this.listenToOnce("ready",this.trackProgress)}manualProgressOff(){this.manualProgress=!1,this.stopTrackingProgress(),this.unlistenTo("durationchange",this.listenToDurationChange)}trackProgress(e){this.stopTrackingProgress(),this.progressInterval=this.setInterval(a.bind(this,function(){const e=this.undefined();this.bufferedPercent_!==e&&this.trigger("progress"),this.bufferedPercent_=e,1===e&&this.stopTrackingProgress()}),500)}onDurationChange(e){this.duration_=this.duration()}buffered(){return n.createTimeRange(0,0)}bufferedPercent(){return o.bufferedPercent(this.buffered(),this.duration_)}stopTrackingProgress(){this.clearInterval(this.progressInterval)}manualTimeUpdatesOn(){this.manualTimeUpdates=!0,this.listenTo("play",this.trackCurrentTime),this.listenTo("pause",this.stopTrackingCurrentTime)}manualTimeUpdatesOff(){this.manualTimeUpdates=!1,this.stopTrackingCurrentTime(),this.unlistenTo("play",this.trackCurrentTime),this.unlistenTo("pause",this.stopTrackingCurrentTime)}trackCurrentTime(){this.currentTimeInterval&&this.stopTrackingCurrentTime(),this.currentTimeInterval=this.setInterval(function(){this.trigger({type:"timeupdate",target:this,manuallyTriggered:!0})},250)}stopTrackingCurrentTime(){this.clearInterval(this.currentTimeInterval),this.trigger({type:"timeupdate",target:this,manuallyTriggered:!0})}dispose(){this.clearTracks(h.NORMAL.names),this.manualProgress&&this.manualProgressOff(),this.manualTimeUpdates&&this.manualTimeUpdatesOff(),super.dispose()}clearTracks(e){(e=[].concat(e)).forEach(e=>{const t=this[`${e}Tracks`]()||[];let r=t.length;for(;r--;){const s=t[r];"text"===e&&this.removeRemoteTextTrack(s),t.removeTrack(s)}})}cleanupAutoTextTracks(){const e=this.autoRemoteTextTracks_||[];let t=e.length;for(;t--;){const r=e[t];this.removeRemoteTextTrack(r)}}reset(){}crossOrigin(){}setCrossOrigin(){}error(e){return void 0!==e&&(this.error_=new c(e),this.trigger("error")),this.error_}played(){return this.hasStarted_?n.createTimeRange(0,0):n.createTimeRange()}play(){}setScrubbing(){}scrubbing(){}setCurrentTime(){this.manualTimeUpdates&&this.trigger({type:"timeupdate",target:this,manuallyTriggered:!0})}initTrackListeners(){h.NORMAL.names.forEach(e=>{const t=()=>{this.trigger(`${e}trackchange`)},r=this[h.NORMAL[e].getterName]();r.addEventListener("removetrack",t),r.addEventListener("addtrack",t),this.listenTo("dispose",()=>{r.removeEventListener("removetrack",t),r.removeEventListener("addtrack",t)})})}addWebVttScript_(){if(!e.WebVTT)if(t.body.contains(this.el())){if(!this.options_["vtt.js"]&&u.isPlain(d)&&Object.keys(d).length>0)return void this.trigger("vttjsloaded");const r=t.createElement("script");r.src=this.options_["vtt.js"]||"https://vjs.zencdn.net/vttjs/0.14.1/vtt.min.js",r.onload=(()=>{this.trigger("vttjsloaded")}),r.onerror=(()=>{this.trigger("vttjserror")}),this.listenTo("dispose",()=>{r.onload=null,r.onerror=null}),e.WebVTT=!0,this.el().parentNode.appendChild(r)}else this.ready(this.addWebVttScript_)}emulateTextTracks(){const e=this.textTracks(),t=this.remoteTextTracks(),r=t=>e.addTrack(t.track),s=t=>e.removeTrack(t.track);t.on("addtrack",r),t.on("removetrack",s),this.addWebVttScript_();const a=()=>this.trigger("texttrackchange"),i=()=>{a();for(let t=0;t<e.length;t++){const r=e[t];r.removeEventListener("cuechange",a),"showing"===r.mode&&r.addEventListener("cuechange",a)}};i(),e.addEventListener("change",i),e.addEventListener("addtrack",i),e.addEventListener("removetrack",i),this.listenTo("dispose",function(){t.off("addtrack",r),t.off("removetrack",s),e.removeEventListener("change",i),e.removeEventListener("addtrack",i),e.removeEventListener("removetrack",i);for(let t=0;t<e.length;t++){e[t].removeEventListener("cuechange",a)}})}addTextTrack(e,t,r){if(!e)throw new Error("TextTrack kind is required but was not provided");return function(e,t,r,s,a={}){const i=e.textTracks();a.kind=t,r&&(a.label=r),s&&(a.language=s),a.tech=e;const n=new h.ALL.text.TrackClass(a);return i.addTrack(n),n}(this,e,t,r)}createRemoteTextTrack(e){const t=s(e,{tech:this});return new h.REMOTE.remoteTextEl.TrackClass(t)}addRemoteTextTrack(e={},t){const r=this.createRemoteTextTrack(e);return!0!==t&&!1!==t&&(i.warn('Calling addRemoteTextTrack without explicitly setting the "manualCleanup" parameter to `true` is deprecated and default to `false` in future version of video.js'),t=!0),this.remoteTextTrackEls().addTrackElement_(r),this.remoteTextTracks().addTrack(r.track),!0!==t&&this.ready(()=>this.autoRemoteTextTracks_.addTrack(r.track)),r}removeRemoteTextTrack(e){const t=this.remoteTextTrackEls().getTrackElementByTrack_(e);this.remoteTextTrackEls().removeTrackElement_(t),this.remoteTextTracks().removeTrack(e),this.autoRemoteTextTracks_.removeTrack(e)}getVideoPlaybackQuality(){return{}}requestPictureInPicture(){const t=this.options_.Promise||e.Promise;if(t)return t.reject()}disablePictureInPicture(){return!0}setDisablePictureInPicture(){}setPoster(){}playsinline(){}setPlaysinline(){}overrideNativeAudioTracks(){}overrideNativeVideoTracks(){}canPlayType(){return""}static canPlayType(){return""}static canPlaySource(e,t){return T.canPlayType(e.type)}static isTech(e){return e.prototype instanceof T||e instanceof T||e===T}static registerTech(e,t){if(T.techs_||(T.techs_={}),!T.isTech(t))throw new Error(`Tech ${e} must be a Tech`);if(!T.canPlayType)throw new Error("Techs must have a static canPlayType method on them");if(!T.canPlaySource)throw new Error("Techs must have a static canPlaySource method on them");return e=l.toTitleCase(e),T.techs_[e]=t,T.techs_[l.toLowerCase(e)]=t,"Tech"!==e&&T.defaultTechOrder_.push(e),t}static getTech(t){if(t)return T.techs_&&T.techs_[t]?T.techs_[t]:(t=l.toTitleCase(t),e&&e.videojs&&e.videojs[t]?(i.warn(`The ${t} tech was added to the videojs object when it should be registered using videojs.registerTech(name, tech)`),e.videojs[t]):void 0)}}return h.ALL.names.forEach(function(e){const t=h.ALL[e];T.prototype[t.getterName]=function(){return this[t.privateName]=this[t.privateName]||new t.ListClass,this[t.privateName]}}),T.prototype.featuresVolumeControl=!0,T.prototype.featuresMuteControl=!0,T.prototype.featuresFullscreenResize=!1,T.prototype.featuresPlaybackRate=!1,T.prototype.featuresProgressEvents=!1,T.prototype.featuresSourceset=!1,T.prototype.featuresTimeupdateEvents=!1,T.prototype.featuresNativeTextTracks=!1,T.withSourceHandlers=function(e){e.registerSourceHandler=function(t,r){let s=e.sourceHandlers;s||(s=e.sourceHandlers=[]),void 0===r&&(r=s.length),s.splice(r,0,t)},e.canPlayType=function(t){const r=e.sourceHandlers||[];let s;for(let e=0;e<r.length;e++)if(s=r[e].canPlayType(t))return s;return""},e.selectSourceHandler=function(t,r){const s=e.sourceHandlers||[];let a;for(let e=0;e<s.length;e++)if(a=s[e].canHandleSource(t,r))return s[e];return null},e.canPlaySource=function(t,r){const s=e.selectSourceHandler(t,r);return s?s.canHandleSource(t,r):""};["seekable","seeking","duration"].forEach(function(e){const t=this[e];"function"==typeof t&&(this[e]=function(){return this.sourceHandler_&&this.sourceHandler_[e]?this.sourceHandler_[e].apply(this.sourceHandler_,arguments):t.apply(this,arguments)})},e.prototype),e.prototype.setSource=function(t){let r=e.selectSourceHandler(t,this.options_);r||(e.nativeSourceHandler?r=e.nativeSourceHandler:i.error("No source handler found for the current source.")),this.disposeSourceHandler(),this.unlistenTo("dispose",this.disposeSourceHandler),r!==e.nativeSourceHandler&&(this.currentSource_=t),this.sourceHandler_=r.handleSource(t,this,this.options_),this.listenToOnce("dispose",this.disposeSourceHandler)},e.prototype.disposeSourceHandler=function(){this.currentSource_&&(this.clearTracks(["audio","video"]),this.currentSource_=null),this.cleanupAutoTextTracks(),this.sourceHandler_&&(this.sourceHandler_.dispose&&this.sourceHandler_.dispose(),this.sourceHandler_=null)}},r.registerComponent("Tech",T),T.registerTech("Tech",T),T.defaultTechOrder_=[],T});
//# sourceMappingURL=../sourcemaps/tech/tech.js.map

/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx","skylark-langx-globals/document","./tech","../utils/dom","../utils/url","../utils/log","../utils/browser","../utils/obj","../utils/merge-options","../utils/string-cases","../tracks/track-types","./setup-sourceset","../utils/define-lazy-property","../utils/promise"],function(e,t,r,i,n,s,a,o,c,l,u,d,h,p){"use strict";const T=u.NORMAL,f=u.REMOTE,g={abort:3,canplay:3,canplaythrough:3,disablepictureinpicturechanged:3,durationchange:3,emptied:3,ended:3,enterpictureinpicture:3,error:3,leavepictureinpicture:3,loadeddata:3,loadstart:3,loadedmetadata:3,pause:3,play:3,playing:3,posterchange:3,progress:3,ratechange:3,seeking:3,seeked:3,sourceset:3,stalled:3,suspend:3,textdata:3,texttrackchange:3,timeupdate:3,volumechange:3,waiting:3};class y extends r{isNativeEvent(t){if(super.isNativeEvent(t))return!0;if(e.isString(t))return!!g[t];if(e.isArray(t)){for(var r=0;r<t.length;r++)if(g[t[r]])return!0;return!1}}constructor(e,t){super(e,t);const r=e.source;let i=!1;if(r&&(this.el_.currentSrc!==r.src||e.tag&&3===e.tag.initNetworkState_)?this.setSource(r):this.handleLateInit_(this.el_),e.enableSourceset&&this.setupSourcesetHandling_(),this.isScrubbing_=!1,this.el_.hasChildNodes()){const e=this.el_.childNodes;let t=e.length;const r=[];for(;t--;){const s=e[t];"track"===s.nodeName.toLowerCase()&&(this.featuresNativeTextTracks?(this.remoteTextTrackEls().addTrackElement_(s),this.remoteTextTracks().addTrack(s.track),this.textTracks().addTrack(s.track),i||this.el_.hasAttribute("crossorigin")||!n.isCrossOrigin(s.src)||(i=!0)):r.push(s))}for(let e=0;e<r.length;e++)this.el_.removeChild(r[e])}this.proxyNativeTracks_(),this.featuresNativeTextTracks&&i&&s.warn("Text Tracks are being loaded from another origin but the crossorigin attribute isn't used.\nThis may prevent text tracks from loading."),this.restoreMetadataTracksInIOSNativePlayer_(),(a.TOUCH_ENABLED||a.IS_IPHONE||a.IS_NATIVE_ANDROID)&&!0===e.nativeControlsForTouch&&this.setControls(!0),this.proxyWebkitFullscreen_(),this.triggerReady()}dispose(){this.el_&&this.el_.resetSourceset_&&this.el_.resetSourceset_(),y.disposeMediaElement(this.el_),this.options_=null,super.dispose()}setupSourcesetHandling_(){d(this)}restoreMetadataTracksInIOSNativePlayer_(){const e=this.textTracks();let t;const r=()=>{t=[];for(let r=0;r<e.length;r++){const i=e[r];"metadata"===i.kind&&t.push({track:i,storedMode:i.mode})}};r(),e.addEventListener("change",r),this.listenTo("dispose",()=>e.removeEventListener("change",r));const i=()=>{for(let e=0;e<t.length;e++){const r=t[e];"disabled"===r.track.mode&&r.track.mode!==r.storedMode&&(r.track.mode=r.storedMode)}e.removeEventListener("change",i)};this.listenTo("webkitbeginfullscreen",()=>{e.removeEventListener("change",r),e.removeEventListener("change",i),e.addEventListener("change",i)}),this.listenTo("webkitendfullscreen",()=>{e.removeEventListener("change",r),e.addEventListener("change",r),e.removeEventListener("change",i)})}overrideNative_(e,t){if(t!==this[`featuresNative${e}Tracks`])return;const r=e.toLowerCase();this[`${r}TracksListeners_`]&&Object.keys(this[`${r}TracksListeners_`]).forEach(e=>{this.el()[`${r}Tracks`].removeEventListener(e,this[`${r}TracksListeners_`][e])}),this[`featuresNative${e}Tracks`]=!t,this[`${r}TracksListeners_`]=null,this.proxyNativeTracksForType_(r)}overrideNativeAudioTracks(e){this.overrideNative_("Audio",e)}overrideNativeVideoTracks(e){this.overrideNative_("Video",e)}proxyNativeTracksForType_(e){const t=T[e],r=this.el()[t.getterName],i=this[t.getterName]();if(!this[`featuresNative${t.capitalName}Tracks`]||!r||!r.addEventListener)return;const n={change:t=>{const r={type:"change",target:i,currentTarget:i,srcElement:i};i.trigger(r),"text"===e&&this[f.remoteText.getterName]().trigger(r)},addtrack(e){i.addTrack(e.track)},removetrack(e){i.removeTrack(e.track)}},s=function(){const e=[];for(let t=0;t<i.length;t++){let n=!1;for(let e=0;e<r.length;e++)if(r[e]===i[t]){n=!0;break}n||e.push(i[t])}for(;e.length;)i.removeTrack(e.shift())};this[t.getterName+"Listeners_"]=n,Object.keys(n).forEach(e=>{const t=n[e];r.addEventListener(e,t),this.listenTo("dispose",i=>r.removeEventListener(e,t))}),this.listenTo("loadstart",s),this.listenTo("dispose",e=>this.unlistenTo("loadstart",s))}proxyNativeTracks_(){T.names.forEach(e=>{this.proxyNativeTracksForType_(e)})}createEl(){let e=this.options_.tag;if(!e||!this.options_.playerElIngest&&!this.movingMediaElementInDOM){if(e){const t=e.cloneNode(!0);e.parentNode&&e.parentNode.insertBefore(t,e),y.disposeMediaElement(e),e=t}else{e=t.createElement("video");const r=this.options_.tag&&i.getAttributes(this.options_.tag),n=c({},r);a.TOUCH_ENABLED&&!0===this.options_.nativeControlsForTouch||delete n.controls,i.setAttributes(e,o.assign(n,{id:this.options_.techId,class:"vjs-tech"}))}e.playerId=this.options_.playerId}void 0!==this.options_.preload&&i.setAttribute(e,"preload",this.options_.preload),void 0!==this.options_.disablePictureInPicture&&(e.disablePictureInPicture=this.options_.disablePictureInPicture);const r=["loop","muted","playsinline","autoplay"];for(let t=0;t<r.length;t++){const n=r[t],s=this.options_[n];void 0!==s&&(s?i.setAttribute(e,n,n):i.removeAttribute(e,n),e[n]=s)}return e}handleLateInit_(e){if(0===e.networkState||3===e.networkState)return;if(0===e.readyState){let e=!1;const t=function(){e=!0};this.listenTo("loadstart",t);const r=function(){e||this.trigger("loadstart")};return this.listenTo("loadedmetadata",r),void this.ready(function(){this.unlistenTo("loadstart",t),this.unlistenTo("loadedmetadata",r),e||this.trigger("loadstart")})}const t=["loadstart"];t.push("loadedmetadata"),e.readyState>=2&&t.push("loadeddata"),e.readyState>=3&&t.push("canplay"),e.readyState>=4&&t.push("canplaythrough"),this.ready(function(){t.forEach(function(e){this.trigger(e)},this)})}setScrubbing(e){this.isScrubbing_=e}scrubbing(){return this.isScrubbing_}setCurrentTime(e){try{this.isScrubbing_&&this.el_.fastSeek&&a.IS_ANY_SAFARI?this.el_.fastSeek(e):this.el_.currentTime=e}catch(e){s(e,"Video is not ready. (Video.js)")}}duration(){if(this.el_.duration===1/0&&a.IS_ANDROID&&a.IS_CHROME&&0===this.el_.currentTime){const e=()=>{this.el_.currentTime>0&&(this.el_.duration===1/0&&this.trigger("durationchange"),this.unlistenTo("timeupdate",e))};return this.listenTo("timeupdate",e),NaN}return this.el_.duration||NaN}width(){return this.el_.offsetWidth}height(){return this.el_.offsetHeight}proxyWebkitFullscreen_(){if(!("webkitDisplayingFullscreen"in this.el_))return;const e=function(){this.trigger("fullscreenchange",{isFullscreen:!1})},t=function(){"webkitPresentationMode"in this.el_&&"picture-in-picture"!==this.el_.webkitPresentationMode&&(this.listenToOnce("webkitendfullscreen",e),this.trigger("fullscreenchange",{isFullscreen:!0,nativeIOSFullscreen:!0}))};this.listenTo("webkitbeginfullscreen",t),this.listenTo("dispose",()=>{this.unlistenTo("webkitbeginfullscreen",t),this.unlistenTo("webkitendfullscreen",e)})}supportsFullScreen(){if("function"==typeof this.el_.webkitEnterFullScreen){const e=window.navigator&&window.navigator.userAgent||"";if(/Android/.test(e)||!/Chrome|Mac OS X 10.5/.test(e))return!0}return!1}enterFullScreen(){const e=this.el_;if(e.paused&&e.networkState<=e.HAVE_METADATA)p.silencePromise(this.el_.play()),this.setTimeout(function(){e.pause();try{e.webkitEnterFullScreen()}catch(e){this.trigger("fullscreenerror",e)}},0);else try{e.webkitEnterFullScreen()}catch(e){this.trigger("fullscreenerror",e)}}exitFullScreen(){this.el_.webkitDisplayingFullscreen?this.el_.webkitExitFullScreen():this.trigger("fullscreenerror",new Error("The video is not fullscreen"))}requestPictureInPicture(){return this.el_.requestPictureInPicture()}src(e){if(void 0===e)return this.el_.src;this.setSrc(e)}reset(){y.resetMediaElement(this.el_)}currentSrc(){return this.currentSource_?this.currentSource_.src:this.el_.currentSrc}setControls(e){this.el_.controls=!!e}addTextTrack(e,t,r){return this.featuresNativeTextTracks?this.el_.addTextTrack(e,t,r):super.addTextTrack(e,t,r)}createRemoteTextTrack(e){if(!this.featuresNativeTextTracks)return super.createRemoteTextTrack(e);const r=t.createElement("track");return e.kind&&(r.kind=e.kind),e.label&&(r.label=e.label),(e.language||e.srclang)&&(r.srclang=e.language||e.srclang),e.default&&(r.default=e.default),e.id&&(r.id=e.id),e.src&&(r.src=e.src),r}addRemoteTextTrack(e,t){const r=super.addRemoteTextTrack(e,t);return this.featuresNativeTextTracks&&this.el().appendChild(r),r}removeRemoteTextTrack(e){if(super.removeRemoteTextTrack(e),this.featuresNativeTextTracks){const t=this.$$("track");let r=t.length;for(;r--;)e!==t[r]&&e!==t[r].track||this.el().removeChild(t[r])}}getVideoPlaybackQuality(){if("function"==typeof this.el().getVideoPlaybackQuality)return this.el().getVideoPlaybackQuality();const e={};return void 0!==this.el().webkitDroppedFrameCount&&void 0!==this.el().webkitDecodedFrameCount&&(e.droppedVideoFrames=this.el().webkitDroppedFrameCount,e.totalVideoFrames=this.el().webkitDecodedFrameCount),window.performance&&"function"==typeof window.performance.now?e.creationTime=window.performance.now():window.performance&&window.performance.timing&&"number"==typeof window.performance.timing.navigationStart&&(e.creationTime=window.Date.now()-window.performance.timing.navigationStart),e}}let m;return h(y,"TEST_VID",function(){if(!i.isReal())return;const e=t.createElement("video"),r=t.createElement("track");return r.kind="captions",r.srclang="en",r.label="English",e.appendChild(r),e}),y.isSupported=function(){try{y.TEST_VID.volume=.5}catch(e){return!1}return!(!y.TEST_VID||!y.TEST_VID.canPlayType)},y.canPlayType=function(e){return y.TEST_VID.canPlayType(e)},y.canPlaySource=function(e,t){return y.canPlayType(e.type)},y.canControlVolume=function(){try{const e=y.TEST_VID.volume;return y.TEST_VID.volume=e/2+.1,e!==y.TEST_VID.volume}catch(e){return!1}},y.canMuteVolume=function(){try{const e=y.TEST_VID.muted;return y.TEST_VID.muted=!e,y.TEST_VID.muted?i.setAttribute(y.TEST_VID,"muted","muted"):i.removeAttribute(y.TEST_VID,"muted","muted"),e!==y.TEST_VID.muted}catch(e){return!1}},y.canControlPlaybackRate=function(){if(a.IS_ANDROID&&a.IS_CHROME&&a.CHROME_VERSION<58)return!1;try{const e=y.TEST_VID.playbackRate;return y.TEST_VID.playbackRate=e/2+.1,e!==y.TEST_VID.playbackRate}catch(e){return!1}},y.canOverrideAttributes=function(){try{const e=()=>{};Object.defineProperty(t.createElement("video"),"src",{get:e,set:e}),Object.defineProperty(t.createElement("audio"),"src",{get:e,set:e}),Object.defineProperty(t.createElement("video"),"innerHTML",{get:e,set:e}),Object.defineProperty(t.createElement("audio"),"innerHTML",{get:e,set:e})}catch(e){return!1}return!0},y.supportsNativeTextTracks=function(){return a.IS_ANY_SAFARI||a.IS_IOS&&a.IS_CHROME},y.supportsNativeVideoTracks=function(){return!(!y.TEST_VID||!y.TEST_VID.videoTracks)},y.supportsNativeAudioTracks=function(){return!(!y.TEST_VID||!y.TEST_VID.audioTracks)},y.Events=["loadstart","suspend","abort","error","emptied","stalled","loadedmetadata","loadeddata","canplay","canplaythrough","playing","waiting","seeking","seeked","ended","durationchange","timeupdate","progress","play","pause","ratechange","resize","volumechange"],[["featuresVolumeControl","canControlVolume"],["featuresMuteControl","canMuteVolume"],["featuresPlaybackRate","canControlPlaybackRate"],["featuresSourceset","canOverrideAttributes"],["featuresNativeTextTracks","supportsNativeTextTracks"],["featuresNativeVideoTracks","supportsNativeVideoTracks"],["featuresNativeAudioTracks","supportsNativeAudioTracks"]].forEach(function([e,t]){h(y.prototype,e,()=>y[t](),!0)}),y.prototype.movingMediaElementInDOM=!a.IS_IOS,y.prototype.featuresFullscreenResize=!0,y.prototype.featuresProgressEvents=!0,y.prototype.featuresTimeupdateEvents=!0,y.patchCanPlayType=function(){a.ANDROID_VERSION>=4&&!a.IS_FIREFOX&&!a.IS_CHROME&&(m=y.TEST_VID&&y.TEST_VID.constructor.prototype.canPlayType,y.TEST_VID.constructor.prototype.canPlayType=function(e){return e&&/^application\/(?:x-|vnd\.apple\.)mpegurl/i.test(e)?"maybe":m.call(this,e)})},y.unpatchCanPlayType=function(){const e=y.TEST_VID.constructor.prototype.canPlayType;return m&&(y.TEST_VID.constructor.prototype.canPlayType=m),e},y.patchCanPlayType(),y.disposeMediaElement=function(e){if(e){for(e.parentNode&&e.parentNode.removeChild(e);e.hasChildNodes();)e.removeChild(e.firstChild);e.removeAttribute("src"),"function"==typeof e.load&&function(){try{e.load()}catch(e){}}()}},y.resetMediaElement=function(e){if(!e)return;const t=e.querySelectorAll("source");let r=t.length;for(;r--;)e.removeChild(t[r]);e.removeAttribute("src"),"function"==typeof e.load&&function(){try{e.load()}catch(e){}}()},["muted","defaultMuted","autoplay","controls","loop","playsinline"].forEach(function(e){y.prototype[e]=function(){return this.el_[e]||this.el_.hasAttribute(e)}}),["muted","defaultMuted","autoplay","loop","playsinline"].forEach(function(e){y.prototype["set"+l.toTitleCase(e)]=function(t){this.el_[e]=t,t?this.el_.setAttribute(e,e):this.el_.removeAttribute(e)}}),["paused","currentTime","buffered","volume","poster","preload","error","seeking","seekable","ended","playbackRate","defaultPlaybackRate","disablePictureInPicture","played","networkState","readyState","videoWidth","videoHeight","crossOrigin"].forEach(function(e){y.prototype[e]=function(){return this.el_[e]}}),["volume","src","poster","preload","playbackRate","defaultPlaybackRate","disablePictureInPicture","crossOrigin"].forEach(function(e){y.prototype["set"+l.toTitleCase(e)]=function(t){this.el_[e]=t}}),["pause","load","play"].forEach(function(e){y.prototype[e]=function(){return this.el_[e]()}}),r.withSourceHandlers(y),y.nativeSourceHandler={},y.nativeSourceHandler.canPlayType=function(e){try{return y.TEST_VID.canPlayType(e)}catch(e){return""}},y.nativeSourceHandler.canHandleSource=function(e,t){if(e.type)return y.nativeSourceHandler.canPlayType(e.type);if(e.src){const t=n.getFileExtension(e.src);return y.nativeSourceHandler.canPlayType(`video/${t}`)}return""},y.nativeSourceHandler.handleSource=function(e,t,r){t.setSrc(e.src)},y.nativeSourceHandler.dispose=function(){},y.registerSourceHandler(y.nativeSourceHandler),r.registerTech("Html5",y),y});
//# sourceMappingURL=../sourcemaps/tech/html5.js.map

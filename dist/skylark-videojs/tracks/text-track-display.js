/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../component","../utils/fn","../utils/dom"],function(e,t,s){"use strict";const o="#222",i="#ccc",a={monospace:"monospace",sansSerif:"sans-serif",serif:"serif",monospaceSansSerif:'"Andale Mono", "Lucida Console", monospace',monospaceSerif:'"Courier New", monospace',proportionalSansSerif:"sans-serif",proportionalSerif:"serif",casual:'"Comic Sans MS", Impact, fantasy',script:'"Monotype Corsiva", cursive',smallcaps:'"Andale Mono", "Lucida Console", monospace, sans-serif'};function n(e,t){let s;if(4===e.length)s=e[1]+e[1]+e[2]+e[2]+e[3]+e[3];else{if(7!==e.length)throw new Error("Invalid color code provided, "+e+"; must be formatted as e.g. #f0e or #f604e2.");s=e.slice(1)}return"rgba("+parseInt(s.slice(0,2),16)+","+parseInt(s.slice(2,4),16)+","+parseInt(s.slice(4,6),16)+","+t+")"}function r(e,t,s){try{e.style[t]=s}catch(e){return}}class l extends e{constructor(e,s,o){super(e,s,o);const i=t.bind(this,this.updateDisplay);e.on("loadstart",t.bind(this,this.toggleDisplay)),e.on("texttrackchange",i),e.on("loadedmetadata",t.bind(this,this.preselectTrack)),e.ready(t.bind(this,function(){if(e.tech_&&e.tech_.featuresNativeTextTracks)return void this.hide();e.on("fullscreenchange",i),e.on("playerresize",i),window.addEventListener("orientationchange",i),e.on("dispose",()=>window.removeEventListener("orientationchange",i));const t=this.options_.playerOptions.tracks||[];for(let e=0;e<t.length;e++)this.player_.addRemoteTextTrack(t[e],!0);this.preselectTrack()}))}preselectTrack(){const e={captions:1,subtitles:1},t=this.player_.textTracks(),s=this.player_.cache_.selectedLanguage;let o,i,a;for(let n=0;n<t.length;n++){const r=t[n];s&&s.enabled&&s.language&&s.language===r.language&&r.kind in e?r.kind===s.kind?a=r:a||(a=r):s&&!s.enabled?(a=null,o=null,i=null):r.default&&("descriptions"!==r.kind||o?r.kind in e&&!i&&(i=r):o=r)}a?a.mode="showing":i?i.mode="showing":o&&(o.mode="showing")}toggleDisplay(){this.player_.tech_&&this.player_.tech_.featuresNativeTextTracks?this.hide():this.show()}createEl(){return super.createEl("div",{className:"vjs-text-track-display"},{"aria-live":"off","aria-atomic":"true"})}clearDisplay(){"function"==typeof window.WebVTT&&window.WebVTT.processCues(window,[],this.el_)}updateDisplay(){const e=this.player_.textTracks(),t=this.options_.allowMultipleShowingTracks;if(this.clearDisplay(),t){const t=[];for(let s=0;s<e.length;++s){const o=e[s];"showing"===o.mode&&t.push(o)}return void this.updateForTrack(t)}let s=null,o=null,i=e.length;for(;i--;){const t=e[i];"showing"===t.mode&&("descriptions"===t.kind?s=t:o=t)}o?("off"!==this.getAttribute("aria-live")&&this.setAttribute("aria-live","off"),this.updateForTrack(o)):s&&("assertive"!==this.getAttribute("aria-live")&&this.setAttribute("aria-live","assertive"),this.updateForTrack(s))}updateDisplayState(e){const t=this.player_.textTrackSettings.getValues(),s=e.activeCues;let l=s.length;for(;l--;){const e=s[l];if(!e)continue;const c=e.displayState;if(t.color&&(c.firstChild.style.color=t.color),t.textOpacity&&r(c.firstChild,"color",n(t.color||"#fff",t.textOpacity)),t.backgroundColor&&(c.firstChild.style.backgroundColor=t.backgroundColor),t.backgroundOpacity&&r(c.firstChild,"backgroundColor",n(t.backgroundColor||"#000",t.backgroundOpacity)),t.windowColor&&(t.windowOpacity?r(c,"backgroundColor",n(t.windowColor,t.windowOpacity)):c.style.backgroundColor=t.windowColor),t.edgeStyle&&("dropshadow"===t.edgeStyle?c.firstChild.style.textShadow=`2px 2px 3px ${o}, 2px 2px 4px ${o}, 2px 2px 5px ${o}`:"raised"===t.edgeStyle?c.firstChild.style.textShadow=`1px 1px ${o}, 2px 2px ${o}, 3px 3px ${o}`:"depressed"===t.edgeStyle?c.firstChild.style.textShadow=`1px 1px ${i}, 0 1px ${i}, -1px -1px ${o}, 0 -1px ${o}`:"uniform"===t.edgeStyle&&(c.firstChild.style.textShadow=`0 0 4px ${o}, 0 0 4px ${o}, 0 0 4px ${o}, 0 0 4px ${o}`)),t.fontPercent&&1!==t.fontPercent){const e=window.parseFloat(c.style.fontSize);c.style.fontSize=e*t.fontPercent+"px",c.style.height="auto",c.style.top="auto"}t.fontFamily&&"default"!==t.fontFamily&&("small-caps"===t.fontFamily?c.firstChild.style.fontVariant="small-caps":c.firstChild.style.fontFamily=a[t.fontFamily])}}updateForTrack(e){if(Array.isArray(e)||(e=[e]),"function"!=typeof window.WebVTT||e.every(e=>!e.activeCues))return;const t=[];for(let s=0;s<e.length;++s){const o=e[s];for(let e=0;e<o.activeCues.length;++e)t.push(o.activeCues[e])}window.WebVTT.processCues(window,t,this.el_);for(let t=0;t<e.length;++t){const o=e[t];for(let e=0;e<o.activeCues.length;++e){const i=o.activeCues[e].displayState;s.addClass(i,"vjs-text-track-cue"),s.addClass(i,"vjs-text-track-cue-"+(o.language?o.language:t))}this.player_.textTrackSettings&&this.updateDisplayState(o)}}}return e.registerComponent("TextTrackDisplay",l),l.constructColor=n,l});
//# sourceMappingURL=../sourcemaps/tracks/text-track-display.js.map
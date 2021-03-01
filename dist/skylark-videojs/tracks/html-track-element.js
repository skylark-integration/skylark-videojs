/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../event-target","../tracks/text-track"],function(t,e){"use strict";const s=0,a=2;class r extends t{constructor(t={}){let r;super();const n=new e(t);this.kind=n.kind,this.src=n.src,this.srclang=n.language,this.label=n.label,this.default=n.default,Object.defineProperties(this,{readyState:{get:()=>r},track:{get:()=>n}}),r=s,n.addEventListener("loadeddata",()=>{r=a,this.trigger({type:"load",target:this})})}}return r.prototype.allowedEvents_={load:"load"},r.NONE=s,r.LOADING=1,r.LOADED=a,r.ERROR=3,r});
//# sourceMappingURL=../sourcemaps/tracks/html-track-element.js.map

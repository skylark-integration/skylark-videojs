/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./button","./component","./utils/promise","./utils/browser"],function(e,s,t,o){"use strict";class i extends e{constructor(e,s){super(e,s),this.mouseused_=!1,this.on("mousedown",this.handleMouseDown)}buildCSSClass(){return"vjs-big-play-button"}handleClick(e){const s=this.player_.play();if(this.mouseused_&&e.clientX&&e.clientY){const e=this.player_.usingPlugin("eme")&&this.player_.eme.sessions&&this.player_.eme.sessions.length>0;return t.silencePromise(s),void(!this.player_.tech(!0)||(o.IE_VERSION||o.IS_EDGE)&&e||this.player_.tech(!0).focus())}const i=this.player_.getChild("controlBar"),n=i&&i.getChild("playToggle");if(!n)return void this.player_.tech(!0).focus();const l=()=>n.focus();t.isPromise(s)?s.then(l,()=>{}):this.setTimeout(l,1)}handleKeyDown(e){this.mouseused_=!1,super.handleKeyDown(e)}handleMouseDown(e){this.mouseused_=!0}}return i.prototype.controlText_="Play Video",s.registerComponent("BigPlayButton",i),i});
//# sourceMappingURL=sourcemaps/big-play-button.js.map

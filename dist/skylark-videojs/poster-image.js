/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./clickable-component","./component","./utils/fn","./utils/dom","./utils/promise","./utils/browser"],function(e,s,t,i,r,l){"use strict";class a extends e{constructor(e,s){super(e,s),this.update(),e.on("posterchange",t.bind(this,this.update))}dispose(){this.player().off("posterchange",this.update),super.dispose()}createEl(){return i.createEl("div",{className:"vjs-poster",tabIndex:-1})}update(e){const s=this.player().poster();this.setSrc(s),s?this.show():this.hide()}setSrc(e){let s="";e&&(s=`url("${e}")`),this.el_.style.backgroundImage=s}handleClick(e){if(!this.player_.controls())return;const s=this.player_.usingPlugin("eme")&&this.player_.eme.sessions&&this.player_.eme.sessions.length>0;!this.player_.tech(!0)||(l.IE_VERSION||l.IS_EDGE)&&s||this.player_.tech(!0).focus(),this.player_.paused()?r.silencePromise(this.player_.play()):this.player_.pause()}}return s.registerComponent("PosterImage",a),a});
//# sourceMappingURL=sourcemaps/poster-image.js.map

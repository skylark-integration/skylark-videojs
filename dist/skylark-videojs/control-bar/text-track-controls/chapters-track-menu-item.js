/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["../../menu/menu-item","../../component","../../utils/fn"],function(e,t,s){"use strict";class i extends e{constructor(e,t){const i=t.track,c=t.cue,n=e.currentTime();t.selectable=!0,t.multiSelectable=!1,t.label=c.text,t.selected=c.startTime<=n&&n<c.endTime,super(e,t),this.track=i,this.cue=c,i.addEventListener("cuechange",s.bind(this,this.update))}handleClick(e){super.handleClick(),this.player_.currentTime(this.cue.startTime),this.update(this.cue.startTime)}update(e){const t=this.cue,s=this.player_.currentTime();this.selected(t.startTime<=s&&s<t.endTime)}}return t.registerComponent("ChaptersTrackMenuItem",i),i});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/chapters-track-menu-item.js.map

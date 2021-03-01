/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./text-track-menu-item","../../component"],function(e,t){"use strict";class n extends e{constructor(e,t){t.track={player:e,kind:t.kind,kinds:t.kinds,default:!1,mode:"disabled"},t.kinds||(t.kinds=[t.kind]),t.label?t.track.label=t.label:t.track.label=t.kinds.join(" and ")+" off",t.selectable=!0,t.multiSelectable=!1,super(e,t)}handleTracksChange(e){const t=this.player().textTracks();let n=!0;for(let e=0,s=t.length;e<s;e++){const s=t[e];if(this.options_.kinds.indexOf(s.kind)>-1&&"showing"===s.mode){n=!1;break}}n!==this.isSelected_&&this.selected(n)}handleSelectedLanguageChange(e){const t=this.player().textTracks();let n=!0;for(let e=0,s=t.length;e<s;e++){const s=t[e];if(["captions","descriptions","subtitles"].indexOf(s.kind)>-1&&"showing"===s.mode){n=!1;break}}n&&(this.player_.cache_.selectedLanguage={enabled:!1})}}return t.registerComponent("OffTextTrackMenuItem",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/off-text-track-menu-item.js.map

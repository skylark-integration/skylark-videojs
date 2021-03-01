/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./text-track-menu-item","../../component"],function(t,e){"use strict";class n extends t{constructor(t,e){e.track={player:t,kind:e.kind,label:e.kind+" settings",selectable:!1,default:!1,mode:"disabled"},e.selectable=!1,e.name="CaptionSettingsMenuItem",super(t,e),this.addClass("vjs-texttrack-settings"),this.controlText(", opens "+e.kind+" settings dialog")}handleClick(t){this.player().getChild("textTrackSettings").open()}}return e.registerComponent("CaptionSettingsMenuItem",n),n});
//# sourceMappingURL=../../sourcemaps/control-bar/text-track-controls/caption-settings-menu-item.js.map

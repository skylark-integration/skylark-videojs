/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","../component","./play-toggle","./time-controls/current-time-display","./time-controls/duration-display","./time-controls/time-divider","./time-controls/remaining-time-display","./live-display","./seek-to-live","./progress-control/progress-control","./picture-in-picture-toggle","./fullscreen-toggle","./volume-panel","./text-track-controls/chapters-button","./text-track-controls/descriptions-button","./text-track-controls/subtitles-button","./text-track-controls/captions-button","./text-track-controls/subs-caps-button","./audio-track-controls/audio-track-button","./playback-rate-menu/playback-rate-menu-button","./spacer-controls/custom-control-spacer"],function(t,e){"use strict";class o extends e{createEl(){return super.createEl("div",{className:"vjs-control-bar",dir:"ltr"})}}return o.prototype.options_={children:["playToggle","volumePanel","currentTimeDisplay","timeDivider","durationDisplay","progressControl","liveDisplay","seekToLive","remainingTimeDisplay","customControlSpacer","playbackRateMenuButton","chaptersButton","descriptionsButton","subsCapsButton","audioTrackButton","fullscreenToggle"]},"exitPictureInPicture"in t&&o.prototype.options_.children.splice(o.prototype.options_.children.length-1,0,"pictureInPictureToggle"),e.registerComponent("ControlBar",o),o});
//# sourceMappingURL=../sourcemaps/control-bar/control-bar.js.map

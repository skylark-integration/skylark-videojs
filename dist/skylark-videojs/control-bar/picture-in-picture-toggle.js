/**
 * skylark-videojs - A version of video.js that ported to running on skylarkjs.
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["skylark-langx-globals/document","../button","../component"],function(e,t,i){"use strict";class r extends t{constructor(e,t){super(e,t),this.listenTo(e,["enterpictureinpicture","leavepictureinpicture"],this.handlePictureInPictureChange),this.listenTo(e,["disablepictureinpicturechanged","loadedmetadata"],this.handlePictureInPictureEnabledChange),this.disable()}buildCSSClass(){return`vjs-picture-in-picture-control ${super.buildCSSClass()}`}handlePictureInPictureEnabledChange(){e.pictureInPictureEnabled&&!1===this.player_.disablePictureInPicture()?this.enable():this.disable()}handlePictureInPictureChange(e){this.player_.isInPictureInPicture()?this.controlText("Exit Picture-in-Picture"):this.controlText("Picture-in-Picture"),this.handlePictureInPictureEnabledChange()}handleClick(e){this.player_.isInPictureInPicture()?this.player_.exitPictureInPicture():this.player_.requestPictureInPicture()}}return r.prototype.controlText_="Picture-in-Picture",i.registerComponent("PictureInPictureToggle",r),r});
//# sourceMappingURL=../sourcemaps/control-bar/picture-in-picture-toggle.js.map

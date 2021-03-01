define([
	'skylark-langx/skylark',
    './video'
//    '@videojs/http-streaming'
], function (skylark,videojs) {
    'use strict';

    return skylark.attach("intg.videojs",videojs);
});
define(function () {
    'use strict';
    const checkVolumeSupport = function (self, player) {
        if (player.tech_ && !player.tech_.featuresVolumeControl) {
            self.addClass('vjs-hidden');
        }
        self.on(player, 'loadstart', function () {
            if (!player.tech_.featuresVolumeControl) {
                self.addClass('vjs-hidden');
            } else {
                self.removeClass('vjs-hidden');
            }
        });
    };
    return checkVolumeSupport;
});
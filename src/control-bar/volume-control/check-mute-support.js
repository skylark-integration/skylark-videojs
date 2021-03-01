define(function () {
    'use strict';
    const checkMuteSupport = function (self, player) {
        if (player.tech_ && !player.tech_.featuresMuteControl) {
            self.addClass('vjs-hidden');
        }
        self.on(player, 'loadstart', function () {
            if (!player.tech_.featuresMuteControl) {
                self.addClass('vjs-hidden');
            } else {
                self.removeClass('vjs-hidden');
            }
        });
    };
    return checkMuteSupport;
});
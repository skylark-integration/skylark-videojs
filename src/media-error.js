define(['./utils/obj'], function (obj) {
    'use strict';
    function MediaError(value) {
        if (value instanceof MediaError) {
            return value;
        }
        if (typeof value === 'number') {
            this.code = value;
        } else if (typeof value === 'string') {
            this.message = value;
        } else if (obj.isObject(value)) {
            if (typeof value.code === 'number') {
                this.code = value.code;
            }
            obj.assign(this, value);
        }
        if (!this.message) {
            this.message = MediaError.defaultMessages[this.code] || '';
        }
    }
    MediaError.prototype.code = 0;
    MediaError.prototype.message = '';
    MediaError.prototype.status = null;
    MediaError.errorTypes = [
        'MEDIA_ERR_CUSTOM',
        'MEDIA_ERR_ABORTED',
        'MEDIA_ERR_NETWORK',
        'MEDIA_ERR_DECODE',
        'MEDIA_ERR_SRC_NOT_SUPPORTED',
        'MEDIA_ERR_ENCRYPTED'
    ];
    MediaError.defaultMessages = {
        1: 'You aborted the media playback',
        2: 'A network error caused the media download to fail part-way.',
        3: 'The media playback was aborted due to a corruption problem or because the media used features your browser did not support.',
        4: 'The media could not be loaded, either because the server or network failed or because the format is not supported.',
        5: 'The media is encrypted and we do not have the keys to decrypt it.'
    };
    for (let errNum = 0; errNum < MediaError.errorTypes.length; errNum++) {
        MediaError[MediaError.errorTypes[errNum]] = errNum;
        MediaError.prototype[MediaError.errorTypes[errNum]] = errNum;
    }
    return MediaError;
});
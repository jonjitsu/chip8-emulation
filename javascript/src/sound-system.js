
module.exports = soundSystem;

var utils = require('./utils'),
    defaults = {
        frequency: 440, // A4 major
        frequencyType: 'sine',
        volume: 2  // 0-10 
    };

function soundSystem(options) {
    options = utils.extend(defaults, options);

    var ac = new AudioContext(),
        os = ac.createOscillator(),
        gn = ac.createGain(),
        gainValue = volumeToGainLevel(options.volume),
        initialize = function() {
            os.frequency.value = options.frequency;
            os.type = options.frequencyType;
            // gn.gain.value = gainValue,
            gn.gain.value = 0,
            os.connect(gn);
            os.start(0);

            gn.connect(ac.destination);
        },
        on = function() {
            // gn.connect(ac.destination);
            gn.gain.value = gainValue;
        },
        off = function() {
            // gn.disconnect();
            gn.gain.value = 0;
        };

    initialize();
    return {
        ac: ac, os: os, gn: gn,
        api: {
            soundOn: on,
            soundOff: off
        }
    };
}

function volumeToGainLevel(vol) {
    return vol/10;
}

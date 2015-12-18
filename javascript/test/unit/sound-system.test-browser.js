var chai = require('chai'),
    assert = chai.assert,
    sound = require('../../src/sound-system.js');

describe('sound-system', function() {
    it('can configure sound system with options', function() {
        var options = {
            frequency: 140, // A4 major
            frequencyType: 'square',
            volume: 5  // 0-10 
        },
        ss = sound(options);

        assert.equal(options.frequency, ss.os.frequency.value);
        assert.equal(options.frequencyType, ss.os.type);
        ss.api.soundOn();
        assert.equal(options.volume/10, ss.gn.gain.value);
        ss.api.soundOff();
    });

    function isSoundOn(ss) {
        return ss.gn.gain.value!==0;
    }
    it('can start/stop beeping', function() {
        var options = {
            frequency: 140, // A4 major
            frequencyType: 'square',
            volume: 1  // 0-10 
        },
        ss = sound(options);

        ss.api.soundOn();
        assert(isSoundOn(ss));
        ss.api.soundOff();
        assert(!isSoundOn(ss));
    });
});

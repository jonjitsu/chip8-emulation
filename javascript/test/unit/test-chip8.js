var chai = require('chai'),
    assert = chai.assert,
    fs = require('fs'),

    chip8 = require('../../src/chip8.js')
;

describe('chip8', function() {
    it('should have a loadProgram function', function() {
        var c = chip8();
        assert.isFunction(c.loadProgram);
    });
    it('should be able to load a program from file', function(done) {
        var c = chip8(),
            file = './test/fixtures/prog.ch8',
            expectedData = fs.readFileSync(file),
            dataLength = expectedData.length,
            expected = new Uint8Array(dataLength)
        ;
        this.timeout(300); 
        expected.set(expectedData);
         
        c.loadProgram(file)
            .then(function() {
                assert.deepEqual(c._ram.slice(0x200, 0x200+expected.length), expected); 
                assert.equal(c._pc, 0x200);
                done();
            });

    });
});

var chai = require('chai'),
    assert = chai.assert,
    canvas = require('../../src/canvas-display.js'),
    utils = require('../../src/utils.js')
    ;

describe('canvas-display', function() {
    it('can create a canvas', function() {
        var options = {
            pixelSize: 20, width: 100, height: 100, bg:'red', fg:'green'
        },
            display = canvas(options);
        assert(display.el.toString()==="[object HTMLCanvasElement]");
        assert.equal(display.el.width, options.width*options.pixelSize);
        assert.equal(display.el.height, options.height*options.pixelSize);
        assert.deepEqual(
            utils.toArray(display.ctx.getImageData(0,0,1,1).data),
            [255,0,0,255]);
    });

    it('can clear the display', function() {
        var options = {
                pixelSize: 1, width: 20, height: 20, bg:'black', fg:'white'
            },
            display = canvas(options),
            displayData = function() {
                return display.ctx.getImageData(0,0, options.width, options.height).data.toString();
            },
            expected = displayData();

        display.ctx.fillStyle='red';
        display.ctx.fillRect(10,10,5,5);
        assert(expected!==displayData());
        display.api.displayClear();
        assert(expected===displayData());
    });

    it('can draw a sprite at a position', function() {
        var spriteA = [0xF0, 0x90, 0xF0, 0x90, 0x90],
            options = {
                pixelSize: 1, width: 100, height: 100, bg:'black', fg:'white'
            },
            display = canvas(options);

        display.api.displayDraw(10,10, spriteA);

        var idata = display.ctx.getImageData(10, 10, options.pixelSize*5, options.pixelSize*5),
            expected = "255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,255,255,255,255,0,0,0,255,0,0,0,255,255,255,255,255,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,0,0,0,255,255,255,255,255,0,0,0,255,0,0,0,255,255,255,255,255,0,0,0,255,255,255,255,255,0,0,0,255,0,0,0,255,255,255,255,255,0,0,0,255";
        assert.equal(expected, idata.data.toString());
    });
});

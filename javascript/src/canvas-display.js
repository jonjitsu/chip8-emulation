
module.exports = canvasDisplay;

var utils = require('./utils'),

    defaults = {
        // size of a chip8 display pixel in canvas pixels
        pixelSize: 10,
        width: 64, height: 32,
        bg: 'black', fg: 'white'
    };



function canvasDisplay(options) {
        options = utils.extend(defaults, options);

        var c = document.createElement('canvas'),
            ctx = c.getContext('2d'),
            pixelSize = options.pixelSize,
            width = options.width * options.pixelSize,
            height = options.height * options.pixelSize,
            clear = function() {
                ctx.fillStyle = options.bg;
                ctx.fillRect(0, 0, width, height);
            },
            point = function(x, y) {
                x = x*pixelSize;
                y = y*pixelSize;
                ctx.fillStyle = options.fg;
                ctx.fillRect(x, y, pixelSize, pixelSize);
            },
            toBinaryString = function(n) {
                return ('0000' + n.toString(2)).slice(-4);
            }
            draw = function(x, y, sprite) {
                console.log(sprite);
                sprite.forEach(function(part) {
                    toBinaryString(part>>>4)
                        .split('')
                        .forEach(function(onOrOff) {
                            if( onOrOff==='1' ) point(x, y);
                            x++;
                        });
                    y++;
                    x=x-4;
                });
            }
        ;

        c.width = width;
        c.height = height;
        clear();
        return {
            el: c, ctx: ctx,
            api: {
                displayClear: clear,
                displayDraw: draw
            }
        };
    }


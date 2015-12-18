var utils = require('./utils.js'),
    chip8 = require('./chip8.js'),
    canvasDisplay = require('./canvas-display.js'),
    display = canvasDisplay(),
    soundSystem = require('./sound-system.js'),
    sound = soundSystem(), 
    vm = chip8.create(),
    data = [0x00, 0xE0, 0x00, 0xE0],
    data2 = [0xa2, 0x1e, 0xc2, 0x1, 0x32, 0x1, 0xa2, 0x1a, 0xd0, 0x14, 0x70, 0x4, 0x30, 0x40, 0x12, 0x0, 0x60, 0x0, 0x71, 0x4, 0x31, 0x20, 0x12, 0x0, 0x12, 0x18, 0x80, 0x40, 0x20, 0x10, 0x20, 0x40, 0x80, 0x10]
;
vm.loadProgram(data2);
window.vm = vm;
window.ss = sound;
window.c = canvasDisplay;
window.d = display;
window.aet = addElementTo;
window.sprite = [0xF0, 0x90, 0x90, 0x90, 0xF0];

onready(main);

function main() {
    vm.bus = utils.extend(vm.bus, display.api);
    addElementTo(display.el, 'display');
}

function addElementTo(el, id) {
    var box = document.getElementById(id);
    box.innerHTML = '';
    box.appendChild(el);
}
function onready(fn) {
    if( typeof window.onload==='function' ) {
        var oldLoad = window.onload;
        window.onload = function() {
            oldLoad();
            fn();
        };
    } else {
        window.onload = fn;
    }
}

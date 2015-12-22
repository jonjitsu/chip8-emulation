var l = console.log.bind(console),
    utils = require('./utils.js'),
    chip8 = require('./chip8.js'),
    dasm = require('./dasm.js'),
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

function loadRom(e) {
    var file = e.target.files[0],
        reader = new FileReader();

    if(file) {
        reader.onload = function(e) {
            var data = new Uint8Array(e.target.result);
            vm.reset();
            vm.loadProgram(data);
            loadDisassembly(data);
            l('ROM loaded!');
            // vm.run();
        }
        reader.readAsArrayBuffer(file);
    } else {
        l('Cannot load rom!', e);
    }
}

function insertContent(id, content) {
    var el = document.getElementById(id);
    if(el) el.innerHTML = content;
}
function loadDisassembly(data) {
    insertContent('disassembly', dasm(data).toString());
}
function setupRomUploader(id) {
    var input = document.getElementById(id);
    input.addEventListener('change', loadRom, false);
}

function main() {
    vm.bus = utils.extend(vm.bus, display.api);
    addElementTo(display.el, 'display');
    setupRomUploader('rom-uploader');
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

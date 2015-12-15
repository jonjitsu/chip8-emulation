
const RAMSIZE = 4096,
      PROGRAM_START = 0x200
;
var fetcher = require('./fetch'),

    /*
      Machine state
     */
    ram = new Uint8Array(RAMSIZE),
    registers = new Uint8Array(16),
    stack = new Uint16Array(16),
    pc = 0x200,
    sp = 0,


    
    isNodeJS = function() {
        return !(process===undefined);
    },
    isBrowser = function() {
        return !isNodeJS();
    },
    loadFromFileSystem = function loadFromFileSystem(path) {
        if( isBrowser() ) return;
        var fs = require('fs');
        return fs.readFileSync(path);
    },
    loadProgram = function loadProgram(uri) {
        return fetcher(uri)
            .then(function(data) {
                ram.set(data, PROGRAM_START);
            });
    },

    nextOpcode = function() {
        return ram[pc];
    },
    fireEvents = function() {
        console.log('Firing events');
    },

    isRunning = true,

    run = function run() {
        while(isRunning) {
            var opcode = nextOpcode();
            console.log(opcode);
            processOpcode(opcode);
            pc++
            fireEvents();
            isRunning=false;
        }
    },

    brk = function() {
        isRunning = false;
    },

    machineState = function() {
        return {
            registers: registers,
            stack: stack,
            pc: pc,
            sp: sp
        };
    }

;

function chip8() {
    return {
        _ram: ram, _registers: registers, _stack: stack, _pc: pc, _sp: sp,

        break: brk,

        loadProgram: loadProgram,

        run: run,

        powerOn: run,

        state: machineState
    };
}

module.exports = chip8;

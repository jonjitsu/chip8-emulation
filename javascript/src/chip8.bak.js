
const RAMSIZE = 4096,
      PROGRAM_START = 0x200
;
var fetcher = require('./fetch'),
    /*
      Machine state
     */
    state = function state() {
        return {
            ram: new Uint8Array(RAMSIZE),
            registers: new Uint16Array(16),
            stack: new Uint16Array(16),
            pc: 0x200,
            sp: 0
        }
    }, 
    ram = new Uint8Array(RAMSIZE),
    registers = new Uint8Array(16),
    stack = new Uint16Array(16),
    pc = 0x200,
    sp = 0,


    loadData = function(data, pos) {
        pos = pos || PROGRAM_START;
        ram.set(data, pos);
    },
    loadProgram = function loadProgram(uri) {
        return fetcher(uri)
            .then(function(data) {
                loadData(data, PROGRAM_START);
            });
    },

    nextOpcode = function() {
        var opcode = ram[pc];
        if (pc > 0x220) throw new Error('End of Program');
        return opcode;
    },
    extractAddress = function (opcode, arg) {
        return ((opcode & 0xF) << 8) | arg;  
    },
    processOpcode = function (opcode) {
        var type = opcode & 0xF0,
            arg = ram[pc + 1],
            ops = [
                function (opcode, arg) {
                    if (opcode === 0x00) {
                        if (arg === 0xE0) {
                            return console.log('clear screen');
                        } else if (arg === 0xEE) {
                            return console.log('return subroutine');
                        }
                    } 
                    pc = extractAddress(opcode, arg);
                }
            ]
        ;
         
        ops[type](opcode, arg);      
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
            pc += 2;
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

        loadData: loadData,
        loadProgram: loadProgram,

        run: run,

        powerOn: run,

        state: machineState
    };
}

module.exports = chip8;

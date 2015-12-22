var assert = require('chai').assert,
    dasm = require('../../src/dasm.js'),
    opcode = dasm.opcode,
    decode = opcode.decode
;

describe('dasm', function() {
    describe('opcode', function() {
        function assertOpcodes(opcodes, decoder) {
            opcodes.forEach(function(pair) {
                if( pair[1].slice ) {
                    assert.deepEqual(pair[1], decoder(pair[0]));
                } else {
                    assert.strictEqual(pair[1], decoder(pair[0]));
                }
            });
        }
        it('can decode type', function() {
            var opcodes = [
                [0x00E0, 0],
                [0x1453, 1],
                [0xF365, 0xF]
            ];
            assertOpcodes(opcodes, opcode.type);
        });
        it('can decode address', function() {
            var opcodes = [
                [0x15d3, 0x5d3],
                [0x2867, 0x867],
                [0xB3ef, 0x3ef]
            ];
            assertOpcodes(opcodes, opcode.address);
        });
        it('can decode Register', function() {
            var opcodes = [
                [0xf21e, 2],
                [0xfe33, 0xe],
                [0x30ff, 0]
            ];

            assertOpcodes(opcodes, opcode.x);
        });
        it('can decode registers', function() {
            var opcodes = [
                [0x8015, [0, 1]],
                [0x8fe7, [0xf, 0xe]]
            ];
            assertOpcodes(opcodes, opcode.registers);
        });

        it('can decode y register', function() {
            var opcodes = [
                [0x8015, 1],
                [0x8fe7, 0xe]
            ];
            assertOpcodes(opcodes, opcode.y);
        });

        it('can decode byte', function() {
            var opcodes = [
                [0xC259, 0x59]
            ];
            assertOpcodes(opcodes, opcode.byte);
        });
        it('can decode nibble', function() {
            var opcodes = [
                [0xD342, 2]
            ];
            assertOpcodes(opcodes, opcode.nibble);
        });
    });

    function assertToken(assertMessage, token, instruction, operands, metadata) {
        if( instruction===undefined ) throw new Error('Bad test!');
        assert.strictEqual( token.instruction, instruction );

        if( operands!==undefined ) {
            assert.deepEqual(token.operands, operands);
        }

        if( metadata!==undefined ) {
            for( var prop in metadata ) {
                assert.strictEqual(metadata[prop], token[prop]);
            }
        }
    }
    it('opcodes', function() {


        assertToken('[00E0] CLS', decode(0x00E0), 'CLS');
        assertToken('[00EE] RET', decode(0x00EE), 'RET');
        assertToken('[01EE] SYS nnn', decode(0x01EE), 'SYS', [0x1EE]);
        assertToken('[1nnn] JP nnn', decode(0x11EE), 'JP', [0x1EE]);
        assertToken('[2nnn] CALL nnn', decode(0x23fa), 'CALL', [0x3fa]);
        assertToken('[3xkk] SE Vx, kk', decode(0x3ea6), 'SE', ['VE', '#A6']);
        assertToken('[4xkk] SNE Vx, kk', decode(0x4ea6), 'SNE', ['VE', '#A6']);
        assertToken('[5xy0] SE Vx, Vy', decode(0x5ea0), 'SE', ['VE', 'VA']);
        assertToken('[6xkk]', decode(0x6a5f), 'LD', ['VA', '#5F']);
        assertToken('[7xkk] ADD Vx, kk', decode(0x773d), 'ADD', ['V7', '#3D']);
        assertToken('[8xy0] LD Vx, Vy', decode(0x8700), 'LD', ['V7', 'V0']);
        assertToken('[8xy1] OR Vx, Vy', decode(0x86c1), 'OR', ['V6', 'VC']);
        assertToken('[8xy2] AND Vx, Vy', decode(0x86c2), 'AND', ['V6', 'VC']);
        assertToken('[8xy3] XOR Vx, Vy', decode(0x86c3), 'XOR', ['V6', 'VC']);
        assertToken('[8xy4] ADD Vx, Vy', decode(0x86c4), 'ADD', ['V6', 'VC']);
        assertToken('[8xy5] SUB Vx, Vy', decode(0x86c5), 'SUB', ['V6', 'VC']);
        assertToken('[8xy6] SHR Vx, Vy', decode(0x86c6), 'SHR', ['V6', 'VC']);
        assertToken('[8xy7] SUBN Vx, Vy', decode(0x86c7), 'SUBN', ['V6', 'VC']);
        assertToken('[8xyE] SHL Vx, Vy', decode(0x86cE), 'SHL', ['V6', 'VC']);
        assertToken('[9xy0] SNE Vx, Vy', decode(0x9320), 'SNE', ['V3', 'V2']);
        assertToken('[Annn] LD I, nnn', decode(0xa0af), 'LD', ['I', 0x0af]);
        assertToken('[Bnnn] JP V0, nnn', decode(0xb0af), 'JP', ['V0', 0x0af]);
        assertToken('[Cxkk] RND Vx, kk', decode(0xcccf), 'RND', ['VC', '#CF']);
        assertToken('[Dxyn] DRW Vx, Vy, n', decode(0xd138), 'DRW', ['V1', 'V3', '#8']);
        assertToken('[Ex9E] SKP Vx', decode(0xEd9e), 'SKP', ['VD']);
        assertToken('[ExA1] SKNP Vx', decode(0xEda1), 'SKNP', ['VD']);
        assertToken('[Fx07] LD Vx, DT', decode(0xF707), 'LD', ['V7', 'DT']);
        assertToken('[Fx0A] LD Vx, K', decode(0xF70A), 'LD', ['V7', 'K']);
        assertToken('[Fx15] LD DT, Vx', decode(0xF715), 'LD', ['DT', 'V7']);
        assertToken('[Fx18] LD ST, Vx', decode(0xF718), 'LD', ['ST', 'V7']);
        assertToken('[Fx29] LD F, Vx', decode(0xF729), 'LD', ['F', 'V7']);
        assertToken('[Fx33] LD B, Vx', decode(0xF733), 'LD', ['B', 'V7']);
        assertToken('[Fx55] LD [I], Vx', decode(0xF755), 'LD', ['[I]', 'V7']);
        assertToken('[Fx65] LD Vx, [I]', decode(0xF765), 'LD', ['V7', '[I]']);
        assertToken('[Fx1E] ADD I, Vx', decode(0xF71E), 'ADD', ['I', 'V7']);
    });

    it('can reduce an array of data to a stream of tokens', function() {
        var data = [0x00, 0xE0, 0x12, 0x00],
            tokens = dasm(data).tokens();

        assertToken(null, tokens[0], 'CLS', undefined, {label: true, opcode: 0x00E0});
        assertToken(null, tokens[1], 'JP', [0x200], {opcode: 0x1200});
        assert.strictEqual(2, tokens.length);
    });

    it('can render individual tokens to strings', function() {
        var data = [0x00, 0xE0, 0x12, 0x00],
            tokens = dasm(data).tokens();

        // assert.equal('200:\n\tCLS\t\t\t; 0x00E0', dasm.renderToken(tokens[0]));
        assert.equal('\tCLS\t\t\t; 0x00E0', dasm.renderToken(tokens[0]));
    });
});

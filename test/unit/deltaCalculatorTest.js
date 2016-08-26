var expect          = require('chai').expect;

var deltaCalculator = require('../../lib/deltaCalculator.js');

describe('DeltaCalculator', function() {
  
    describe('the "getDelta" function', function() {

        it('works with a simple test', function() {
            var delta = deltaCalculator.getDelta('Hello the world! Welcome!', 'Hello world and other planets! Welcome!');

            expect(delta).to.be.an.instanceof(Buffer);
        });

        it('creates an empty diff if files are equal', function() {
            var oldString = 'Hello world!';
            var newString = oldString;

            var delta = deltaCalculator.getDelta(oldString, newString);

            expect(delta.length).to.equal(0);
        });

        it('deals correctly with adding less than 127 characters', function() {
            var oldString = 'Hello world!';
            var newString = 'Hello big world!';

            var delta = deltaCalculator.getDelta(oldString, newString);

            expect(delta.length).to.equal(6);
            expect(delta.readUInt16BE(0).toString(2)).to.equal('1000001100000100');
            expect(delta.slice(2).toString()).to.equal('big ');
        });

        it('deals correctly with adding more than 127 characters', function() {
            var oldString = 'Hello world!';
            var newString = 'Hello ' + getStringOfLength(150) + 'world!';

            var delta = deltaCalculator.getDelta(oldString, newString);

            expect(delta.length).to.equal(2 + 2 + 150);
            expect(delta.readUInt16BE(0).toString(2)).to.equal('1000001101111111');
            expect(delta.slice(2, 2 + 127).toString()).to.equal(getStringOfLength(127));
            expect(delta.readUInt16BE(2 + 127).toString(2)).to.equal('1011111110010111');
            expect(delta.slice(2 + 127 + 2).toString()).to.equal(getStringOfLength(150 - 127));
        });

        it('deals correctly with adding a non ascii char', function() {
            var oldString = 'Hello world!';
            var newString = 'Hello 繁 world!'; // The 繁 char requires 3 bytes

            var delta = deltaCalculator.getDelta(oldString, newString);

            expect(delta.length).to.equal(6);
            expect(delta.readUInt16BE(0).toString(2)).to.equal('1000001100000010');
            expect(delta.slice(2).toString()).to.equal('繁 ');
        });

        it('deals correctly with removing some chars', function() {
            var oldString = 'Hello world!';
            var newString = 'Hell world';

            var delta = deltaCalculator.getDelta(oldString, newString);

            expect(delta.length).to.equal(4);
            expect(delta.readUInt16BE(0).toString(2)).to.equal('1000000001');
            expect(delta.readUInt16BE(2).toString(2)).to.equal('1110000001');
        });

        it('deals correctly with removing more than 127 chars', function() {
            var oldString = 'Hello ' + getStringOfLength(150) + 'world!';
            var newString = 'Hello world';

            var delta = deltaCalculator.getDelta(oldString, newString);

            expect(delta.length).to.equal(6);
            expect(delta.readUInt16BE(0).toString(2)).to.equal('1101111111');
            expect(delta.readUInt16BE(2).toString(2)).to.equal('11111110010111'); 
            expect(delta.readUInt16BE(4).toString(2)).to.equal('111000000001');
        });

    });

    function getStringOfLength(length) {
        var result = '';
        for (var i = 0; i < length; i++) {
            result += 'a';
        }
        return result;
    }

});
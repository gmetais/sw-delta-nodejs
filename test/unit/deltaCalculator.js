var expect          = require('chai').expect;

var deltaCalculator = require('../../lib/deltaCalculator.js');

describe('DeltaCalculator', function() {
  
    describe('the "getDelta" function', function() {

        it('works with a simple test', function() {
            var delta = deltaCalculator.getDelta('Hello the world! Welcome!', 'Hello world and other planets! Welcome!');
            expect(delta).to.be.a('string');
        });

        it('creates an empty diff if files are equal', function() {
            var oldString = 'Hello world!';
            var newString = 'Hello world!';

            var delta = deltaCalculator.getDelta(oldString, newString);
            expect(delta).to.equal('');
        });

    });

});
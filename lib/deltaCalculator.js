var ubsdiff = require('node-bsdiff');


var DeltaCalculator = function() {
    'use strict';


    this.getDelta = function(oldString, newString) {

        return ubsdiff.diff(new Buffer(oldString), new Buffer(newString)).toString();
    };

};

module.exports = new DeltaCalculator();
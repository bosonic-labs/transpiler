var fs = require('fs'),
    transpiler = require('../');

exports.testTranspilation = function(test) {
    test.expect(1);
    var transpiled = transpiler(fs.readFileSync(__dirname + '/fixtures/spec_sample.html', 'utf8')),
        expected = {
            js: fs.readFileSync(__dirname + '/expected/spec_sample.js', 'utf8')
        };
    test.equal(transpiled.js, expected.js, "the JS should be transpiled");
    test.done();
}
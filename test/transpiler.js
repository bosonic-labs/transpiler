var fs = require('fs'),
    transpiler = require('../');

exports.testSimpleTranspilation = function(test) {
    test.expect(1);
    var transpiled = transpiler(fs.readFileSync(__dirname + '/fixtures/spec_sample.html', 'utf8')),
        expected = {
            js: fs.readFileSync(__dirname + '/expected/spec_sample.js', 'utf8')
        };
    test.equal(transpiled.js, expected.js, "the JS should be transpiled");
    test.done();
}

exports.testScriptDependency = function(test) {
    test.expect(1);
    var transpiled = transpiler(fs.readFileSync(__dirname + '/fixtures/sample_with_deps.html', 'utf8')),
        expected = {
            scripts: ["../node_modules/moment/moment.js", "../node_modules/pikaday/pikaday.js"]
        };
    test.deepEqual(transpiled.scripts, expected.scripts, "the script dependencies should be found");
    test.done();
}
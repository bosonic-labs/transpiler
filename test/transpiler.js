var fs = require('fs'),
    transpiler = require('../');

exports.testSimpleTranspilation = function(test) {
    test.expect(3);
    var transpiled = transpiler(fs.readFileSync(__dirname + '/fixtures/spec_sample.html', 'utf8')),
        expected = {
            js: fs.readFileSync(__dirname + '/expected/spec_sample.js', 'utf8')
        };
    test.equal(transpiled.js, expected.js, "the JS should be transpiled");
    test.equal(transpiled.scripts.length, 0);
    test.equal(transpiled.stylesheets.length, 0);
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

exports.testStylesheetDependency = function(test) {
    test.expect(1);
    var transpiled = transpiler(fs.readFileSync(__dirname + '/fixtures/sample_with_deps.html', 'utf8')),
        expected = {
            stylesheets: ["../node_modules/pikaday/css/pikaday.css"]
        };
    test.deepEqual(transpiled.stylesheets, expected.stylesheets, "the stylesheets dependencies should be found");
    test.done();
}
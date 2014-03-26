var fs = require('fs'),
    transpiler = require('../');

exports.testSimpleTranspilation = function(test) {
    test.expect(4);
    var transpiled = transpiler.transpile(fs.readFileSync(__dirname + '/fixtures/spec_sample.html', 'utf8')),
        expected = {
            js: fs.readFileSync(__dirname + '/expected/spec_sample.js', 'utf8'),
            css: fs.readFileSync(__dirname + '/expected/spec_sample.css', 'utf8')
        };
    test.equal(transpiled.js, expected.js, "the JS should be transpiled");
    test.equal(transpiled.css, expected.css, "the CSS should be shimmed");
    test.equal(transpiled.scripts.length, 0);
    test.equal(transpiled.stylesheets.length, 0);
    test.done();
}

exports.testScriptDependency = function(test) {
    test.expect(1);
    var transpiled = transpiler.transpile(fs.readFileSync(__dirname + '/fixtures/sample_with_deps.html', 'utf8')),
        expected = {
            scripts: ["../node_modules/moment/moment.js", "../node_modules/pikaday/pikaday.js"]
        };
    test.deepEqual(transpiled.scripts, expected.scripts, "the script dependencies should be found");
    test.done();
}

exports.testStylesheetDependency = function(test) {
    test.expect(1);
    var transpiled = transpiler.transpile(fs.readFileSync(__dirname + '/fixtures/sample_with_deps.html', 'utf8')),
        expected = {
            stylesheets: ["../node_modules/pikaday/css/pikaday.css"]
        };
    test.deepEqual(transpiled.stylesheets, expected.stylesheets, "the stylesheets dependencies should be found");
    test.done();
}

exports.testStylesShiming = function(test) {
    var tests = [
        [':host', 'b-dummy'],
        [':host:hover', 'b-dummy:hover'],
        [':host(.cssClass)', 'b-dummy.cssClass'],
        [':ancestor(.cssClass)', '.cssClass b-dummy'],
        [':host-context(.cssClass)', '.cssClass b-dummy']
    ];
    test.expect(tests.length);
    tests.forEach(function(rule) {
        test.equal(transpiler.shimSelector(rule[0], 'b-dummy'), rule[1]);
    });
    test.done();
}

exports.testStylesheetShiming = function(test) {
    var stylesheet = fs.readFileSync(__dirname + '/fixtures/shadowCSS_sample.css', 'utf8'),
        shimmed = fs.readFileSync(__dirname + '/expected/shimed_shadowCSS_sample.css', 'utf8');
    
    test.expect(1);
    test.equal(transpiler.shimStyles(stylesheet, 'b-dummy'), shimmed);
    test.done();
}
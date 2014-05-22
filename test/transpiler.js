var fs = require('fs'),
    transpiler = require('../');

exports.testStylesShiming = function(test) {
    var tests = [
        [':host', 'b-dummy'],
        [':host:hover', 'b-dummy:hover'],
        [':host[visible]', 'b-dummy[visible]'],
        [':host(.cssClass)', 'b-dummy.cssClass'],
        [':ancestor(.cssClass)', '.cssClass b-dummy'],
        [':host-context(.cssClass)', '.cssClass b-dummy'],
        ['p', 'b-dummy p'],
        ['b-dummy', 'b-dummy'],
        ['b-dummy p', 'b-dummy p'],
        ['::content p', 'b-dummy p']
    ];
    test.expect(tests.length);
    tests.forEach(function(rule) {
        test.equal(transpiler.shimSelector(rule[0], 'b-dummy'), rule[1]);
    });
    test.done();
}

exports.testStylesheetShiming = function(test) {
    var stylesheet = fs.readFileSync(__dirname + '/fixtures/shadowCSS_sample.css', 'utf8'),
        shimmed = fs.readFileSync(__dirname + '/expected/shadowCSS_sample.css', 'utf8');
    
    test.expect(1);
    test.equal(transpiler.shimStyles(stylesheet, 'b-dummy'), shimmed);
    test.done();
}

exports.testTranspileSpecSampleScript = function(test) {
    var script = fs.readFileSync(__dirname + '/fixtures/spec_sample_script.js', 'utf8'),
        expected = fs.readFileSync(__dirname + '/expected/spec_sample_script.js', 'utf8');

    test.expect(1);
    test.equal(transpiler.transpileScript(script, 'b-test'), expected);
    test.done();
}

exports.testTranspileScriptWithGettersSetters = function(test) {
    var script = fs.readFileSync(__dirname + '/fixtures/getters_setters.js', 'utf8'),
        expected = fs.readFileSync(__dirname + '/expected/getters_setters.js', 'utf8');

    test.expect(1);
    test.equal(transpiler.transpileScript(script, 'b-test'), expected);
    test.done();
}

exports.testTranspileSpecSample = function(test) {
    var transpiled = transpiler.transpile(fs.readFileSync(__dirname + '/fixtures/spec_sample.html', 'utf8')),
        expected = fs.readFileSync(__dirname + '/expected/spec_sample.html', 'utf8');
    
    test.expect(1);
    test.equal(transpiled, expected);
    test.done();
}

exports.testTranspileExtendedSpecSample = function(test) {
    var transpiled = transpiler.transpile(fs.readFileSync(__dirname + '/fixtures/extended_spec_sample.html', 'utf8')),
        expected = fs.readFileSync(__dirname + '/expected/extended_spec_sample.html', 'utf8');
    
    test.expect(1);
    test.equal(transpiled, expected);
    test.done();
}

exports.testExtendsNativeElementTranspilation = function(test) {
    var transpiled = transpiler.transpile(fs.readFileSync(__dirname + '/fixtures/extended_native_element.html', 'utf8')),
        expected = fs.readFileSync(__dirname + '/expected/extended_native_element.html', 'utf8');

    test.expect(1);
    test.equal(transpiled, expected);
    test.done();
}

exports.testExtendsBosonicElementTranspilation = function(test) {
    var transpiled = transpiler.transpile(fs.readFileSync(__dirname + '/fixtures/extended_bosonic_element.html', 'utf8')),
        expected = fs.readFileSync(__dirname + '/expected/extended_bosonic_element.html', 'utf8');
    
    test.expect(1);
    test.equal(transpiled, expected);
    test.done();
}

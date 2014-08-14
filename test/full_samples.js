var expect = require('chai').expect,
    transpiler = require('../'),
    fs = require('fs');

describe('Simplified spec sample', function() {
    var fixture = fs.readFileSync(__dirname + '/fixtures/simplified_spec_sample.html', 'utf8');
    
    it('should transpile into a vanilla JS Web Component', function() {
        var expected = fs.readFileSync(__dirname + '/expected/simplified_spec_sample.html', 'utf8'),
            transpiled = transpiler.transpile(fixture, { automaticTemplating: true, wrap: true });

        expect(transpiled.html).to.equal(expected);
    });
});

describe('Extended spec sample', function() {
    var fixture = fs.readFileSync(__dirname + '/fixtures/extended_spec_sample.html', 'utf8');

    it('should transpile into a vanilla JS Web Component', function() {
        var expected = fs.readFileSync(__dirname + '/expected/extended_spec_sample.html', 'utf8'),
            transpiled = transpiler.transpile(fixture, { automaticTemplating: true, wrap: true });

        expect(transpiled.html).to.equal(expected);
    });
});

describe('Extended native element', function() {
    var fixture = fs.readFileSync(__dirname + '/fixtures/extended_native_element.html', 'utf8');

    it('should transpile into a vanilla JS Web Component', function() {
        var expected = fs.readFileSync(__dirname + '/expected/extended_native_element.html', 'utf8'),
            transpiled = transpiler.transpile(fixture, { automaticTemplating: true, wrap: true });

        expect(transpiled.html).to.equal(expected);
    });
});
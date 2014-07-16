var expect = require('chai').expect,
    transpileScript = require('../lib/transpiler').transpileScript;

function transpile(code, element, extendee) {
    element = element || 'tick-tock-clock';
    return transpileScript(code, element, extendee, { automaticTemplating: true });
}

describe('empty component transpilation', function() {
    var code = [
        '({',
        '})'
    ].join('\n'),
        external = [
        'function fmt(n) {',
        '  return (n < 10 ? \'0\' : \'\') + n;',
        '}'
    ].join('\n');

    it('should work', function() {
        var expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '})});'
        ].join('\n');
        expect(transpileScript(code, 'tick-tock-clock')).to.equal(expected);
    });

    it('should preserve external code', function() {
        var expected = external + '\n' + [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '})});'
        ].join('\n');
        expect(transpileScript(external + '\n' + code, 'tick-tock-clock')).to.equal(expected);
    });
});

describe('automatic templating', function() {
    it('should add a createdCallback method when there is not one', function() {
        var code = [
            '({',
            '  foo: function(bar) {',
            '    console.log(bar);',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'var template = document._currentScript.parentNode.querySelector(\'template\');',
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  createdCallback: { enumerable: true, value: function() {',
            '    this.createShadowRoot();',
            '    this.shadowRoot.appendChild(template.content.cloneNode(true));',
            '  } },',
            '  foo: { enumerable: true, value: function(bar) {',
            '    console.log(bar);',
            '  } }',
            '})});'
        ].join('\n');
        expect(transpile(code, 'tick-tock-clock')).to.equal(expected);
    });

    it('should inject code into an existent createdCallback method', function() {
        var code = [
            '({',
            '  createdCallback: function() {',
            '    console.log(bar);',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'var template = document._currentScript.parentNode.querySelector(\'template\');',
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  createdCallback: { enumerable: true, value: function() {',
            '    this.createShadowRoot();',
            '    this.shadowRoot.appendChild(template.content.cloneNode(true));',
            '    console.log(bar);',
            '  } }',
            '})});'
        ].join('\n');
        expect(transpile(code, 'tick-tock-clock')).to.equal(expected);
    });
});

describe('methods transpilation', function() {
    var code = [
        '({',
        '  insertedCallback: start,',
        '  foo: function(bar) {',
        '    console.log(bar);',
        '  }',
        '})'
    ].join('\n');

    it('should expand them into property def', function() {
        var expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  insertedCallback: { enumerable: true, value: start },',
            '  foo: { enumerable: true, value: function(bar) {',
            '    console.log(bar);',
            '  } }',
            '})});'
        ].join('\n');
        expect(transpileScript(code, 'tick-tock-clock')).to.equal(expected);
    });
});

describe('getters and setters', function() {

    it('should expand a single getter', function() {
        var code = [
            '({',
            '  get height() {',
            '    return this.style.height;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, get: function() {',
            '    return this.style.height;',
            '  } }',
            '})});'
        ].join('\n');
        expect(transpileScript(code, 'tick-tock-clock')).to.equal(expected);
    });

    it('should expand a single setter', function() {
        var code = [
            '({',
            '  set height(value) {',
            '    this.style.height = value;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, set: function(value) {',
            '    this.style.height = value;',
            '  } }',
            '})});'
        ].join('\n');
        expect(transpileScript(code, 'tick-tock-clock')).to.equal(expected);
    });

    it('should expand a getter/setter', function() {
        var code = [
            '({',
            '  get height() {',
            '    return this.style.height;',
            '  },',
            '  set height(value) {',
            '    this.style.height = value;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, get: function() {',
            '    return this.style.height;',
            '  }, set: function(value) {',
            '    this.style.height = value;',
            '  } }',
            '})});'
        ].join('\n');
        expect(transpileScript(code, 'tick-tock-clock')).to.equal(expected);
    });

    it('should expand a setter/getter', function() {
        var code = [
            '({',
            '  set height(value) {',
            '    this.style.height = value;',
            '  },',
            '  get height() {',
            '    return this.style.height;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            'window.TickTockClock = document.registerElement(\'tick-tock-clock\', { prototype : Object.create(HTMLElement.prototype, {',
            '  height: { enumerable: true, set: function(value) {',
            '    this.style.height = value;',
            '  }, get: function() {',
            '    return this.style.height;',
            '  } }',
            '})});'
        ].join('\n');
        expect(transpileScript(code, 'tick-tock-clock')).to.equal(expected);
    });
});

describe('super shortcut & extends', function() {
    var code = [
        '({',
        '  foo: function(bar) {',
        '    super.foo(bar);',
        '  }',
        '})'
    ].join('\n');

    it('should expand into parent prototype function call', function() {
        var expected = [
            'window.SuperTickTockClock = document.registerElement(\'super-tick-tock-clock\', { prototype : Object.create(TickTockClock.prototype, {',
            '  foo: { enumerable: true, value: function(bar) {',
            '    TickTockClock.prototype.foo.call(this, bar);',
            '  } }',
            '})});'
        ].join('\n');
        expect(transpileScript(code, 'super-tick-tock-clock', 'tick-tock-clock')).to.equal(expected);
    });
});
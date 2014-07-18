var expect = require('chai').expect,
    transpileToReactComponent = require('../lib/react-transpiler').transpileToReactComponent;


var template = '<span id="hh"></span><span id="sep">:</span><span id="mm"></span>',
    renderMethod = [
        '  render: function() {',
        '    return this.transferPropsTo(',
        '      <div className="tick-tock-clock">',
        '        ' + template,
        '      </div>',
        '    );',
        '  }'
    ].join('\n');

var transpile = function(code, options) {
    var opts = {
        name: 'tick-tock-clock',
        extendee: null,
        template: template
    };
    options = options || {};
    if (options.attributes) opts.attributes = options.attributes;

    return transpileToReactComponent(code, opts);
}

describe('Component transpilation', function() {
    
    it('should add a render method and a mixin', function() {
        var code = [
                '({',
                '})'
            ].join('\n'),
            expected = [
                '/** @jsx React.DOM */',
                'var TickTockClock = React.createClass({',
                '  mixins: [BosonicMixin],',
                   renderMethod,
                '});'
            ].join('\n');
        expect(transpile(code)).to.equal(expected);
    });

    it('should rename WCs callbacks to React ones', function() {
        var code = [
                '({',
                '  createdCallback: foo,',
                '  attachedCallback: start,',
                '  detachedCallback: stop',
                '})'
            ].join('\n'),
            expected = [
                '/** @jsx React.DOM */',
                'var TickTockClock = React.createClass({',
                '  mixins: [BosonicMixin],',
                   renderMethod + ',',
                '  componentWillMount: foo,',
                '  componentDidMount: start,',
                '  componentDidUnmount: stop',
                '});'
            ].join('\n');
        expect(transpile(code)).to.equal(expected);
    });

    it('should proxify DOM methods to this.getDOMNode()', function() {
        var code = [
                '({',
                '  foo: function() {',
                '    this.querySelector("#foo").textContent = "bar";',
                '  }',
                '})'
            ].join('\n'),
            expected = [
                '/** @jsx React.DOM */',
                'var TickTockClock = React.createClass({',
                '  mixins: [BosonicMixin],',
                   renderMethod + ',',
                '  foo: function() {',
                '    this.getDOMNode().querySelector("#foo").textContent = "bar";',
                '  }',
                '});'
            ].join('\n');
        expect(transpile(code)).to.equal(expected);
    });

    it('should route shadowRoot calls to this.getDOMNode()', function() {
        var code = [
                '({',
                '  foo: function() {',
                '    this.shadowRoot.querySelector("#foo").textContent = "bar";',
                '  }',
                '})'
            ].join('\n'),
            expected = [
                '/** @jsx React.DOM */',
                'var TickTockClock = React.createClass({',
                '  mixins: [BosonicMixin],',
                   renderMethod + ',',
                '  foo: function() {',
                '    this.getDOMNode().querySelector("#foo").textContent = "bar";',
                '  }',
                '});'
            ].join('\n');
        expect(transpile(code)).to.equal(expected);
    });
});

describe('getters and setters', function() {

    it('should convert a getter into a method & rewrite property calls', function() {
        var code = [
            '({',
            '  get height() {',
            '    return this.style.height;',
            '  },',
            '  foo: function() {',
            '    console.log(this.height);',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            '/** @jsx React.DOM */',
            'var TickTockClock = React.createClass({',
            '  mixins: [BosonicMixin],',
               renderMethod + ',',
            '  getHeight: function() {',
            '    return this.style.height;',
            '  },',
            '  foo: function() {',
            '    console.log(this.getHeight());',
            '  }',
            '});'
        ].join('\n');
        expect(transpile(code)).to.equal(expected);
    });

    it('should convert a setter into a method', function() {
        var code = [
            '({',
            '  set height(value) {',
            '    this.style.height = value;',
            '  },',
            '  foo: function() {',
            '    this.height = 40;',
            '  }',
            '})'
        ].join('\n'),
            expected = [
            '/** @jsx React.DOM */',
            'var TickTockClock = React.createClass({',
            '  mixins: [BosonicMixin],',
               renderMethod + ',',
            '  setHeight: function(value) {',
            '    this.style.height = value;',
            '  },',
            '  foo: function() {',
            '    this.setHeight(40);',
            '  }',
            '});'
        ].join('\n');
        expect(transpile(code)).to.equal(expected);
    });

});

describe('declared attributes', function() {
    it('should add a special __attributes__ property', function() {
        var code = [
                '({',
                '})'
            ].join('\n'),
            expected = [
                '/** @jsx React.DOM */',
                'var TickTockClock = React.createClass({',
                '  __attributes__: [\'foo\'],',
                '  mixins: [BosonicMixin],',
                   renderMethod,
                '});'
            ].join('\n');
        expect(transpile(code, { attributes: ['foo'] })).to.equal(expected);
    });
});
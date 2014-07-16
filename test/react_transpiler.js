var expect = require('chai').expect,
    transpileToReactComponent = require('../lib/react-transpiler').transpileToReactComponent;

var template = '<span id="hh"></span><span id="sep">:</span><span id="mm"></span>',
    renderMethod = [
        '  render: function() {',
        '    return (',
        '      <div className="tick-tock-clock">',
        '        ' + template,
        '      </div>',
        '    );',
        '  }'
    ].join('\n');

describe('Component transpilation', function() {
    
    it('should add a render method', function() {
        var code = [
                '({',
                '})'
            ].join('\n'),
            expected = [
                '/** @jsx React.DOM */',
                'var TickTockClock = React.createClass({',
                    renderMethod,
                '});'
            ].join('\n');
        expect(transpileToReactComponent(code, 'tick-tock-clock', null, template)).to.equal(expected);
    });

    it('should rename WCs callbacks to React ones', function() {
        var code = [
                '({',
                '  insertedCallback: start,',
                '  removedCallback: stop',
                '})'
            ].join('\n'),
            expected = [
                '/** @jsx React.DOM */',
                'var TickTockClock = React.createClass({',
                   renderMethod + ',',
                '  componentDidMount: start,',
                '  componentDidUnmount: stop',
                '});'
            ].join('\n');
        expect(transpileToReactComponent(code, 'tick-tock-clock', null, template)).to.equal(expected);
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
                   renderMethod + ',',
                '  foo: function() {',
                '    this.getDOMNode().querySelector("#foo").textContent = "bar";',
                '  }',
                '});'
            ].join('\n');
        expect(transpileToReactComponent(code, 'tick-tock-clock', null, template)).to.equal(expected);
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
                   renderMethod + ',',
                '  foo: function() {',
                '    this.getDOMNode().querySelector("#foo").textContent = "bar";',
                '  }',
                '});'
            ].join('\n');
        expect(transpileToReactComponent(code, 'tick-tock-clock', null, template)).to.equal(expected);
    });
});
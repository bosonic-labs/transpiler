'use strict';

var jstransform = require('jstransform'),
    react = require('react-tools/vendor/fbtransform/transforms/react'),
    Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils'),
    tools = require('./tools');

var DOMProperties = [
    'querySelector',
    'querySelectorAll',
    'addEventListener',
    'dispatchEvent',
    'appendChild',

    'children',
    'parentNode',
    'tabIndex',
    'shadowRoot'
];

var globals,
    callbacksMap = {
    createdCallback: 'componentWillMount',
    attachedCallback: 'componentDidMount',
    detachedCallback: 'componentDidUnmount'
};

function visitAssignmentExpressionsForSetters(traverse, node, path, state) {
    utils.catchup(node.left.property.range[0], state);
    utils.append('set' + tools.ucfirst(node.left.property.name) + '(', state);
    utils.move(node.right.range[0], state);
    utils.catchup(node.right.range[1], state);
    utils.append(')', state);
}
visitAssignmentExpressionsForSetters.test = function(node, path, state) {
    return node.type === Syntax.AssignmentExpression
        && node.left.object
        && node.left.object.type === Syntax.ThisExpression
        && globals.setters.indexOf(node.left.property.name) !== -1;
}

function visitMemberExpressionsForGetters(traverse, node, path, state) {
    utils.catchup(node.property.range[0], state);
    utils.append('get' + tools.ucfirst(node.property.name) + '()', state);
    utils.move(node.property.range[1], state);
}
visitMemberExpressionsForGetters.test = function(node, path, state) {
    return node.type === Syntax.MemberExpression
        && node.object.type === Syntax.ThisExpression
        && globals.getters.indexOf(node.property.name) !== -1;
}

function visitThisExpression(traverse, node, path, state) {
    var property = node.property.name;

    if (DOMProperties.indexOf(property) !== -1) {
        utils.catchup(node.property.range[0], state);
        utils.append('getDOMNode().', state);
        if (property === 'shadowRoot') {
            utils.move(node.property.range[1] + '.'.length, state);
        } else {
            utils.catchup(node.property.range[1], state);
        }
    }
}
visitThisExpression.test = function(node, path, state) {
    return node.type === Syntax.MemberExpression
        && node.object.type === Syntax.ThisExpression
}

function visitProperty(traverse, node, path, state) {
    var key = node.key.name;

    if (node.kind === 'get') {
        globals.getters.push(key);
        utils.move(node.key.range[1], state);
        utils.append('get' + tools.ucfirst(key) + ': function', state);
        traverse(node.value, path, state);
        utils.catchup(node.value.range[1], state);
    } else if (node.kind === 'set') {
        globals.setters.push(key);
        utils.move(node.key.range[1], state);
        utils.append('set' + tools.ucfirst(key) + ': function', state);
        traverse(node.value, path, state);
        utils.catchup(node.value.range[1], state);
    } else {
        if (callbacksMap.hasOwnProperty(key)) {
            utils.move(node.key.range[1], state);
            utils.append(callbacksMap[key], state);
        }
        utils.catchup(node.value.range[0], state);
        traverse(node.value, path, state);
        utils.catchup(node.value.range[1], state);
    }
    return false;
}
visitProperty.test = function(node, path, state) {
    return node.type === Syntax.Property
        && path[0].type === Syntax.ObjectExpression;
}

function visitObjectExpressions(traverse, node, path, state) {
    var elementName = state.g.opts.elementName,
        extendee = state.g.opts.extendee,
        template = state.g.opts.template,
        attributes = state.g.opts.attributes,
        elementClass = tools.camelize(elementName),
        extendeeClass = tools.getExtendeeClass(extendee);

    state = utils.updateState(state, {
        elementName: elementName,
        elementClass: elementClass,
        extendeeClass: extendeeClass,
        template: template
    });

    utils.append('var '+elementClass+' = React.createClass({', state);
    utils.move(node.expression.range[0] + '{'.length, state);

    if (Array.isArray(attributes)) {
        utils.append('\n  __attributes__: [' + tools.stringifyArray(attributes) + '],', state);
    }

    utils.append('\n  mixins: [BosonicMixin],', state);

    template = template || '{this.props.children}';

    utils.append('\n  render: function() {\n', state);
    utils.append('    return this.transferPropsTo(\n', state);
    utils.append('      <div className="'+elementName+'">\n        ' + template + '\n      </div>\n', state);
    utils.append('    );\n', state);
    utils.append('  }', state);
    if (node.expression.properties.length > 0) {
        utils.append(',', state);
    }

    traverse(node.expression, path, state);
    utils.catchupWhiteSpace(node.range[1], state);

    utils.append('});', state);
    return false;
}
visitObjectExpressions.test = function(node, path, state) {
    return node.type === Syntax.ExpressionStatement
        && node.expression.type === Syntax.ObjectExpression;
};

function transpileToReactComponent(script, options) {
    globals = {
        getters: [],
        setters: []
    };

    var firstPass = jstransform.transform(
            [visitObjectExpressions, visitProperty, visitThisExpression],
            script,
            { 
                elementName: options.name,
                extendee: options.extendee,
                template: options.template,
                attributes: options.attributes
            }
        );
    var secondPass = jstransform.transform(
            [visitMemberExpressionsForGetters, visitAssignmentExpressionsForSetters], 
            firstPass.code
        );
    // var thirdPass = jstransform.transform(
    //         react.visitorList, 
    //         '/** @jsx React.DOM */\n' + secondPass.code
    //     );
    
    // return thirdPass.code;
    return '/** @jsx React.DOM */\n' + secondPass.code;
}

exports = module.exports = {
    transpileToReactComponent: transpileToReactComponent
}
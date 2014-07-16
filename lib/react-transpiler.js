'use strict';

var jstransform = require('jstransform'),
    Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils'),
    camelize = require('./utils').camelize,
    getExtendeeClass = require('./utils').getExtendeeClass;

var DOMProperties = [
    'querySelector',
    'shadowRoot'
];

function visitThisExpression(traverse, node, path, state) {
    utils.catchup(node.property.range[0], state);
    utils.append('getDOMNode().', state);
    if (node.property.name === 'shadowRoot') {
        utils.move(node.property.range[1] + '.'.length, state);
    } else {
        utils.catchup(node.property.range[1], state);
    }
}
visitThisExpression.test = function(node, path, state) {
    return node.type === Syntax.MemberExpression
        && node.object.type === Syntax.ThisExpression
        && DOMProperties.indexOf(node.property.name) !== -1
}

function visitProperty(traverse, node, path, state) {
    var key = node.key.name;
    switch (key) {
        case 'insertedCallback':
            utils.move(node.key.range[1], state);
            utils.append('componentDidMount', state);
            break;
        case 'removedCallback':
            utils.move(node.key.range[1], state);
            utils.append('componentDidUnmount', state);
            break;
    }
    utils.catchup(node.value.range[0], state);
    traverse(node.value, path, state);
    utils.catchup(node.value.range[1], state);
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
        elementClass = camelize(elementName),
        extendeeClass = getExtendeeClass(extendee);

    state = utils.updateState(state, {
        elementName: elementName,
        elementClass: elementClass,
        extendeeClass: extendeeClass,
        template: template
    });

    utils.append('var '+elementClass+' = React.createClass({', state);
    utils.move(node.expression.range[0] + '{'.length, state);

    utils.append('\n  render: function() {\n', state);
    utils.append('    return (\n', state);
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

function transpileToReactComponent(script, elementName, extendee, template) {
    var transformedScript = jstransform.transform(
        [visitObjectExpressions, visitProperty, visitThisExpression],
        script,
        { 
            elementName: elementName,
            extendee: extendee,
            template: template
        }
    );
    return '/** @jsx React.DOM */\n' + transformedScript.code;
}

exports = module.exports = {
    transpileToReactComponent: transpileToReactComponent
}
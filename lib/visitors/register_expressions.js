var Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils'),
    tools = require('../tools');

function createInjectableMethods(properties, state) {
    if (!state.g.opts.inject) return;
    for (var key in state.g.opts.inject) {
        var exists = tools.searchMethod(properties, key);
        if (!exists) {
            utils.append('\n  ' + key + ': { enumerable: true, value: function() {\n', state);
            tools.injectCode(state.g.opts.inject[key], state);
            utils.append('  } }', state);
            if (properties.length > 0) {
                utils.append(',', state);
            }
        }
    }
}

function renderGetterSetter(traverse, node, path, state) {
    if (state.gettersSetters.indexOf(node.key.name) !== -1) {
        return;
    }
    var key = node.key.name,
        inverseKind = node.kind === 'get' ? 'set' : 'get';
        inverse = tools.searchProperty(path[0].properties, key, inverseKind);

    utils.catchup(node.key.range[0] - (node.key.range[0] - key.length + 1), state);
    utils.move(node.key.range[1], state);
    utils.append(key + ': { enumerable: true, ' + node.kind + ': function', state);

    path.unshift(node);
    traverse(node.value, path, state);
    path.shift();

    utils.catchup(node.value.range[1], state);
    
    if (inverse) {
        state.gettersSetters.push(key)
        
        utils.move(inverse.key.range[1], state);
        utils.append(', ' + inverseKind + ': function', state);

        path.unshift(node);
        traverse(node.value, path, state);
        path.shift();

        utils.catchup(inverse.value.range[1], state);
    }

    utils.append(' }', state);
}

function renderProperty(traverse, node, path, state) {
    utils.catchup(node.key.range[1], state);
    utils.append(': { enumerable: true, value: ', state);
    utils.move(node.value.range[0], state);

    if (state.g.opts.inject && state.g.opts.inject.hasOwnProperty(node.key.name)) {
        utils.catchup(node.value.body.range[0] + '{\n'.length, state);
        tools.injectCode(state.g.opts.inject[node.key.name], state);
    }
    
    path.unshift(node);
    traverse(node.value, path, state);
    path.shift();

    utils.catchup(node.value.range[1], state);
    utils.append(' }', state);
}

function renderProperties(traverse, expressionNode, path, state) {
    state.gettersSetters = [];

    expressionNode.properties.forEach(function(node) {
        if (node.kind === 'get' || node.kind === 'set') {
            renderGetterSetter(traverse, node, path, state);
        } else {
            renderProperty(traverse, node, path, state);
        }
    });

    delete state.gettersSetters;
}

function visitRegisterExpression(traverse, node, path, state) {
    var elementName = state.g.opts.name,
        extendee = state.g.opts.extendee,
        extendsNativeElement = tools.extendsNativeElement(extendee),
        elementClass = tools.camelize(elementName),
        extendeeClass = tools.getExtendeeClass(extendee);

    var expressionNode = (node.type === Syntax.ExpressionStatement)
                       ? node.expression : node.arguments[0];

    if (state.g.opts.prepend) {
        utils.append(state.g.opts.prepend + "\n", state);
    }

    utils.append("window."+elementClass+" = document.registerElement('"+elementName+"', { ", state);
    utils.append("prototype : Object.create("+extendeeClass+".prototype, {", state);
    
    utils.move(expressionNode.range[0] + '{'.length, state);

    createInjectableMethods(expressionNode.properties, state);
    
    path.unshift(expressionNode);
    renderProperties(traverse, expressionNode, path, state);
    path.shift();
    
    utils.catchupWhiteSpace(node.range[1], state);

    utils.append('})', state);
    // CAUTION: when extending a non-native element, the polyfill doesn't work properly when the 'extends' option is set
    if (extendee && extendsNativeElement) { 
        utils.append(", extends: '" + extendee + "' ", state);
    }
    utils.append('});', state);
    return false;
}
visitRegisterExpression.test = function(node, path, state) {
    return (node.type === Syntax.ExpressionStatement && node.expression.type === Syntax.ObjectExpression)
        || (node.type === Syntax.CallExpression
            && node.callee.type === Syntax.MemberExpression && node.callee.object.name === 'Bosonic'
            && node.callee.property.name === 'register'
            && node.arguments[0].type === Syntax.ObjectExpression);
};

exports = module.exports = visitRegisterExpression;
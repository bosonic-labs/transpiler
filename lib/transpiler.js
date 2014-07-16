/*
 * Bosonic transpiler
 * https://github.com/bosonic/transpiler
 *
 * Copyright (c) 2013 Raphaël Rougeron
 * Licensed under the MIT license.
 */

'use strict';

var jstransform = require('jstransform'),
    Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils'),
    camelize = require('./utils').camelize,
    getExtendeeClass = require('./utils').getExtendeeClass,
    extendsNativeElement = require('./utils').extendsNativeElement,
    shimStyles = require('./css').shimStyles;

function searchProperty(properties, key, kind) {
    var found;
    properties.forEach(function(property) {
        if (property.kind === kind && property.key.name === key) found = property;
    });
    return found;
}

function searchSetter(properties, key) {
    return searchProperty(properties, key, 'set');
}

function searchGetter(properties, key) {
    return searchProperty(properties, key, 'get');
}

function searchMethod(properties, key) {
    var found;
    properties.forEach(function(property) {
        if (property.kind === 'init' && property.key.name === key 
            && property.value.type === Syntax.FunctionExpression) found = property;
    });
    return found;
}

function visitProperty(traverse, node, path, state) {
    if (node.kind === 'get') {
        if (state.gettersSetters.indexOf(node.key.name) !== -1) {
            //utils.move(node.value.range[1], state);
            return;
        }
        var key = node.key.name,
            setter = searchSetter(path[0].properties, key);

        utils.move(node.key.range[1], state);
        utils.append(key + ': { enumerable: true, get: function', state);
        utils.catchup(node.value.range[1], state);
        
        if (setter) {
            state.gettersSetters.push(key)
            
            utils.move(setter.key.range[1], state);
            utils.append(', set: function', state);
            utils.catchup(setter.value.range[1], state);
        }

        utils.append(' }', state);
    } else if (node.kind === 'set') {
        if (state.gettersSetters.indexOf(node.key.name) !== -1) {
            //utils.move(node.value.range[1], state);
            return;
        }
        var key = node.key.name,
            getter = searchGetter(path[0].properties, key);

        utils.move(node.key.range[1], state);
        utils.append(key + ': { enumerable: true, set: function', state);
        utils.catchup(node.value.range[1], state);

        if (getter) {
            state.gettersSetters.push(key)
            
            utils.move(getter.key.range[1], state);
            utils.append(', get: function', state);
            utils.catchup(getter.value.range[1], state);
        }

        utils.append(' }', state);
    } else {
        utils.catchup(node.key.range[1], state);
        utils.append(': { enumerable: true, value: ', state);
        utils.move(node.value.range[0], state);
        
        if (node.key.name === 'createdCallback' && state.injectTemplatingCode) {
            utils.catchup(node.value.body.range[0] + '{'.length, state);
            utils.append('\n    this.createShadowRoot();\n', state);
            utils.append('    this.shadowRoot.appendChild(template.content.cloneNode(true));', state);
        }
        
        traverse(node.value, path, state);
        utils.catchup(node.value.range[1], state);
        utils.append(' }', state);
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
        extendsNativeElement = state.g.opts.extendsNativeElement,
        elementClass = camelize(elementName),
        extendeeClass = getExtendeeClass(extendee),
        automaticTemplating = state.g.opts.automaticTemplating;

    state = utils.updateState(state, {
        elementName: elementName,
        elementClass: elementClass,
        extendeeClass: extendeeClass,
        gettersSetters: []
    });

    if (automaticTemplating) {
        utils.append("var template = document._currentScript.parentNode.querySelector('template');\n", state);
    }
    utils.append("window."+elementClass+" = document.registerElement('"+elementName+"', { ", state);
    utils.append("prototype : Object.create("+extendeeClass+".prototype, {", state);
    
    utils.move(node.expression.range[0] + '{'.length, state);

    if (automaticTemplating) {
        var created = searchMethod(node.expression.properties, 'createdCallback');
        if (created) {
            state = utils.updateState(state, {
                injectTemplatingCode: true
            });
        } else {
            utils.append('\n  createdCallback: { enumerable: true, value: function() {\n', state);
            utils.append('    this.createShadowRoot();\n', state);
            utils.append('    this.shadowRoot.appendChild(template.content.cloneNode(true));\n', state);
            utils.append('  } }', state);
            if (node.expression.properties.length > 0) {
                utils.append(',', state);
            }
        }
    }
    
    traverse(node.expression, path, state);
    utils.catchupWhiteSpace(node.range[1], state);

    utils.append('})', state);
    // CAUTION: when extending a non-native element, the polyfill doesn't work properly when the 'extends' option is set
    if (extendee && extendsNativeElement) { 
        utils.append(", extends: '" + extendee + "' ", state);
    }
    utils.append('});', state);
    return false;
}
visitObjectExpressions.test = function(node, path, state) {
    return node.type === Syntax.ExpressionStatement
        && node.expression.type === Syntax.ObjectExpression;
};

function visitSuperCallExpression(traverse, node, path, state) {
    var superClassName = state.extendeeClass;

    if (node.callee.type === Syntax.MemberExpression) {
        utils.move(node.callee.range[0], state);
        utils.append(superClassName + '.prototype', state);
        utils.move(node.callee.object.range[1], state);
        utils.catchup(node.callee.property.range[1], state);
        utils.append('.call(this', state);
        if (node.arguments.length > 0) {
            utils.append(', ', state);
            utils.catchupWhiteSpace(node.arguments[0].range[0], state);
            traverse(node.arguments, path, state);
        }
        utils.append(')', state);
        utils.move(node.range[1], state);
    }
    return false;
}
visitSuperCallExpression.test = function(node, path, state) {
    if (node.type === Syntax.CallExpression) {
        var callee = node.callee;
        if (callee.type === Syntax.Identifier && callee.name === 'super'
            || callee.type == Syntax.MemberExpression
            && callee.object.name === 'super') {
            return true;
        }
    }
    return false;
};

function transpileScript(script, elementName, extendee, options) {
    options = options || {};

    var transformedScript = jstransform.transform(
        [visitSuperCallExpression, visitObjectExpressions, visitProperty],
        script,
        { 
            elementName: elementName,
            extendee: extendee,
            extendsNativeElement: extendsNativeElement(extendee),
            automaticTemplating: options.automaticTemplating || false
        }
    );
    return options.wrap ? "(function () {" + transformedScript.code + "}());"
                        : transformedScript.code;
}

exports = module.exports = {
    transpileScript: transpileScript
}

/*
 * Bosonic transpiler
 * https://github.com/bosonic/transpiler
 *
 * Copyright (c) 2013 Raphaël Rougeron
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs'),
    cheerio = require('cheerio'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    jstransform = require('jstransform'),
    Syntax = require('esprima-fb').Syntax,
    utils = require('jstransform/src/utils');

function camelize(str) {
    var camelized = str.replace(/(\-|_|\.|\s)+(.)?/g, function(match, separator, chr) {
        return chr ? chr.toUpperCase() : '';
    }).replace(/^([A-Z])/, function(match, separator, chr) {
        return match.toLowerCase();
    });
    return camelized.charAt(0).toUpperCase() + camelized.slice(1);
}

function decamelize(str) {
    str = str.charAt(0).toLowerCase() + str.slice(1);
    return str.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
}

function shimSelector(selector, elementName) {
    var shimed = false,
        selectorRegexes = [
            [/^:host\(([^:]+)\)$/, elementName+'$1'],
            [/^:host(:hover|:active|:focus)$/, elementName+'$1'],
            [/^:host(\[[^:]+\])$/, elementName+'$1'],
            [/^:host$/, elementName],
            [/^:ancestor\(([^:]+)\)$/, '$1 '+elementName], // deprecated; replaced by :host-context
            [/^:host-context\(([^:]+)\)$/, '$1 '+elementName],
            [/^::content/, elementName],
        ];

    for (var i = 0; i < selectorRegexes.length; i++) {
        var re = selectorRegexes[i];
        if (selector.match(re[0])) {
            shimed = true;
            selector = selector.replace(re[0], re[1]);
            break;
        }
    }
    if (!shimed && !selector.match(new RegExp(elementName))) {
        selector = elementName + ' ' + selector;
    }
    return selector;
}

function shimStyles(styles, elementName) {
    var css = require('css'),
        parseTree = css.parse(styles);

    parseTree.stylesheet.rules.forEach(function(rule) {
        rule.selectors.forEach(function(selector, i, selectorsRef) {
            selectorsRef[i] = shimSelector(selector, elementName);
        });
    });

    return css.stringify(parseTree);
}

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

function renderFunctionParams(functionExpr) {
    return functionExpr.params.map(function(param) { return param.name; }).join(', ');
}

function visitProperty(traverse, node, path, state) {
    if (node.kind === 'get') {
        if (state.gettersSetters.indexOf(node.key.name) !== -1) {
            utils.move(node.value.range[1], state);
            return;
        }
        var key = node.key.name,
            setter = searchSetter(path[0].properties, key);

        utils.append(key+": ", state);
        utils.move(node.value.range[0], state);
        utils.append('{ enumerable: true, get : function() ', state);
        utils.catchup(node.value.range[1], state);
        
        if (setter) {
            state.gettersSetters.push(key)
            
            utils.move(setter.value.range[0], state);
            utils.append(', set : function('+renderFunctionParams(setter.value)+') ', state);
            utils.catchup(setter.value.range[1], state);
        }

        utils.append('}', state);
    } else if (node.kind === 'set') {
        if (state.gettersSetters.indexOf(node.key.name) !== -1) {
            utils.move(node.value.range[1], state);
            return;
        }
        var key = node.key.name,
            getter = searchGetter(path[0].properties, key);

        utils.append(key+": ", state);
        utils.move(node.value.range[0], state);
        utils.append('{ enumerable: true, set : function('+renderFunctionParams(node.value)+') ', state);
        utils.catchup(node.value.range[1], state);
        if (getter) {
            state.gettersSetters.push(key)
            
            utils.move(getter.value.range[0], state);
            utils.append(', get : function() ', state);
            utils.catchup(getter.value.range[1], state);
        }
        utils.append('}', state);
    } else {
        utils.catchup(node.value.range[0], state);
        utils.append('{ enumerable: true, value : ', state);
        utils.catchup(node.value.range[1], state);
        utils.append('}', state);
    }
}
visitProperty.test = function(node, path, state) {
    return node.type === Syntax.Property
        && path[0].type === Syntax.ObjectExpression;
}

function visitObjectExpressions(traverse, node, path, state) {
    var elementName = state.g.opts.elementName,
        extendee = state.g.opts.extendee,
        elementClass = camelize(elementName),
        extendeeClass;

    if (!extendee) {
        extendeeClass = 'HTMLElement'
    } else if (extendee.indexOf('-') === -1) { // native element
        if (['thead', 'tbody', 'tfoot'].indexOf(extendee) !== -1) {
            extendeeClass = 'HTMLTableSectionElement';
        } else {
            extendeeClass = 'HTML' + camelize(extendee) + 'Element';
        }
    } else {
        extendeeClass = camelize(extendee);
    }

    state = utils.updateState(state, {
        elementName: elementName,
        elementClass: elementClass,
        extendeeClass: extendeeClass,
        gettersSetters: []
    });

    utils.append("window."+elementClass+" = document.registerElement('"+elementName+"', {", state);
    utils.append("prototype : Object.create("+extendeeClass+".prototype, ", state);

    utils.move(node.expression.range[0], state);
    traverse(node.expression, path, state);
    utils.catchupWhiteSpace(node.range[1], state);

    utils.append('})', state);
    if (extendee) {
        utils.append(", extends: '" + extendee + "'", state);
    }
    utils.append('});', state);

    if (extendee) {
        utils.append("Object.defineProperty("+elementClass+".prototype, '_super', {\
            enumerable: false,\
            writable: false,\
            configurable: false,\
            value: "+extendeeClass+".prototype\
        });", state);
    }

    return false;
}
visitObjectExpressions.test = function(node, path, state) {
    return node.type === Syntax.ExpressionStatement
        && node.expression.type === Syntax.ObjectExpression;
};

function transpileScript(script, elementName, extendee) {
    var transformedScript = jstransform.transform(
        [visitObjectExpressions, visitProperty],
        script,
        { 
            elementName: elementName,
            extendee: extendee
        }
    );
    // We do another pass with Esprima in order to indent JS code correctly
    var outputAst = esprima.parse("(function () {" + transformedScript.code + "}());");
    return escodegen.generate(outputAst);
}

function transpile(htmlString) {
    var mainScript,
        sourceAst,
        scriptDeps = [],
        cssDeps = [],
        $ = cheerio.load(htmlString),
        element = $('element'),
        template = $('template').html(),
        style = $('style').html(),
        scripts = $('script'),
        stylesheets = $('link[rel=stylesheet]'),
        elementName = element.attr('name'),
        extendee = element.attr('extends');

    scripts.each(function(i, script) {
        if ($(this).attr('src')) {
            scriptDeps.push($(this).attr('src'));
        } else {
            if (mainScript !== undefined) {
                throw new Error('Only one <script> is permitted in a Web Component declaration');
            }
            mainScript = $(this);
        }
    });

    stylesheets.each(function(i, link) {
        cssDeps.push($(this).attr('href'));
    });

    if (style !== null) {
        style = shimStyles(style, elementName);
        $('style').html("\n"+style+"\n");
    }

    if (mainScript !== undefined) {
        var transpiled = transpileScript(mainScript.html(), elementName, extendee);
        mainScript.html("\n"+transpiled+"\n");
    }
    
    return $.html();
}

exports = module.exports = {
    transpile: transpile,
    transpileScript: transpileScript,
    shimStyles: shimStyles,
    shimSelector: shimSelector
}


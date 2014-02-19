'use strict';

var _ = require('underscore'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    esprima = require('esprima'),
    escodegen = require('escodegen'),
    estraverse = require('estraverse');

var componentTemplate = fs.readFileSync(__dirname + '/templates/basic.js', 'utf8');

exports = module.exports = function(htmlString) {
    var $ = cheerio.load(htmlString),
        element = $('element'),
        template = $('template').html(),
        style = $('style').html(),
        script = $('script').html(),
        template = template ? "'"+template.replace(/\r?\n/g, '')+"'" : "null",
        elementName = element.attr('name'),
        sourceAst = esprima.parse(script, { loc: true });

    // According to the spec, the last value of the <script> must be an object whose properties will define 
    // the new element's API. This object must therefore be wrapped in an ExpressionStatement
    var exprStmt = sourceAst.body[sourceAst.body.length - 1];
    if (exprStmt.type !== 'ExpressionStatement') {
        throw new Error('The last value of the <script> must be an ExpressionStatement');
    }
    if (exprStmt.expression.type !== 'ObjectExpression') {
        throw new Error('The last value of the <script> must be an ExpressionStatement whose expression must be an object literal');
    }

    // We grab all the code prior to the ExpressionStatement and prepend it to the code to output
    var outerCode = [];
    for (var i = 0; i <= sourceAst.body.length - 2; i++) {
        outerCode.push(escodegen.generate(sourceAst.body[i]));
    }

    var context = {
        elementName: elementName,
        template: template,
        behavior: escodegen.generate(exprStmt.expression),
        outerCode: outerCode.join("\n")
    }, output = _.template(componentTemplate)(context);

    return {
        js: output,
        css: style,
        template: template
    };
}
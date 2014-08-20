var fs = require('fs'),
    cheerio = require('cheerio'),
    esprima = require('esprima-fb'),
    escodegen = require('escodegen'),
    shimShadowStyles = require('./lib/css').shimShadowStyles,
    transpileScript = require('./lib/transpiler').transpileScript;

function getElementFacets($) {
    var mainScript,
        scriptDeps = [],
        cssDeps = [],
        element = $('element'),
        template = $('template').html(),
        style = $('element style'),
        scripts = $('script'),
        stylesheets = $('link[rel=stylesheet]'),
        elementName = element.attr('name'),
        attributes = element.attr('attributes') ? element.attr('attributes').split(' ') : null,
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
    
    return {
        name: elementName,
        attributes: attributes,
        extendee: extendee,
        script: mainScript,
        style: style,
        template: template,
        dependencies: {
            stylesheets: cssDeps,
            scripts: scriptDeps
        }
    };
}

function transpile(htmlString, options) {
    var $ = cheerio.load(htmlString, { xmlMode: true }),
        element = getElementFacets($);

    options = options || {};
    options.name = element.name;
    options.attributes = element.attributes;
    options.extendee = element.extendee;
    options.template = element.template;

    if (!element.template) {
        options.automaticTemplating = false;
    }

    return {
        js: transpileToJS(element, $, options),
        css: transpileToCSS(element, $, options),
        html: transpileToHTML(element, $, options)
    };
}

function transpileToHTML(element, $, options) {
    if (element.style.html() !== null) {
        element.style.html("\n" + shimShadowStyles(element.style.html(), element.name) + "\n");
    }

    if (element.script.html() !== null) {
        var transpiled = transpileScript(element.script.html(), options);
        element.script.html("\n"+reindentScript(transpiled)+"\n");
    }
    
    return $.html();
}

function transpileToCSS(element, $, options) {
    var css = [];

    $('style').each(function(i, style) {
        if ($(this).parent('element').length !== 0) {
            css.push(shimShadowStyles($(this).html(), element.name));
        } else {
            css.push($(this).html());
        }
    });

    return css.join('\n');
}

function transpileToJS(element, $, options) {
    var transpiled = transpileScript(element.script.html(), options, true);
    return reindentScript(transpiled);
}

function reindentScript(script) {
    // We do another pass with Esprima in order to indent JS code correctly
    var outputAst = esprima.parse(script);
    return escodegen.generate(outputAst);
}

exports = module.exports = {
    transpile: transpile,
    reindentScript: reindentScript,
    transpileScript: transpileScript,
    shimShadowStyles: shimShadowStyles
}

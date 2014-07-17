var fs = require('fs'),
    cheerio = require('cheerio'),
    esprima = require('esprima-fb'),
    escodegen = require('escodegen'),
    shimShadowStyles = require('./lib/css').shimShadowStyles,
    shimReactStyles = require('./lib/css').shimReactStyles,
    transpileScript = require('./lib/transpiler').transpileScript,
    transpileToReactComponent = require('./lib/react-transpiler').transpileToReactComponent;

function getElementFacets($) {
    var mainScript,
        scriptDeps = [],
        cssDeps = [],
        element = $('element'),
        template = $('template').html(),
        style = $('style'),
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

function transpileToReact(htmlString) {
    var css = '',
        $ = cheerio.load(htmlString),
        element = getElementFacets($);

    if (element.style.html() !== null) {
        css = shimReactStyles(element.style.html(), element.name);
    }

    return {
        css: css,
        jsx: transpileToReactComponent(element.script.html(), element.name, element.extendee, element.template)
    };
}

function transpile(htmlString, options) {
    var $ = cheerio.load(htmlString),
        element = getElementFacets($);

    options = options || {};

    if (element.style.html() !== null) {
        element.style.html("\n" + shimShadowStyles(element.style.html(), element.name) + "\n");
    }

    if (element.script.html() !== null) {
        options.name = element.name;
        options.attributes = element.attributes;
        options.extendee = element.extendee;

        if (!element.template) {
            options.automaticTemplating = false;
        }
        var transpiled = transpileScript(element.script.html(), options);
        element.script.html("\n"+reindentScript(transpiled)+"\n");
    }
    
    return $.html();
}

function reindentScript(script) {
    // We do another pass with Esprima in order to indent JS code correctly
    var outputAst = esprima.parse(script);
    return escodegen.generate(outputAst);
}

exports = module.exports = {
    transpile: transpile,
    transpileToReact: transpileToReact,
    reindentScript: reindentScript,
    transpileScript: transpileScript,
    shimShadowStyles: shimShadowStyles
}

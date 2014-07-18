var Syntax = require('esprima-fb').Syntax;

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

function stringifyArray(attributes) {
    return attributes.map(function(a) { return "'" + a + "'"; }).join(', ');
}

function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelize(str) {
    var camelized = str.replace(/(\-|_|\.|\s)+(.)?/g, function(match, separator, chr) {
        return chr ? chr.toUpperCase() : '';
    }).replace(/^([A-Z])/, function(match, separator, chr) {
        return match.toLowerCase();
    });
    return ucfirst(camelized);
}

function decamelize(str) {
    str = str.charAt(0).toLowerCase() + str.slice(1);
    return str.replace(/([a-z\d])([A-Z])/g, '$1-$2').toLowerCase();
}

function extendsNativeElement(extendee) {
    if (!extendee) return false;
    return extendee.indexOf('-') === -1;
}

function getExtendeeClass(extendee) {
    if (!extendee) {
        return 'HTMLElement'
    } else if (extendsNativeElement(extendee)) {
        if (['thead', 'tbody', 'tfoot'].indexOf(extendee) !== -1) {
            return 'HTMLTableSectionElement';
        } else {
            return 'HTML' + camelize(extendee) + 'Element';
        }
    } else {
        return camelize(extendee);
    }
}

exports = module.exports = {
    searchProperty: searchProperty,
    searchSetter: searchSetter,
    searchGetter: searchGetter,
    searchMethod: searchMethod,
    stringifyArray: stringifyArray,
    ucfirst: ucfirst,
    camelize: camelize,
    decamelize: decamelize,
    getExtendeeClass: getExtendeeClass,
    extendsNativeElement: extendsNativeElement
};
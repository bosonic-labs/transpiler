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
    camelize: camelize,
    decamelize: decamelize,
    getExtendeeClass: getExtendeeClass,
    extendsNativeElement: extendsNativeElement
};
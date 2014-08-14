var expect = require('chai').expect,
    css = require('../lib/css');

describe('Shadow CSS shiming', function() {
    it('should rewrite selectors', function() {
        var tests = [
            [':host', 'b-dummy'],
            [':host:hover', 'b-dummy:hover'],
            [':host[visible]', 'b-dummy[visible]'],
            [':host(.cssClass)', 'b-dummy.cssClass'],
            [':ancestor(.cssClass)', '.cssClass b-dummy'],
            [':host-context(.cssClass)', '.cssClass b-dummy'],
            ['p', 'b-dummy p'],
            ['b-dummy', 'b-dummy'],
            ['b-dummy p', 'b-dummy p'],
            ['::content p', 'b-dummy p']
        ];
        tests.forEach(function(rule) {
            expect(css.shimShadowSelector(rule[0], 'b-dummy')).to.equal(rule[1]);
        });
    });

    it('should rewrite a full stylesheet', function() {
        var styles = [
            ':host {',
            '  display: block;',
            '}',
            ':host:hover {',
            '  color: blue;',
            '}',
            ':host(.active) {',
            '  color: red;',
            '}'
        ].join('\n'),
            shimed = [
            'b-dummy {',
            '  display: block;',
            '}\n',
            'b-dummy:hover {',
            '  color: blue;',
            '}\n',
            'b-dummy.active {',
            '  color: red;',
            '}'
        ].join('\n');

        expect(css.shimShadowStyles(styles, 'b-dummy')).to.equal(shimed);
    });
});
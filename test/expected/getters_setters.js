(function () {
    window.BTest = document.registerElement('b-test', {
        prototype: Object.create(HTMLElement.prototype, {
            sortable: {
                enumerable: true,
                get: function () {
                    return this.hasAttribute('sortable');
                },
                set: function (value) {
                    value ? this.setAttribute('sortable', '') : this.removeAttribute('sortable');
                }
            },
            resizable: {
                enumerable: true,
                set: function (value) {
                    value ? this.setAttribute('resizable', '') : this.removeAttribute('resizable');
                },
                get: function () {
                    return this.hasAttribute('resizable');
                }
            },
            width: {
                enumerable: true,
                set: function (value) {
                    this.style.width = value + 'px';
                }
            },
            height: {
                enumerable: true,
                get: function () {
                    return this.style.height;
                }
            }
        })
    });
}());
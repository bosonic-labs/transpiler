(function () {
    window.SuperButton = document.registerElement('super-button', {
        prototype: Object.create(HTMLButtonElement.prototype, {
            dummy: {
                enumerable: true,
                value: function () {
                    console.log('bar');
                }
            }
        }),
        extends: 'button'
    });
}());
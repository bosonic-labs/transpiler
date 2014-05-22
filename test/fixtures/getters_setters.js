({
    get sortable() {
        return this.hasAttribute('sortable');
    },

    set sortable(value) {
        value ? this.setAttribute('sortable', '') : this.removeAttribute('sortable')
    },

    set resizable(value) {
        value ? this.setAttribute('resizable', '') : this.removeAttribute('resizable')
    },

    get resizable() {
        return this.hasAttribute('resizable');
    },

    set width(value) {
        this.style.width = value + 'px';
    },

    get height() {
        return this.style.height;
    }
});
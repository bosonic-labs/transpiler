/** @jsx React.DOM */
var BosonicMixin = {
    componentWillReceiveProps: function(nextProps) {
        if (!this.__attributes__) return;
        this.__attributes__.forEach(function(attr) {
            if (nextProps[attr] !== this.props[attr]) {
                var callback = attr + 'Changed';
                if (this.hasOwnProperty(callback)) {
                    this[callback].call(this, this.props[attr], nextProps[attr]);
                }
            }
        }, this);
    },

    setAttribute: function(key, value) {
        this.getDOMNode().setAttribute(key, value);
        if (this.__attributes__ && this.__attributes__.indexOf(key) !== -1) {
            var newProp = {};
            newProp[key] = value;
            this.setProps(newProp);
        }
    },

    getAttribute: function(key) {
        return this.__attributes__ && this.__attributes__.indexOf(key) !== -1 
            ? this.props[key] 
            : this.getDOMNode().getAttribute(key);
    },

    hasAttribute: function(key) {
        return this.__attributes__ && this.__attributes__.indexOf(key) !== -1 
            ? this.props.hasOwnProperty(key) 
            : this.getDOMNode().hasAttribute(key);
    },

    removeAttribute: function(key) {
        this.getDOMNode().removeAttribute(key);
        if (this.__attributes__ && this.__attributes__.indexOf(key) !== -1) {
            var props = this.props;
            delete props[key];
            this.replaceProps(props);
        }
    }
}
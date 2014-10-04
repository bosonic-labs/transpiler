(function () {
    window.SuperTickTockClock = document.registerElement('super-tick-tock-clock', {
        prototype: Object.create(TickTockClock.prototype, {
            tick: {
                enumerable: true,
                value: function () {
                    TickTockClock.prototype.tick.call(this);
                    var now = new Date();
                    this.style.borderColor = now.getSeconds() % 2 ? '#ccc' : 'red';
                }
            }
        })
    });
}());
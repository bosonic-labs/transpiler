function start() {
      this.tick();
      this._interval = window.setInterval(this.tick.bind(this), 1000);
    }
    function stop() {
      window.clearInterval(this._interval);
    }
    function fmt(n) {
      return (n < 10 ? '0' : '') + n;
    }
var TickTockClockMixin = {
      readyCallback: function () {
        this.appendChild(this.template.content.cloneNode());
        if (this.parentElement) {
          start.call(this);
        }
      },
      componentDidMount: start,
      componentDidUnmount: stop,
      tick: function () {
        var now = new Date();
        this.querySelector('#hh').textContent = fmt(now.getHours());
        this.querySelector('#sep').style.visibility =
            now.getSeconds() % 2 ? 'visible' : 'hidden';
        this.querySelector('#mm').textContent = fmt(now.getMinutes());
      },
      render: function() {    return (
<div className="tick-tock-clock">
    <span id="hh"></span>
    <span id="sep">:</span>
    <span id="mm"></span>
  </div>
);  }
    };

    var TickTockClock = React.createClass({
mixins: [BosonicReact.CustomElementMixin, TickTockClockMixin]
});

function merge(obj1, obj2) {
  for (var attrname in obj1) {
    if (!obj2.hasOwnProperty(attrname)) obj2[attrname] = obj1[attrname];
  }
  return obj2;
}

var SuperTickTockClockMixin = merge(TickTockClockMixin, {
  tick: function () {
        TickTockClockMixin.tick.call(this);
        var now = new Date();
        this.style.borderColor = now.getSeconds() % 2 ? '#ccc' : 'red';
      }
});

var SuperTickTockClock = React.createClass({
  mixins: [BosonicReact.CustomElementMixin, SuperTickTockClockMixin],
});
/** @jsx React.DOM */

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

    var TickTockClock = React.createClass({
  mixins: [BosonicMixin],
  render: function() {
    return this.transferPropsTo(
      <div className="tick-tock-clock">
        
    <span id="hh"/>
    <span id="sep">:</span>
    <span id="mm"/>
  
      </div>
    );
  },
      componentWillMount: function() {
        if (this.parentElement) {
          start.call(this);
        }
      },
      componentDidMount: start,
      componentDidUnmount: stop,
      tick: function () {
        var now = new Date();
        this.getDOMNode().querySelector('#hh').textContent = fmt(now.getHours());
        this.getDOMNode().querySelector('#sep').style.visibility =
            now.getSeconds() % 2 ? 'visible' : 'hidden';
        this.getDOMNode().querySelector('#mm').textContent = fmt(now.getMinutes());
      }
    });
  
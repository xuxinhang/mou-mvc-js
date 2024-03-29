import Mou, { Component } from '../lib';
import { mount } from '../lib/core';

class Counter extends Component {
  constructor() {
    super();
    this.state = {
      number: 0,
      delta: 1,
    };

    this.onAccelerateBtnClicked = this.onAccelerateBtnClicked.bind(this);

    setInterval(() => {
      this.setState({ number: this.state.number + this.state.delta });
    }, 1000);
  }

  onAccelerateBtnClicked() {
    const m = [0, 2, 1];
    this.setState({ delta: m[this.state.delta] });
  }

  render() {
    return (
      <div className="counter-wrap">
        <code className="counter-number" style={{ 'font-weight': this.state.number % 10 ? 'normal' : 'bold' }}>
          {this.state.number}
        </code>
        <input value={`${this.state.number}`} />
        <input type="range" value={this.state.number % 100} max="100" min="0" />
        <button className="counter-accelerate-btn" onClick={this.onAccelerateBtnClicked}>
          <i>⚡</i>
        </button>
      </div>
    );
  }
}

function App() {
  return (
    <Mou.Fragment>
      <code>Current Number = </code>
      <Counter />
    </Mou.Fragment>
  );
}

mount(<App />, document.querySelector('#root'));

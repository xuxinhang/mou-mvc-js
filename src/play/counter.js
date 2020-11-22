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
    this.setState({ delta: 2 });
  }

  render() {
    return (
      <div className="counter-wrap">
        <code className="counter-number" style={{ 'font-weight': this.state.number % 10 ? 'normal' : 'bold' }}>
          {this.state.number}
        </code>
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

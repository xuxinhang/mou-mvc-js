import Mou, { Component } from '../lib';
import { mount } from '../lib/core';

class Counter extends Component {
  constructor() {
    super();
    this.state = {
      number: 0,
    };

    setInterval(() => {
      this.setState({ number: this.state.number + 1 });
    }, 1000);
  }

  render() {
    return (
      <span className="counter-number" style={{ 'font-weight': this.state.number % 10 ? 'normal' : 'bold' }}>
        {this.state.number}
      </span>
    );
  }
}

function App() {
  return (
    <Mou.Fragment>
      <code>Current Number = </code>
      <code>
        <Counter />
      </code>
    </Mou.Fragment>
  );
}

mount(<App />, document.querySelector('#root'));

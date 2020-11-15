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
    return <mark>{this.state.number}</mark>;
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

import Mou, { Component } from '../../lib';
import { mount } from '../../lib/core';

class App extends Component {
  constructor() {
    super();
    this.state = {
      title: 'Hello, Portal',
      open: true,
      content: 'Hello, Portal!',
    };

    this.onCheckboxClicked = this.onCheckboxClicked.bind(this);
  }

  onCheckboxClicked() {
    this.setState({ open: !this.state.open });
  }

  render() {
    return (
      <section className="intro">
        <button className="start-btn">Click to Start</button>
        <label>
          <input type="checkbox" checked={this.state.open} onClick={this.onCheckboxClicked} />
          <span>Open aside textarea</span>
        </label>
        {this.state.open && (
          <Mou.Portal to="#float">
            <textarea>{this.state.content}</textarea>
          </Mou.Portal>
        )}
      </section>
    );
  }
}

mount(<App />, document.querySelector('#root'));

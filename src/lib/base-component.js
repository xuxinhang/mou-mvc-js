export default class BaseComponent {
  render() {
    throw new Error('Render function required.');
  }

  mount() {
    // const vnode = this.render();
  }
}

BaseComponent.prototype._isComponentInst = true;

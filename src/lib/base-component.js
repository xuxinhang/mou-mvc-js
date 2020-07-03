export default class BaseComponent {
  render() {
    throw new Error('Render function required.');
  }

  mount(el) {
    const vnode = this.render();
  }
}

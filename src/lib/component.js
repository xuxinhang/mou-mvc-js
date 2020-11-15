import { diffSubRoot } from './core';
import { applyTasker, createDOMOperationTasker } from './tasker';

const nextTick =
  typeof Promise !== 'undefined' ? Promise.resolve().then.bind(Promise.resolve()) : a => window.setTimeout(a, 0);

class RenderQueue {
  constructor() {
    this.queue = [];
    this.isScheduled = false;
  }

  push(next) {
    if (this.queue.findIndex(item => next.inst === item.inst) === -1) {
      this.queue.push(next);
    }
  }

  scheduleApply() {
    if (!this.isScheduled) {
      this.isScheduled = true;
      nextTick(this.applyRequestQueue.bind(this));
    }
  }

  applyRequestQueue() {
    this.isScheduled = false;
    const tasker = createDOMOperationTasker();
    let request;

    while ((request = this.queue.shift())) {
      const { inst } = request;

      const nextState = inst._pendingState;
      inst._pendingState = null;

      inst.state = nextState;
      const nextSubRoot = inst.render();

      const hostNode = inst._node;
      diffSubRoot(tasker, hostNode, hostNode, hostNode._subRoot, nextSubRoot);
    }

    applyTasker(tasker);
  }
}

export const RENDER_QUEUE = new RenderQueue();

export class BaseComponent {
  render() {
    throw new Error('Render function required.');
  }

  mount() {
    // const vnode = this.render();
  }

  setState(nextState) {
    if (!this._pendingState) this._pendingState = Object.assign({}, this.state);
    Object.assign(this._pendingState, nextState);

    RENDER_QUEUE.push({ type: 'COMPONENT_STATEFUL', inst: this });
    RENDER_QUEUE.scheduleApply();
  }
}

BaseComponent.prototype._isComponentInst = true;

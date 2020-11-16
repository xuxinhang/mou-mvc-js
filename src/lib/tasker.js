/**
 * DOM Operation Tasker Manager Module
 */

export function applyTasker(tasker) {
  console.debug('Tasker Queue: ', tasker.queue);

  const state = {};

  for (const task of tasker.queue) {
    applyDOMOperationTask(task, state);
  }
}

export function createDOMOperationTasker() {
  const task_inst = new DOMOperationTasker();
  return task_inst;
}

class DOMOperationTasker {
  constructor() {
    this.queue = [];
  }
  enqueue(task) {
    this.queue.push(task);
  }
}

function applyDOMOperationTask(task) {
  switch (task.type) {
    // Raw HTML DOM task command
    case 'mountNode': {
      const { selfNode, parentNode, refNode } = task;

      console.assert(refNode === null || refNode._el);
      console.assert(parentNode._el);

      mountNode(selfNode, parentNode._el, refNode && refNode._el);
      break;
    }
    case 'moveNode': {
      const { selfNode, parentNode, refNode } = task;

      console.assert(refNode === null || refNode._el);
      console.assert(parentNode._el);
      console.assert(selfNode._el);

      moveNode(selfNode, selfNode._el, parentNode._el, refNode && refNode._el);
      break;
    }
    case 'removeNode': {
      const { selfNode, parentNode } = task;
      removeNode(selfNode, selfNode._el, parentNode._el);
      break;
    }
    case 'updateTextContent': {
      const { selfNode } = task;
      const el = selfNode._el;
      console.assert(el && el.nodeType === el.TEXT_NODE);
      updateTextContent(selfNode, el);
      break;
    }
    default: {
      // do nothing
    }
  }
}

function mountNode(vnode, parentNode, refNode = null) {
  switch (vnode.type) {
    case 'ELEMENT':
      vnode._el = document.createElement(vnode.tag);
      parentNode.insertBefore(vnode._el, refNode);
      // TEMP: append DOM attributes to the inserted element
      if (vnode.attrs?.srcset !== undefined) {
        vnode._el.setAttribute('srcset', vnode.attrs.srcset);
      }
      break;
    case 'TEXT':
      vnode._el = document.createTextNode(vnode.text);
      parentNode.insertBefore(vnode._el, refNode);
      break;
    default:
      throw 'Support no vnode type other than ELEMENT and TEXT!';
  }
}

function moveNode(vnode, selfNode, parentNode, refNode = null) {
  console.assert(vnode._el === selfNode);
  parentNode.insertBefore(selfNode, refNode);
}

function removeNode(vnode, selfNode, parentNode) {
  console.assert(vnode._el === selfNode);
  parentNode.removeChild(selfNode);
}

function updateTextContent(vnode, selfNode) {
  selfNode.textContent = vnode.text;
}

/* The initial experiment for diff algorithm
var BEFORE = ['Z', 'A', 'B', 'C', 'D'];
var AFTER  = ['B', 'A', 'E', 'D', 'C'];

function diff (task, before, after) {
  const before_marks = new Array(before.length);

  for (let a_i = 0; a_i < after.length; a_i++) {
    const a_k = after[a_i];
    const prevIndex = before.indexOf(a_k);
    if (prevIndex === -1) {
      task.create(a_k, a_i);
    } else {
      if (prevIndex >= a_i) {
      	task.move(prevIndex, a_i);
      }
      before_marks[prevIndex] = true;
    }
  }

  for (let b_i = 0; b_i < before.length; b_i++) {
    const b_used = !!before_marks[b_i];
    if (!b_used) {
      task.remove(b_i);
    }
  }
}

var task_inst = {
  create: (...args) => console.log('create', ...args),
  move:   (...args) => console.log('move', ...args),
  remove: (...args) => console.log('remove', ...args),
};

diff(task_inst, BEFORE, AFTER);
*/

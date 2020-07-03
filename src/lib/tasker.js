export function apply(tasker) {
  console.log(tasker.queue);
  for (const task of tasker.queue) {
    applyDOMOperationTask(task);
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
  rawMount(vnode, targetNode) {
    this.queue.push({
      type: 'rawMount',
      inserted: vnode,
      targetNode,
    });
  }
  insert(parent, inserted, toIndex = -1) {
    this.queue.push({
      type: 'insert',
      parent,
      inserted,
      toIndex,
    });
  }
  move(parent, fromIndex, toIndex) {
    console.log(parent.children);
    this.queue.push({
      type: 'move',
      parent,
      fromIndex,
      toIndex,
    });
  }
  remove(parent, fromIndex) {
    this.queue.push({
      type: 'remove',
      parent,
      fromIndex,
    });
  }
}

function applyDOMOperationTask(task) {
  switch (task.type) {
    case 'insert':
      applyInsertOperation(task.parent, task.inserted, task.toIndex);
      break;
    case 'remove':
      applyRemoveOperation(task.parent, task.fromIndex);
      break;
    case 'move':
      applyMoveOperation(task.parent, task.fromIndex, task.toIndex);
      break;
    default:
      break;
  }
}

function applyInsertOperation(parent, inserted, toIndex) {
  const parentNode = parent._el;

  switch (inserted.type) {
    case 'ELEMENT': {
      const insertedNode = document.createElement(inserted.tag);
      if (toIndex === -1 || toIndex >= parent.children.length) {
        parentNode.append(insertedNode);
      } else {
        const ref = parent.children[toIndex];
        const refNode = ref._el;
        parentNode.insertBefore(insertedNode, refNode);
      }
      inserted._el = insertedNode;
      return insertedNode;
    }
    case 'TEXT': {
      const insertedNode = document.createTextNode(inserted.text);
      if (toIndex === -1) {
        parentNode.append(insertedNode);
      } else {
        const ref = parent.children[toIndex];
        parentNode.insertBefore(insertedNode, ref._el);
      }
      inserted._el = insertedNode;
      return insertedNode;
    }
    default:
  }
}

function applyMoveOperation(parent, fromIndex, toIndex) {
  const parentNode = parent._el;
  const vnode = parent.children[fromIndex];

  switch (vnode.type) {
    case 'ELEMENT':
    case 'TEXT':
      const movedNode = vnode._el;
      if (toIndex === -1 || toIndex >= parent.children.length) {
        parentNode.appendChild(movedNode);
      } else {
        const ref = parent.children[toIndex];
        const refNode = ref._el;
        console.log(toIndex, movedNode, refNode);
        parentNode.insertBefore(movedNode, refNode);
      }
      break;

    default:
  }
}

function applyRemoveOperation(parent, fromIndex) {
  const parentNode = parent._el;
  const vnode = parent.children[fromIndex];

  switch (vnode.type) {
    case 'ELEMENT':
    case 'TEXT':
      parentNode.removeChild(vnode._el);
      break;

    default:
  }
}

/*
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

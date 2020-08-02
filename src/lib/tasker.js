import { generateIndexArray } from './toolkit';

// const getVNodeByBeforeIndex = (index, beforeParent)

export function apply(tasker) {
  console.log(tasker.queue);

  const state = {
    childrenOrderTrack: {},
    childrenInsertTrack: {},
  };

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
    // VNode-compatible task command
    case 'insert':
      applyInsertTask(task);
      break;
    case 'remove':
      applyRemoveTask(task);
      break;
    case 'move':
      applyMoveTask(task);
      break;
    //
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
    default: {
      // do nothing
    }
  }
}

function applyInsertTask({ beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex }) {
  const node = mountingSet[~beforeIndex];
  const refNode =
    afterNextBeforeIndex === null
      ? null
      : afterNextBeforeIndex < 0
      ? mountingSet[~afterNextBeforeIndex]
      : beforeParent.children[afterNextBeforeIndex];
  const parentNode = afterParent;

  console.assert(refNode === null || refNode._el);
  console.assert(parentNode._el);

  mountNode(node, parentNode._el, refNode && refNode._el);
}

function applyMoveTask({ beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex }) {
  const node = beforeParent.children[beforeIndex];
  const refNode =
    afterNextBeforeIndex === null
      ? null
      : afterNextBeforeIndex < 0
      ? mountingSet[~afterNextBeforeIndex]
      : beforeParent.children[afterNextBeforeIndex];
  const parentNode = afterParent;

  console.assert(refNode === null || refNode._el);
  console.assert(parentNode._el);
  console.assert(node._el);

  moveNode(node, node._el, parentNode._el, refNode && refNode._el);
}

function applyRemoveTask({ beforeParent, afterParent, beforeIndex }) {
  const node = beforeParent.children[beforeIndex];
  const parentNode = afterParent;

  console.assert(node._el);

  removeNode(node, node._el, parentNode._el);
}

function mountNode(vnode, parentNode, refNode = null) {
  switch (vnode.type) {
    case 'ELEMENT':
      vnode._el = document.createElement(vnode.tag);
      parentNode.insertBefore(vnode._el, refNode);
      break;
    case 'TEXT':
      vnode._el = document.createTextNode(vnode.text);
      parentNode.insertBefore(vnode._el, refNode);
      break;
    default:
      // support no vnode type other than ELEMENT and TEXT
      throw '!';
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

/* function applyDOMOperationTask(task, state) {
  const parent = task.parent;
  // init order track
  if (!state.childrenOrderTrack.hasOwnProperty(parent._uid)) {
    const parentChildren = parent.children || [];
    state.childrenOrderTrack[parent._uid] = generateIndexArray(parentChildren.length);
  }
  const orderTrack = state.childrenOrderTrack[parent._uid];

  // init insert track
  if (task.type === 'insert') {
    if (!state.childrenInsertTrack.hasOwnProperty(parent._uid)) {
      state.childrenInsertTrack[parent._uid] = [];
    }
  }
  const insertTrack = state.childrenInsertTrack[parent._uid] ?? [];

  switch (task.type) {
    case 'insert': {
      const inserted = task.inserted;
      const parent = task.parent;
      const toIndex = task.toIndex;

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

      const insertCount = insertTrack.push(inserted);
      orderTrackInsert(orderTrack, toIndex === -1 ? orderTrack.length : toIndex, ~insertCount);
      break;
    }

    case 'remove': {
      const parent = task.parent;
      const fromIndex = task.fromIndex;
      const parentNode = parent._el;
      const vnode = parent.children[fromIndex];

      switch (vnode.type) {
        case 'ELEMENT':
        case 'TEXT':
          parentNode.removeChild(vnode._el);
          break;
        default:
      }

      orderTrackRemove(orderTrack, fromIndex);
      break;
    }

    case 'move': {
      const parent = task.parent;
      const fromIndex = task.fromIndex;
      const toIndex = task.toIndex;

      const parentNode = parent._el;
      const vnode = parent.children[fromIndex];

      const isMovedBackward = toIndex > fromIndex;

      switch (vnode.type) {
        case 'ELEMENT':
        case 'TEXT':
          const movedNode = vnode._el;
          if (toIndex === -1 || toIndex >= parent.children.length) {
            // !
            parentNode.appendChild(movedNode);
          } else {
            console.log(orderTrack);
            const mark = orderTrack[toIndex];
            const ref = mark < 0 ? insertTrack[~mark] : parent.children[mark];
            // console.log(toIndex, movedNode, refNode);
            parentNode.insertBefore(movedNode, ref._el);
          }
          break;
        default:
      }

      orderTrackMove(orderTrack, fromIndex, toIndex === -1 ? orderTrack.length : toIndex);
      break;
    }

    default: {
      break;
    }
  }
} */

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

// function orderTrackInsert(track, index, mark) {
//   track.splice(index, 0, mark);
// }

// function orderTrackMove(track, fromIndex, toIndex) {
//   const movedItem = track[fromIndex];
//   track.splice(fromIndex, 1);
//   track.splice(toIndex, 0, movedItem);
// }

// function orderTrackRemove(track, fromIndex) {
//   track.splice(fromIndex, 1);
// }

/* VDOM Ops */

/* eslint-disable */

import { generateUID } from './toolkit';

export function insert(tasker, parent, vnode, toIndex = -1) {
  // assign UID only when it's a newly-inserted node
  vnode._uid = generateUID();

  switch (vnode.type) {
    case 'ELEMENT':
      insertElement(tasker, parent, vnode, toIndex);
      break;
    case 'TEXT':
      insertText(tasker, parent, vnode, toIndex);
      break;
    default:
      break;
  }
}

function insertChildren(tasker, nextParent) {
  for (const child of nextParent.children) {
    insert(tasker, nextParent, child, -1);
  }
}

function insertElement(tasker, parent, vnode, toIndex) {
  tasker.insert(parent, vnode, toIndex);
  insertChildren(tasker, vnode);
}

function insertText(tasker, parent, vnode, toIndex) {
  tasker.insert(parent, vnode, toIndex);
}

export function move(tasker, prevParent, nextParent, prevVNode, nextVNode, fromIndex, toIndex) {
  if (prevVNode.type !== nextVNode.type) {
    // TODO if the two types are different
    remove(parent, prevVNode, fromIndex);
    insert(parent, nextVNode, toIndex);
    return;
  }

  // TODO REMOVE
  // diffSelf(tasker, prevVNode, nextVNode);

  // parent is the previous parent
  // const _toIndex = toIndex < 0 ? nextParent.children.length + toIndex : toIndex;
  switch (nextVNode.type) {
    case 'ELEMENT':
      moveElement(tasker, prevParent, nextParent, prevVNode, nextVNode, fromIndex, toIndex);
      break;
    case 'TEXT':
      // tasker.move(parent, fromIndex, toIndex);
      break;
    default:
      break;
  }
}

function moveElement(tasker, prevParent, nextParent, prevVNode, nextVNode, fromIndex, toIndex) {
  const vnode = nextVNode,
    prevnode = prevVNode;
  if (prevnode.tag !== vnode.tag) {
    tasker.remove(prevnode);
    tasker.insert(parent, vnode);
    diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
  } else {
    tasker.move(prevParent, fromIndex, toIndex);
    diffSelf(tasker, prevnode, vnode);
    diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
  }
}

export function remove(tasker, parent, fromIndex) {
  console.log(parent.children, fromIndex);
  const vnode = parent.children[fromIndex];
  switch (vnode.type) {
    case 'ELEMENT':
      tasker.remove(parent, fromIndex);
      break;
    case 'TEXT':
      tasker.remove(parent, fromIndex);
      break;
    default:
      break;
  }
}

function removeElement(tasker, parent, fromIndex) {
  tasker.remove(parent, fromIndex);
}

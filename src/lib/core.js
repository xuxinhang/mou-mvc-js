import { normalizeVNode } from './h';
import { apply, createDOMOperationTasker } from './tasker';

export function mount(vnode, elem) {
  vnode = normalizeVNode(vnode);
  const hackedParentVNode = {
    _isVNode: true,
    _el: elem,
  };
  return _update(hackedParentVNode, null, vnode);
}

export function refresh(prevnode, vnode, elem) {
  vnode = normalizeVNode(vnode);
  const hackedParentVNode = {
    _isVNode: true,
    _el: elem,
    children: [],
  };
  return _update(hackedParentVNode, prevnode, vnode);
}

function _update(parent, prevnode, vnode) {
  if (prevnode == null && vnode == null) return;

  const tasker = createDOMOperationTasker();
  // diffOne(tasker, parent, prevnode, vnode);
  if (prevnode == null && vnode != null) {
    insert(tasker, parent, vnode);
  } else if (prevnode != null && vnode == null) {
    // TODO remove();
  } else if (prevnode != null && vnode != null) {
    diffOne(tasker, parent, prevnode, vnode);
  }

  apply(tasker);
}

function diffChildren(tasker, prevParent, parent, beforeNodes, afterNodes) {
  const before_marks = new Array(beforeNodes.length);
  let lastIndex = 0; // 用来存储寻找过程中遇到的最大索引值

  for (let a_i = 0; a_i < afterNodes.length; a_i++) {
    const a_k = afterNodes[a_i];
    let b_i = beforeNodes.findIndex(e => e.key === a_k.key);
    const b_k = beforeNodes[b_i];
    if (b_i === -1) {
      // console.log(prevParent);
      // insert(tasker, prevParent, a_k, a_i);
      insert(tasker, prevParent, a_k, -1);
    } else {
      // if (b_i < lastIndex) {
      //   move(tasker, prevParent, parent, b_k, b_i, a_i);
      // } else {
      //   lastIndex = b_i;
      //   diffOne(tasker, parent, b_k, a_k);
      // }
      move(tasker, prevParent, parent, b_k, a_k, b_i, -1);

      before_marks[b_i] = true;
    }
  }

  for (let b_i = 0; b_i < beforeNodes.length; b_i++) {
    const b_used = !!before_marks[b_i];
    if (!b_used) {
      remove(tasker, prevParent, b_i);
    }
  }
}

function diffSelf(tasker, prevnode, vnode) {
  vnode._el = prevnode._el;
  // TODO
  return;
}

function insert(tasker, parent, vnode, toIndex = -1) {
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

function diffOne(tasker, parent, prevnode, vnode) {
  if (prevnode.type !== vnode.type) {
    const index = parent.children.indexOf(prevnode);
    remove(parent, prevnode, index);
    insert(parent, vnode, index);
    return;
  }

  diffSelf(tasker, prevnode, vnode);

  switch (prevnode.type) {
    case 'ELEMENT':
      diffOneElement(tasker, parent, prevnode, vnode);
      break;
    case 'TEXT':
      diffOneText();
      break;
    default:
      break;
  }
}

function diffOneElement(tasker, parent, prevnode, vnode) {
  if (prevnode.tag !== vnode.tag) {
    tasker.remove(prevnode);
    tasker.insert(parent, vnode);
    diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
  } else {
    diffSelf(tasker, prevnode, vnode);
    diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
  }
}

function diffOneText(tasker, parent, vnode, toIndex) {
  // tasker.patch
}

function move(tasker, prevParent, nextParent, prevVNode, nextVNode, fromIndex, toIndex) {
  if (prevVNode.type !== nextVNode.type) {
    // TODO if the two types are different
    remove(parent, prevVNode, fromIndex);
    insert(parent, nextVNode, toIndex);
    return;
  }

  // TODO REMOVE
  diffSelf(tasker, prevVNode, nextVNode);

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

function remove(tasker, parent, fromIndex) {
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

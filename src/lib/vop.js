/* VDOM Ops */

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

/* vdom ops */

export function vdomInsert(
  tasker,
  beforeParent,
  mountingSet,
  afterParent,
  beforeIndex,
  afterIndex,
  afterNextBeforeIndex
) {
  const isInserted = beforeIndex < 0;
  const movedVNode = isInserted ? mountingSet[~beforeIndex] : beforeParent.children[beforeIndex];
  const referVNode = isInserted ? mountingSet[~afterNextBeforeIndex] : beforeParent.children[afterNextBeforeIndex];

  const task = { type: isInserted ? 'insert' : 'move' };

  const parentNode = afterParent;
  let redirectedParentNode = parentNode;
  let redirectedTailRefNode = null;

  // set the redirect target for vnodes with a fragment parent
  const isFragmentParentNode = parentNode.type === 'FRAGMENT';
  if (isFragmentParentNode) {
    // console.log(parentNode);
    redirectedParentNode = parentNode._host;
    redirectedTailRefNode = getVNodeAsRefNode(parentNode._tailRef);

    // console.log(redirectedTailRefNode);
  }

  switch (movedVNode.type) {
    case 'ELEMENT':
    case 'TEXT': {
      const node = isInserted ? mountingSet[~beforeIndex] : beforeParent.children[beforeIndex];
      const refNode =
        afterNextBeforeIndex === null
          ? redirectedTailRefNode // null
          : afterNextBeforeIndex < 0
          ? mountingSet[~afterNextBeforeIndex]
          : beforeParent.children[afterNextBeforeIndex];

      tasker.enqueue({
        type: isInserted ? 'mountNode' : 'moveNode',
        selfNode: node,
        parentNode: redirectedParentNode,
        refNode: refNode,
      });
      break;
    }
    case 'FRAGMENT': {
      const node = movedVNode;

      /*
      // the fragment node is linked to no DOM entity
      node._el = null;
      // the host target node, because the fragment node has no entity
      node._host = parentNode._host ?? parentNode;
      // TODO: node._host could also be assigned like the following:
      //   node._host = isNotEntityNode(parentNode) ? parentNode._host : parentNode
      //   const isNotEntityNode = node => node.type === 'FRAGMENT' || 'PROTAL';

      // use _tailRef to mark the tail of a fragment node in the host target node
      // _tailRef represents the sibling node of the fragment node, or null if itself is the last one
      // node._tailRef = if as tail, (parentNode._tailRef ?? null); else, referVNode;
      node._tailRef =
        afterNextBeforeIndex === null
          ? parentNode._tailRef ?? null
          : afterNextBeforeIndex < 0
          ? mountingSet[~afterNextBeforeIndex]
          : beforeParent.children[afterNextBeforeIndex];
      // TODO: isNotEntityNode(parentNode) ? parentNode._host : null
      */
      break;
    }
    default:
      break;
  }
  // return task;
}

export function vdomRemove(tasker, beforeParent, afterParent, beforeIndex) {
  const node = beforeParent.children[beforeIndex];
  const parentNode = beforeParent;

  let redirectedParentNode = parentNode;
  // let redirectedTailRefNode = null;

  // set the redirect target for vnodes with a fragment parent
  const isFragmentParentNode = parentNode.type === 'FRAGMENT';
  if (isFragmentParentNode) {
    redirectedParentNode = parentNode._host;
    // redirectedTailRefNode = parentNode._tailRef;
  }

  switch (node.type) {
    case 'ELEMENT':
    case 'TEXT': {
      console.assert(node._el);
      tasker.enqueue({
        type: 'removeNode',
        selfNode: node,
        parentNode: redirectedParentNode,
      });
      break;
    }
    case 'FRAGMENT': {
      break;
    }
    default:
    // return {};
  }
}

function getVNodeAsRefNode(vnode) {
  if (vnode === null) return null;

  if (vnode.type === 'FRAGMENT') {
    const children = vnode.children;
    const hasChildren = vnode.children.length;
    return hasChildren ? vnode.children[0] : vnode._tailRef;
  } else {
    return vnode;
  }
}

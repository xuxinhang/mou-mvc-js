/* vdom ops */

import { isEntityNode } from './core';

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
    // redirectedParentNode = parentNode._host;
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
    // TODO: a better processing method
    // redirectedTailRefNode = getVNodeAsRefNode(parentNode._tailRef);
    redirectedTailRefNode = getTailRefEntityNode(parentNode);
  }

  switch (movedVNode.type) {
    case 'ELEMENT':
    case 'TEXT': {
      const node = isInserted ? mountingSet[~beforeIndex] : beforeParent.children[beforeIndex];
      const refNode =
        afterNextBeforeIndex === null
          ? redirectedTailRefNode
          : getHeadEntityNode(
              afterNextBeforeIndex < 0
                ? mountingSet[~afterNextBeforeIndex]
                : beforeParent.children[afterNextBeforeIndex]
            );

      tasker.enqueue({
        type: isInserted ? 'mountNode' : 'moveNode',
        selfNode: node,
        parentNode: redirectedParentNode,
        refNode: refNode,
      });
      break;
    }
    case 'FRAGMENT': {
      /*
      const node = movedVNode;

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
    // redirectedParentNode = parentNode._host;
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
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

function getFirstEntityNode(node) {
  if (node === null) return null;

  if (node.type === 'FRAGMENT') {
    const hasChildren = node.children.length;
    return hasChildren ? getFirstEntityNode(node.children[0]) : node._nextSibling;
    // return hasChildren ? getVNodeAsRefNode(vnode.children[0]) : vnode._tailRef;
  } else {
    return node;
  }
}

function getTailRefEntityNode(node) {
  let current = node;

  // eslint-disable-next-line
  while (true) {
    if (current._nextSibling) {
      const ref = getHeadEntityNode(current._nextSibling);
      if (ref) return ref;
      current = current._nextSibling;
    } else if (current._parent) {
      if (isEntityNode(current._parent)) return null;
      current = current._parent;
    } else {
      // have reached the toppest node
      return null;
    }
  }
}

function getHeadEntityNode(root) {
  if (isEntityNode(root)) return root;
  for (const child of root.children) {
    const result = getHeadEntityNode(child);
    if (result) return result;
  }
}

function getNearestAncestorEntityNode(startNode) {
  for (let current = startNode; current; current = current._parent) {
    if (isEntityNode(current)) return current;
  }
  return null;
}

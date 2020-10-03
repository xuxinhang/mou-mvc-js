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
  const movedVNode = isInserted
    ? mountingSet[~beforeIndex]
    : beforeParent.type === 'COMPONENT'
    ? beforeParent._subRoot
    : beforeParent.children[beforeIndex];

  const parentNode = afterParent;
  let redirectedParentNode = parentNode;
  let redirectedTailRefNode = null;

  // set the redirect target for vnodes with a fragment parent
  // it's the key about how the fragment works!
  const isFragmentParentNode = parentNode.type === 'FRAGMENT';
  const isComponentParentNode = parentNode.type === 'COMPONENT';
  if (isFragmentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
    redirectedTailRefNode = getTailRefEntityNode(parentNode);
  } else if (isComponentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
    redirectedTailRefNode = getTailRefEntityNode(parentNode);
  }

  switch (movedVNode.type) {
    case 'ELEMENT':
    case 'TEXT': {
      const selfNode = movedVNode;
      const refNode =
        afterNextBeforeIndex === null
          ? redirectedTailRefNode
          : getHeadEntityNode(
              afterNextBeforeIndex < 0
                ? mountingSet[~afterNextBeforeIndex]
                : beforeParent.type === 'COMPONENT'
                ? beforeParent._subRoot
                : beforeParent.children[afterNextBeforeIndex]
            );

      // console.log('refNode = ', refNode);
      // if (refNode !== null && refNode._el.parentNode === null) {
      //   console.log('refNode is not in the DOM!');
      // }

      tasker.enqueue({
        type: isInserted ? 'mountNode' : 'moveNode',
        selfNode,
        parentNode: redirectedParentNode,
        refNode,
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
  const node = beforeParent.type === 'COMPONENT' ? beforeParent._subRoot : beforeParent.children[beforeIndex];
  const parentNode = beforeParent;

  let redirectedParentNode = parentNode;
  // let redirectedTailRefNode = null;

  // set the redirect target for vnodes with a fragment parent
  const isFragmentParentNode = parentNode.type === 'FRAGMENT';
  const isComponentParentNode = parentNode.type === 'COMPONENT';
  if (isFragmentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
  } else if (isComponentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
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
    default:
      break;
  }
}

function getTailRefEntityNode(node) {
  let current = node;

  // eslint-disable-next-line
  while (true) {
    if (current._host) {
      // TODO current.type ===
      current = current._host; // TODO no more #_host
    } else if (current._nextSibling) {
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

  if (root.type === 'COMPONENT') {
    return getHeadEntityNode(root._subRoot);
  } else {
    // TODO root.type === 'FRAGMENT'
    for (const child of root.children) {
      const result = getHeadEntityNode(child);
      if (result) return result;
    }
  }
}

function getNearestAncestorEntityNode(startNode) {
  for (let current = startNode; current; ) {
    if (isEntityNode(current)) return current;

    if (current._host) {
      current = current._host;
    } else {
      current = current._parent;
    }
  }
  return null;
}

/**
 * Map the operation to entity vnodes to that to DOM nodes
 */

import { getChildOrSubRootOrMountingNode, isEntityNode } from './toolkit';

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

  // NOTE: beforeParent might be null here!
  //       DO NOT directly use getChildOrSubRootOrMountingNode function
  //       <<IMPORTANT!>>
  const movedVNode = isInserted
    ? mountingSet[~beforeIndex]
    : getChildOrSubRootOrMountingNode(beforeIndex, beforeParent);

  const parentNode = afterParent;
  let redirectedParentNode = parentNode;
  let redirectedTailRefNode = null;

  // set the redirect target for vnodes with a fragment parent
  // it's the key about how the fragment works!
  const isFragmentParentNode = parentNode.type === 'FRAGMENT';
  const isFunctionalComponentParentNode = parentNode.type === 'COMPONENT_FUNCTIONAL';
  const isStatefulComponentParentNode = parentNode.type === 'COMPONENT_STATEFUL';
  if (isFragmentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
    redirectedTailRefNode = getTailRefEntityNode(parentNode);
  } else if (isFunctionalComponentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
    redirectedTailRefNode = getTailRefEntityNode(parentNode);
  } else if (isStatefulComponentParentNode) {
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
          : getHeadEntityNode(getChildOrSubRootOrMountingNode(afterNextBeforeIndex, beforeParent, mountingSet));

      tasker.enqueue({
        type: isInserted ? 'mountNode' : 'moveNode',
        selfNode,
        parentNode: redirectedParentNode,
        refNode,
      });
      break;
    }
    default:
      break;
  }
}

export function vdomRemove(tasker, beforeParent, afterParent, beforeIndex) {
  const node = getChildOrSubRootOrMountingNode(beforeIndex, beforeParent);
  const parentNode = beforeParent;

  let redirectedParentNode = parentNode;
  // let redirectedTailRefNode = null;

  // set the redirect target for vnodes with a fragment parent
  const isFragmentParentNode = parentNode.type === 'FRAGMENT';
  const isFunctionalComponentParentNode = parentNode.type === 'COMPONENT_FUNCTIONAL';
  const isStatefulComponentParentNode = parentNode.type === 'COMPONENT_STATEFUL';
  if (isFragmentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
  } else if (isFunctionalComponentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
  } else if (isStatefulComponentParentNode) {
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

export function insertEntity(tasker, upper, self, ref, beforeIndex) {
  console.assert(self.type === 'ELEMENT' || self.type === 'TEXT');
  const parentNode = upper;
  const selfNode = self;
  const isInserted = beforeIndex < 0;

  // redirect the parent or tail-ref node to get the actually node
  let redirectedParentNode = parentNode;
  let redirectedTailRefNode = null;

  // set the redirect target for vnodes with a fragment parent
  // it's the key to how the fragment works!
  const isFragmentParentNode = parentNode.type === 'FRAGMENT';
  const isFunctionalComponentParentNode = parentNode.type === 'COMPONENT_FUNCTIONAL';
  const isStatefulComponentParentNode = parentNode.type === 'COMPONENT_STATEFUL';
  if (isFragmentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
    redirectedTailRefNode = getTailRefEntityNode(parentNode);
  } else if (isFunctionalComponentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
    redirectedTailRefNode = getTailRefEntityNode(parentNode);
  } else if (isStatefulComponentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
    redirectedTailRefNode = getTailRefEntityNode(parentNode);
  }

  // map to the actually ref node according to the given ref node
  let refNode = ref;
  while (refNode !== null && refNode.type === 'PORTAL') refNode = refNode._nextSibling;
  refNode = refNode === null ? redirectedTailRefNode : getHeadEntityNode(refNode);

  tasker.enqueue({
    type: isInserted ? 'mountNode' : 'moveNode',
    selfNode,
    parentNode: redirectedParentNode,
    refNode,
  });
}

export function removeEntity(tasker, upper, self) {
  console.assert(self.type === 'ELEMENT' || self.type === 'TEXT');
  const selfNode = self;
  const parentNode = upper;

  // redirect the parent node to get the actually node
  let redirectedParentNode = parentNode;

  // set the redirect target for vnodes with a fragment parent
  // it's the key to how the fragment works!
  const isFragmentParentNode = parentNode.type === 'FRAGMENT';
  const isFunctionalComponentParentNode = parentNode.type === 'COMPONENT_FUNCTIONAL';
  const isStatefulComponentParentNode = parentNode.type === 'COMPONENT_STATEFUL';
  if (isFragmentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
  } else if (isFunctionalComponentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
  } else if (isStatefulComponentParentNode) {
    redirectedParentNode = getNearestAncestorEntityNode(parentNode);
  }

  console.assert(selfNode._el);
  tasker.enqueue({
    type: 'removeNode',
    selfNode,
    parentNode: redirectedParentNode,
  });
}

function getTailRefEntityNode(node) {
  let current = node;

  // eslint-disable-next-line
  while (true) {
    if (current._componentHost) {
      // if the node is the sub-node of a component
      current = current._componentHost;
    } else {
      // for other nodes
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
}

function getHeadEntityNode(root) {
  if (isEntityNode(root)) return root;

  switch (root.type) {
    case 'COMPONENT_STATEFUL':
    case 'COMPONENT_FUNCTIONAL': {
      if (root._subRoot) {
        return getHeadEntityNode(root._subRoot);
      }
    }
    case 'FRAGMENT': // eslint-disable-line no-fallthrough
    default: {
      for (const child of root.children) {
        const result = getHeadEntityNode(child);
        if (result) return result;
      }
    }
  }
  console.assert(false);
}

function getNearestAncestorEntityNode(startNode) {
  for (let current = startNode; current; ) {
    if (isEntityNode(current)) return current;

    if (current._componentHost) {
      // for the sub node of a component
      current = current._componentHost;
    } else {
      // for other nodes
      current = current._parent;
    }
  }
  return null;
}

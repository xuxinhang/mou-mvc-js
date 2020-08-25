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
    // TODO: a better processing method
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
    const hasChildren = vnode.children.length;
    return hasChildren ? getVNodeAsRefNode(vnode.children[0]) : vnode._tailRef;
  } else {
    return vnode;
  }
}

export function isVNodeLinkedToDOMNode(vnode) {
  return (vnode._el || vnode.type === 'FRAGMENT') && (vnode.children ?? []).every(c => isVNodeLinkedToDOMNode(c));
}

export function isVNodeLinkedToRelativeVNode(vnode) {
  return (
    vnode._parent !== undefined &&
    vnode._nextSibling !== undefined &&
    (vnode.children ?? []).every(c => isVNodeLinkedToRelativeVNode(c))
  );
}

export function generateUID() {
  return ~~(Math.random() * 10000000);
}

export function generateIndexArray(n) {
  const arr = Array(n);
  for (let i = 0; i < n; i++) arr[i] = i;
  return arr;
}

export function getChildOrSubRootOrMountingNode(index, node, mountingSet) {
  // @HACK fetch from mountingSet firstly, because the offered node might be null
  if (index < 0) {
    if (!Array.isArray(mountingSet)) throw new TypeError('missing mountingSet');
    return mountingSet[~index];
  }

  switch (node.type) {
    case 'COMPONENT_STATEFUL':
    case 'COMPONENT_FUNCTIONAL': {
      return node._subRoot;
    }
    case 'ELEMENT':
    case 'FRAGMENT': {
      if (index < 0) {
        if (!Array.isArray(mountingSet)) throw new TypeError('missing mountingSet');
        return mountingSet[~index];
      } else {
        return node.children[index];
      }
      // break;
    }
    default: {
      throw new Error('this node has neither child nor sub-root.');
    }
  }
}

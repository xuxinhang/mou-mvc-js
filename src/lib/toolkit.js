export function isVNodeLinkedToDOMNode(vnode) {
  // for entity nodes, check #_el; for fragments, check #_host
  // return (vnode._el || vnode._host) && (vnode.children ?? []).every(c => isVNodeLinkedToDOMNode(c));
  return (
    (vnode._el || vnode.type === 'FRAGMENT') /* vnode._host */ &&
    (vnode.children ?? []).every(c => isVNodeLinkedToDOMNode(c))
  );
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
  switch (node.type) {
    case 'COMPONENT': {
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

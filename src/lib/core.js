import { normalizeVNode } from './h';
import { apply, createDOMOperationTasker } from './tasker';
import { vdomInsert, vdomRemove } from './vop';

export function mount(vnode, elem) {
  vnode = normalizeVNode(vnode);
  const hackedParentVNode = {
    _isVNode: true,
    _el: elem,
    _uid: -1,
    children: [],
  };
  return _update(hackedParentVNode, null, vnode);
}

export function refresh(prevnode, vnode, elem) {
  vnode = normalizeVNode(vnode);
  const hackedParentVNode = {
    _isVNode: true,
    _el: elem,
    _uid: -1,
    children: [],
  };
  return _update(hackedParentVNode, prevnode, vnode);
}

function _update(parent, prevnode, vnode) {
  if (prevnode == null && vnode == null) return;

  const tasker = createDOMOperationTasker();
  if (prevnode == null && vnode != null) {
    mountOne(tasker, parent, [vnode], parent, -1, 0, null);
  } else if (prevnode != null && vnode == null) {
    removeOne();
  } else if (prevnode != null && vnode != null) {
    diffOne(tasker, parent, prevnode, vnode);
  }

  apply(tasker);
}

function mountOne(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  console.assert(beforeIndex < 0);
  const vnode = mountingSet[~beforeIndex];

  switch (vnode.type) {
    case 'ELEMENT': {
      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      // then, mount the children nodes
      const childrenNodes = vnode.children;
      console.assert(vnode && childrenNodes);
      for (let i = 0; i < childrenNodes.length; i++) {
        // @HACK  afterNextBeforeIndex is assigned as null, which fits this situation
        mountOne(tasker, vnode, childrenNodes, vnode, ~i, i, null);
      }
      break;
    }
    case 'TEXT': {
      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      break;
    }
    case 'FRAGMENT': {
      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      console.assert(vnode && vnode.children);
      const childrenNodes = vnode.children;
      for (let i = 0; i < childrenNodes.length; i++) {
        mountOne(tasker, null, childrenNodes, vnode, ~i, i, i);
      }
      break;
    }
    // and other cases for different vnode.type:
    default:
      break;
  }
}

function unmountOne() {
  // TODO
}

function diffOne(tasker, parent, prevnode, vnode) {
  // the diff operation is only avaliable for two nodes with the same node type
  console.assert(prevnode.type === vnode.type);

  // copy the meta data
  vnode._el = prevnode._el;
  vnode._uid = prevnode._uid;

  diffSelf(tasker, prevnode, vnode);

  switch (prevnode.type) {
    case 'ELEMENT':
      diffOneElement(tasker, parent, prevnode, vnode);
      break;
    case 'TEXT':
      // TODO diffOneText();
      break;
    default:
      break;
  }
}

function diffOneElement(tasker, parent, prevnode, vnode) {
  if (prevnode.tag !== vnode.tag) {
    diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
  } else {
    diffSelf(tasker, prevnode, vnode);
    diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
  }
}

function diffSelf(tasker, prevnode, vnode) {
  // TODO
  return;
}

function diffChildren(tasker, prevParent, parent, beforeNodes, afterNodes) {
  const before_marks = new Array(beforeNodes.length);
  let lastIndex = 0; // 用来存储寻找过程中遇到的最大索引值

  const childrenMoveRecord = [];
  const childrenInsertRecord = [];

  for (let a_i = 0; a_i < afterNodes.length; a_i++) {
    const a_k = afterNodes[a_i];
    let b_i = beforeNodes.findIndex(e => isNodeDiffable(e, a_k));
    const b_k = beforeNodes[b_i];
    if (b_i === -1) {
      const beforeIndex = -childrenInsertRecord.push(a_k);

      const lastChildrenMoveRecord = childrenMoveRecord[childrenMoveRecord.length - 1];
      if (lastChildrenMoveRecord && lastChildrenMoveRecord.afterNextBeforeIndex === undefined) {
        lastChildrenMoveRecord.afterNextBeforeIndex = beforeIndex;
      }

      childrenMoveRecord.push({ beforeIndex, afterIndex: a_i, afterNextBeforeIndex: undefined });
    } else {
      const lastChildrenMoveRecord = childrenMoveRecord[childrenMoveRecord.length - 1];
      if (lastChildrenMoveRecord && lastChildrenMoveRecord.afterNextBeforeIndex === undefined) {
        lastChildrenMoveRecord.afterNextBeforeIndex = b_i;
      }

      if (b_i < lastIndex) {
        childrenMoveRecord.push({ beforeIndex: b_i, afterIndex: a_i, afterNextBeforeIndex: undefined });
        diffOne(tasker, parent, b_k, a_k);
      } else {
        lastIndex = b_i;
        diffOne(tasker, parent, b_k, a_k);
      }
      before_marks[b_i] = true;
    }
  }

  const lastChildrenMoveRecord = childrenMoveRecord[childrenMoveRecord.length - 1];
  if (lastChildrenMoveRecord && lastChildrenMoveRecord.afterNextBeforeIndex === undefined) {
    lastChildrenMoveRecord.afterNextBeforeIndex = null; // null stands for the last one.
  }

  for (let b_i = 0; b_i < beforeNodes.length; b_i++) {
    const b_used = !!before_marks[b_i];
    if (b_used) continue;
    // TODO no more direct vdom operations
    vdomRemove(tasker, prevParent, parent, b_i);
  }

  const sortedChildrenMoveRecord = childrenMoveRecord.sort((a, b) => b.afterIndex - a.afterIndex);
  for (const r of sortedChildrenMoveRecord) {
    if (r.beforeIndex < 0) {
      mountOne(tasker, prevParent, childrenInsertRecord, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    } else {
      // TODO no more direct vdom operations
      vdomInsert(tasker, prevParent, childrenInsertRecord, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    }
  }
}

function isNodeDiffable(a, b) {
  // TODO
  return (
    a.type === b.type &&
    a.key === b.key && // basic condition
    (a.type !== 'ELEMENT' || a.tag === b.tag) // for element node
  );
}

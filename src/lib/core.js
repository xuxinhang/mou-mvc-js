import { normalizeVNode } from './h';
import { apply, createDOMOperationTasker } from './tasker';
import { vdomInsert, vdomMove, vdomRemove, insert } from './vop';

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
  // diffOne(tasker, parent, prevnode, vnode);
  if (prevnode == null && vnode != null) {
    // insert(tasker, parent, vnode);
    insertOne(tasker, parent, [vnode], parent, -1, 0, null);
    // diff
  } else if (prevnode != null && vnode == null) {
    removeOne();
  } else if (prevnode != null && vnode != null) {
    diffOne(tasker, parent, prevnode, vnode);
  }

  apply(tasker);
}

function insertOne(tasker, beforeParent, insertedList, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  console.assert(beforeIndex < 0);
  const vnode = insertedList[~beforeIndex];
  switch (vnode.type) {
    case 'ELEMENT':
      tasker.enqueue(
        vdomInsert(beforeParent, insertedList, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex)
      );
      insertElementChildren(tasker, vnode, vnode.children);
      break;
    case 'TEXT':
      tasker.enqueue(
        vdomInsert(beforeParent, insertedList, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex)
      );
      break;
    // and other cases for different vnode.type
    default:
      break;
  }
}

function insertElementChildren(tasker, parent) {
  const nodes = parent.children;
  console.assert(parent && nodes);
  for (let i = 0; i < nodes.length; i++) {
    // @HACK
    insertOne(tasker, parent, nodes, parent, ~i, i, null);
  }
}

function removeOne() {
  // TODO
}

function diffOne(tasker, parent, prevnode, vnode) {
  if (prevnode.type !== vnode.type) {
    const index = parent.children.indexOf(prevnode);
    // remove(parent, prevnode, index);
    // insert(parent, vnode, index);
    return;
  }

  // copy the meta data
  vnode._el = prevnode._el;
  vnode._uid = prevnode._uid;

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
    // tasker.remove(prevnode);
    // tasker.insert(parent, vnode);
    diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
  } else {
    diffSelf(tasker, prevnode, vnode);
    diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
  }
}

function diffOneText(tasker, parent, vnode, toIndex) {
  // tasker.patch
}

function diffSelf(tasker, prevnode, vnode) {
  // TODO
  return;
}

function diffChildren(tasker, prevParent, parent, beforeNodes, afterNodes) {
  // console.trace('diffChildren');
  const before_marks = new Array(beforeNodes.length);
  let lastIndex = 0; // 用来存储寻找过程中遇到的最大索引值

  const childrenMoveRecord = [];
  const childrenInsertRecord = [];

  for (let a_i = 0; a_i < afterNodes.length; a_i++) {
    const a_k = afterNodes[a_i];
    let b_i = beforeNodes.findIndex(e => e.key === a_k.key);
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
    tasker.enqueue(vdomRemove(prevParent, parent, b_i));
  }

  const sortedChildrenMoveRecord = childrenMoveRecord.sort((a, b) => b.afterIndex - a.afterIndex);
  for (const r of sortedChildrenMoveRecord) {
    if (r.beforeIndex < 0) {
      insertOne(tasker, prevParent, childrenInsertRecord, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    } else {
      tasker.enqueue(
        // TODO no more direct vdom operations
        vdomInsert(prevParent, childrenInsertRecord, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex)
      );
    }
  }
}

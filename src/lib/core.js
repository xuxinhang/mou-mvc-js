import { normalizeVNode } from './h';
import { apply, createDOMOperationTasker } from './tasker';
import { vdomInsert, vdomRemove } from './vop';
import { generateIndexArray, generateUID } from './toolkit';

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

  vnode._uid = generateUID();

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
      const node = vnode;
      const parentNode = afterParent;

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
          ? parentNode._tailRef ?? null // TODO: calculate when used ?
          : afterNextBeforeIndex < 0
          ? mountingSet[~afterNextBeforeIndex]
          : beforeParent.children[afterNextBeforeIndex];
      // TODO: isNotEntityNode(parentNode) ? parentNode._host : null

      console.log('_tailRef:\t', node);

      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);

      console.assert(vnode && vnode.children);
      const childrenNodes = vnode.children;
      for (let i = 0; i < childrenNodes.length; i++) {
        mountOne(tasker, null, childrenNodes, vnode, ~i, i, null);
      }
      break;
    }
    // and other cases for different vnode.type:
    default:
      break;
  }
}

function moveOne(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  const node = beforeParent.children[beforeIndex];

  switch (node.type) {
    case 'ELEMENT':
    case 'TEXT': {
      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      break;
    }
    case 'FRAGMENT': {
      const beforeNode = beforeParent.children[beforeIndex];
      const afterNode = afterParent.children[afterIndex];

      console.assert(beforeNode.type === 'FRAGMENT');
      console.assert(afterNode.type === 'FRAGMENT');

      // TODO 添加一些内容
      // vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      // TODO: copy/update the value of _tailRef, _el and _host from the old fragment node
      diffSelf(tasker, beforeNode, afterNode);
      afterNode._host = beforeNode._host;
      afterNode._tailRef =
        afterNextBeforeIndex === null
          ? beforeParent._tailRef ?? null
          : getChildByIndex(afterNextBeforeIndex, beforeParent.children, mountingSet);

      // for (let i = 0; i < beforeParent.children.length; i++) {
      //   // insert each child of this fragment to `
      //   moveOne(tasker, beforeNode, [], afterNode, i, i, null);
      // }

      for (let i = beforeNode.children.length - 1, lastIndex = null; i >= 0; lastIndex = i--) {
        // insert each child of this fragment one by one
        moveOne(tasker, beforeNode, [], afterNode, i, i, lastIndex);
      }
      break;
    }
  }
}

function unmountOne(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  // console.log(beforeIndex);
  console.assert(beforeIndex >= 0);
  const node = beforeParent.children[beforeIndex];

  switch (node.type) {
    case 'ELEMENT':
    case 'TEXT': {
      vdomRemove(tasker, beforeParent, afterParent, beforeIndex);
      break;
    }
    case 'FRAGMENT': {
      // remove all of its children
      for (let i = 0; i < node.children.length; i++) {
        vdomRemove(tasker, node, null, i);
      }
      break;
    }
    default:
      break;
  }
}

function diffOne(tasker, parent, prevnode, vnode) {
  // the diff operation is only avaliable for two nodes with the same node type
  console.assert(prevnode.type === vnode.type);

  // copy the meta data
  vnode._el = prevnode._el;
  vnode._uid = prevnode._uid;
  if (prevnode._host) vnode._host = prevnode._host;
  // TODO: 考虑放到 diffChildren 过程中或者在 diffOne 中传入 afterNextBeforeIndex
  // 不论移动的 fragment 还是不移动的 fragment 都需要重新计算 _tailRef
  if (prevnode._tailRef !== undefined && vnode._tailRef === undefined) {
    vnode._tailRef = prevnode._tailRef;
  }

  diffSelf(tasker, prevnode, vnode);

  switch (prevnode.type) {
    case 'ELEMENT': {
      diffOneElement(tasker, parent, prevnode, vnode);
      break;
    }
    case 'TEXT':
      // TODO diffOneText();
      break;
    case 'FRAGMENT': {
      diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
      break;
    }
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

      // assign the afterNextBefore value of the last moved node
      const lastChildrenMoveRecord = childrenMoveRecord[childrenMoveRecord.length - 1];
      if (lastChildrenMoveRecord && lastChildrenMoveRecord.afterNextBeforeIndex === undefined) {
        lastChildrenMoveRecord.afterNextBeforeIndex = beforeIndex;
      }

      childrenMoveRecord.push({ beforeIndex, afterIndex: a_i, afterNextBeforeIndex: undefined });
    } else {
      // assign the afterNextBefore value of the last moved node
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
    unmountOne(tasker, prevParent, childrenInsertRecord, parent, b_i, undefined, undefined);
  }

  const sortedChildrenMoveRecord = childrenMoveRecord.sort((a, b) => b.afterIndex - a.afterIndex);
  for (const r of sortedChildrenMoveRecord) {
    if (r.beforeIndex < 0) {
      mountOne(tasker, prevParent, childrenInsertRecord, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    } else {
      moveOne(tasker, prevParent, childrenInsertRecord, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    }
  }
}

/* Utils */

function isNodeDiffable(a, b) {
  // TODO
  return (
    a.type === b.type &&
    a.key === b.key && // basic condition
    (a.type !== 'ELEMENT' || a.tag === b.tag) // for element node
  );
}

function getChildByIndex(index, existingList, mountingList = []) {
  return index < 0 ? mountingList[~index] : existingList[index];
}

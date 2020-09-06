import { normalizeVNode } from './h';
import { apply, createDOMOperationTasker } from './tasker';
import { vdomInsert, vdomRemove } from './vop';
import { /* generateIndexArray, */ generateUID } from './toolkit';

function clearMountTargetElement(el) {
  el.innerHTML = '';
}

export function mount(vnode, elem) {
  clearMountTargetElement(elem);

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
    // removeOne();
  } else if (prevnode != null && vnode != null) {
    diffOne(tasker, parent, prevnode, vnode);
  }

  apply(tasker);
}

function mountOne(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  console.assert(beforeIndex < 0);
  const vnode = mountingSet[~beforeIndex];

  vnode._uid = generateUID();
  vnode._parent = afterParent;

  switch (vnode.type) {
    case 'ELEMENT': {
      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      mountChildren(tasker, vnode, vnode);
      break;
    }
    case 'TEXT': {
      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      break;
    }
    case 'FRAGMENT': {
      const node = vnode;

      // the fragment node is linked to no DOM entity
      node._el = null;

      // const parentNode = afterParent;
      // the host target node, because the fragment node has no entity
      //   node._host = parentNode._host ?? parentNode;
      // node._host = isNotEntityNode(parentNode) ? parentNode._host : parentNode;

      // use _tailRef to mark the tail of a fragment node in the host target node
      // _tailRef represents the sibling node of the fragment node, or null if itself is the last one
      // node._tailRef = if as tail, (parentNode._tailRef ?? null); else, referVNode;
      // node._tailRef =
      //   afterNextBeforeIndex === null
      //     ? parentNode._tailRef ?? null // TODO: calculate when used ?
      //     : getChildByIndex(afterNextBeforeIndex, beforeParent.children, mountingSet);
      // node._nextSibling = getChildByIndex(afterNextBeforeIndex, beforeParent.children, mountingSet);
      // console.log('_tailRef:\t', node);

      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      mountChildren(tasker, null, vnode);
      break;
    }
    // and other cases for different vnode.type:
    default:
      break;
  }
}

function mountChildren(tasker, beforeParent, afterParent) {
  const childNodes = afterParent.children;
  console.assert(afterParent && childNodes);

  // update #_nextSibling and #_parent
  for (let i = 0; i < childNodes.length; i++) {
    const a_k = childNodes[i];
    a_k._nextSibling = childNodes[i + 1];
    a_k._parent = afterParent;
  }
  if (childNodes.length > 0) {
    childNodes[childNodes.length - 1]._nextSibling = null;
  }

  for (let i = 0; i < childNodes.length; i++) {
    // @HACK  afterNextBeforeIndex is always assigned as null, which fits this situation
    //        Maybe changed to use the correct afterNextIndexBefore in the future
    mountOne(tasker, beforeParent, childNodes, afterParent, ~i, i, null);
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
      console.assert(beforeNode.type === 'FRAGMENT' && afterNode.type === 'FRAGMENT');

      // TODO: copy/update the value of _tailRef, _el and _host from the old fragment node
      // just simply copy the #_host. Because the node won't move cross layers
      // afterNode._host = beforeNode._host;
      // afterNode._tailRef =
      //   afterNextBeforeIndex === null
      //     ? beforeParent._tailRef ?? null
      //     : getChildByIndex(afterNextBeforeIndex, beforeParent.children, mountingSet);
      // afterNode._nextSibling = getChildByIndex(afterNextBeforeIndex, beforeParent.children, mountingSet);

      for (let i = beforeNode.children.length - 1, lastIndex = null; i >= 0; lastIndex = i--) {
        // insert each child of this fragment one by one
        moveOne(tasker, beforeNode, [], afterNode, i, i, lastIndex);
      }
      break;
    }
  }
}

function unmountOne(tasker, beforeParent, mountingSet, afterParent, beforeIndex) {
  // console.log(beforeIndex);
  console.assert(beforeIndex >= 0);
  const node = beforeParent.children[beforeIndex];

  switch (node.type) {
    case 'ELEMENT': {
      // just simply delete this element and all of its children will go
      vdomRemove(tasker, beforeParent, afterParent, beforeIndex);
      break;
    }
    case 'TEXT': {
      vdomRemove(tasker, beforeParent, afterParent, beforeIndex);
      break;
    }
    case 'FRAGMENT': {
      // recursively remove all of its children
      for (let i = 0; i < node.children.length; i++) {
        unmountOne(tasker, node, null, null, i);
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
  // if (prevnode._host) vnode._host = prevnode._host;
  // TODO: 考虑放到 diffChildren 过程中 不论 fragment 是否移动都需要重新计算 _tailRef
  // if (prevnode._tailRef !== undefined && vnode._tailRef === undefined) {
  //   vnode._tailRef = prevnode._tailRef;
  // }

  diffSelf(tasker, prevnode, vnode);

  switch (prevnode.type) {
    case 'ELEMENT': {
      if (prevnode.tag !== vnode.tag) {
        diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
      } else {
        diffSelf(tasker, prevnode, vnode);
        diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
      }
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

function diffSelf(tasker, beforeNode, afterNode) {
  console.assert(beforeNode.type === afterNode.type);
  const nodeType = beforeNode.type;

  switch (nodeType) {
    case 'TEXT': {
      console.assert(beforeNode._el && beforeNode._el.textContent === beforeNode.text);
      console.assert(beforeNode._el === afterNode._el);
      if (beforeNode.text !== afterNode.text) {
        tasker.enqueue({ type: 'updateTextContent', selfNode: afterNode });
        // console.log(beforeNode.text, afterNode.text);
      }
      break;
    }
  }

  return;
}

function diffChildren(tasker, prevParent, parent, beforeNodes, afterNodes) {
  const isBeforeNodeRemained = new Array(beforeNodes.length);
  let lastIndex = 0; // 用来存储寻找过程中遇到的最大索引值

  const childInsertRecord = [];
  const mountingSet = [];

  function setAfterNextBeforeIndexOfTheLastInsertRecord(index) {
    // do nothing if there is no insert record.
    if (childInsertRecord.length === 0) return;
    const lastInsertRecord = childInsertRecord[childInsertRecord.length - 1];
    // if afterNextBeforeIndex === undefined, the lastInsertRecord is still open.
    if (lastInsertRecord.afterNextBeforeIndex === undefined) lastInsertRecord.afterNextBeforeIndex = index;
  }

  for (let a_i = 0; a_i < afterNodes.length; a_i++) {
    const a_k = afterNodes[a_i];
    let b_i = beforeNodes.findIndex(e => isNodeDiffable(e, a_k));
    const b_k = beforeNodes[b_i];
    if (b_i === -1) {
      const beforeIndex = -mountingSet.push(a_k);
      setAfterNextBeforeIndexOfTheLastInsertRecord(beforeIndex);
      childInsertRecord.push({ beforeIndex, afterIndex: a_i, afterNextBeforeIndex: undefined });
    } else {
      setAfterNextBeforeIndexOfTheLastInsertRecord(b_i);
      if (b_i < lastIndex) {
        childInsertRecord.push({ beforeIndex: b_i, afterIndex: a_i, afterNextBeforeIndex: undefined });
      } else {
        lastIndex = b_i;
      }
      diffOne(tasker, parent, b_k, a_k);
      isBeforeNodeRemained[b_i] = true;
    }

    // update #_nextSibling
    if (a_i > 0) afterNodes[a_i - 1]._nextSibling = a_k;
    // update #_parent
    a_k._parent = parent;
  }

  setAfterNextBeforeIndexOfTheLastInsertRecord(null); // null stands for the last one.

  // update #_nextSibling
  if (afterNodes.length > 0) afterNodes[afterNodes.length - 1]._nextSibling = null;

  // unmount the un-used nodes
  for (let b_i = 0; b_i < beforeNodes.length; b_i++) {
    if (isBeforeNodeRemained[b_i]) continue;
    unmountOne(tasker, prevParent, mountingSet, parent, b_i, undefined, undefined);
  }

  const sortedChildInsertRecord = childInsertRecord.sort((a, b) => b.afterIndex - a.afterIndex);
  for (const r of sortedChildInsertRecord) {
    if (r.beforeIndex < 0) {
      mountOne(tasker, prevParent, mountingSet, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    } else {
      moveOne(tasker, prevParent, mountingSet, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    }
  }
}

/* Utils */

function isNodeDiffable(a, b) {
  if (a.type !== b.type) return false;
  if (a.key !== b.key) return false;
  if (a.type === 'ELEMENT' && a.tag !== b.tag) return false;
  return true;
}

export function getChildByIndex(index, existingList, mountingList = []) {
  return index < 0 ? mountingList[~index] : existingList[index];
}

export function isNotEntityNode(node) {
  return node.type === 'FRAGMENT' || node.type === 'PROTAL';
  // return node._host !== undefined && node._host !== null;
}

export function isEntityNode(node) {
  return !isNotEntityNode(node);
}

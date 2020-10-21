import { normalizeChildren } from './h';
import { apply, createDOMOperationTasker } from './tasker';
import { vdomInsert, vdomRemove } from './vop';
import { /* generateIndexArray, */ generateUID, getChildOrSubRootOrMountingNode } from './toolkit';

export function mount(vnode, elem) {
  // clear the original element contains
  elem.innerHTML = '';
  return refresh(null, vnode, elem);
}

export function refresh(prevnode, vnode, elem) {
  const constructHelperMountingRootNode = (el, vnode) => {
    const hackedParentVNode = {
      _isVNode: true,
      // _isMountingRoot: true,
      type: 'ELEMENT',
      _el: el,
      _uid: -1,
      children: normalizeChildren(vnode),
    };
    return hackedParentVNode;
  };

  const beforeHelperRootNode = constructHelperMountingRootNode(elem, prevnode);
  const afterHelperRootNode = constructHelperMountingRootNode(elem, vnode);

  const tasker = createDOMOperationTasker();

  diffChildren(
    tasker,
    beforeHelperRootNode,
    afterHelperRootNode,
    beforeHelperRootNode.children,
    afterHelperRootNode.children
  );

  apply(tasker);
}

function mountOne(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  console.assert(beforeIndex < 0);
  const vnode = mountingSet[~beforeIndex];

  vnode._uid = generateUID();
  vnode._parent = afterParent; // TODO maybe removed one day.

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
      //     ? parentNode._tailRef ?? null // TTODO: calculate when used ?
      //     : getChildByIndex(afterNextBeforeIndex, beforeParent.children, mountingSet);
      // node._nextSibling = getChildByIndex(afterNextBeforeIndex, beforeParent.children, mountingSet);
      // console.log('_tailRef:\t', node);

      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      mountChildren(tasker, null, vnode);
      break;
    }
    case 'COMPONENT_FUNCTIONAL': {
      const node = vnode;
      const subRoot = node.tag(node.props);
      node._subRoot = subRoot;
      if (subRoot) subRoot._componentHost = node;

      mountOne(tasker, null, [subRoot], node, -1, 0, null);
      break;
    }
    case 'COMPONENT_STATEFUL': {
      const node = vnode;
      const Fn = node.tag;

      // initialize a component instance
      const inst = (node._inst = new Fn());

      // get the node tree
      // TEMP: pass the props directly
      const subRoot = inst.render(node.props);
      node._subRoot = subRoot;
      if (subRoot) subRoot._componentHost = node;

      // append the mount task into the queue
      mountOne(tasker, null, [subRoot], node, -1, 0, null);
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

  for (let i = childNodes.length - 1, lastIndex = null; i >= 0; lastIndex = i--) {
    mountOne(tasker, beforeParent, childNodes, afterParent, ~i, i, lastIndex === null ? lastIndex : ~lastIndex);
  }
}

function moveOne(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  console.assert(beforeIndex >= 0);
  const node = getChildOrSubRootOrMountingNode(beforeIndex, beforeParent, mountingSet);

  switch (node.type) {
    case 'ELEMENT':
    case 'TEXT': {
      vdomInsert(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex);
      break;
    }
    case 'FRAGMENT': {
      const beforeNode = getChildOrSubRootOrMountingNode(beforeIndex, beforeParent);
      const afterNode = getChildOrSubRootOrMountingNode(afterIndex, afterParent);
      console.assert(beforeNode.type === 'FRAGMENT' && afterNode.type === 'FRAGMENT');

      // TTODO: copy/update the value of _tailRef, _el and _host from the old fragment node
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
    case 'COMPONENT_FUNCTIONAL': {
      const beforeNode = getChildOrSubRootOrMountingNode(beforeIndex, beforeParent);
      const afterNode = getChildOrSubRootOrMountingNode(afterIndex, afterParent);
      console.assert(beforeNode.type === 'COMPONENT_FUNCTIONAL' && afterNode.type === 'COMPONENT_FUNCTIONAL');
      moveOne(tasker, beforeNode, [], afterNode, 0, 0, null);
      break;
    }
    case 'COMPONENT_STATEFUL': {
      const beforeNode = getChildOrSubRootOrMountingNode(beforeIndex, beforeParent);
      const afterNode = getChildOrSubRootOrMountingNode(afterIndex, afterParent);
      console.assert(beforeNode.type === 'COMPONENT_STATEFUL' && afterNode.type === 'COMPONENT_STATEFUL');
      moveOne(tasker, beforeNode, [], afterNode, 0, 0, null);
      break;
    }
    default:
      break;
  }
}

function unmountOne(tasker, beforeParent, mountingSet, afterParent, beforeIndex) {
  console.assert(beforeIndex >= 0);
  // here, node is the current node that is the child of the parent node.
  const node = getChildOrSubRootOrMountingNode(beforeIndex, beforeParent);

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
    case 'COMPONENT_FUNCTIONAL': {
      unmountOne(tasker, node, null, null, 0);
      break;
    }
    case 'COMPONENT_STATEFUL': {
      unmountOne(tasker, node, null, null, 0);
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
  // TTODO: 考虑放到 diffChildren 过程中 不论 fragment 是否移动都需要重新计算 _tailRef
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
      break;
    case 'FRAGMENT': {
      diffChildren(tasker, prevnode, vnode, prevnode.children, vnode.children);
      break;
    }
    case 'COMPONENT_STATEFUL':
    case 'COMPONENT_FUNCTIONAL': {
      // just diffSelf is enough, the component node has no child.
      break;
    }
    default:
      break;
  }
}

function diffSelf(tasker, beforeNode, afterNode) {
  console.assert(beforeNode.type === afterNode.type);
  const nodeType = beforeNode.type;

  function diffSubRoot(tasker, beforeHost, afterHost, beforeSubRoot, afterSubRoot) {
    if (isNodeDiffable(beforeSubRoot, afterSubRoot)) {
      diffOne(tasker, afterHost, beforeSubRoot, afterSubRoot);
    } else {
      // TODO: consider to create the new functions: (un)mountSubRoot
      //       because the so-called sub-root is not the child
      unmountOne(tasker, beforeHost, [], afterHost, 0, 0);
      mountOne(tasker, beforeHost, [beforeSubRoot], afterHost, -1, 0, null);
    }
  }

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
    case 'COMPONENT_FUNCTIONAL': {
      console.assert(beforeNode._subRoot !== undefined);
      console.assert(beforeNode.tag === afterNode.tag);

      // re-generate the new sub root node
      const subRoot = afterNode.tag(afterNode.props);
      (afterNode._subRoot = subRoot) && (subRoot._componentHost = afterNode);

      diffSubRoot(tasker, beforeNode, afterNode, beforeNode._subRoot, afterNode._subRoot);

      break;
    }
    case 'COMPONENT_STATEFUL': {
      // diff the sub root node.
      console.assert(beforeNode._inst._isComponentInst);

      // copy the previous component instance to the afterNode.
      const inst = (afterNode._inst = beforeNode._inst);
      // re-generate the new sub-root node
      const subRoot = inst.render(afterNode.props);
      (afterNode._subRoot = subRoot) && (subRoot._componentHost = afterNode);

      diffSubRoot(tasker, beforeNode, afterNode, beforeNode._subRoot, afterNode._subRoot);
      break;
    }
  }

  return;
}

function diffChildren(tasker, prevParent, parent, beforeNodes, afterNodes) {
  const isBeforeNodeReused = new Array(beforeNodes.length);
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

    // update #_nextSibling and #_parent
    if (a_i > 0) afterNodes[a_i - 1]._nextSibling = a_k;
    a_k._parent = parent;

    let b_i = beforeNodes.findIndex((n, i) => !isBeforeNodeReused[i] && isNodeDiffable(n, a_k));
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
      isBeforeNodeReused[b_i] = true;
    }
  }

  setAfterNextBeforeIndexOfTheLastInsertRecord(null); // null stands for the last one.

  // update #_nextSibling
  if (afterNodes.length > 0) afterNodes[afterNodes.length - 1]._nextSibling = null;

  // unmount the un-used nodes
  for (let b_i = 0; b_i < beforeNodes.length; b_i++) {
    if (isBeforeNodeReused[b_i]) continue;
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
  if (a.type === 'COMPONENT_FUNCTIONAL' && a.tag !== b.tag) return false;
  return true;
}

export function isNotEntityNode(node) {
  return (
    node.type === 'FRAGMENT' ||
    node.type === 'PROTAL' ||
    node.type === 'COMPONENT_FUNCTIONAL' ||
    node.type === 'COMPONENT_STATEFUL'
  );
}

export function isEntityNode(node) {
  return !isNotEntityNode(node);
}

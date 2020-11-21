import classnames from 'classnames';
import { applyTasker, createDOMOperationTasker } from './tasker';
import { removeEntity, insertEntity } from './vop';
import { generateUID, getChildOrSubRootOrMountingNode, isNullOrUndef } from './toolkit';

export function mount(vnode, elem) {
  // clear the original element contains
  elem.innerHTML = '';
  return refresh(null, vnode, elem);
}

export function refresh(prevnode, vnode, elem) {
  const constructMountingHostNode = (el, vnode) => {
    const hackedParentVNode = {
      _isVNode: true,
      type: 'MOUNTING_HOST_ELEMENT',
      _el: el,
      _uid: 0,
      _subRoot: vnode,
    };
    return hackedParentVNode;
  };

  const beforeMountingHostNode = constructMountingHostNode(elem, prevnode);
  const afterMountingHostNode = constructMountingHostNode(elem, vnode);

  const tasker = createDOMOperationTasker();

  diffSubRoot(
    tasker,
    beforeMountingHostNode,
    afterMountingHostNode,
    beforeMountingHostNode._subRoot,
    afterMountingHostNode._subRoot
  );

  applyTasker(tasker);
}

function mountChild(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  console.assert(beforeIndex < 0);
  const node = getChildOrSubRootOrMountingNode(beforeIndex, null, mountingSet);

  node._uid = generateUID();
  node._parent = afterParent;

  // beforeParent might be null
  console.assert(
    afterNextBeforeIndex === null || afterNextBeforeIndex < 0 || (afterNextBeforeIndex >= 0 && beforeParent)
  );
  const refNode =
    afterNextBeforeIndex === null
      ? null
      : getChildOrSubRootOrMountingNode(afterNextBeforeIndex, beforeParent, mountingSet);
  mountNode(tasker, afterParent, node, refNode);
}

function mountNode(tasker, upper /* parent or host */, node, ref) {
  switch (node.type) {
    case 'ELEMENT': {
      insertEntity(tasker, upper, node, ref, -1);

      if (!isNullOrUndef(node.class) && node.class !== '') {
        tasker.enqueue({ type: 'setProp', node, name: 'className', value: classnames(node.class) });
      }

      for (const name in node.attrs) {
        tasker.enqueue({ type: 'setAttr', node, name, value: node.attrs[name] });
      }

      mountChildren(tasker, null, node);
      break;
    }
    case 'TEXT': {
      insertEntity(tasker, upper, node, ref, -1);
      break;
    }
    case 'FRAGMENT': {
      node._el = null; // the fragment node is linked to no DOM entity
      mountChildren(tasker, null, node);
      break;
    }
    case 'COMPONENT_FUNCTIONAL': {
      const subRoot = node.tag(node.props);
      mountSubRoot(tasker, null, node, null, subRoot);
      break;
    }
    case 'COMPONENT_STATEFUL': {
      const componentProps = node.props;
      // initialize a component instance
      const inst = (node._inst = new node.tag());
      inst._node = node;
      inst.props = componentProps;
      // get the node tree
      const subRoot = inst.render();

      mountSubRoot(tasker, null, node, null, subRoot);
      break;
    }
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
  }
  if (childNodes.length > 0) {
    childNodes[childNodes.length - 1]._nextSibling = null;
  }

  for (let i = childNodes.length - 1, lastIndex = null; i >= 0; lastIndex = i--) {
    mountChild(tasker, beforeParent, childNodes, afterParent, ~i, i, lastIndex === null ? lastIndex : ~lastIndex);
  }
}

function unmountChildren(tasker, beforeParent) {
  const node = beforeParent;
  // recursively remove all of its children
  for (let i = 0; i < node.children.length; i++) {
    unmountChild(tasker, node, null, null, i);
  }
}

function moveChild(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex, afterNextBeforeIndex) {
  console.assert(beforeIndex >= 0);
  const beforeNode = getChildOrSubRootOrMountingNode(beforeIndex, beforeParent);
  const afterNode = getChildOrSubRootOrMountingNode(afterIndex, afterParent, null);
  afterNode._parent = afterParent;

  switch (beforeNode.type) {
    case 'ELEMENT':
    case 'TEXT': {
      const refNode =
        afterNextBeforeIndex === null
          ? null
          : getChildOrSubRootOrMountingNode(afterNextBeforeIndex, beforeParent, mountingSet);
      insertEntity(tasker, afterParent, beforeNode, refNode, beforeIndex);
      break;
    }
    case 'FRAGMENT': {
      console.assert(beforeNode.type === 'FRAGMENT' && afterNode.type === 'FRAGMENT');

      for (let i = beforeNode.children.length - 1, lastIndex = null; i >= 0; lastIndex = i--) {
        // insert each child of this fragment one by one
        moveChild(tasker, beforeNode, [], afterNode, i, i, lastIndex);
      }
      break;
    }
    case 'COMPONENT_FUNCTIONAL': {
      console.assert(beforeNode.type === 'COMPONENT_FUNCTIONAL' && afterNode.type === 'COMPONENT_FUNCTIONAL');
      // TODO to call vdomInsert, instead of moveChild
      moveChild(tasker, beforeNode, [], afterNode, 0, 0, null);
      break;
    }
    case 'COMPONENT_STATEFUL': {
      console.assert(beforeNode.type === 'COMPONENT_STATEFUL' && afterNode.type === 'COMPONENT_STATEFUL');
      // TODO to call vdomInsert, instead of moveChild
      moveChild(tasker, beforeNode, [], afterNode, 0, 0, null);
      break;
    }
    default:
      break;
  }
}

function unmountChild(tasker, beforeParent, mountingSet, afterParent, beforeIndex) {
  console.assert(beforeIndex >= 0);
  // here, node is the current node that is the child of the parent node.
  const node = getChildOrSubRootOrMountingNode(beforeIndex, beforeParent);

  unmountNode(tasker, beforeParent, node);
}

function unmountNode(tasker, upper /* parent or host */, node) {
  switch (node.type) {
    case 'ELEMENT': {
      // just simply delete this element and all of its children will go
      removeEntity(tasker, upper, node);
      break;
    }
    case 'TEXT': {
      removeEntity(tasker, upper, node);
      break;
    }
    case 'FRAGMENT': {
      unmountChildren(tasker, node);
      break;
    }
    case 'COMPONENT_FUNCTIONAL': {
      unmountSubRoot(tasker, node, null, node._subRoot, null);
      break;
    }
    case 'COMPONENT_STATEFUL': {
      unmountSubRoot(tasker, node, null, node._subRoot, null);
      break;
    }
    default:
      break;
  }
}

function diffChild(tasker, beforeParent, mountingSet, afterParent, beforeIndex, afterIndex) {
  console.assert(afterIndex >= 0);

  diffNode(
    tasker,
    getChildOrSubRootOrMountingNode(beforeIndex, beforeParent, mountingSet),
    getChildOrSubRootOrMountingNode(afterIndex, afterParent, null)
  );
}

function diffNode(tasker, beforeNode, afterNode) {
  // the diff operation is only avaliable for two nodes with the same node type
  console.assert(beforeNode.type === afterNode.type);
  const nodeType = beforeNode.type;

  // copy the meta data
  afterNode._uid = beforeNode._uid;

  // There are two steps for diffing a node:
  //   1) diff itself - attrs and dom props for element/text nodes, or sub root for component nodes
  //   2) diff its children (if exist)

  switch (nodeType) {
    case 'ELEMENT': {
      console.assert(beforeNode.tag === afterNode.tag);
      afterNode._el = beforeNode._el;
      // FUTURE: diff on its attrs and dom props, etc.
      // diff its children nodes
      diffChildren(tasker, beforeNode, afterNode, beforeNode.children, afterNode.children);
      break;
    }
    case 'TEXT': {
      console.assert(beforeNode._el);
      console.assert(beforeNode._el.textContent === beforeNode.text);
      afterNode._el = beforeNode._el;

      // diff its text content in dom
      if (beforeNode.text !== afterNode.text) {
        tasker.enqueue({ type: 'updateTextContent', selfNode: afterNode });
      }

      // the text node has no child
      break;
    }
    case 'FRAGMENT': {
      // the fragment node has no its own prop, so just diff its children
      diffChildren(tasker, beforeNode, afterNode, beforeNode.children, afterNode.children);
      break;
    }
    case 'COMPONENT_FUNCTIONAL': {
      console.assert(beforeNode._subRoot !== undefined);
      console.assert(beforeNode.tag === afterNode.tag);

      // re-generate the new sub root node, and then diff it.
      const subRoot = afterNode.tag(afterNode.props);
      diffSubRoot(tasker, beforeNode, afterNode, beforeNode._subRoot, subRoot);
      break;
    }
    case 'COMPONENT_STATEFUL': {
      console.assert(beforeNode._inst._isComponentInst);
      const componentProps = afterNode.props;

      // reuse the previous component instance for the afterNode.
      const inst = (afterNode._inst = beforeNode._inst);
      console.assert(inst._node === beforeNode);
      inst._node = afterNode;
      inst.props = componentProps;

      // re-generate the new sub-root node, and then diff it.
      const subRoot = inst.render(componentProps);
      diffSubRoot(tasker, beforeNode, afterNode, beforeNode._subRoot, subRoot);
      break;
    }
    default:
      break;
  }
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

    let b_i = beforeNodes.findIndex((n, i) => !isBeforeNodeReused[i] && isNodeDiffable(n, a_k));
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
      // afterNextBeforeIndex is unknown now.
      a_k._parent = parent;
      diffChild(tasker, prevParent, null, parent, b_i, a_i, undefined);
      isBeforeNodeReused[b_i] = true;
    }
  }

  setAfterNextBeforeIndexOfTheLastInsertRecord(null); // null stands for the last one.

  // update #_nextSibling
  if (afterNodes.length > 0) afterNodes[afterNodes.length - 1]._nextSibling = null;

  // unmount the un-used nodes
  for (let b_i = 0; b_i < beforeNodes.length; b_i++) {
    if (isBeforeNodeReused[b_i]) continue;
    unmountChild(tasker, prevParent, mountingSet, parent, b_i, undefined, undefined);
  }

  const sortedChildInsertRecord = childInsertRecord.sort((a, b) => b.afterIndex - a.afterIndex);
  for (const r of sortedChildInsertRecord) {
    if (r.beforeIndex < 0) {
      mountChild(tasker, prevParent, mountingSet, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    } else {
      moveChild(tasker, prevParent, mountingSet, parent, r.beforeIndex, r.afterIndex, r.afterNextBeforeIndex);
    }
  }
}

function mountSubRoot(tasker, beforeHost, afterHost, beforeSubRoot, afterSubRoot) {
  console.assert(beforeSubRoot === null);
  afterHost._subRoot = afterSubRoot; // link sub-root
  if (afterSubRoot === null) return; // when this host has no sub-root

  const root = afterSubRoot,
    host = afterHost;

  root._uid = generateUID();
  root._componentHost = host;

  mountNode(tasker, host, root, null);
}

function unmountSubRoot(tasker, beforeHost, afterHost, beforeSubRoot, afterSubRoot) {
  console.assert(afterSubRoot === null);
  const root = beforeSubRoot,
    host = beforeHost;

  unmountNode(tasker, host, root);

  // finally remove the sub-root link
  if (afterHost) afterHost._subRoot = null;
}

// eslint-disable-next-line
function moveSubRoot() {
  // Emm... There is no so-called "move sub-root"
}

export function diffSubRoot(tasker, beforeHost, afterHost, beforeSubRoot, afterSubRoot) {
  console.assert(beforeSubRoot === beforeHost._subRoot);

  if (beforeSubRoot && afterSubRoot && isNodeDiffable(beforeSubRoot, afterSubRoot)) {
    afterHost._subRoot = afterSubRoot;
    afterSubRoot._componentHost = afterHost;
    diffNode(tasker, beforeSubRoot, afterSubRoot);
  } else {
    if (beforeSubRoot) unmountSubRoot(tasker, beforeHost, null, beforeSubRoot, null);
    if (afterSubRoot) mountSubRoot(tasker, null, afterHost, null, afterSubRoot);
  }
}

/* Utils */

function isNodeDiffable(a, b) {
  if (a.type !== b.type) return false;
  if (a.key !== b.key) return false;
  if (a.type === 'ELEMENT' && a.tag !== b.tag) return false;
  if (a.type === 'COMPONENT_FUNCTIONAL' && a.tag !== b.tag) return false;
  if (a.type === 'COMPONENT_STATEFUL' && a.tag !== b.tag) return false;
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

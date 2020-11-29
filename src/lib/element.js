/**
 * Functions for patching the own props of element nodes,and mapping to operation to DOM node
 * including DOM props, attribute, event listeners, class name and style.
 */

import classnames from 'classnames';
import { isNullOrUndef } from './toolkit';

/* Some helper functions to free from adding task items manually */

function _setAttribute(tasker, node, name, value) {
  tasker.enqueue({ type: 'setAttr', node, name, value });
}

function _removeAttribute(tasker, node, name) {
  tasker.enqueue({ type: 'removeAttr', node, name });
}

function _setDOMProp(tasker, node, name, value) {
  tasker.enqueue({ type: 'setProp', node, name, value });
}

function _setStyleProperty(tasker, node, name, value) {
  tasker.enqueue({ type: 'setStyleProperty', node, name, value });
}

function _removeStyleProperty(tasker, node, name) {
  tasker.enqueue({ type: 'removeStyleProperty', node, name });
}

function _setStyleCssText(tasker, node, value) {
  tasker.enqueue({ type: 'setStyleCssText', node, value });
}

function _addEventListener(tasker, node, name, listener, options) {
  tasker.enqueue({ type: 'addEventListener', node, name, listener, options });
}

function _removeEventListener(tasker, node, name, listener, options) {
  tasker.enqueue({ type: 'removeEventListener', node, name, listener, options });
}

/* Patch style, class, DOM props, DOM attributes, etc. */

export function patchStyle(tasker, node, beforeStyle, afterStyle) {
  console.assert(node._el || (!node._el && !beforeStyle));

  if (beforeStyle === afterStyle) return;

  if (isNullOrUndef(afterStyle)) {
    if (!isNullOrUndef(beforeStyle)) _removeAttribute(tasker, node, 'style');
    return;
  }

  if (typeof afterStyle === 'string') {
    _setStyleCssText(tasker, node, afterStyle);
    return;
  }

  // now, afterStyle is an object
  if (isNullOrUndef(beforeStyle)) {
    let k;
    for (k in afterStyle) _setStyleProperty(tasker, node, k, afterStyle[k]);
  } else if (typeof beforeStyle === 'string') {
    _setStyleCssText(tasker, node, ''); // clear the stall style first
    let k;
    for (k in afterStyle) _setStyleProperty(tasker, node, k, afterStyle[k]);
  } else {
    // diff each property one by one if beforeStyle is also an object
    let k;
    for (k in afterStyle) {
      const a_k = afterStyle[k];
      if (beforeStyle[k] !== a_k) _setStyleProperty(tasker, node, k, a_k);
    }
    for (k in beforeStyle) {
      if (isNullOrUndef(afterStyle[k])) _removeStyleProperty(tasker, node, k);
    }
  }
}

export function patchClassName(tasker, node, beforeClass, afterClass) {
  if (beforeClass === afterClass) return;
  // TODO consider Element#classList for diffing
  _setDOMProp(tasker, node, 'className', classnames(afterClass));
}

export function patchEventList(tasker, node, beforeEventList, afterEventList) {
  if (beforeEventList === afterEventList) return;
  const isBeforeEventListNullOrUndef = isNullOrUndef(beforeEventList);
  const isAfterEventListNullOrUndef = isNullOrUndef(afterEventList);
  if (isBeforeEventListNullOrUndef && isAfterEventListNullOrUndef) return;

  const getEventOption = h => (typeof h === 'function' ? false : h);
  let n, bh, ah;

  /**
   * Each item of an EventList is either a handler function or an object
   * implementing both the EventListener interface and the option object
   * accepted by addEventListener or removeEventListener. For example:
   *     { handleEvent: Function, capture: false, once: false, passive: false }
   */

  if (isBeforeEventListNullOrUndef) {
    for (n in afterEventList) {
      ah = afterEventList[n];
      _addEventListener(tasker, node, n, ah, getEventOption(ah));
    }
  } else if (isAfterEventListNullOrUndef) {
    for (n in beforeEventList) {
      bh = beforeEventList[n];
      _removeEventListener(tasker, node, n, bh, getEventOption(bh));
    }
  } else {
    for (n in beforeEventList) {
      bh = beforeEventList[n];
      ah = afterEventList[n];
      if (bh !== ah) {
        if (bh) _removeEventListener(tasker, node, n, bh, getEventOption(bh));
        if (ah) _addEventListener(tasker, node, n, ah, getEventOption(ah));
      }
    }
    for (n in afterEventList) {
      bh = beforeEventList[n];
      ah = afterEventList[n];
      if (!bh) _addEventListener(tasker, node, n, ah, getEventOption(ah));
    }
  }
}

export function patchDOMProps(tasker, node, beforeProps, afterProps) {
  if (beforeProps === afterProps) return;
  if (!beforeProps && !afterProps) return;
  let k;

  if (!beforeProps) {
    for (k in afterProps) _setDOMProp(tasker, node, k, afterProps[k] ?? '');
    return;
  }

  if (!afterProps) {
    for (k in beforeProps) _setDOMProp(tasker, node, k, '');
    return;
  }

  // if (afterProps && beforeProps)
  for (k in beforeProps) {
    const beforeValue = beforeProps[k];
    const afterValue = afterProps[k];
    if (!isNullOrUndef(beforeValue) && isNullOrUndef(afterValue)) _setDOMProp(tasker, node, k, '');
  }
  for (k in afterProps) {
    const beforeValue = beforeProps[k];
    const afterValue = afterProps[k];
    if (beforeValue !== afterValue) _setDOMProp(tasker, node, k, afterValue ?? '');
  }
}

export function patchAttrs(tasker, node, beforeAttrs, afterAttrs) {
  if (beforeAttrs === afterAttrs) return;
  if (!beforeAttrs && !afterAttrs) return;
  let k, v;

  if (!beforeAttrs) {
    for (k in afterAttrs) (v = afterAttrs[k]) != null && _setAttribute(tasker, node, k, v);
    return;
  }

  if (!afterAttrs) {
    for (k in beforeAttrs) beforeAttrs[k] != null && _removeAttribute(tasker, node, k);
    return;
  }

  // diff the before and after attrs
  for (k in beforeAttrs) {
    if (beforeAttrs[k] != null && afterAttrs[k] == null) _removeAttribute(tasker, node, k);
  }
  for (k in afterAttrs) {
    if (beforeAttrs[k] !== (v = afterAttrs[k])) _setDOMProp(tasker, node, k, v);
  }
}

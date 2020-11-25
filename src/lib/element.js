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
  // TODO consider Element#classList for diffing
  if (!isNullOrUndef(afterClass) && afterClass !== '') {
    _setDOMProp(tasker, node, 'className', classnames(afterClass));
  }
}

export function patchEventList(tasker, node, beforeEventList, afterEventList) {
  const isBeforeEventListNullOrUndef = isNullOrUndef(beforeEventList);
  const isAfterEventListNullOrUndef = isNullOrUndef(afterEventList);
  if (isBeforeEventListNullOrUndef && isAfterEventListNullOrUndef) return;

  const getEventOption = h => (typeof h === 'function' ? false : h);
  let n, bh, ah;

  /**
   * Each item of an EventList is either a handler function or an object
   * implementing both the EventListener interface and the option list
   * accepted by addEventListener or removeEventListener. For example:
   *   { handleEvent: Function, capture: false, once: false, passive: false }
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

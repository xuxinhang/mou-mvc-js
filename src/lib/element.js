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

/* Patch style, class, DOM props, DOM attributes, etc. */

export function patchStyle(tasker, node, beforeStyle, afterStyle) {
  console.assert((node._el && beforeStyle) || (!node._el && !beforeStyle));

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
  // TODO use Element#classList for diffing
  if (!isNullOrUndef(afterClass) && afterClass !== '') {
    _setDOMProp(tasker, node, 'className', classnames(afterClass));
  }
}

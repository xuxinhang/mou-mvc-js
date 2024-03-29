import h, { Portal } from './h';
import { BaseComponent } from './component';

export { h };
export { h as createElement };

export const Frag = '__fragment__';
export const Fragment = Frag;
export { mount, refresh } from './core';
export { BaseComponent as Component };

export default {
  h: h,
  createElement: h,
  Frag,
  Fragment,
  Portal,
  // mount,
  // refresh,
};

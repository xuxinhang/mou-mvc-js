import h from './h';

export { h };
export { h as createElement };

export const Frag = '__fragment__';
export const Fragment = Frag;
export { mount, refresh } from './core';

export default {
  h: h,
  createElement: h,
  Frag,
  Fragment,
  // mount,
  // refresh,
};

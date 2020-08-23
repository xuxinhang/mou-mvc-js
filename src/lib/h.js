export const Fragment = Symbol('Fragment');
export const Protal = Symbol('Protal');

export default function createElement(tag, data = {}, children = null) {
  const base = {
    _isVNode: true,
    _el: null,
    type: null,
  };

  data = data ?? {};

  if (tag === Fragment || tag === '__fragment__') {
    Object.assign(base, {
      type: 'FRAGMENT',
      tag: Fragment,
      key: data?.key,
      children: normalizeChildren(children),
    });
  } else if (typeof tag === 'string') {
    Object.assign(base, {
      type: 'ELEMENT',
      tag,
      key: data?.key,
      class: data.class ?? undefined,
      style: data.style ?? undefined,
      attrs: {},
      domProps: {},
      on: {},
      children: normalizeChildren(children),
    });
  } else {
    Object.assign(base, {
      type: 'COMPONENT',
      tag,
      children: normalizeChildren(children),
    });
  }

  return base;
}

function normalizeChildren(children) {
  children = Array.isArray(children) ? children : children == null ? [] : [children];
  return children.map(normalizeVNode);
}

export function normalizeVNode(vnode) {
  if (typeof vnode === 'string') {
    return {
      _isVNode: true,
      _el: null,
      type: 'TEXT',
      text: vnode,
    };
  } else {
    return vnode;
  }
}

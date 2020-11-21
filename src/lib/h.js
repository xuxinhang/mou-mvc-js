export const Fragment = Symbol('Fragment');
export const Protal = Symbol('Protal');

export default function createElement(tag, data = {}, ...children) {
  // pre-process input parameters
  children = children.flat();
  data = data ?? {};

  const base = {
    _isVNode: true,
    _el: null,
    type: null,
    key: data?.key,
  };

  if (tag === Fragment || tag === '__fragment__') {
    Object.assign(base, {
      type: 'FRAGMENT',
      tag: Fragment,
      children: normalizeChildren(children),
    });
  } else if (typeof tag === 'string') {
    const events = {},
      attrs = {},
      domProps = {};

    for (const key in data) {
      if (key === 'class' || key === 'className' || key === 'style') continue;
      if (key.startsWith('on-')) {
        events[key.substr(3).toLowerCase()] = data[key];
      } else {
        attrs[key.toLowerCase()] = data[key];
      }
    }

    Object.assign(base, {
      type: 'ELEMENT',
      tag,
      class: data.class ?? data.className ?? undefined,
      style: data.style ?? undefined,
      attrs,
      domProps,
      on: events,
      children: normalizeChildren(children),
    });
  } else if (typeof tag === 'function') {
    if (tag.prototype && tag.prototype.render) {
      const { ...props } = data;
      Object.assign(base, {
        type: 'COMPONENT_STATEFUL',
        tag,
        props,
        children: {},
      });
    } else {
      const { ...props } = data;
      Object.assign(base, {
        type: 'COMPONENT_FUNCTIONAL',
        tag,
        props,
        children: {},
      });
    }
  } else {
    console.assert(false, 'unknown node type');
  }

  return base;
}

export function normalizeChildren(children) {
  children = Array.isArray(children) ? children : children == null ? [] : [children];
  return children.map(normalizeVNode);
}

export function normalizeVNode(vnode) {
  if (vnode === undefined || vnode === null) vnode = '';

  if (vnode._isVNode) {
    return vnode;
  } else {
    return {
      _isVNode: true,
      _el: null,
      type: 'TEXT',
      text: String(vnode),
    };
  }
}

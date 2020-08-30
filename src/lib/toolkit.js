export function isVNodeLinkedToDOMNode(vnode) {
  // for entity nodes, check #_el; for fragments, check #_host
  // return (vnode._el || vnode._host) && (vnode.children ?? []).every(c => isVNodeLinkedToDOMNode(c));
  return (
    (vnode._el || vnode.type === 'FRAGMENT') /* vnode._host */ &&
    (vnode.children ?? []).every(c => isVNodeLinkedToDOMNode(c))
  );
}

export function generateUID() {
  return ~~(Math.random() * 10000000);
}

export function generateIndexArray(n) {
  const arr = Array(n);
  for (let i = 0; i < n; i++) arr[i] = i;
  return arr;
}

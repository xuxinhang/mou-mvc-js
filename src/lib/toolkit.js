export function isVNodeLinkedToDOMNode(vnode) {
  return vnode._el && (vnode.children ?? []).every(c => isVNodeLinkedToDOMNode(c));
}

export function generateUID() {
  return ~~(Math.random() * 10000000);
}

export function generateIndexArray(n) {
  const arr = Array(n);
  for (let i = 0; i < n; i++) arr[i] = i;
  return arr;
}

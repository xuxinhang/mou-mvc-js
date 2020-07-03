export function isVNodeLinkedToDOMNode(vnode) {
  return (
    vnode._el && (vnode.children ?? []).every((c) => isVNodeLinkedToDOMNode(c))
  );
}

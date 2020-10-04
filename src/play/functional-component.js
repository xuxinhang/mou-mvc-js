import Mou, { h } from '$/lib';
import { mount, refresh } from '../lib/core';

const dataset = [
  { name: 'Apple Watch Series 6', desc: '健康的未来，现在戴上。' },
  { name: 'iPad Air', desc: '凭实力出彩。' },
  { name: 'Apple Watch SE', desc: '事事拿手，轻松入手。' },
  { name: '新款 iPad', desc: '特有本事，特超值。' },
  { name: 'iOS 14', desc: '这种新感觉，一点不陌生。' },
  { name: 'iPadOS', desc: '独家新可能，由 iPad 来打开。' },
  { name: 'watchOS 7', desc: '感觉一新，如日夜之别。' },
  { name: 'Apple Music', desc: '听起来，笑起来。' },
];

const target = document.querySelector('#zone');

function Product(props) {
  return (
    <Mou.Fragment>
      <dt>{props.name}</dt>
      <dd>{props.desc}</dd>
    </Mou.Fragment>
  );
}

function getTree(dataset) {
  return (
    <>
      <details>
        <summary>{dataset.length} Products total</summary>Designed by Apple in California.
      </details>
      <dl>
        {dataset.map(({ name, desc }) => (
          <Product key={name} name={name} desc={desc} />
        ))}
      </dl>
    </>
  );
}

function checkRenderResult(ref) {
  const checked = Array.from(target.getElementsByTagName('dt')).map(e => e.innerText);
  const isSame = checked.every((value, index) => {
    return value === ref[index];
  });
  if (isSame) {
    console.info('Render well.', ref);
  } else {
    console.error('Render Wrong: ', ref);
  }
  return isSame;
}

(function () {
  let lastTree = null;
  const newTree = Mou.h('__fragment__', null, Mou.h('dl'));
  mount(newTree, target);
  lastTree = newTree;

  setTimeout(() => {
    const tree = getTree(dataset.slice(0, 2));
    refresh(lastTree, tree, target);
    lastTree = tree;
    console.log(tree);
  }, 1000);

  setTimeout(() => {
    const tree = getTree(dataset.slice(0, 2).reverse());
    refresh(lastTree, tree, target);
    lastTree = tree;
    console.log(tree);
  }, 2000);

  // setTimeout(() => {
  //   const tree = getTree(dataset.slice(0, 2).reverse());
  //   refresh(lastTree, tree, target);
  //   lastTree = tree;
  // }, 2000);

  const tickBtn = document.querySelector('.tick-btn');

  tickBtn.addEventListener('click', () => {
    const list = dataset
      .concat([])
      .sort(() => Math.random() - 0.5)
      .slice(0, parseInt(Math.random() * dataset.length));
    const tree = getTree(list);
    refresh(lastTree, tree, target);
    lastTree = tree;
    checkRenderResult(list.map(item => item.name));
  });
})();

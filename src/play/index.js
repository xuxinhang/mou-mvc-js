// alert('Hello Parcel~');

import h from '$/lib/h';
import Component from '$/lib/component';
import { mount, refresh } from '$/lib/core';
import { isVNodeLinkedToDOMNode } from '$/lib/toolkit';

const get_vnode = () =>
  h('main', null, [
    h('h1', null, 'Hello'),
    h('p', { class: 'para' }, ['The power of', h('strong', null, 'Parcel'), ', a bundler.']),
    h('pre', { class: 'code-block' }, 'yarn add parcel --dev'),
  ]);

console.log(get_vnode());

class App extends Component {
  render() {
    return get_vnode();
  }
}

// eslint-disable-next-line
const vm = new App();

// mount(h('main', null, [h('section', { id: 'intro' }, null), h('section', { id: 'appr' }, null) ]), document.querySelector('#root'));

const wordLibrary = [
  'browser',
  'node',
  'commonjs',
  'worker',
  'mocha',
  // 'jasmine',
  // 'jest',
  // 'phantomjs',
  // 'protractor',
  // 'qunit',
  // 'jquery',
  // 'prototypejs',
  // 'shelljs',
  // 'meteor',
  // 'mongo',
  // 'applescript',
  // 'nashorn',
  // 'serviceworker',
  // 'atomtest',
  // 'embertest',
  // 'webextensions',
  // 'greasemonkey',
];

let lastVNode = null;

// lastVNode = h('main', null, [
//   h('section', { key: 'intro', id: 'intro' }, [
//     h('h1', null, 'Introduce to the new Surface Go.'),
//   ]),
//   h('section', { key: 'appr', id: 'appr' }, [
//     h('h1', null, ['The ', h('em', null, 'wonderful'), ' appearance.']),
//   ]),
// ]);
lastVNode = h('main', null, [
  h('section', { key: 'intro', id: 'intro' }, [h('h1', null, 'Introduce to the new Surface Go.')]),
  h('section', { key: 'feat', id: 'feat' }, [h('h1', null, 'Best Features!')]),
  h('section', { key: 'appr', id: 'appr' }, [h('h1', null, ['The wonderful appearance.'])]),
]);
mount(lastVNode, document.querySelector('#root'));

setTimeout(() => {
  const currentVNode = h('main', null, [
    h('section', { key: 'appr', id: 'appr' }, [h('h1', null, ['The wonderful appearance.'])]),
    h('section', { key: 'feat', id: 'feat' }, [h('h1', null, 'Best Features!')]),
    h('section', { key: 'intro', id: 'intro' }, [h('h1', null, 'Introduce to the new Surface Go.')]),
    h('section', { key: 'comment', id: 'comment' }, [h('h1', null, 'Good comments')]),
  ]);
  refresh(lastVNode, currentVNode, document.querySelector('#root'));
  console.log(currentVNode);
  lastVNode = currentVNode;
}, 1000);

window.toggleRefresh = () => {
  const words = [...wordLibrary].sort(() => Math.random() - 0.5).slice(0, ~~(Math.random() * wordLibrary.length));
  const nodes = words.map(w => h('section', { key: `${w}` }, h('h1', null, w)));
  const currentVNode = h('main', null, nodes);
  console.log(words);
  refresh(lastVNode, currentVNode, document.querySelector('#root'));

  const isWordSame = Array.from(document.querySelectorAll('#root section')).every(
    (node, index) => node.innerText === words[index]
  );

  if (!isVNodeLinkedToDOMNode(currentVNode)) {
    console.error('not all VNodeLinkedToDOMNode');
    console.error(currentVNode);
  } else if (!isWordSame) {
    console.error('Word Content error.');
  } else {
    console.info('Well done.');
  }
  console.log(currentVNode);
  lastVNode = currentVNode;
};

document.querySelector('#tick-btn').addEventListener('click', () => window.toggleRefresh());

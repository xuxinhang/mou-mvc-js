import h from './lib/h';
import { mount, refresh } from './lib/core';
import { isVNodeLinkedToDOMNode } from './lib/toolkit';

const database = [
  {
    name: 'Surface Pro X',
    desc: '拥有 LTE 连接功能和 13 英寸窄边框触控屏的二合一笔记本电脑',
  },
  {
    name: '超强配件',
    desc: '使用强大且高效的工具完善您的体验',
  },
  {
    name: 'Surface Go 2',
    desc: '最小最轻的 Surface, 配备 10.5 英寸触控屏',
  },
  {
    name: 'Surface Headphones 2',
    desc: '震撼的音效、佩戴舒适和主动降噪',
  },
  {
    name: 'Surface Laptop 3',
    desc: '纤巧时尚，13.5 英寸或 15 英寸触控屏',
  },
  {
    name: 'Surface Pro 7',
    desc: '12.3 英寸触控屏，具有平板电脑到笔记本电脑的多种工作模式',
  },
  {
    name: 'Surface Book 3',
    desc: '我们功能最强大的 13.5 英寸或 15 英寸触摸屏笔记本',
  },
  {
    name: 'Surface Studio 2',
    desc: '28 英寸触控屏色彩绚丽，搭配强劲独立显卡',
  },
];

function getVTree(items) {
  const vtree = h(
    'dl',
    null,
    items.map(t =>
      h(
        '__fragment__',
        {
          key: t.name,
        },
        [h('dt', null, t.name), h('dd', null, t.desc), h('meter')]
      )
    )
  );
  return vtree;
}

const target = document.querySelector('#ep-dl .zone');

let new_vtree = h('dl', null);
mount(new_vtree, target);
let last_vtree = new_vtree;

new_vtree = getVTree([database[0], database[2]]);
refresh(last_vtree, new_vtree, target);
last_vtree = new_vtree;

setTimeout(() => {
  new_vtree = getVTree([database[2], database[0]]);
  refresh(last_vtree, new_vtree, target);
  console.log(last_vtree, new_vtree);
  last_vtree = new_vtree;
}, 1000);

document.querySelector('#ep-dl .tick-btn').addEventListener('click', function () {
  const items = database
    .map(t => ({ ...t, num: ~~(Math.random() * 100000) }))
    .sort((a, b) => a.num - b.num)
    .slice(0, ~~(Math.random() * database.length));

  const vtree = getVTree(items);
  refresh(last_vtree, vtree, target);

  const isWordSame = Array.from(target.querySelectorAll('dt')).every((node, index) => {
    return node.innerText === items[index]?.name;
  });
  if (!isWordSame) {
    console.error('Word Wrong');
    console.error(items.map(t => t.name));
  } else {
    console.info('Well done');
    console.info(items.map(t => t.name));
  }

  if (!isVNodeLinkedToDOMNode(vtree)) {
    console.error('isVNodeLinkedToDOMNode');
    console.error(vtree);
  }

  last_vtree = vtree;
});

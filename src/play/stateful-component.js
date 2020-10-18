import Mou, { Component } from '$/lib';
import { mount, refresh } from '../lib/core';

const dataset = [
  {
    name: 'Word',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-wcus-prod/sc/fe/f96f7b.svg',
  },
  {
    name: 'Excel',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-wcus-prod/sc/3f/e5fedc.svg',
  },
  {
    name: 'PowerPoint',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-wcus-prod/sc/24/c165a0.svg',
  },
  {
    name: 'OneNote',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-wcus-prod/sc/d0/e0ac9e.svg',
  },
  {
    name: 'Outlook',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-wcus-prod/sc/2f/33e52d.svg',
  },
  {
    name: 'Access',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-wcus-prod/sc/88/d1168f.svg',
  },
  {
    name: 'Publisher',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/e2/337aae.svg',
  },
  {
    name: 'Exchange',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/42/45a960.svg',
  },
  {
    name: 'OneDrive',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/f1/693c70.svg',
  },
  {
    name: 'Teams',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/24/b4ded9.svg',
  },
  {
    name: 'SharePoint',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/8b/203ea2.svg',
  },
  {
    name: 'Yammer',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/e3/8609c0.svg',
  },
  {
    name: 'Stream',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/98/dea254.svg',
  },
  {
    name: 'Sway',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/3f/7b96f7.svg',
  },
  {
    name: 'Power Apps',
    icon: 'https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4G435',
  },
  {
    name: 'Power Automate',
    icon: 'https://query.prod.cms.rt.microsoft.com/cms/api/am/binary/RE4FYO0',
  },
  {
    name: 'Power Virtual Agents',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/3f/dbf110.svg',
  },
  {
    name: 'Forms',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/36/c07240.svg',
  },
  {
    name: 'Planner',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/7f/a513ed.svg',
  },
  {
    name: 'To-Do',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/ef/8bbe85.svg',
  },
  {
    name: 'Visio',
    icon: 'https://www.microsoft.com/onerfstatics/marketingsites-eas-prod/sc/d1/f2e376.svg',
  },
];

const target = document.querySelector('#zone');

function Product(props) {
  return (
    <li>
      <picture>
        <img srcSet={props.icon} />
      </picture>
      <span>{props.name}</span>
    </li>
  );
}

class ProductPlus extends Component {
  constructor() {
    super();
    this.state = {};
  }

  render(props) {
    // const props = this.props;
    return (
      <li>
        <picture>
          <img srcSet={props.icon} />
        </picture>
        <span>{props.name}</span>
      </li>
    );
  }
}

function getTree(dataset) {
  return (
    <>
      <h2>
        <img srcSet="https://blobs.officehome.msocdn.com/versionless/webmanifestimages/OfficeDesktop_256.png" />
        Office 365
      </h2>
      <ul>
        {dataset.map(({ name, icon }) => (
          <ProductPlus key={name} name={name} icon={icon} />
        ))}
      </ul>
    </>
  );
}

function patchDataset(dataset, lastDataset = []) {
  return dataset.map(item => ({
    ...item,
    count: (lastDataset.find(i => i.name === item.name)?.count ?? 0) + 1,
  }));
}

function checkRenderResult(ref) {
  const checked = Array.from(target.querySelectorAll('li span')).map(e => e.innerText);
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
  let lastDataset = [];
  const newTree = Mou.h('__fragment__', null, Mou.h('ul'));
  mount(newTree, target);
  lastTree = newTree;

  setTimeout(() => {
    const currentDataset = patchDataset(dataset.slice(0, 1), lastDataset);
    const tree = getTree(currentDataset);
    refresh(lastTree, tree, target);
    lastTree = tree;
    lastDataset = currentDataset;
  }, 1000);

  setTimeout(() => {
    const currentDataset = patchDataset(dataset.slice(0, 2).reverse(), lastDataset);
    const tree = getTree(currentDataset);
    refresh(lastTree, tree, target);
    lastTree = tree;
    lastDataset = currentDataset;
  }, 2000);

  const tickBtn = document.querySelector('.tick-btn');

  tickBtn.addEventListener('click', () => {
    const list = patchDataset(
      dataset
        .concat([])
        .sort(() => Math.random() - 0.5)
        .slice(0, parseInt(Math.random() * dataset.length)),
      lastDataset
    );
    const tree = getTree(list);
    refresh(lastTree, tree, target);
    lastTree = tree;
    lastDataset = list;

    checkRenderResult(list.map(item => item.name));
  });
})();

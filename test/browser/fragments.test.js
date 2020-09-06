// import { setupRerender } from 'preact/test-utils';
import Mou, { mount /* render, Component, */ } from 'mou';
import { setupScratch, teardown } from './utils';
// import { logCall, /* clearLog */ getLog } from '../_util/logCall';

function render(...args) {
  return mount(...args);
}

const Fragment = Mou.Fragment;

function clearLog() {
  // do nothing
}

/** @jsx Mou.h */
/* eslint-disable react/jsx-boolean-value */

describe('Fragment', () => {
  let expectDomLog = false;

  /** @type {HTMLDivElement} */
  let scratch;

  /** @type {() => void} */
  // let rerender;

  // let ops = [];

  function expectDomLogToBe(/* expectedOperations, message */) {
    if (expectDomLog) {
      // expect(getLog()).to.deep.equal(expectedOperations, message);
    }
  }

  // class Stateful extends Component {
  //   componentDidUpdate() {
  //     ops.push('Update Stateful');
  //   }
  //   render() {
  //     return <div>Hello</div>;
  //   }
  // }

  before(() => {
    // logCall(Node.prototype, 'insertBefore');
    // logCall(Node.prototype, 'appendChild');
    // logCall(Node.prototype, 'removeChild');
    // logCall(CharacterData.prototype, 'remove');
    // TODO: Consider logging setting set data
    // ```
    // var orgData = Object.getOwnPropertyDescriptor(CharacterData.prototype, 'data')
    // Object.defineProperty(CharacterData.prototype, 'data', {
    // 	...orgData,
    // 	get() { return orgData.get.call(this) },
    // 	set(value) { console.log('setData', value); orgData.set.call(this, value); }
    // });
    // ```
  });

  beforeEach(() => {
    scratch = setupScratch();
    // rerender = setupRerender();
    // ops = [];

    clearLog();
  });

  afterEach(() => {
    teardown(scratch);
  });

  it('should not render empty Fragment', () => {
    render(<Fragment />, scratch);
    expect(scratch.innerHTML).to.equal('');
  });

  it('should render a single child', () => {
    clearLog();
    render(
      <Fragment>
        <span>foo</span>
      </Fragment>,
      scratch
    );

    expect(scratch.innerHTML).to.equal('<span>foo</span>');
    expectDomLogToBe(['<span>.appendChild(#text)', '<div>.appendChild(<span>foo)']);
  });

  it('should render multiple children via noop renderer', () => {
    render(
      <Fragment>
        hello <span>world</span>
      </Fragment>,
      scratch
    );

    expect(scratch.innerHTML).to.equal('hello <span>world</span>');
  });

  it('should not crash with null as last child', () => {
    let fn = () => {
      render(
        <Fragment>
          <span>world</span>
          {null}
        </Fragment>,
        scratch
      );
    };
    expect(fn).not.to.throw();
    expect(scratch.innerHTML).to.equal('<span>world</span>');

    render(
      <Fragment>
        <span>world</span>
        <p>Hello</p>
      </Fragment>,
      scratch
    );
    expect(scratch.innerHTML).to.equal('<span>world</span><p>Hello</p>');

    expect(fn).not.to.throw();
    expect(scratch.innerHTML).to.equal('<span>world</span>');

    render(
      <Fragment>
        <span>world</span>
        {null}
        <span>world</span>
      </Fragment>,
      scratch
    );
    expect(scratch.innerHTML).to.equal('<span>world</span><span>world</span>');

    render(
      <Fragment>
        <span>world</span>
        Hello
        <span>world</span>
      </Fragment>,
      scratch
    );
    expect(scratch.innerHTML).to.equal('<span>world</span>Hello<span>world</span>');
  });
});

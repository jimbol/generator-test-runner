var assert = require('assert');
var genRunner = require('../src');

describe('genRunner', () => {
  let sampleGenerator;

  beforeEach(() => {
    sampleGenerator = function* (args) {
      const a = yield { args };
      yield a.other;
      return args;
    }
  });

  it('returns an object', () => {
    const runner = genRunner(sampleGenerator);
    assert.equal(typeof runner, 'object');
  });

  it('returns `next` method', () => {
    const runner = genRunner(sampleGenerator);
    assert.equal(typeof runner.next, 'function');
  });

  it('returns `run` method', () => {
    const runner = genRunner(sampleGenerator);
    assert.equal(typeof runner.run, 'function');
  });

  describe('next', () => {
    it('adds a step for second `next`', () => {
      const run = genRunner(sampleGenerator)
        .next('init')
        .next('a')
        .run();
      assert(run.a);
      assert(!run.init);
    });

    it('accepts arguments in first `next`', () => {
      const myArgs = [1, 2, 3];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a')
        .run();

      assert.equal(run.a.value.args, myArgs);
    });

    it('accepts yielded value in other `next`s', () => {
      const myArgs = [1, 2, 3];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' })
        .next('other')
        .run();

      assert.equal(run.other.value, 'a value');
    });

    it('also stores the return value', () => {
      const myArgs = [1, 2, 3];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' })
        .next('other')
        .next('returnVal')
        .run();

      assert.equal(run.returnVal.value, myArgs);
      assert.equal(run.returnVal.done, true);
    });

    it('allows partial runs', () => {
      const myArgs = [1, 2, 3];
      const runner = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' });

      runner.run();

      const run = runner
        .next('other')
        .next('returnVal')
        .run();

      assert.equal(run.returnVal.done, true);
    });

    it('throws error when too many steps are passed', () => {
      try {
        const myArgs = [1, 2, 3];
        const run = genRunner(sampleGenerator)
          .next('init', myArgs)
          .next('a', { other: 'a value' })
          .next('other')
          .next('returnVal')
          .next('ERROR')
          .run();
      } catch (error) {
        assert.equal(error, "Error: Attempting to call 'ERROR', generator runner is already done");
      }
    });
  });

  describe('run', () => {
    it('allows overrides to be passed', () => {
      const myArgs = [1, 2, 3];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' })
        .next('other')
        .next('returnVal')
        .run({
          a: { other: 'a different value' },
        });

      assert.equal(run.other.value, 'a different value')
    });
  });
});

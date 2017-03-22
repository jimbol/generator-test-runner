var deepEqual = require('deep-equal');
var assert = require('assert');
var genRunner = require('../src');

describe('genRunner', () => {
  let sampleGenerator;

  beforeEach(() => {
    sampleGenerator = function* (args, extraArg) {
      const a = yield { args };
      const b = yield { extraArg };
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

  it('returns `snapshot` method', () => {
    const runner = genRunner(sampleGenerator);
    assert.equal(typeof runner.snapshot, 'function');
  });

  describe('next', () => {
    it('adds a step for second `next`', () => {
      const run = genRunner(sampleGenerator)
        .next('init')
        .next('a')
        .next('b')
        .run();
      assert(run.get('a'));
    });

    it('accepts arguments in first `next`', () => {
      const myArgs = [1, 2, 3];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a')
        .next('b')
        .run();

      assert.equal(run.get('a').value.args, myArgs);
    });

    it('accepts overrides for first `next`', () => {
      const myArgs = [1, 2, 3];
      const myOverrides = [3, 2, 1];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a')
        .next('b')
        .run({
          init: [myOverrides],
        });

      assert.equal(run.get('a').value.args, myOverrides);
    });

    it('accepts yielded value in other `next`s', () => {
      const myArgs = [1, 2, 3];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' })
        .next('b')
        .next('other')
        .run();

      assert.equal(run.get('other').value, 'a value');
    });

    it('also stores the return value', () => {
      const myArgs = [1, 2, 3];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' })
        .next('b')
        .next('other')
        .next('returnVal')
        .run();

      assert.equal(run.get('returnVal').value, myArgs);
      assert.equal(run.get('returnVal').done, true);
    });

    it('allows partial runs', () => {
      const myArgs = [1, 2, 3];
      const runner = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' });

      runner.run();

      const run = runner
        .next('b')
        .next('other')
        .next('returnVal')
        .run();

      assert.equal(run.get('returnVal').done, true);
    });

    it('throws error when too many steps are passed', () => {
      try {
        const myArgs = [1, 2, 3];
        const run = genRunner(sampleGenerator)
          .next('init', myArgs)
          .next('a', { other: 'a value' })
          .next('b')
          .next('other')
          .next('returnVal')
          .next('ERROR')
          .run();
      } catch (error) {
        assert.equal(error, "Error: Attempting to call 'ERROR', generator runner is already done");
      }
    });
  });

  describe('match', () => {
    let toggle = true;
    let myArgs;
    let myOtherArgs;
    let run;

    beforeEach(() => {
      myArgs = [1, 2, 3];
      myOtherArgs = [2, 3, 4];
      run = genRunner(sampleGenerator)
        .match('b', (step) => {
          return deepEqual(step.value, { extraArg: myOtherArgs });
        }, () => { other: 'b value' })
        .next('init', myArgs, myOtherArgs)
        .next('a', { other: 'a value' })
        .next('other')
        .next('returnVal')
        .run();
    });

    it('sets match name to an array', () => {
      assert.equal(Array.isArray(run.get('b')), true);
    });

    it('stores matched value in the array', () => {
      assert.equal(run.get('b')[0].value.extraArg, myOtherArgs)
    });
  });

  describe('snapshot', () => {
    it('allows overrides to be passed', () => {
      const myArgs = [1, 2, 3];
      const runner = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' })
        .next('b')
        .next('other')
        .next('returnVal');

      const snapshot = runner.snapshot();

      assert.deepEqual(snapshot, runner.run().output);
    });
  });

  describe('run', () => {
    it('allows overrides to be passed', () => {
      const myArgs = [1, 2, 3];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs)
        .next('a', { other: 'a value' })
        .next('b')
        .next('other')
        .next('returnVal')
        .run({
          a: { other: 'a different value' },
        });

      assert.equal(run.get('other').value, 'a different value')
    });

    it('accepts multiple arguments into init', () => {
      const myArgs = [1, 2, 3];
      const myOtherArgs = [2, 3, 4];
      const run = genRunner(sampleGenerator)
        .next('init', myArgs, myOtherArgs)
        .next('a', { other: 'a value' })
        .next('b', { other: 'b value' })
        .next('other')
        .next('returnVal')
        .run({
          a: { other: 'a different value' },
        });

      assert.equal(run.get('b').value.extraArg, myOtherArgs)
    });
  });
});

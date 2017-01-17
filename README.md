# Generator Test Runner
A [generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) test runner for any test runner.  It was originally designed for use with [redux-saga](https://github.com/yelouafi/redux-saga), but will work with any generators.

## Goals
- Switching the order of steps should be easy
- Associate steps with their results
- Changing step results should be easy

## Install
Either
```
npm install generator-test-runner --save-dev
```
or
```
yarn add generator-test-runner --dev
```

## Guide
Generator Test Runner allows you to test generators by

1. Defining each step a generator will take
2. Running the generator with each step
3. Storing the yielded values of each step

### Step By Step
#### Define Generator
Lets start with a generator.  This one is a [redux-saga](https://github.com/redux-saga/redux-saga) effect.
```es6
export function* getFoos(action) {
  const token = yield select(getToken);
  const response = yield call(fetchFoos, action.bars, token);
  yield put(handleResponse(response));
}
```

#### Example runner
In our mocha tests, we can stub a run like so.  Its good to see it all together up front.
```es6
import genRunner from 'generator-test-runner';

let action = {};
let token = 'abc-123';
const response = {};

beforeEach(() => {
  run = genRunner(getFoos)
    .next('init', action)
    .next('getToken', token)
    .next('fetchFoos', response)
    .next('finish')
    .run();
});
```
#### Init Generator Runner
First we pass the generator into the runner
```es6
genRunner(getFoos)
```

#### Invoking Generator
The first step after invoking `genRunner` represents the invocation of the generator itself.
```es6
genRunner(getFoos)
  .next('init', initialArgs)
```
This is like calling `getFoos(initialArgs)`.

#### Defining Steps
After that we define each step, giving each a name and result (if needed).
```es6
runner.next('getToken', token)
```

The last step will be the final yield.
```es6
runner.next('finish');
```

#### Running the Runner
Once you are ready to test, `run` the runner.
```es6
run = runner.run();
```

### Asserting
In our tests we can assert against pieces of the run
```es6
expect(run.get('getToken').value).to.deep.equal(select(getToken));
expect(run.get('fetchFoos').value).to.deep.equal(call(fetchFoos, action.bars, token));
```

### Forking
We can define a base generator runner, then fork using `context`s' `beforeEach` functions.

First, define the consistent steps, then build on the initial runner in subsequent `beforeEach` statements
```es6
describe('my generator', () => {
  let initialRunner;
  beforeEach(() => {
    // step1, step2, and step3 always need to be run
    // they will run beforeEach test
    initialRunner = genRunner(myGenerator)
      .next('step1')
      .next('step2')
      .next('step3', false);
  });

  context('when step3 returns true', () => {
    let run;
    beforeEach(() => {
      run = initialRunner
        .next('returnsEarly')
        .run({ step3: true });
    });

    it('returns early', () => {
      expect(run.get('returnsEarly').done).to.be.true;
    });
  });

  context('when step3 returns false', () => {
    let run;
    beforeEach(() => {
      run = initialRunner
        .next('step4')
        .next('finish')
        .run();
    });

    it('finishes', () => {
      expect(run.get('finishes').done).to.be.true;
    });
  });
});
```
## Overwriting variables
Just pass in overrides for a given action when you call `run`.
```es6
run = runner.run({
  getToken: 'invalid-token',
});
```

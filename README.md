# Generator Test Runner
A generator test runner for Mocha.  Designed for use with [redux-saga](https://github.com/yelouafi/redux-saga) but will work with any generators.

## Goals
- Switching the order of instructions should be easy
- Associate instructions with their results
- Changing instruction results should be easy

## Guide

### Step By Step
#### Define Effect
Lets start with a basic effect.
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
expect(run.getToken.value).to.deep.equal(select(getToken));
expect(run.fetchFoos.value).to.deep.equal(call(fetchFoos, action.bars, token));
```

## Overwriting variables
Just pass in overrides for a given action when you call `run`.
```es6
run = runner.run({
  getToken: 'invalid-token',
});
```

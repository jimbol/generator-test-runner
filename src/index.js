module.exports = function genRunner(generator) {
  const steps = [];
  const matches = [];

  const snapshot = function (...args) {
    return run(...args).output;
  };

  const next = function (name, ...value) {
    steps.push({ name, value });
    return { match, next, run, snapshot };
  };

  const match = function (name, tryMatch, value) {
    matches.push({
      name,
      value,
      fn: (output, match) => {
        if (tryMatch(output)) {
          return true;
        }

        return false;
      }
    });

    return { match, next, run, snapshot };
  };


  const run = function (overrides = {}) {
    let g;
    const matchOutput = {};
    const stepOutput = {};
    let prevValue;
    let alreadyDone = false;
    let i = 0;

    while (true) {
      const step = steps[i];
      if (!step) break;

      const { name, value } = step;

      if (!g) {
        g = generator.apply(null, overrides[name] || value);
        i++;
        continue;
      }

      if (alreadyDone) {
        throw new Error(`Attempting to call '${name}', generator runner is already done`);
      }

      const output = g.next.apply(g, prevValue);

      const matchedStep = matches.find((match) => {
        if (match.fn(output)) {
          matchOutput[match.name] = matchOutput[match.name] || [];
          matchOutput[match.name].push(output)
          return true;
        }

        return false;
      });


      if (!matchedStep) {
        stepOutput[name] = output;
        prevValue = (overrides[name]) ? [overrides[name]] : value;
        i++;
      } else {
        prevValue = matchedStep.value();
      }

      alreadyDone = output.done;

      if (output.done) {
        break;
      };
    }

    return {
      output: Object.assign({}, matchOutput, stepOutput),
      get: (label) => {
        return get(stepOutput, matchOutput, label);
      }
    };
  };

  return { match, next, run, snapshot };
};

const get = (stepOutput, matchOutput, label) => {
  const valForStep = stepOutput[label];
  const valForMatch = matchOutput[label];

  const val = valForStep || valForMatch;

  if (!val) {
    throw new Error(`'${label}' doesn't exist on run.`);
  }

  return val;
};

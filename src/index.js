module.exports = function genRunner(generator) {
  const steps = [];

  const next = function (name, ...value) {
    steps.push({ name, value });
    return { next, run };
  };

  const run = function (overrides = {}) {
    let g;
    const stepOutput = {};
    let prevValue;
    let alreadyDone = false;

    steps.forEach(({ name, value }) => {
      if (!g) {
        g = generator.apply(null, value);
        return;
      }

      if (alreadyDone) {
        throw new Error(`Attempting to call '${name}', generator runner is already done`);
      }

      stepOutput[name] = g.next.apply(g, prevValue);

      alreadyDone = stepOutput[name].done;

      prevValue = (overrides[name]) ? [overrides[name]] : value;
    });

    return { get: (label) => get(stepOutput, label) };
  };

  return { next, run };
};

const get = (stepOutput, label) => {
  if (!stepOutput[label]) throw new Error(`'${label}' doesn't exist on run.`);
  return stepOutput[label];
};

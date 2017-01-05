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
      if (g) {
        if (alreadyDone) {
          throw new Error(`Attempting to call '${name}', generator runner is already done`);
        }

        stepOutput[name] = g.next.apply(g, prevValue);

        const done = stepOutput[name].done;
        if (done) alreadyDone = true;

        prevValue = (overrides[name]) ? [overrides[name]] : value;
        return;
      }

      g = generator.apply(null, value);
    });

    return stepOutput;
  };

  return { next, run };
};

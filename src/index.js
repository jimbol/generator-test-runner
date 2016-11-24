export function genRunner(generator) {
  const steps = [];

  const next = function (name, value) {
    steps.push({ name, value });
    return { next, run };
  };

  const run = function (overrides = {}) {
    let g;
    const stepOutput = {};
    let prevValue;

    steps.forEach(({ name, value }) => {
      if (g) {
        stepOutput[name] = g.next(prevValue);
        prevValue = overrides[name] || value;
        return;
      }

      g = generator(value);
    });

    return stepOutput;
  };

  return { next, run };
};

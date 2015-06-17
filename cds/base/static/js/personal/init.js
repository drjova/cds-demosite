require(
  [
    'js/personal/main',
    'flight/lib/compose',
    'flight/lib/registry',
    'flight/lib/advice',
    'flight/lib/logger',
    'flight/lib/debug',
  ],

  function(initializePersonal, compose, registry, advice, withLogging, debug) {
    debug.enable(true);
    compose.mixin(registry, [advice.withAdvice]);
    // Init personal
    initializePersonal();
  }
);

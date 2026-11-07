export const tierDetectionScript = `(function() {
  try {
    var search = window.location.search || '';
    
    // 1. ?tier= override for testing (store it nowhere)
    var forcedTier = null;
    if (search.indexOf('tier=full') !== -1) forcedTier = 'full';
    else if (search.indexOf('tier=lite') !== -1) forcedTier = 'lite';
    else if (search.indexOf('tier=minimal') !== -1) forcedTier = 'minimal';

    var tier = forcedTier;
    if (!tier) {
      // Rule 1: Minimal = prefers-reduced-motion: reduce OR saveData === true
      var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      var saveData = conn && conn.saveData === true;
      
      if (rm || saveData) {
        tier = 'minimal';
      } else {
        // Rule 2: Lite = (pointer: coarse) OR no hover OR viewport width < 1024px
        var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        var noHover = window.matchMedia && !window.matchMedia('(hover: hover)').matches;
        var narrow = window.innerWidth < 1024;
        
        if (coarse || noHover || narrow) {
          tier = 'lite';
        } else {
          // Rule 3: Full = everything else
          tier = 'full';
        }
      }
    }

    window.__PAGE_TIER = tier;
    document.documentElement.setAttribute('data-tier', tier);

    // 2. Intro decision
    var forceIntro = search.indexOf('intro=1') !== -1;
    var forceSkip = search.indexOf('intro=0') !== -1;
    var seen = false;
    try { seen = !!sessionStorage.getItem('introSeen'); } catch(e) {}
    var rmCheck = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var skipReason = null;
    if (forceSkip) skipReason = 'intro=0';
    else if (tier !== 'full') skipReason = 'tier is ' + tier;
    else if (rmCheck) skipReason = 'prefers-reduced-motion';
    else if (seen && !forceIntro) skipReason = 'already seen in session';

    var isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (skipReason) {
      document.documentElement.setAttribute('data-intro', 'skip');
      if (isDev) console.log('[intro] skip (' + skipReason + ')');
    } else {
      document.documentElement.setAttribute('data-intro', 'play');
      if (isDev) console.log('[intro] play');
    }
  } catch(e) {
    window.__PAGE_TIER = 'lite';
    document.documentElement.setAttribute('data-tier', 'lite');
    document.documentElement.setAttribute('data-intro', 'skip');
  }
})();`;

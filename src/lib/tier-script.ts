export const tierDetectionScript = `(function() {
  try {
    var search = window.location.search;
    var forceIntro = search.indexOf('intro=1') !== -1;
    var forceSkip = search.indexOf('intro=0') !== -1;
    var seen = false;
    try { seen = !!sessionStorage.getItem('introSeen'); } catch(e) {}

    var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var sd = conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g');
    
    if (rm || sd) {
      document.documentElement.setAttribute('data-tier', 'minimal');
      document.documentElement.setAttribute('data-intro', 'skip');
      return;
    }
    
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var hover = window.matchMedia('(hover: hover)').matches;
    var wide = window.innerWidth >= 1024;
    var isFull = finePointer && hover && wide;

    if (isFull) {
      document.documentElement.setAttribute('data-tier', 'full');
      if (forceSkip || (seen && !forceIntro)) {
        document.documentElement.setAttribute('data-intro', 'skip');
      } else {
        document.documentElement.setAttribute('data-intro', 'play');
      }
    } else {
      document.documentElement.setAttribute('data-tier', 'lite');
      document.documentElement.setAttribute('data-intro', 'skip');
    }
  } catch(e) {
    document.documentElement.setAttribute('data-tier', 'lite');
    document.documentElement.setAttribute('data-intro', 'skip');
  }
})();`;

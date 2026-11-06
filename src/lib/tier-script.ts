export const tierDetectionScript = `(function() {
  try {
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var sd = conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g');
    if (rm || sd) {
      document.documentElement.setAttribute('data-tier', 'minimal');
      return;
    }
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var hover = window.matchMedia('(hover: hover)').matches;
    var wide = window.innerWidth >= 1024;
    if (finePointer && hover && wide) {
      document.documentElement.setAttribute('data-tier', 'full');
    } else {
      document.documentElement.setAttribute('data-tier', 'lite');
    }
  } catch(e) {
    document.documentElement.setAttribute('data-tier', 'lite');
  }
})();`;


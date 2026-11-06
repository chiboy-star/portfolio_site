export function getProjectThumbnail(
  title: string,
  liveUrl?: string,
  customThumbnail?: { url: string; blurhash?: string }
): { url: string; blurhash: string } {
  // 1. Admin uploaded image
  if (customThumbnail?.url) {
    return {
      url: customThumbnail.url,
      blurhash: customThumbnail.blurhash || "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
    };
  }

  // 2. Auto-screenshot of liveUrl via Microlink
  if (liveUrl && liveUrl.startsWith("http")) {
    const screenshotUrl = `https://api.microlink.io?url=${encodeURIComponent(
      liveUrl
    )}&screenshot=true&meta=false&embed=screenshot.url`;
    return {
      url: screenshotUrl,
      blurhash: "L5H25[offQof00ayfQay~qj[fQj[",
    };
  }

  // 3. Typographic placeholder with initials in Geist, flat --surface, hairline border
  const initials = title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#111113"/>
    <rect x="1" y="1" width="798" height="598" fill="none" stroke="#222226" stroke-width="1.5" rx="16"/>
    <text x="40" y="60" fill="#8D8D94" font-family="-apple-system, BlinkMacSystemFont, 'Geist Mono', monospace" font-size="13" letter-spacing="0.1em">PROJECT REPOSITORY</text>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#EDEDEE" font-family="-apple-system, BlinkMacSystemFont, 'Geist', sans-serif" font-weight="300" font-size="72" letter-spacing="0.12em">${initials}</text>
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" fill="#F5A524" font-family="-apple-system, BlinkMacSystemFont, 'Geist Mono', monospace" font-size="12" letter-spacing="0.08em">${title.toUpperCase()}</text>
  </svg>`;

  const placeholderUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    url: placeholderUrl,
    blurhash: "L00000fQfQfQfQfQfQfQ~qfQfQfQ",
  };
}


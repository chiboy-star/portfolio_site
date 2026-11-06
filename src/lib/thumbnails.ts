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

  // 3. Typographic placeholder with initials
  const initials = title
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
    <rect width="600" height="360" fill="#111113"/>
    <rect x="1" y="1" width="598" height="358" fill="none" stroke="#222226" stroke-width="2"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#F5A524" font-family="system-ui, sans-serif" font-weight="700" font-size="48" letter-spacing="0.1em">${initials}</text>
    <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="#8D8D94" font-family="system-ui, sans-serif" font-size="14" letter-spacing="0.05em">CODE REPOSITORY</text>
  </svg>`;

  const placeholderUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    url: placeholderUrl,
    blurhash: "L00000fQfQfQfQfQfQfQ~qfQfQfQ",
  };
}

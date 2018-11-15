import LZString from "lz-string";

export function read() {
  const hash = document.location.hash.slice(1);
  if (!hash) {
    return {};
  }

  // backwards support for old json encoded URIComponent
  const decode =
    hash.indexOf("%7B%22") !== -1
      ? decodeURIComponent
      : LZString.decompressFromEncodedURIComponent;

  try {
    return JSON.parse(decode(hash));
  } catch (_) {
    return {};
  }
}

export function replace(state) {
  const hash = LZString.compressToEncodedURIComponent(JSON.stringify(state));
  if (
    typeof URL === "function" &&
    typeof history === "object" &&
    typeof history.replaceState === "function"
  ) {
    // @ts-ignore TODO: check on this
    const url = new URL(window.location.href);
    url.hash = hash;
    // @ts-ignore
    history.replaceState(null, null, url);
  } else {
    location.hash = hash;
  }
}

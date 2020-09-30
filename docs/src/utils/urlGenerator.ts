export const urlGenerator = (path: string) => {
  return path.replace(/\d+-/g, '')
}

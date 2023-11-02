export const getHash = () => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="app:hash"]');
  return meta?.content ?? "";
};

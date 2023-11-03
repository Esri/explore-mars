// eslint-disable

declare module "*.scss" {
  const content: Record<string, string>;
  export default content;
}

declare module "*?worker&url" {
  const url: string;
  export default url;
}

export const getHash = () => {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="app:hash"]');
  return meta?.content ?? "";
};

export const setCookie = (name: string, value: string, exdays: number) => {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
};

export const getCookie = (name: string) => {
  const parameter = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(parameter) === 0) {
      return c.substring(parameter.length, c.length);
    }
  }
  return "";
};

import { tsx } from "@arcgis/core/widgets/support/widget";
import { Page } from "./Page";
import styles from './cookie-banner.module.scss'

const setCookie = (name: string, value: string, exdays: number) => {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
};

const getCookie = (name: string) => {
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

const DISCLAIMER_COOKIE_NAME = "disclaimerCookie";
const DISCLAIMER_COOKIE_VALUE = "true";

interface CookieBannerProps {
  hidden: boolean;
}

export function CookieBanner({ hidden }: CookieBannerProps) {
  const disclaimerCookie = getCookie(DISCLAIMER_COOKIE_NAME);
  const needsAcceptence = !hidden && disclaimerCookie !== DISCLAIMER_COOKIE_VALUE;

  return (
    <Page
      key="cookies"
      class={styles.cookieBanner}
      hidden={!needsAcceptence}
      onClose={() => {
        setCookie(DISCLAIMER_COOKIE_NAME, DISCLAIMER_COOKIE_VALUE, 365);
      }}
      content={(
        <p>
          By using this app, you agree to the storing of cookies on your device
          to access data layers, enhance user experience and analyze site usage.
        </p>
      )}
    />
  );
}
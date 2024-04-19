/* Copyright 2023 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { tsx } from "@arcgis/core/widgets/support/widget";
import { Page } from "./Page";
import styles from "./cookie-banner.module.scss";
import { CloseButton } from "./close-button/CloseButton";

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

export function CookieBanner() {
  const disclaimerCookie = getCookie(DISCLAIMER_COOKIE_NAME);
  const needsAcceptance = disclaimerCookie !== DISCLAIMER_COOKIE_VALUE;

  return (
    <Page
      key="cookies"
      hidden={!needsAcceptance}
      children={
        <div class={styles.cookieBanner}>
          <span class={styles.close}>
            <CloseButton
              onClose={() => {
                setCookie(DISCLAIMER_COOKIE_NAME, DISCLAIMER_COOKIE_VALUE, 365);
              }}
            />
          </span>
          <p>
            By using this app, you agree to the storing of cookies on your
            device to access data layers, enhance user experience and analyze
            site usage.
          </p>
        </div>
      }
    />
  );
}

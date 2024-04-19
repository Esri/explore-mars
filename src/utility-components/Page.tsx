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
import styles from "./page.module.scss";
import cx from "classnames";
import { PointerEventsContainer } from "./PointerEventsContainer";
interface PageProps {
  key?: string;
  hidden?: boolean;
  class?: string;
  children: tsx.JSX.Element | tsx.JSX.Element[];
}

export function Page({
  key,
  hidden,
  class: clazz,
  children = [],
}: PageProps) {
  return (
    <PointerEventsContainer
      children={
        <div
          key={key}
          class={cx(styles.page, { [styles.hidden]: hidden }, clazz)}
        >
          <div class={styles.content}>{children}</div>
        </div>
      }
    />
  );
}

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
import styles from "./SubMenu.module.scss";
import { tsx } from "@arcgis/core/widgets/support/widget";
import cx from "classnames";

interface ItemProps {
  onClick: () => void;
  itemClass: string;
  text: string;
  icon?: string;
}
export function Item({ icon, text, itemClass, onClick }: ItemProps) {
  return (
    <button class={cx(styles.item, itemClass)} onclick={onClick}>
      {icon != null ? (
        <div class={styles.iconContainer}>
          <img class={styles.icon} alt="" src={icon} />
        </div>
      ) : null}
      {text}
    </button>
  );
}

interface SubMenuProps {
  items: tsx.JSX.Element[];
  class?: string;
}
export function SubMenu({ items, class: clazz }: SubMenuProps) {
  return <nav class={cx(styles.subMenu, clazz)}>{items}</nav>;
}

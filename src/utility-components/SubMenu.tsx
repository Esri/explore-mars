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

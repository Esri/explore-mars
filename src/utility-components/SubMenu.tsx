import styles from './SubMenu.module.scss';
import { tsx } from "@arcgis/core/widgets/support/widget";
import cx from 'classnames';

interface ItemProps {
  onClick: () => void;
  itemClass: string;
  text: string;
}
export function Item({ text, itemClass, onClick }: ItemProps) {
  return (
    <button
      class={cx(styles.item, itemClass)}
      onclick={onClick}
    >
      {text}
    </button>
  )
}

interface SubMenuProps {
  items: tsx.JSX.Element[]
}
export function SubMenu({ items }: SubMenuProps) {
  return (
    <nav class={styles.subMenu}>
      {items}
    </nav>
  )
}
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

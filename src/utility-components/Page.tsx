import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from "./page.module.scss";
import cx from "classnames";
import { PointerEventsContainer } from "./PointerEventsContainer";

interface CookieBannerProps {
  key?: string;
  content: tsx.JSX.Element;
  hidden?: boolean;
  class?: string;
}

export function Page({
  key,
  content,
  hidden,
  class: clazz,
}: CookieBannerProps) {
  return (
    <PointerEventsContainer
      children={
        <div
          key={key}
          class={cx(styles.page, { [styles.hidden]: hidden }, clazz)}
        >
          <div class={styles.content}>{content}</div>
        </div>
      }
    />
  );
}

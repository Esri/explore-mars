import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from './page.module.scss';
import cx from 'classnames';
import { CloseButton } from "./CloseButton";
import { PointerEventsContainer } from "./PointerEventsContainer";

interface CookieBannerProps {
  key?: string;
  content: tsx.JSX.Element;
  hidden?: boolean;
  onClose: () => void;
  class?: string;
}

export function Page({ key, content, hidden, onClose, class: clazz }: CookieBannerProps) {
  return (
    <PointerEventsContainer children={(
      <div key={key} class={cx(styles.page, { [styles.hidden]: hidden }, clazz)}>
        <CloseButton
          onClose={onClose}
        />
        <div class={styles.content}>
          {content}
        </div>
      </div>
    )} />
    );
}
import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from './close-button.module.scss';

interface CloseButtonProps {
  onClose: () => void;
}

export function CloseButton({ onClose }: CloseButtonProps) {
  return (
      <button
        class={styles.closeButton}
        onclick={onClose}
      />
  );
}
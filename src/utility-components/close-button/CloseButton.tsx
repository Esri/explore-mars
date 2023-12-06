import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from "./close-button.module.scss";
import AppState from "../../application/AppState";

interface CloseButtonProps {
  onClose?: () => void;
}

export function CloseButton({ onClose }: CloseButtonProps) {
  return (
    <button
      class={styles.closeButton}
      onclick={() => {
        onClose?.();
        AppState.page = "home";
      }}
    />
  );
}

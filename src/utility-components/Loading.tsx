import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from "./Loading.module.scss";

export function Loading() {
  return (
    <div class={styles.loaderContainer}>
      <div class={styles.loader}>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}

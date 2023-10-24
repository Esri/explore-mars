// import { CSS } from "./constants";
import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from './HomePage.module.scss';
import cx from 'classnames';

interface LandingPageProps {
  hidden: boolean;
  onStart: () => void;
}
export function LandingPage({ onStart, hidden }: LandingPageProps) {
  return (
    <div class={cx(styles.landingPage, { [styles.hidden]: hidden })}>
      <div class={styles.content}>
          <h1 class={styles.heading}>Explore Mars!</h1>
          <p>
            Have you always dreamt of being an astronaut? Come close by
            exploring Mars, its canyons, mountains and craters along with the
            location of previous missions!
          </p>
          <button class={styles.button} onclick={() => { onStart() }}>
            Start now!
          </button>
          <p class={cx(styles.small)}>
            Tip: to navigate use the left and right mouse buttons, or with
            your keyboard using W,A,S,D + arrow keys.
          </p>
      </div>
      <div class={styles.graphics}>
        <div class={cx(styles.graphic, styles.right)}></div>
        <div class={cx(styles.graphic, styles.right)}></div>
        <div class={cx(styles.graphic, styles.middle)}></div>
        <div class={cx(styles.graphic, styles.right)}></div>
        <div class={cx(styles.graphic, styles.right)}></div>
        <div class={cx(styles.graphic, styles.left)}></div>
        <div class={cx(styles.graphic, styles.middle)}></div>
        <div class={cx(styles.graphic, styles.left)}></div>
        <div class={cx(styles.graphic, styles.left)}></div>
      </div>
    </div>
  );
}
import { tsx } from "@arcgis/core/widgets/support/widget";
import styles from './PointerEventsContainer.module.scss';


interface PointerEventsContainerProps {
  children: tsx.JSX.Element;
}
export function PointerEventsContainer({ children }: PointerEventsContainerProps) {

  return (
    <div class={styles.pointerEventsContainer}>
      {children}
    </div>
  )
}
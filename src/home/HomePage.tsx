// import { CSS } from "./constants";
import { tsx } from "@arcgis/core/widgets/support/widget";
import { CSS } from "../widgets/constants";

interface LandingPageProps {
  hidden: boolean;
  onStart: () => void;
}
export function LandingPage({ onStart, hidden}: LandingPageProps) {
  const hiddenClass = hidden ? " hidden" : ""; 
  return (
    <div
      class={`${CSS.pageContainer} landing-page` + hiddenClass}
    >
      <div class="content">
        <div class="container">
          <h1>Explore Mars!</h1>
          <p class="text">
            Have you always dreamt of being an astronaut? Come close by
            exploring Mars, its canyons, mountains and craters along with the
            location of previous missions!
          </p>
          <p>
            <button
              onclick={() => { onStart() }}
            >
              Start now!
            </button>
          </p>
          <p class="small navigation-tip">
            Tip: to navigate use the left and right mouse buttons, or with
            your keyboard using W,A,S,D + arrow keys.
          </p>
        </div>
      </div>
      <div class="graphics">
        <div class="graphic-1 right"></div>
        <div class="graphic-2 right"></div>
        <div class="graphic-3 middle"></div>
        <div class="graphic-4 right"></div>
        <div class="graphic-5 right"></div>
        <div class="graphic-6 left"></div>
        <div class="graphic-7 middle"></div>
        <div class="graphic-8 left"></div>
        <div class="graphic-9 left"></div>
      </div>
    </div>
  );
}
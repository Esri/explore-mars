import { useState } from "react";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-notice";
import "./CookieBanner.css";

export function CookieBanner() {
  const [open, setOpen] = useState(
    () => !document.cookie.split(";").some((cookie) => cookie.trim() === "disclaimerCookie=true"),
  );
  const dismiss = () => {
    document.cookie = `disclaimerCookie=true;max-age=31536000;path=/;SameSite=Lax${location.protocol === "https:" ? ";Secure" : ""}`;
    setOpen(false);
  };
  if (!open) {
    return null;
  }
  return (
    <div className="cookie-notice">
      <calcite-notice open closable oncalciteNoticeClose={dismiss} scale="s">
        <span slot="message">
          This app uses cookies to access data layers and enhance your experience.
        </span>
        <calcite-button slot="link" appearance="transparent" onClick={dismiss}>
          Dismiss
        </calcite-button>
      </calcite-notice>
    </div>
  );
}

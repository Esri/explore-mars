import { useState } from "react";
import "@esri/calcite-components/components/calcite-alert";

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
    <calcite-alert
      slot="alerts"
      label="Cookies"
      open
      scale="s"
      oncalciteAlertClose={(event) => {
        // Queued alerts can be hidden without being dismissed.
        if (!event.currentTarget.open) {
          dismiss();
        }
      }}
    >
      <span slot="message">
        By using this app, you agree to the storing of cookies on your device to access data layers,
        enhance user experience and analyze site usage.
      </span>
    </calcite-alert>
  );
}

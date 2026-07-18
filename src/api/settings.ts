import { httpClient } from "./httpClient";
import type { SiteSettingsResult, UpdateSiteSettingsCommand } from "./types";

export function fetchSiteSettings() {
  return httpClient<SiteSettingsResult>("/api/settings", {
    skipAuth: true,
  });
}

export function updateSiteSettings(command: UpdateSiteSettingsCommand) {
  return httpClient<SiteSettingsResult>("/api/settings", {
    method: "PUT",
    body: command,
  });
}

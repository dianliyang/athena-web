import { renderSettingsPage } from "../_shared";

export const dynamic = "force-dynamic";

export default async function SettingsApiManagementPage() {
  return renderSettingsPage("api-management");
}

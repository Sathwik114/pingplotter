import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Default monitoring behaviour and SMTP configuration</p>
      </div>

      <div className="card">
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}

import { prisma } from "./prisma";

/**
 * There is only ever one Settings row. Create it with defaults if missing.
 */
export async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  return settings;
}

export async function updateSettings(data) {
  const settings = await getSettings();
  return prisma.settings.update({
    where: { id: settings.id },
    data,
  });
}

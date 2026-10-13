/**
 * AsyncStorage-shaped key/value store backed by Capacitor Preferences
 * (UserDefaults on iOS, localStorage on web). Keeps the old storage keys,
 * so the data model and persistence code stay unchanged.
 */
import { Preferences } from '@capacitor/preferences';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  },
  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
};

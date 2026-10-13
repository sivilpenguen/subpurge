import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { Currency } from '../core/constants/currencies';
import type { Subscription } from '../core/store/logic';

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  currency: Currency;
  subscriptions: Subscription[];
}

export type BackupErrorCode = 'unsupported' | 'invalidJson' | 'invalidFormat';

export class BackupError extends Error {
  constructor(public code: BackupErrorCode) {
    super(code);
  }
}

function toCSVRow(fields: string[]): string {
  return fields.map(f => `"${String(f ?? '').replace(/"/g, '""')}"`).join(',');
}

export function buildBackupJSON(subscriptions: Subscription[], currency: Currency, now = new Date()): string {
  const payload: BackupPayload = { version: 1, exportedAt: now.toISOString(), currency, subscriptions };
  return JSON.stringify(payload, null, 2);
}

export function buildCSV(subscriptions: Subscription[], currency: Currency): string {
  const headers = ['Name', 'Price', 'Currency', 'Billing Cycle', 'Tracking Type', 'Start Date', 'Next Billing Date', 'Expiry Date', 'Active', 'Purpose', 'Notes'];
  const rows = subscriptions.map(s => toCSVRow([
    s.name,
    s.price.toFixed(2),
    s.currencyCode ?? currency.code,
    s.billingCycle,
    s.trackingType,
    s.startDate,
    s.nextBillingDate ?? '',
    s.expiryDate ?? '',
    s.isActive ? 'Yes' : 'No',
    s.purpose ?? '',
    s.notes ?? '',
  ]));
  return [toCSVRow(headers), ...rows].join('\n');
}

export function parseBackup(raw: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BackupError('invalidJson');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as BackupPayload).version !== 1 ||
    !Array.isArray((parsed as BackupPayload).subscriptions)
  ) {
    throw new BackupError('invalidFormat');
  }

  return parsed as BackupPayload;
}

async function shareFile(fileName: string, contents: string, mimeType: string, title: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const { value: canShare } = await Share.canShare();
  if (!canShare) throw new BackupError('unsupported');

  const { uri } = await Filesystem.writeFile({
    path: fileName,
    data: contents,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  try {
    await Share.share({ title, files: [uri] });
  } catch (err) {
    // Dismissing the share sheet rejects with "Share canceled" — not an error for the user.
    if (err instanceof Error && /cancel/i.test(err.message)) return;
    throw err;
  }
}

export async function exportJSON(subscriptions: Subscription[], currency: Currency): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  await shareFile(`subpurge-backup-${date}.json`, buildBackupJSON(subscriptions, currency), 'application/json', 'Subpurge');
}

export async function exportCSV(subscriptions: Subscription[], currency: Currency): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  await shareFile(`subpurge-export-${date}.csv`, buildCSV(subscriptions, currency), 'text/csv', 'Subpurge CSV');
}

/** Opens the system file picker (Files app on iOS) and parses the chosen backup. */
export function pickBackupFile(): Promise<BackupPayload | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        resolve(parseBackup(await file.text()));
      } catch (err) {
        reject(err);
      }
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

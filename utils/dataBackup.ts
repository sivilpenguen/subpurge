import {
  cacheDirectory,
  writeAsStringAsync,
  readAsStringAsync,
  EncodingType,
} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import type { Subscription } from '../store/subscriptionTypes';
import type { Currency } from '../constants/currencies';

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  currency: Currency;
  subscriptions: Subscription[];
}

export class BackupError extends Error {}

function toCSVRow(fields: string[]): string {
  return fields.map(f => `"${String(f ?? '').replace(/"/g, '""')}"`).join(',');
}

function getCacheDir(): string {
  if (!cacheDirectory) throw new BackupError('Dosya sistemi bu platformda desteklenmiyor');
  return cacheDirectory;
}

async function share(path: string, mimeType: string, dialogTitle: string): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new BackupError('Paylaşım bu cihazda desteklenmiyor');
  await Sharing.shareAsync(path, { mimeType, dialogTitle });
}

export async function exportJSON(subscriptions: Subscription[], currency: Currency): Promise<void> {
  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    currency,
    subscriptions,
  };
  const path = getCacheDir() + 'subpurge-backup.json';
  await writeAsStringAsync(path, JSON.stringify(payload, null, 2), { encoding: EncodingType.UTF8 });
  await share(path, 'application/json', 'Subpurge Yedeği');
}

export async function exportCSV(subscriptions: Subscription[], currency: Currency): Promise<void> {
  const headers = ['Name', 'Price', 'Currency', 'Billing Cycle', 'Tracking Type', 'Start Date', 'Next Billing Date', 'Expiry Date', 'Active', 'Purpose', 'Notes'];
  const rows = subscriptions.map(s => toCSVRow([
    s.name,
    s.price.toFixed(2),
    currency.code,
    s.billingCycle,
    s.trackingType,
    s.startDate,
    s.nextBillingDate ?? '',
    s.expiryDate ?? '',
    s.isActive ? 'Yes' : 'No',
    s.purpose ?? '',
    s.notes ?? '',
  ]));
  const csv = [toCSVRow(headers), ...rows].join('\n');
  const path = getCacheDir() + 'subpurge-export.csv';
  await writeAsStringAsync(path, csv, { encoding: EncodingType.UTF8 });
  await share(path, 'text/csv', 'Subpurge CSV Export');
}

export async function importJSON(): Promise<BackupPayload | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;

  const uri = result.assets[0].uri;
  const raw = await readAsStringAsync(uri, { encoding: EncodingType.UTF8 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new BackupError('Dosya JSON formatında değil');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as BackupPayload).version !== 1 ||
    !Array.isArray((parsed as BackupPayload).subscriptions)
  ) {
    throw new BackupError('Geçersiz Subpurge yedek formatı');
  }

  return parsed as BackupPayload;
}

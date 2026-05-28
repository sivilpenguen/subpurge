import { useCallback, useState } from 'react';
import { ThemedAlertAction } from '../components/ThemedAlert';

export type AlertConfig = {
  title?: string;
  message?: string;
  actions: ThemedAlertAction[];
  accent?: 'neutral' | 'destructive';
};

export function useAlertState() {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((config: AlertConfig) => {
    setAlertConfig(config);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return {
    alertConfig,
    showAlert,
    closeAlert,
    setAlertConfig,
  };
}

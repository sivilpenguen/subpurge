import { Image, ImageLoadEventData } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getLocalLogo } from '../constants/localLogos';
import { getTheme } from '../constants/theme';
import { useThemeMode } from '../store/ThemeContext';

interface Props {
  logoUrl?: string;
  icon: string;
  color: string;
  size?: number;
  serviceName?: string;
}

export function ServiceLogo({ logoUrl, icon, color, size = 40, serviceName }: Props) {
  const themeMode = useThemeMode();
  const theme = getTheme(themeMode);
  // true = local dosya 1x1 placeholder, gerçek logo değil
  const [localIsPlaceholder, setLocalIsPlaceholder] = useState(false);
  const [remoteFailed, setRemoteFailed] = useState(false);

  const radius = size * 0.28;
  const localAsset = serviceName ? getLocalLogo(serviceName) : undefined;
  const useThemeTint = serviceName === 'ChatGPT Plus' || serviceName === 'X (Twitter)';
  const imageStyle = {
    width: size * 0.7,
    height: size * 0.7,
    tintColor: useThemeTint ? theme.text : undefined,
  };

  const useLocal = !!localAsset && !localIsPlaceholder;
  const useRemote = !useLocal && !!logoUrl && !remoteFailed;

  if (useLocal || (localAsset && !localIsPlaceholder)) {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
        <Image
          source={localAsset}
          style={imageStyle}
          contentFit="contain"
          onLoad={(e: ImageLoadEventData) => {
            // 1x1 ise placeholder — Clearbit'e geç
            if (e.source.width <= 1 && e.source.height <= 1) {
              setLocalIsPlaceholder(true);
            }
          }}
        />
      </View>
    );
  }

  if (useRemote) {
    return (
      <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
        <Image
          source={{ uri: logoUrl }}
          style={imageStyle}
          contentFit="contain"
          onError={() => setRemoteFailed(true)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: radius }]}>
      <Text style={{ fontSize: size * 0.48 }}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});

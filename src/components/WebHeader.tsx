import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { isTelegram } from '../lib/telegram';
import { RootStackParamList } from '../types/navigation';
import { useThemeColors, spacing, fontSizes, ColorPalette } from '../constants/theme';

interface WebHeaderProps {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  showSearch?: boolean;
}

export function WebHeader({
  searchValue = '',
  onSearchChange,
  showSearch = true,
}: WebHeaderProps) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (Platform.OS !== 'web' || isTelegram()) return null;

  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        <TouchableOpacity
          style={styles.brand}
          onPress={() => navigation.navigate('UserTabs', { screen: 'Home' })}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {showSearch && onSearchChange && (
          <View style={styles.search}>
            <SearchBar value={searchValue} onChangeText={onSearchChange} />
          </View>
        )}

        <View style={styles.actions}>
          <ThemeToggle />
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors: ColorPalette) => StyleSheet.create({
  header: {
    width: '100%',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        } as any)
      : {}),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingLeft: 0,
    paddingRight: spacing.lg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    height: 56,
    width: 62,
  },
  search: {
    flex: 1,
    marginHorizontal: spacing.xl,
    maxWidth: 500,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
});

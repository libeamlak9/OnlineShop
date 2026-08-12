import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import { colors, spacing, borderRadius, fontSizes } from '../constants/theme';

interface CategoryFilterProps {
  selected: Category | null;
  onSelect: (category: Category | null) => void;
  showNewArrivals?: boolean;
  newArrivalsSelected?: boolean;
  onNewArrivalsToggle?: () => void;
}

const VISIBLE_COUNT = 3;

export function CategoryFilter({
  selected,
  onSelect,
  showNewArrivals = false,
  newArrivalsSelected = false,
  onNewArrivalsToggle,
}: CategoryFilterProps) {
  const { categories } = useApp();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const visibleCategories = categories.slice(0, VISIBLE_COUNT);
  const hiddenCategories = categories.slice(VISIBLE_COUNT);

  function handleSelect(category: Category | null) {
    onSelect(category);
    setDropdownVisible(false);
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <TouchableOpacity
          style={[styles.chip, selected === null && styles.activeChip]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.text, selected === null && styles.activeText]}>
            All
          </Text>
        </TouchableOpacity>

        {showNewArrivals && (
          <TouchableOpacity
            style={[styles.chip, newArrivalsSelected && styles.activeChip]}
            onPress={onNewArrivalsToggle}
          >
            <Text
              style={[styles.text, newArrivalsSelected && styles.activeText]}
            >
              New Arrivals
            </Text>
          </TouchableOpacity>
        )}

        {visibleCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.chip, selected === category && styles.activeChip]}
            onPress={() => onSelect(category)}
          >
            <Text
              style={[
                styles.text,
                selected === category && styles.activeText,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}

        {hiddenCategories.length > 0 && (
          <TouchableOpacity
            style={[styles.chip, styles.moreChip]}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={[styles.text, styles.moreText]}>More ▼</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={dropdownVisible}
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdown}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.dropdownItem}
                  onPress={() => handleSelect(category)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selected === category && styles.dropdownItemTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {category}
                  </Text>
                  {selected === category && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    height: 34,
    justifyContent: 'center',
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  moreChip: {
    borderColor: colors.primary,
  },
  text: {
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  activeText: {
    color: colors.surface,
    fontWeight: '600',
  },
  moreText: {
    color: colors.primary,
    fontWeight: '600',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: spacing.lg,
  },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 180,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: fontSizes.md,
    color: colors.text,
    flex: 1,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: fontSizes.md,
    marginLeft: spacing.sm,
  },
});

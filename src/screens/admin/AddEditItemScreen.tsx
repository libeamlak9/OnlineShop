import { useState } from 'react';
import { Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { AdminHeader } from '../../components/AdminHeader';
import { useApp } from '../../context/AppContext';
import { useResponsive } from '../../hooks/useResponsive';
import { AdminStackParamList } from '../../types/navigation';
import { getProductCoverImage, resizeImage } from '../../utils/images';
import { Category, Product } from '../../types';
import { colors, spacing, borderRadius, fontSizes } from '../../constants/theme';

const MAX_WIDTH = 800;

export function AddEditItemScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const route = useRoute();
  const { productId } = (route.params as { productId?: string }) ?? {};
  const { products, categories, addProduct, updateProduct } = useApp();
  const { isDesktop } = useResponsive();

  const existing = productId ? products.find((p) => p.id === productId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [price, setPrice] = useState(existing?.price.toString() ?? '');
  const [category, setCategory] = useState<Category>(existing?.category ?? categories[0]);
  const [stock, setStock] = useState(existing?.stock.toString() ?? '');
  const [images, setImages] = useState<string[]>(existing?.images ?? []);
  const [coverImageIndex, setCoverImageIndex] = useState(existing?.coverImageIndex ?? 0);

  const isValid =
    name.trim() &&
    description.trim() &&
    !isNaN(Number(price)) &&
    Number(price) > 0 &&
    !isNaN(Number(stock));

  async function pickImages() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const resized = await Promise.all(
        result.assets.map((asset) => resizeImage(asset.uri, 800))
      );
      setImages((prev) => [...prev, ...resized]);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setCoverImageIndex((current) => {
        if (current >= next.length) return next.length > 0 ? next.length - 1 : 0;
        return current;
      });
      return next;
    });
  }

  function handleSave() {
    if (!isValid) return;

    const productData: Product = {
      id: existing?.id ?? Date.now().toString(),
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      images,
      coverImageIndex: images.length > 0 ? coverImageIndex : 0,
      stock: Number(stock),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    if (existing) {
      updateProduct(productData);
      navigation.navigate('AdminDashboard');
      Alert.alert('Item Updated', `${productData.name} has been updated.`);
    } else {
      addProduct(productData);
      navigation.navigate('AdminDashboard');
      Alert.alert('Item Added', `${productData.name} has been added.`);
    }
  }

  const previewProduct: Product = {
    id: existing?.id ?? 'preview',
    name: name.trim() || 'Product',
    description: description.trim(),
    price: Number(price) || 0,
    category,
    images,
    coverImageIndex,
    stock: Number(stock) || 0,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
  const coverUri = getProductCoverImage(previewProduct);
  const isWeb = Platform.OS === 'web';

  return (
    <>
      {isWeb && <AdminHeader />}
      <Screen noPadding edges={['top', 'left', 'right']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text style={styles.title}>{existing ? 'Edit Item' : 'Add New Item'}</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Product Images</Text>
            <TouchableOpacity
              style={[
                styles.coverPicker,
                images.length > 0 && styles.coverPickerWithImage,
              ]}
              onPress={pickImages}
            >
              <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="contain" />
              <View
                style={[
                  styles.imageOverlay,
                  images.length > 0 && styles.imageOverlaySubtle,
                ]}
              >
                <Ionicons
                  name="camera-outline"
                  size={28}
                  color={images.length > 0 ? colors.primary : colors.surface}
                />
                <Text
                  style={[
                    styles.imageOverlayText,
                    images.length > 0 && styles.imageOverlayTextDark,
                  ]}
                >
                  {images.length > 0 ? 'Add More Images' : 'Add Images'}
                </Text>
              </View>
            </TouchableOpacity>

            {images.length > 0 && (
              <FlatList
                data={images}
                horizontal
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.thumbnailList}
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.thumbnailContainer,
                      index === coverImageIndex && styles.thumbnailContainerActive,
                    ]}
                  >
                    <TouchableOpacity onPress={() => setCoverImageIndex(index)}>
                      <Image source={{ uri: item }} style={styles.thumbnail} resizeMode="cover" />
                    </TouchableOpacity>
                    {index === coverImageIndex && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={22} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>

          <View style={[styles.row, isDesktop && styles.rowDesktop]}>
            <View style={[styles.field, styles.flex]}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Item name"
              />
            </View>

            <View style={[styles.field, styles.flex]}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.picker}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue as Category)}
                >
                  {categories.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Item description"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.row, isDesktop && styles.rowDesktop]}>
            <View style={[styles.field, styles.flex]}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, styles.flex]}>
              <Text style={styles.label}>Stock</Text>
              <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Button
            title={existing ? 'Update Item' : 'Add Item'}
            onPress={handleSave}
            disabled={!isValid}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    maxWidth: MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  coverPicker: {
    width: '100%',
    height: 280,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
    position: 'relative',
    ...(Platform.OS === 'web'
      ? ({
          height: 420,
        } as any)
      : {}),
  },
  coverPickerWithImage: {
    ...(Platform.OS === 'web'
      ? ({
          height: 520,
        } as any)
      : {
          height: 360,
        }),
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlaySubtle: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  imageOverlayText: {
    color: colors.surface,
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  imageOverlayTextDark: {
    color: colors.text,
  },
  thumbnailList: {
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  thumbnailContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  thumbnailContainerActive: {
    borderColor: colors.primary,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: 2,
    alignItems: 'center',
  },
  coverBadgeText: {
    color: colors.surface,
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  rowDesktop: {
    flexDirection: 'row',
  },
  picker: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  saveButton: {
    marginTop: spacing.md,
  },
});

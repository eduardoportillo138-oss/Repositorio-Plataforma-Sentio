import { type AvatarFile } from '@sentio/api-client';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** Lado máximo de la imagen que se sube: el servidor genera variantes de 256 y 512 px. */
const MAX_SIDE = 1024;
const JPEG_QUALITY = 0.8;

export type PickAvatarResult =
  | { kind: 'picked'; file: AvatarFile; previewUri: string }
  | { kind: 'cancelled' }
  | { kind: 'denied' };

/**
 * Abre la galería con recorte cuadrado y comprime en el dispositivo antes de subir:
 * redimensiona a 1024 px y convierte a JPEG (también las fotos HEIC del iPhone),
 * lo que además descarta los metadatos EXIF del original.
 */
export async function pickAvatar(): Promise<PickAvatarResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { kind: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return { kind: 'cancelled' };

  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });

  const body = await (await fetch(saved.uri)).blob();
  return {
    kind: 'picked',
    previewUri: saved.uri,
    file: { body, mimeType: 'image/jpeg', sizeBytes: body.size },
  };
}

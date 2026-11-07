'use client';

import { type ReactNode, useState } from 'react';
import { H4, Paragraph, Text, XStack, YStack } from 'tamagui';

/** A partir de aquí el texto se recorta y aparece "ver más". */
const COLLAPSE_AFTER_CHARS = 280;
const COLLAPSE_AFTER_LINES = 4;

export interface PostCardProps {
  authorName: string;
  authorHandle: string;
  /** Avatar de la plataforma (UserAvatar de web o móvil). */
  authorAvatar: ReactNode;
  /** Abre el perfil del autor (al tocar el avatar o el nombre). */
  onAuthorPress?: () => void;
  /** Etiqueta accesible del enlace al autor, p. ej. "Ver el perfil de Ana". */
  authorLabel?: string;
  timeLabel: string;
  title: string;
  text: string;
  seeMoreLabel: string;
  seeLessLabel: string;
  /** Barra de acciones (Me gusta, comentar, compartir: Fase 4). */
  actions?: ReactNode;
  /** Menú de la esquina (p. ej. borrar, si es propia). */
  menu?: ReactNode;
  /** Versión compacta para resultados de búsqueda. */
  compact?: boolean;
  /** Reemplaza el render del título/texto (p. ej. con coincidencias resaltadas). */
  renderTitle?: (title: string) => ReactNode;
  renderText?: (text: string) => ReactNode;
  onPress?: () => void;
}

function isLong(text: string): boolean {
  return text.length > COLLAPSE_AFTER_CHARS || text.split('\n').length > COLLAPSE_AFTER_LINES;
}

/** Tarjeta de publicación compartida por web y móvil. */
export function PostCard({
  authorName,
  authorHandle,
  authorAvatar,
  onAuthorPress,
  authorLabel,
  timeLabel,
  title,
  text,
  seeMoreLabel,
  seeLessLabel,
  actions,
  menu,
  compact = false,
  renderTitle,
  renderText,
  onPress,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = !compact && isLong(text);
  const lines = compact ? 2 : collapsible && !expanded ? COLLAPSE_AFTER_LINES : undefined;

  return (
    <YStack
      tag="article"
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingHorizontal="$4"
      paddingVertical={compact ? '$3' : '$4'}
      gap="$2"
    >
      <XStack alignItems="center" gap="$3">
        <XStack
          flex={1}
          alignItems="center"
          gap="$3"
          minHeight={44}
          cursor={onAuthorPress ? 'pointer' : undefined}
          onPress={onAuthorPress}
          role={onAuthorPress ? 'link' : undefined}
          aria-label={authorLabel}
        >
          {authorAvatar}
          <YStack flex={1}>
            <Text fontWeight="700" color="$color12" numberOfLines={1}>
              {authorName}
            </Text>
            <Text fontSize="$2" color="$color10" numberOfLines={1}>
              @{authorHandle} · {timeLabel}
            </Text>
          </YStack>
        </XStack>
        {menu}
      </XStack>

      <YStack gap="$1" onPress={onPress} cursor={onPress ? 'pointer' : undefined}>
        <H4 color="$color12" numberOfLines={compact ? 1 : undefined}>
          {renderTitle ? renderTitle(title) : title}
        </H4>
        {text ? (
          <Paragraph color="$color11" numberOfLines={lines}>
            {renderText ? renderText(text) : text}
          </Paragraph>
        ) : null}
      </YStack>
      {collapsible ? (
        <Text
          color="$blue10"
          fontWeight="600"
          alignSelf="flex-start"
          paddingVertical="$2"
          cursor="pointer"
          role="button"
          aria-expanded={expanded}
          onPress={() => setExpanded((v) => !v)}
        >
          {expanded ? seeLessLabel : seeMoreLabel}
        </Text>
      ) : null}

      {actions ? <XStack gap="$2">{actions}</XStack> : null}
    </YStack>
  );
}

/** Marcador de carga con la forma de una PostCard. */
export function PostCardSkeleton() {
  const bar = (width: number | `${number}%`, height = 12) => (
    <YStack width={width} height={height} borderRadius="$2" backgroundColor="$color4" />
  );
  return (
    <YStack
      paddingHorizontal="$4"
      paddingVertical="$4"
      gap="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      aria-hidden
    >
      <XStack alignItems="center" gap="$3">
        <YStack width={40} height={40} borderRadius={20} backgroundColor="$color4" />
        <YStack gap="$2" flex={1}>
          {bar('40%')}
          {bar('25%', 10)}
        </YStack>
      </XStack>
      {bar('70%', 16)}
      {bar('100%')}
      {bar('85%')}
    </YStack>
  );
}

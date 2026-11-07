'use client';

import { useConnection, useHomeFeedQuery } from '@sentio/api-client';
import { useTranslation } from '@sentio/i18n';
import { EmptyState, FloatingActionButton, HomeIcon, PlusIcon, YStack } from '@sentio/ui';
import { useState } from 'react';
import { NewPostDialog } from '@/components/NewPostDialog';
import { PostList } from '@/components/PostList';

export default function HomePage() {
  const { t } = useTranslation();
  const [composing, setComposing] = useState(false);
  const query = useHomeFeedQuery({ notifyOnNetworkStatusChange: true });
  const feed = useConnection(query, (d) => d.homeFeed);

  return (
    <YStack width="100%" maxWidth={640} alignSelf="center" flex={1}>
      <PostList
        feed={feed}
        empty={
          <EmptyState icon={HomeIcon} title={t('feed.empty.title')} body={t('feed.empty.body')} />
        }
      />
      {/* Contenedor fijo de tamaño cero: el botón se posiciona respecto a la esquina de la ventana. */}
      <div style={{ position: 'fixed', right: 0, bottom: 0, width: 0, height: 0, zIndex: 20 }}>
        <FloatingActionButton
          icon={<PlusIcon size={26} color="white" />}
          label={t('post.newPost')}
          onPress={() => setComposing(true)}
        />
      </div>
      <NewPostDialog open={composing} onClose={() => setComposing(false)} />
    </YStack>
  );
}

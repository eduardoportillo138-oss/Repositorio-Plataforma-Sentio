import { useTranslation } from '@sentio/i18n';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { CommentsList } from './CommentsList';
import { ShareForm } from './ShareForm';

interface Target {
  id: string;
  title: string;
}

interface PostInteractionsValue {
  openComments: (post: Target) => void;
  openShare: (post: Target) => void;
}

const Ctx = createContext<PostInteractionsValue | null>(null);

/** Una hoja de comentarios y una de compartir para todo el portal (fuera de las listas). */
export function PostInteractionsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Target | null>(null);
  const [share, setShare] = useState<Target | null>(null);
  const value = useMemo(() => ({ openComments: setComments, openShare: setShare }), []);

  return (
    <Ctx.Provider value={value}>
      {children}
      <BottomSheet
        open={comments !== null}
        onClose={() => setComments(null)}
        title={t('comments.title')}
      >
        {comments ? (
          <CommentsList
            key={comments.id}
            postId={comments.id}
            onNavigate={() => setComments(null)}
          />
        ) : null}
      </BottomSheet>
      <BottomSheet open={share !== null} onClose={() => setShare(null)} title={t('share.title')}>
        {share ? (
          <ShareForm
            key={share.id}
            postId={share.id}
            postTitle={share.title}
            onDone={() => setShare(null)}
          />
        ) : null}
      </BottomSheet>
    </Ctx.Provider>
  );
}

export function usePostInteractions(): PostInteractionsValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error('usePostInteractions debe usarse dentro de <PostInteractionsProvider>.');
  return ctx;
}

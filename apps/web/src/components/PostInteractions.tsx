'use client';

import { useTranslation } from '@sentio/i18n';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { CommentsList } from './CommentsList';
import { ModalDialog } from './ModalDialog';
import { ShareForm } from './ShareDialog';

interface Target {
  id: string;
  title: string;
}

interface PostInteractionsValue {
  openComments: (post: Target) => void;
  openShare: (post: Target) => void;
}

const Ctx = createContext<PostInteractionsValue | null>(null);

/**
 * Un único panel de comentarios y un único diálogo de compartir para todo el portal.
 * Viven fuera de la lista virtualizada, así no se desmontan al hacer scroll.
 */
export function PostInteractionsProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Target | null>(null);
  const [share, setShare] = useState<Target | null>(null);
  const value = useMemo(() => ({ openComments: setComments, openShare: setShare }), []);

  return (
    <Ctx.Provider value={value}>
      {children}
      <ModalDialog
        variant="side"
        open={comments !== null}
        onClose={() => setComments(null)}
        title={t('comments.title')}
      >
        {comments ? <CommentsList key={comments.id} postId={comments.id} /> : null}
      </ModalDialog>
      <ModalDialog open={share !== null} onClose={() => setShare(null)} title={t('share.title')}>
        {share ? (
          <ShareForm
            key={share.id}
            postId={share.id}
            postTitle={share.title}
            onDone={() => setShare(null)}
          />
        ) : null}
      </ModalDialog>
    </Ctx.Provider>
  );
}

export function usePostInteractions(): PostInteractionsValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error('usePostInteractions debe usarse dentro de <PostInteractionsProvider>.');
  return ctx;
}

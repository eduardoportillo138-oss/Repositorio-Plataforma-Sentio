import { Stack } from 'expo-router';

/** Pila de la pestaña Perfil (en la Fase 2 se agregan "Editar perfil" e "Información privada"). */
export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

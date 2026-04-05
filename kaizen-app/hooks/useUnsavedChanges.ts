import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from 'expo-router';

/**
 * Detecta mudanças não salvas num formulário e exibe Alert de confirmação ao sair.
 * Chame `markAsSaved()` ANTES de navegar após um save bem-sucedido para
 * desativar o guard e evitar o Alert espúrio.
 */
export function useUnsavedChanges(current: object, initial: object) {
  const navigation  = useNavigation();
  const isSavingRef = useRef(false);

  const isDirty = JSON.stringify(current) !== JSON.stringify(initial);

  const markAsSaved = useCallback(() => {
    isSavingRef.current = true;
  }, []);

  const confirmExit = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Deseja sair?',
        'As informações preenchidas serão perdidas.',
        [
          { text: 'Continuar editando', style: 'cancel',      onPress: () => resolve(false) },
          { text: 'Sair mesmo assim',   style: 'destructive', onPress: () => resolve(true)  },
        ],
      );
    });
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isSavingRef.current) return;
      if (!isDirty) return;
      e.preventDefault();
      confirmExit().then((confirmed) => {
        if (confirmed) navigation.dispatch(e.data.action);
      });
    });
    return unsubscribe;
  }, [isDirty, navigation, confirmExit]);

  return { isDirty, markAsSaved, confirmExit };
}

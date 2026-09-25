import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Envía al inicio sin mostrar información de la página pedida.
 * Se usa para rutas sin permiso (panel de tienda / admin) y para direcciones desconocidas.
 * Reemplaza la URL (no la agrega al historial), así "Atrás" no vuelve a la página bloqueada.
 */
export const RedirectHome: React.FC<{ notice?: { title: string; message: string } }> = ({ notice }) => {
  const { redirectToHome, addLiveNotification } = useApp();
  useEffect(() => {
    redirectToHome();
    if (notice) addLiveNotification({ type: 'info', title: notice.title, message: notice.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

// src/components/ScrollToTopButton.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

export function ScrollToTopButton() {
  // Estado para controlar la visibilidad del botón
  const [isVisible, setIsVisible] = useState(false);

  // Función que se ejecuta al hacer scroll
  const toggleVisibility = () => {
    // Si el scroll vertical es mayor a 300px, muestra el botón
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Función para hacer scroll suave hacia el tope de la página
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    // Añade un listener para el evento de scroll cuando el componente se monta
    window.addEventListener('scroll', toggleVisibility);

    // Limpia el listener cuando el componente se desmonta para evitar fugas de memoria
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isVisible && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
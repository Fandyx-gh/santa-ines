import { CircleCheck } from 'lucide-react';
import { Logo } from '../../components/Logo';
import type { DiscoveryConfig } from '../../types/discovery';

interface SuccessScreenProps {
  config: DiscoveryConfig;
  testMode: boolean;
  onViewResponses: () => void;
  onReset?: () => void;
}

export function SuccessScreen({ config, testMode, onViewResponses, onReset }: SuccessScreenProps) {
  return (
    <main className="success-page page-shell">
      <Logo src={config.logoPath} />
      <div className="success-icon" aria-hidden="true">
        <CircleCheck size={34} strokeWidth={1.5} />
      </div>
      <span className="eyebrow">Santa Inés · Descubrimiento</span>
      <h1>¡Muchas gracias!</h1>
      <p>Con esta información ya tenemos una visión mucho más clara de cómo funciona Santa Inés y podremos preparar una propuesta ajustada a lo que realmente necesitan.</p>
      <p>Revisaremos las respuestas y organizaremos nuestras recomendaciones para la siguiente etapa.</p>
      <div className="success-status">
      <CircleCheck size={16} aria-hidden="true" />
        Respuestas recibidas correctamente
      </div>
      {testMode ? <span className="test-mode-badge test-mode-badge--success">Modo de prueba</span> : null}
      <button className="success-link" type="button" onClick={onViewResponses}>
        Ver respuestas enviadas
      </button>
      {onReset ? (
        <button className="button button--secondary success-reset" type="button" onClick={onReset}>
          Reiniciar prueba
        </button>
      ) : null}
    </main>
  );
}

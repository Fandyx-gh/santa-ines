import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch, type Path } from 'react-hook-form';
import { Clock3, Download, Play, Save } from 'lucide-react';
import { initialAnswers } from '../../config/santaInes';
import { Logo } from '../../components/Logo';
import { ProgressHeader } from '../../components/ProgressHeader';
import { QuestionRenderer } from '../../components/QuestionRenderer';
import { ReviewScreen } from './ReviewScreen';
import { SuccessScreen } from './SuccessScreen';
import { isSupabaseConfigured } from '../../lib/supabase';
import { removeLocalState, saveRemoteState, writeLocalState } from '../../lib/persistence';
import { validateAll, validateStep } from '../../lib/validation';
import type { DiscoveryAnswers, DiscoveryConfig, PersistedState, SaveState } from '../../types/discovery';

interface DiscoveryWizardProps {
  config: DiscoveryConfig;
  initialState: PersistedState;
  testMode: boolean;
}

function IntroScreen({
  config,
  onStart,
  testMode,
}: {
  config: DiscoveryConfig;
  onStart: () => void;
  testMode: boolean;
}) {
  return (
    <main className="intro-page page-shell">
      <span className="eyebrow intro-page__eyebrow">Descubrimiento · Santa Inés</span>
      {testMode ? <span className="test-mode-badge test-mode-badge--intro">Modo de prueba</span> : null}
      <Logo src={config.logoPath} />
      <img className="facade-image" src={config.facadePath} alt="Entrada de los apartamentos Santa Inés" />
      <div className="intro-copy">
        <h1>Conozcamos mejor Santa Inés</h1>
        <p>Queremos entender cómo funciona actualmente Santa Inés para preparar una propuesta digital realmente útil para ustedes.</p>
      </div>
      <div className="reassurance-row" aria-label="Detalles del cuestionario">
        <span><Clock3 size={16} aria-hidden="true" /> 5–7 min</span>
        <span><Save size={16} aria-hidden="true" /> Guardado automático</span>
        <span><Download size={16} aria-hidden="true" /> Puedes continuar después</span>
      </div>
      <button className="button button--primary button--start" type="button" onClick={onStart}>
        <Play size={17} fill="currentColor" aria-hidden="true" />
        Comenzar
      </button>
      <p className="intro-helper">No necesitas tener todas las respuestas exactas. Con la información que tengas disponible es suficiente.</p>
    </main>
  );
}

export function DiscoveryWizard({ config, initialState, testMode }: DiscoveryWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialState.currentStep);
  const [status, setStatus] = useState(initialState.status);
  const [submittedAt, setSubmittedAt] = useState<string | null>(initialState.submittedAt ?? null);
  const [showSubmittedSummary, setShowSubmittedSummary] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const { control, formState, getValues, setError, clearErrors, setValue, reset } = useForm<DiscoveryAnswers>({
    defaultValues: initialState.answers,
    mode: 'onChange',
  });
  const answers = useWatch({ control }) as DiscoveryAnswers;
  const totalSteps = config.sections.length;

  const currentSection = useMemo(() => {
    if (currentStep < 1 || currentStep > totalSteps) {
      return null;
    }
    return config.sections[currentStep - 1];
  }, [config.sections, currentStep, totalSteps]);

  useEffect(() => {
    const updatedAt = new Date().toISOString();
    const localState: PersistedState = {
      token: initialState.token,
      isTest: testMode,
      currentStep,
      answers,
      status,
      updatedAt,
      submittedAt,
    };
    writeLocalState(localState);

    if (!isSupabaseConfigured) {
      setSaveState('saved');
      return;
    }

    setSaveState('saving');
    let retryTimer: number | undefined;
    let debounceTimer: number | undefined;
    let disposed = false;

    const sync = async () => {
      try {
        await saveRemoteState(initialState.token, currentStep, answers, status, submittedAt, testMode);
        if (!disposed) {
          setSaveState('saved');
        }
      } catch {
        if (!disposed) {
          setSaveState('error');
          retryTimer = window.setTimeout(sync, 5000);
        }
      }
    };

    debounceTimer = window.setTimeout(() => {
      void sync();
    }, 800);

    return () => {
      disposed = true;
      if (debounceTimer !== undefined) {
        window.clearTimeout(debounceTimer);
      }
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [answers, currentStep, initialState.token, status, submittedAt, testMode]);

  if (status === 'SUBMITTED') {
    if (showSubmittedSummary) {
      return (
        <ReviewScreen
          config={config}
          answers={answers}
          readOnly
          onBack={() => setShowSubmittedSummary(false)}
        />
      );
    }

    return (
      <SuccessScreen
        config={config}
        testMode={testMode}
        onViewResponses={() => setShowSubmittedSummary(true)}
        onReset={testMode ? () => {
          removeLocalState(initialState.token, true);
          reset(initialAnswers);
          setSubmittedAt(null);
          setStatus('IN_PROGRESS');
          setCurrentStep(0);
          setShowSubmittedSummary(false);
          setSaveState('saving');
          void saveRemoteState(initialState.token, 0, initialAnswers, 'IN_PROGRESS', null, true)
            .then(() => setSaveState('saved'))
            .catch(() => setSaveState('error'));
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } : undefined}
      />
    );
  }

  if (currentStep === 0) {
    return (
      <IntroScreen
        config={config}
        testMode={testMode}
        onStart={() => {
          setCurrentStep(1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  if (currentStep === totalSteps + 1) {
    return (
      <ReviewScreen
        config={config}
        answers={answers}
        onEdit={(sectionIndex) => {
          setCurrentStep(sectionIndex + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onBack={() => {
          setCurrentStep(totalSteps);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSubmit={submitFromReview}
      />
    );
  }

  if (!currentSection) {
    return null;
  }

  function showValidationErrors(errors: { name: string; message: string }[]) {
    errors.forEach((error) => {
      setError(error.name as Path<DiscoveryAnswers>, {
        type: 'manual',
        message: error.message,
      });
    });
    window.setTimeout(() => {
      const errorElement = document.querySelector<HTMLElement>('.field-error');
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const fieldGroup = errorElement?.closest('.conditional-field') ?? errorElement?.closest('.form-question');
      fieldGroup?.querySelector<HTMLElement>('button, input, textarea')?.focus();
    }, 0);
  }

  function continueToNext() {
    clearErrors();
    const result = validateStep(currentStep - 1, getValues(), config);
    if (!result.valid) {
      showValidationErrors(result.errors);
      return;
    }

    setCurrentStep((step) => Math.min(totalSteps + 1, step + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function submitFromReview() {
    clearErrors();
    const result = validateAll(getValues(), config);
    if (!result.valid) {
      const firstError = result.errors[0];
      const [sectionIndexValue, fieldName] = firstError.name.split(':');
      const sectionIndex = Number(sectionIndexValue);
      setCurrentStep(sectionIndex + 1);
      showValidationErrors([
        { name: fieldName, message: firstError.message },
      ]);
      return;
    }

    const nextSubmittedAt = new Date().toISOString();
    const nextStep = totalSteps + 1;
    const finalAnswers = getValues();
    writeLocalState({
      token: initialState.token,
      isTest: testMode,
      currentStep: nextStep,
      answers: finalAnswers,
      status: 'SUBMITTED',
      updatedAt: nextSubmittedAt,
      submittedAt: nextSubmittedAt,
    });
    setSubmittedAt(nextSubmittedAt);
    setStatus('SUBMITTED');
    setCurrentStep(nextStep);
    if (isSupabaseConfigured) {
      setSaveState('saving');
      void saveRemoteState(initialState.token, nextStep, finalAnswers, 'SUBMITTED', nextSubmittedAt, testMode)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setCurrentStep((step) => Math.max(0, step - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="questionnaire-page">
      <div className="page-shell page-shell--questionnaire">
        <ProgressHeader
          logoPath={config.logoPath}
          sectionLabel={currentSection.label}
          step={currentStep}
          totalSteps={totalSteps}
          saveState={saveState}
          testMode={testMode}
        />

        <form
          className="questionnaire-form"
          onSubmit={(event) => {
            event.preventDefault();
            continueToNext();
          }}
        >
          <div className="section-heading">
            <h1>{currentSection.title}</h1>
            {currentSection.description ? <p>{currentSection.description}</p> : null}
          </div>

          <div className="question-list">
            {currentSection.questions.map((question) => (
              <div key={question.id}>
                <QuestionRenderer
                  question={question}
                  control={control}
                  errors={formState.errors}
                  answers={answers}
                  setValue={setValue}
                />
              </div>
            ))}
          </div>

          <div className="wizard-nav">
            <button className="button button--secondary" type="button" onClick={goBack}>
              Anterior
            </button>
            <button className="button button--primary" type="submit">
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

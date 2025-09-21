import type { FC, ReactNode } from 'react';

export interface WizardStep {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface Props {
  steps: WizardStep[];
  currentStep: string;
  onStepChange: (id: string) => void;
}

export const Wizard: FC<Props> = ({ steps, currentStep, onStepChange }) => {
  const active = steps.find((step) => step.id === currentStep) ?? steps[0];
  return (
    <div>
      <nav className="stepper" aria-label="Progreso del asistente">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => !step.disabled && onStepChange(step.id)}
            className={step.id === active.id ? 'active' : ''}
            aria-current={step.id === active.id}
            disabled={step.disabled}
          >
            {step.label}
          </button>
        ))}
      </nav>
      <div role="region" aria-live="polite">
        {active.content}
      </div>
    </div>
  );
};

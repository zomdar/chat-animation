import type { FormEvent, ReactNode } from "react";

type PromptSubmitHandler = () => Promise<void> | void;

interface PromptFormProps {
  onSubmit: PromptSubmitHandler;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export const PromptForm = ({
  onSubmit,
  disabled,
  children,
  className,
}: PromptFormProps) => {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    await onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`ai-prompt-form ${className ?? ""}`.trim()}
      data-disabled={disabled ? "" : undefined}
    >
      {children}
    </form>
  );
};

interface PromptFormSubmitProps {
  disabled?: boolean;
  label?: string;
}

export const PromptFormSubmit = ({
  disabled,
  label = "Send",
}: PromptFormSubmitProps) => (
  <button
    type="submit"
    className="ai-prompt-form__submit"
    disabled={disabled}
    aria-label={label}
  >
    {label}
  </button>
);

import React, { useState } from 'react';
import { useTheme } from '@/hooks';
import Button from '@/components/atoms/Button';

interface FormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  submitLabel?: string;
  resetLabel?: string;
  showReset?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Form: React.FC<FormProps> = ({
  onSubmit,
  loading = false,
  submitLabel = 'Submit',
  resetLabel = 'Reset',
  showReset = false,
  children,
  className = ''
}) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<any>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleReset = () => {
    setFormData({});
    const form = document.querySelector('form') as HTMLFormElement;
    form?.reset();
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.values.lg
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.values.sm,
    justifyContent: 'flex-end',
    paddingTop: theme.spacing.values.md,
    borderTop: `1px solid ${theme.colors.divider}`
  };

  return (
    <form className={className} style={formStyle} onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.values.md }}>
        {children}
      </div>
      
      <div style={actionsStyle}>
        {showReset && (
          <Button 
            type="button" 
            variant="tertiary" 
            onClick={handleReset}
            disabled={loading}
          >
            {resetLabel}
          </Button>
        )}
        <Button 
          type="submit" 
          variant="primary" 
          loading={loading}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default Form;
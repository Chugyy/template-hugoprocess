import React from 'react';

interface FormTemplateProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

const FormTemplate: React.FC<FormTemplateProps> = (props) => {
  return null;
};

export default FormTemplate;
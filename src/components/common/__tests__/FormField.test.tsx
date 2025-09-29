import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FormField, useFormValidation } from '../FormField';

// Mock component to test useFormValidation hook
const TestFormValidation: React.FC<{
  initialValues: any;
  validationRules: any;
  onSubmit: (values: any) => void;
}> = ({ initialValues, validationRules, onSubmit }) => {
  const { values, errors, touched, isSubmitting, setValue, setTouchedField, handleSubmit } = useFormValidation(
    initialValues,
    validationRules
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit); }}>
      <FormField
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={(value) => setValue('email', value)}
        onBlur={() => setTouchedField('email')}
        validation={validationRules.email}
        error={errors.email}
        touched={touched.email}
        required
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        value={values.password}
        onChange={(value) => setValue('password', value)}
        onBlur={() => setTouchedField('password')}
        validation={validationRules.password}
        error={errors.password}
        touched={touched.password}
        required
      />
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
      <div data-testid="errors">{JSON.stringify(errors)}</div>
      <div data-testid="values">{JSON.stringify(values)}</div>
    </form>
  );
};

describe('FormField', () => {
  describe('Basic Rendering', () => {
    it('renders with label and input', () => {
      render(
        <FormField
          label="Test Field"
          name="test"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(
        <FormField
          label="Required Field"
          name="required"
          value=""
          onChange={() => {}}
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders help text when provided', () => {
      render(
        <FormField
          label="Field with Help"
          name="help"
          value=""
          onChange={() => {}}
          helpText="This is helpful information"
        />
      );

      expect(screen.getByText('This is helpful information')).toBeInTheDocument();
    });
  });

  describe('Input Types', () => {
    it('renders text input by default', () => {
      render(
        <FormField
          label="Text Input"
          name="text"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('renders email input', () => {
      render(
        <FormField
          label="Email Input"
          name="email"
          type="email"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      render(
        <FormField
          label="Password Input"
          name="password"
          type="password"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByLabelText('Password Input')).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      render(
        <FormField
          label="Number Input"
          name="number"
          type="number"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    it('renders textarea', () => {
      render(
        <FormField
          label="Textarea"
          name="textarea"
          type="textarea"
          value=""
          onChange={() => {}}
          rows={5}
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });

    it('renders select with options', () => {
      const options = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
      ];

      render(
        <FormField
          label="Select Field"
          name="select"
          type="select"
          value=""
          onChange={() => {}}
          options={options}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when required field is empty', async () => {
      render(
        <FormField
          label="Required Field"
          name="required"
          value=""
          onChange={() => {}}
          validation={{ required: true }}
          touched={true}
        />
      );

      expect(screen.getByText('Required Field is required')).toBeInTheDocument();
    });

    it('shows error for invalid email format', async () => {
      render(
        <FormField
          label="Email Field"
          name="email"
          type="email"
          value="invalid-email"
          onChange={() => {}}
          validation={{ email: true }}
          touched={true}
        />
      );

      expect(screen.getByText('Email Field must be a valid email address')).toBeInTheDocument();
    });

    it('shows error for minimum length', async () => {
      render(
        <FormField
          label="Password Field"
          name="password"
          type="password"
          value="123"
          onChange={() => {}}
          validation={{ minLength: 8 }}
          touched={true}
        />
      );

      expect(screen.getByText('Password Field must be at least 8 characters')).toBeInTheDocument();
    });

    it('shows error for maximum length', async () => {
      render(
        <FormField
          label="Name Field"
          name="name"
          value="This is a very long name that exceeds the maximum length"
          onChange={() => {}}
          validation={{ maxLength: 20 }}
          touched={true}
        />
      );

      expect(screen.getByText('Name Field must be no more than 20 characters')).toBeInTheDocument();
    });

    it('shows error for pattern mismatch', async () => {
      render(
        <FormField
          label="Phone Field"
          name="phone"
          value="invalid-phone"
          onChange={() => {}}
          validation={{ pattern: /^\d{10}$/ }}
          touched={true}
        />
      );

      expect(screen.getByText('Phone Field format is invalid')).toBeInTheDocument();
    });

    it('shows error for custom validation', async () => {
      const customValidation = (value: string) => {
        if (value === 'forbidden') return 'This value is not allowed';
        return null;
      };

      render(
        <FormField
          label="Custom Field"
          name="custom"
          value="forbidden"
          onChange={() => {}}
          validation={{ custom: customValidation }}
          touched={true}
        />
      );

      expect(screen.getByText('This value is not allowed')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onChange when input value changes', () => {
      const mockOnChange = jest.fn();
      
      render(
        <FormField
          label="Test Field"
          name="test"
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(mockOnChange).toHaveBeenCalledWith('new value');
    });

    it('calls onBlur when input loses focus', () => {
      const mockOnBlur = jest.fn();
      
      render(
        <FormField
          label="Test Field"
          name="test"
          value=""
          onChange={() => {}}
          onBlur={mockOnBlur}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(mockOnBlur).toHaveBeenCalled();
    });

    it('clears error when user starts typing', async () => {
      render(
        <FormField
          label="Test Field"
          name="test"
          value=""
          onChange={() => {}}
          validation={{ required: true }}
          touched={true}
        />
      );

      // Error should be visible initially
      expect(screen.getByText('Test Field is required')).toBeInTheDocument();

      // Start typing
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'a' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Test Field is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('useFormValidation Hook', () => {
    it('manages form state correctly', async () => {
      const mockOnSubmit = jest.fn();
      const initialValues = { email: '', password: '' };
      const validationRules = {
        email: { required: true, email: true },
        password: { required: true, minLength: 8 },
      };

      render(
        <TestFormValidation
          initialValues={initialValues}
          validationRules={validationRules}
          onSubmit={mockOnSubmit}
        />
      );

      // Check initial state
      expect(screen.getByTestId('values')).toHaveTextContent('{"email":"","password":""}');
      expect(screen.getByTestId('errors')).toHaveTextContent('{}');

      // Fill in valid values
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      // Check that onSubmit was called with valid values
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('shows validation errors on submit', async () => {
      const mockOnSubmit = jest.fn();
      const initialValues = { email: '', password: '' };
      const validationRules = {
        email: { required: true, email: true },
        password: { required: true, minLength: 8 },
      };

      render(
        <TestFormValidation
          initialValues={initialValues}
          validationRules={validationRules}
          onSubmit={mockOnSubmit}
        />
      );

      // Submit without filling fields
      const submitButton = screen.getByRole('button', { name: 'Submit' });
      fireEvent.click(submitButton);

      // Check that errors are displayed
      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      // onSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper label association', () => {
      render(
        <FormField
          label="Accessible Field"
          name="accessible"
          value=""
          onChange={() => {}}
        />
      );

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Accessible Field');

      expect(input).toHaveAttribute('id', 'accessible');
      expect(label).toHaveAttribute('for', 'accessible');
    });

    it('has proper ARIA attributes for errors', () => {
      render(
        <FormField
          label="Field with Error"
          name="error"
          value=""
          onChange={() => {}}
          validation={{ required: true }}
          error="This field is required"
          touched={true}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('has proper ARIA attributes for disabled state', () => {
      render(
        <FormField
          label="Disabled Field"
          name="disabled"
          value=""
          onChange={() => {}}
          disabled
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });
});

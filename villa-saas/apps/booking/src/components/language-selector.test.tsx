import { render, screen } from '@testing-library/react';
import { LanguageSelector } from './language-selector';

// Mock the UI components
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value }: any) => <div data-testid="select" data-value={value}>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ children }: any) => <div>{children}</div>,
}));

describe('LanguageSelector', () => {
  it('should render with current locale', () => {
    render(<LanguageSelector />);
    
    const select = screen.getByTestId('select');
    expect(select).toHaveAttribute('data-value', 'fr');
  });

  it('should display language flags and names', () => {
    render(<LanguageSelector />);
    
    // Check if French is displayed
    expect(screen.getByText('🇫🇷')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
  });
});
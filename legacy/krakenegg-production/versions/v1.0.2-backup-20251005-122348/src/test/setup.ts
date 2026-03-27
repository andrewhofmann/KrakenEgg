import '@testing-library/jest-dom';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    button: 'button',
    input: 'input',
    textarea: 'textarea',
    form: 'form',
    span: 'span',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => {
  const MockIcon = ({ ...props }: any) => {
    return { type: 'div', props: { 'data-testid': 'mock-icon', ...props } };
  };

  return new Proxy({}, {
    get: () => MockIcon,
  });
});

// Mock CSS imports
vi.mock('../index.css', () => ({}));

// Setup global test environment
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLElement focus methods
HTMLElement.prototype.focus = vi.fn();
HTMLElement.prototype.blur = vi.fn();
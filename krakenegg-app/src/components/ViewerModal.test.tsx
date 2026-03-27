import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useStore } from '../store';
import { ViewerModal } from './ViewerModal';

vi.mock('react-syntax-highlighter', () => ({
  Prism: (props: any) => <pre data-testid="syntax-highlighter">{props.children}</pre>,
}));

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  darcula: {},
}));

beforeEach(() => {
  useStore.setState({
    viewer: {
      show: false,
      title: '',
      content: '',
      loading: false,
      error: null,
      isImage: false,
    },
  });
});

describe('ViewerModal', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<ViewerModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and content when show is true', () => {
    useStore.setState({
      viewer: {
        show: true,
        title: 'readme.md',
        content: '# Hello World',
        loading: false,
        error: null,
        isImage: false,
      },
    });

    render(<ViewerModal />);

    expect(screen.getByText('readme.md')).toBeInTheDocument();
    expect(screen.getByText('# Hello World')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    useStore.setState({
      viewer: {
        show: true,
        title: 'file.txt',
        content: '',
        loading: true,
        error: null,
        isImage: false,
      },
    });

    render(<ViewerModal />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useStore.setState({
      viewer: {
        show: true,
        title: 'file.txt',
        content: '',
        loading: false,
        error: 'Permission denied',
        isImage: false,
      },
    });

    render(<ViewerModal />);

    expect(screen.getByText('Error: Permission denied')).toBeInTheDocument();
  });

  it('renders an image when isImage is true', () => {
    useStore.setState({
      viewer: {
        show: true,
        title: 'photo.png',
        content: 'data:image/png;base64,abc123',
        loading: false,
        error: null,
        isImage: true,
      },
    });

    render(<ViewerModal />);

    const img = screen.getByAltText('photo.png');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123');
  });

  it('calls hideViewer when close button is clicked', () => {
    const hideViewer = vi.fn();

    useStore.setState({
      viewer: {
        show: true,
        title: 'file.txt',
        content: 'contents',
        loading: false,
        error: null,
        isImage: false,
      },
      hideViewer,
    });

    render(<ViewerModal />);

    // The close button is the only button in the header
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(hideViewer).toHaveBeenCalled();
  });

  it('uses syntax highlighting for code files', () => {
    useStore.setState({
      viewer: {
        show: true,
        title: 'app.tsx',
        content: 'const x = 1;',
        loading: false,
        error: null,
        isImage: false,
      },
    });

    render(<ViewerModal />);

    expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument();
    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });
});

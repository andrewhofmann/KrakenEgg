import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useStore } from '../store';
import { GoToPathModal } from './GoToPathModal';

beforeEach(() => {
  useStore.setState({
    goToPathModal: { show: false, initialPath: '' },
    activeSide: 'left',
  });
});

describe('GoToPathModal', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<GoToPathModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and input when show is true', () => {
    useStore.setState({
      goToPathModal: { show: true, initialPath: '/Users/test' },
    });

    render(<GoToPathModal />);

    expect(screen.getByText('Go To Path')).toBeInTheDocument();
    expect(screen.getByText('Enter the full path to navigate to:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/Users/test')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  it('calls setPath and hideGoToPathModal on Go click', () => {
    const setPath = vi.fn();
    const hideGoToPathModal = vi.fn();

    useStore.setState({
      goToPathModal: { show: true, initialPath: '/Users/test' },
      activeSide: 'left',
      setPath,
      hideGoToPathModal,
    });

    render(<GoToPathModal />);

    const input = screen.getByDisplayValue('/Users/test');
    fireEvent.change(input, { target: { value: '/Users/new-path' } });
    fireEvent.click(screen.getByText('Go'));

    expect(setPath).toHaveBeenCalledWith('left', '/Users/new-path');
    expect(hideGoToPathModal).toHaveBeenCalled();
  });

  it('calls hideGoToPathModal on Cancel click', () => {
    const hideGoToPathModal = vi.fn();

    useStore.setState({
      goToPathModal: { show: true, initialPath: '' },
      hideGoToPathModal,
    });

    render(<GoToPathModal />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(hideGoToPathModal).toHaveBeenCalled();
  });

  it('confirms on Enter key press', () => {
    const setPath = vi.fn();
    const hideGoToPathModal = vi.fn();

    useStore.setState({
      goToPathModal: { show: true, initialPath: '/tmp' },
      activeSide: 'right',
      setPath,
      hideGoToPathModal,
    });

    render(<GoToPathModal />);

    const input = screen.getByDisplayValue('/tmp');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(setPath).toHaveBeenCalledWith('right', '/tmp');
    expect(hideGoToPathModal).toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const hideGoToPathModal = vi.fn();

    useStore.setState({
      goToPathModal: { show: true, initialPath: '/tmp' },
      hideGoToPathModal,
    });

    render(<GoToPathModal />);

    const input = screen.getByDisplayValue('/tmp');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(hideGoToPathModal).toHaveBeenCalled();
  });

  it('uses activeSide when calling setPath', () => {
    const setPath = vi.fn();
    const hideGoToPathModal = vi.fn();

    useStore.setState({
      goToPathModal: { show: true, initialPath: '/home' },
      activeSide: 'right',
      setPath,
      hideGoToPathModal,
    });

    render(<GoToPathModal />);

    fireEvent.click(screen.getByText('Go'));

    expect(setPath).toHaveBeenCalledWith('right', '/home');
  });
});

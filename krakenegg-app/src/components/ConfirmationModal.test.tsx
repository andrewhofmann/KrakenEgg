import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useStore } from '../store';
import { ConfirmationModal } from './ConfirmationModal';

// ConfirmationModal uses @radix-ui/react-dialog which needs portal mocking
// Radix Dialog renders into a portal; we need to allow it in jsdom
beforeEach(() => {
  useStore.setState({
    confirmation: {
      show: false,
      title: '',
      message: '',
      showConflictOptions: false,
      onConfirm: vi.fn(),
    },
  });
});

describe('ConfirmationModal', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<ConfirmationModal />);
    // Radix Dialog with open=false should not render content
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('renders title and message when show is true', () => {
    useStore.setState({
      confirmation: {
        show: true,
        title: 'Delete Files',
        message: 'Are you sure you want to delete 3 files?',
        showConflictOptions: false,
        onConfirm: vi.fn(),
      },
    });

    render(<ConfirmationModal />);

    expect(screen.getByText('Delete Files')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete 3 files?')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('calls onConfirm and closeConfirmation when Confirm is clicked', () => {
    const onConfirm = vi.fn();
    const closeConfirmation = vi.fn();

    useStore.setState({
      confirmation: {
        show: true,
        title: 'Confirm Action',
        message: 'Proceed?',
        showConflictOptions: false,
        onConfirm,
      },
      closeConfirmation,
    });

    render(<ConfirmationModal />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledWith(undefined);
    expect(closeConfirmation).toHaveBeenCalled();
  });

  it('calls closeConfirmation when Cancel is clicked', () => {
    const closeConfirmation = vi.fn();

    useStore.setState({
      confirmation: {
        show: true,
        title: 'Confirm',
        message: 'Cancel test',
        showConflictOptions: false,
        onConfirm: vi.fn(),
      },
      closeConfirmation,
    });

    render(<ConfirmationModal />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(closeConfirmation).toHaveBeenCalled();
  });

  it('shows conflict options when showConflictOptions is true', () => {
    useStore.setState({
      confirmation: {
        show: true,
        title: 'Copy Files',
        message: 'Some files already exist.',
        showConflictOptions: true,
        onConfirm: vi.fn(),
      },
    });

    render(<ConfirmationModal />);

    expect(screen.getByText('Conflict Resolution')).toBeInTheDocument();
    expect(screen.getByText('Ask for each conflict (Default)')).toBeInTheDocument();
    expect(screen.getByText('Overwrite All')).toBeInTheDocument();
    expect(screen.getByText('Skip Existing')).toBeInTheDocument();
    expect(screen.getByText('Overwrite only if newer')).toBeInTheDocument();
  });

  it('passes selected conflict strategy to onConfirm', () => {
    const onConfirm = vi.fn();
    const closeConfirmation = vi.fn();

    useStore.setState({
      confirmation: {
        show: true,
        title: 'Copy Files',
        message: 'Conflict detected.',
        showConflictOptions: true,
        onConfirm,
      },
      closeConfirmation,
    });

    render(<ConfirmationModal />);

    // Select "Overwrite All"
    fireEvent.click(screen.getByLabelText('Overwrite All'));

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledWith('overwrite');
    expect(closeConfirmation).toHaveBeenCalled();
  });

  it('defaults conflict strategy to "prompt"', () => {
    const onConfirm = vi.fn();
    const closeConfirmation = vi.fn();

    useStore.setState({
      confirmation: {
        show: true,
        title: 'Copy',
        message: 'Conflict.',
        showConflictOptions: true,
        onConfirm,
      },
      closeConfirmation,
    });

    render(<ConfirmationModal />);

    // Without changing the radio, click Confirm
    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledWith('prompt');
  });
});

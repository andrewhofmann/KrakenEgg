import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useStore } from '../store';
import { InputModal } from './InputModal';

beforeEach(() => {
  useStore.setState({
    inputModal: {
      show: false,
      title: '',
      message: '',
      initialValue: '',
      onConfirm: vi.fn(),
    },
  });
});

describe('InputModal', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<InputModal />);
    expect(container.firstChild).toBeNull();
  });

  it('renders title and message when show is true', () => {
    useStore.setState({
      inputModal: {
        show: true,
        title: 'Rename File',
        message: 'Enter new filename:',
        initialValue: 'old-name.txt',
        onConfirm: vi.fn(),
      },
    });

    render(<InputModal />);

    expect(screen.getByText('Rename File')).toBeInTheDocument();
    expect(screen.getByText('Enter new filename:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('old-name.txt')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('calls onConfirm with current value and closes on OK click', () => {
    const onConfirm = vi.fn();
    const closeInputModal = vi.fn();

    useStore.setState({
      inputModal: {
        show: true,
        title: 'New Folder',
        message: 'Enter folder name:',
        initialValue: 'new-folder',
        onConfirm,
      },
      closeInputModal,
    });

    render(<InputModal />);

    const input = screen.getByDisplayValue('new-folder');
    fireEvent.change(input, { target: { value: 'my-folder' } });
    fireEvent.click(screen.getByText('OK'));

    expect(onConfirm).toHaveBeenCalledWith('my-folder');
    expect(closeInputModal).toHaveBeenCalled();
  });

  it('calls closeInputModal on Cancel click', () => {
    const closeInputModal = vi.fn();

    useStore.setState({
      inputModal: {
        show: true,
        title: 'Test',
        message: 'Test message',
        initialValue: '',
        onConfirm: vi.fn(),
      },
      closeInputModal,
    });

    render(<InputModal />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(closeInputModal).toHaveBeenCalled();
  });

  it('confirms on Enter key press', () => {
    const onConfirm = vi.fn();
    const closeInputModal = vi.fn();

    useStore.setState({
      inputModal: {
        show: true,
        title: 'Test',
        message: 'Enter value:',
        initialValue: 'test-value',
        onConfirm,
      },
      closeInputModal,
    });

    render(<InputModal />);

    const input = screen.getByDisplayValue('test-value');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onConfirm).toHaveBeenCalledWith('test-value');
    expect(closeInputModal).toHaveBeenCalled();
  });

  it('closes on Escape key press', () => {
    const closeInputModal = vi.fn();

    useStore.setState({
      inputModal: {
        show: true,
        title: 'Test',
        message: 'Test',
        initialValue: '',
        onConfirm: vi.fn(),
      },
      closeInputModal,
    });

    render(<InputModal />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(closeInputModal).toHaveBeenCalled();
  });

  it('updates input value on typing', () => {
    useStore.setState({
      inputModal: {
        show: true,
        title: 'Test',
        message: 'Type something:',
        initialValue: '',
        onConfirm: vi.fn(),
      },
    });

    render(<InputModal />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'hello world' } });

    expect(screen.getByDisplayValue('hello world')).toBeInTheDocument();
  });
});

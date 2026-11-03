import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CameraBarcodeModal } from '../camera-barcode-modal';

describe('CameraBarcodeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnScan = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when open is false', () => {
    render(
      <CameraBarcodeModal
        open={false}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );
    expect(screen.queryByTestId('camera-barcode-modal')).not.toBeInTheDocument();
  });

  it('renders correctly when open', () => {
    render(
      <CameraBarcodeModal
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
        title="Custom Camera Scan"
      />
    );
    expect(screen.getByTestId('camera-barcode-modal')).toBeInTheDocument();
    expect(screen.getByText('Custom Camera Scan')).toBeInTheDocument();
    expect(screen.getByTestId('camera-barcode-close-btn')).toBeInTheDocument();
  });

  it('invokes onClose when close button is clicked', () => {
    render(
      <CameraBarcodeModal
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );
    fireEvent.click(screen.getByTestId('camera-barcode-close-btn'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows manual/simulated barcode input and invokes onScan + onClose', () => {
    render(
      <CameraBarcodeModal
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    const input = screen.getByTestId('camera-barcode-simulate-input');
    const applyBtn = screen.getByTestId('camera-barcode-simulate-btn');

    expect(applyBtn).toBeDisabled();

    fireEvent.change(input, { target: { value: '890103000005' } });
    expect(applyBtn).not.toBeDisabled();

    fireEvent.click(applyBtn);
    expect(mockOnScan).toHaveBeenCalledWith('890103000005');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('applies simulated barcode when Enter key is pressed in input', () => {
    render(
      <CameraBarcodeModal
        open={true}
        onClose={mockOnClose}
        onScan={mockOnScan}
      />
    );

    const input = screen.getByTestId('camera-barcode-simulate-input');
    fireEvent.change(input, { target: { value: '8901234567890' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockOnScan).toHaveBeenCalledWith('8901234567890');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

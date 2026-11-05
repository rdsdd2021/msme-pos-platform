import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductPhotoUpload } from '../product-photo-upload';

describe('ProductPhotoUpload', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload dropzone when no imageUrl is provided', () => {
    render(<ProductPhotoUpload imageUrl={null} onChange={mockOnChange} />);

    expect(screen.getByTestId('product-photo-upload')).toBeInTheDocument();
    expect(screen.getByText('Add Product Photo')).toBeInTheDocument();
    expect(screen.getByText('Search from Internet')).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
    expect(screen.getByText('Choose File')).toBeInTheDocument();
    expect(screen.queryByTestId('product-photo-preview')).not.toBeInTheDocument();
  });

  it('renders image preview and remove button when imageUrl is provided', () => {
    const testImageUrl = 'data:image/jpeg;base64,mockimagedata123';
    render(<ProductPhotoUpload imageUrl={testImageUrl} onChange={mockOnChange} />);

    const preview = screen.getByTestId('product-photo-preview');
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute('src', testImageUrl);
    expect(screen.getByText('Product Photo Added')).toBeInTheDocument();

    const removeBtn = screen.getByTestId('product-photo-remove-btn');
    expect(removeBtn).toBeInTheDocument();

    fireEvent.click(removeBtn);
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('handles drag over and drag leave states', () => {
    const { container } = render(<ProductPhotoUpload imageUrl={null} onChange={mockOnChange} />);
    const dropzone = container.querySelector('.border-dashed')!;

    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass('border-emerald-500');

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('border-emerald-500');
  });
});


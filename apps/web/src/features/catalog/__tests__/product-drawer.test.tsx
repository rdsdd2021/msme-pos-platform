import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDrawer, ProductFormData } from '../product-drawer';

describe('ProductDrawer with Camera Barcode & Photo Upload', () => {
  const initialData: ProductFormData = {
    open: true,
    mode: 'create',
    name: 'Fortune Sunflower Oil 1L',
    sku: 'GROC-004',
    barcodePrimary: '',
    imageUrl: null,
    categoryId: 'cat-1',
    baseUnitId: 'unit-1',
    purchaseCost: '140.00',
    sellingPrice: '165.00',
    mrp: '180.00',
    hsnCode: '15121110',
    gstRatePercent: '5.00',
    packageSize: '1 L',
    openingStockQuantity: '',
    openingStockBranchId: '',
  };

  const categories = [{ id: 'cat-1', tenantId: 't-1', name: 'Edible Oils', code: 'OIL', parentId: null, sortOrder: 1, isActive: true }];
  const units = [{ id: 'unit-1', tenantId: 't-1', name: 'Litre', symbol: 'L', decimalPlaces: 2, isBase: true, isActive: true }];
  const branches = [{ id: 'br-1', tenantId: 't-1', name: 'Main Store', code: 'MAIN', address: 'Market Road', isDefault: true, isActive: true }];

  function TestWrapper({ onSave = jest.fn().mockResolvedValue(undefined) }) {
    const [data, setData] = useState<ProductFormData>(initialData);
    return (
      <ProductDrawer
        open={true}
        onClose={jest.fn()}
        data={data}
        setData={setData}
        categories={categories}
        units={units}
        branches={branches}
        activeBranch={branches[0]}
        onSave={onSave}
      />
    );
  }

  it('renders photo upload section and scan camera button in Basic Details tab', () => {
    render(<TestWrapper />);

    expect(screen.getByTestId('product-photo-upload')).toBeInTheDocument();
    expect(screen.getByTestId('product-scan-barcode-btn')).toBeInTheDocument();
    expect(screen.getByTestId('product-barcode-input')).toHaveValue('');
  });

  it('opens CameraBarcodeModal when Scan Camera button is clicked and updates barcode field', () => {
    render(<TestWrapper />);

    // Initially camera modal is closed
    expect(screen.queryByTestId('camera-barcode-modal')).not.toBeInTheDocument();

    // Click "Scan Camera" button
    fireEvent.click(screen.getByTestId('product-scan-barcode-btn'));

    // Camera modal opens
    expect(screen.getByTestId('camera-barcode-modal')).toBeInTheDocument();

    // Simulate scanning barcode via fallback test input
    const simInput = screen.getByTestId('camera-barcode-simulate-input');
    const applyBtn = screen.getByTestId('camera-barcode-simulate-btn');
    fireEvent.change(simInput, { target: { value: '8901234567890' } });
    fireEvent.click(applyBtn);

    // Modal closes and barcode input is auto-populated
    expect(screen.queryByTestId('camera-barcode-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('product-barcode-input')).toHaveValue('8901234567890');
  });
});

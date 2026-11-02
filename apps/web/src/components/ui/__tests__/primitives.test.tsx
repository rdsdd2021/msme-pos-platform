import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';
import { Input } from '../input';
import { Badge } from '../badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs';
import { Skeleton } from '../skeleton';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Shadcn UI Core Primitives', () => {
  it('renders Button with variants and handles click events', () => {
    const handleClick = jest.fn();
    render(
      <div>
        <Button variant="default" onClick={handleClick}>Primary Action</Button>
        <Button variant="destructive">Delete Item</Button>
        <Button variant="success">Complete Sale</Button>
        <Button variant="outline" disabled>Disabled Action</Button>
      </div>
    );

    const primaryBtn = screen.getByText('Primary Action');
    expect(primaryBtn).toBeInTheDocument();
    fireEvent.click(primaryBtn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Delete Item')).toHaveClass('bg-destructive');
    expect(screen.getByText('Complete Sale')).toHaveClass('bg-emerald-600');
    expect(screen.getByText('Disabled Action')).toBeDisabled();
  });

  it('renders Input and accepts user typing', () => {
    render(<Input placeholder="Scan barcode or enter SKU..." data-testid="test-input" />);
    const input = screen.getByTestId('test-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Scan barcode or enter SKU...');

    fireEvent.change(input, { target: { value: '8901234567890' } });
    expect(input).toHaveValue('8901234567890');
  });

  it('renders Badges with semantic status variants', () => {
    render(
      <div>
        <Badge variant="success">In Stock</Badge>
        <Badge variant="warning">Low Stock</Badge>
        <Badge variant="destructive">Out of Stock</Badge>
      </div>
    );

    expect(screen.getByText('In Stock')).toHaveClass('bg-emerald-50');
    expect(screen.getByText('Low Stock')).toHaveClass('bg-amber-50');
    expect(screen.getByText('Out of Stock')).toHaveClass('bg-destructive');
  });

  it('renders Card with Header, Title, Description, and Content', () => {
    render(
      <Card data-testid="test-card">
        <CardHeader>
          <CardTitle>Daily Sales Summary</CardTitle>
          <CardDescription>Real-time register totals</CardDescription>
        </CardHeader>
        <CardContent>
          <span data-testid="card-body">₹14,250.00</span>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Daily Sales Summary')).toBeInTheDocument();
    expect(screen.getByText('Real-time register totals')).toBeInTheDocument();
    expect(screen.getByTestId('card-body')).toHaveTextContent('₹14,250.00');
  });

  it('renders Table structure correctly with tabular data', () => {
    render(
      <Table data-testid="test-table">
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-mono">OIL-1L</TableCell>
            <TableCell>Fortune Sunflower Oil</TableCell>
            <TableCell className="text-right font-mono font-semibold">₹140.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('OIL-1L')).toBeInTheDocument();
    expect(screen.getByText('Fortune Sunflower Oil')).toBeInTheDocument();
    expect(screen.getByText('₹140.00')).toBeInTheDocument();
  });

  it('renders Tabs and toggles content on selection', () => {
    render(
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
        </TabsList>
        <TabsContent value="products">Product Catalog View</TabsContent>
        <TabsContent value="stock">Stock Balances View</TabsContent>
      </Tabs>
    );

    expect(screen.getByText('Product Catalog View')).toBeInTheDocument();
    expect(screen.queryByText('Stock Balances View')).not.toBeInTheDocument();

    const stockTab = screen.getByRole('tab', { name: 'Stock' });
    fireEvent.keyDown(stockTab, { key: 'Enter', code: 'Enter' });
    expect(stockTab).toHaveAttribute('data-state', 'active');
  });

  it('renders Skeleton with pulse animation class', () => {
    render(<Skeleton data-testid="test-skeleton" className="h-6 w-32" />);
    const skeleton = screen.getByTestId('test-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('renders Alert with Title and Description', () => {
    render(
      <Alert variant="warning">
        <AlertTitle>Branch GSTIN Unconfigured</AlertTitle>
        <AlertDescription>Invoices are currently marked as UNREGISTERED.</AlertDescription>
      </Alert>
    );

    expect(screen.getByText('Branch GSTIN Unconfigured')).toBeInTheDocument();
    expect(screen.getByText(/Invoices are currently marked/i)).toBeInTheDocument();
  });
});

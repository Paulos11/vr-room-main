import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

/**
 * Defines the shape of the coupon object.
 * For better type safety, you could potentially import this type
 * directly from your Prisma client if it's generated.
 * e.g., import type { Coupon } from '@prisma/client'
 */
interface Coupon {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

/**
 * Defines the props for the CouponCard component.
 */
interface CouponCardProps {
  coupon: Coupon;
  // You might also want a function to refetch data after deletion
  // onCouponDeleted?: (couponId: string) => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon }) => {
  
  /**
   * Handles the click event for the delete button.
   * Sends a DELETE request to the server.
   */
  const handleDelete = async () => {
    // It's good practice to ask for confirmation before a destructive action.
    // const confirmed = window.confirm(`Are you sure you want to delete the coupon "${coupon.code}"?`);
    // if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Coupon deleted successfully.',
        });
        // Call the parent function to update the UI
        // if (onCouponDeleted) {
        //   onCouponDeleted(coupon.id);
        // }
      } else {
        throw new Error(data.message || 'Failed to delete coupon');
      }
    } catch (error: any) {
       toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="border bg-card text-card-foreground p-4 rounded-lg shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{coupon.code}</h3>
          <p className="text-sm text-muted-foreground">{coupon.name}</p>
        </div>
        <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
          {coupon.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => { /* TODO: Open an edit dialog/modal here */ }}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
};

export default CouponCard;

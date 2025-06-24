import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Zod schema for client-side form validation
const CouponSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters long").toUpperCase(),
  name: z.string().min(3, "Name is required"),
  discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  discountValue: z.coerce.number().min(0, "Discount value cannot be negative"),
  validFrom: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  validTo: z.string().optional(),
  isActive: z.boolean().default(true),
  maxUses: z.coerce.number().optional(),
});

type CouponFormData = z.infer<typeof CouponSchema>;

interface CreateCouponFormProps {
  // Function to call on successful coupon creation, e.g., to close a dialog or refresh data.
  onSuccess: () => void;
}

const CreateCouponForm: React.FC<CreateCouponFormProps> = ({ onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, control, setValue } = useForm<CouponFormData>({
    resolver: zodResolver(CouponSchema),
    defaultValues: {
      discountType: 'PERCENTAGE',
      isActive: true,
    }
  });

  const processSubmit = async (formData: CouponFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create coupon.');
      }

      toast({
        title: 'Success!',
        description: `Coupon "${data.coupon.code}" has been created.`,
      });
      onSuccess(); // Call the callback to signal success

    } catch (error: any) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="code" className="text-right">Code</Label>
        <div className="col-span-3">
          <Input id="code" {...register("code")} className="uppercase" />
          {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <div className="col-span-3">
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="discountType" className="text-right">Discount Type</Label>
        <div className="col-span-3">
           <Select onValueChange={(value) => setValue('discountType', value as 'PERCENTAGE' | 'FIXED_AMOUNT')} defaultValue="PERCENTAGE">
            <SelectTrigger>
              <SelectValue placeholder="Select discount type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">Percentage</SelectItem>
              <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="discountValue" className="text-right">Value</Label>
        <div className="col-span-3">
          <Input id="discountValue" type="number" step="0.01" {...register("discountValue")} />
          {errors.discountValue && <p className="text-red-500 text-xs mt-1">{errors.discountValue.message}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="validFrom" className="text-right">Valid From</Label>
        <div className="col-span-3">
            <Input id="validFrom" type="date" {...register("validFrom")} />
            {errors.validFrom && <p className="text-red-500 text-xs mt-1">{errors.validFrom.message}</p>}
        </div>
      </div>
      
       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="validTo" className="text-right">Valid To</Label>
        <div className="col-span-3">
            <Input id="validTo" type="date" {...register("validTo")} />
             {errors.validTo && <p className="text-red-500 text-xs mt-1">{errors.validTo.message}</p>}
        </div>
      </div>

       <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="maxUses" className="text-right">Max Uses</Label>
        <div className="col-span-3">
          <Input id="maxUses" type="number" placeholder="Unlimited" {...register("maxUses")} />
        </div>
      </div>

      <div className="flex items-center justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Coupon'}
        </Button>
      </div>
    </form>
  );
};

export default CreateCouponForm;

import { z } from 'zod'

// User validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Address validation schemas
export const addressSchema = z.object({
  name: z.string().min(1, 'Address name is required').max(50, 'Name must be less than 50 characters'),
  street: z.string().min(1, 'Street address is required').max(100, 'Street address must be less than 100 characters'),
  city: z.string().min(1, 'City is required').max(50, 'City must be less than 50 characters'),
  zipCode: z.string().min(1, 'ZIP code is required').max(10, 'ZIP code must be less than 10 characters'),
  country: z.string().min(1, 'Country is required').max(50, 'Country must be less than 50 characters'),
  instructions: z.string().max(200, 'Instructions must be less than 200 characters').optional(),
  isDefault: z.boolean().default(false),
})

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Order validation schemas
export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productSizeId: z.string().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Quantity cannot exceed 10'),
  toppings: z.array(z.string()).default([]),
  specialInstructions: z.string().max(500, 'Special instructions must be less than 500 characters').optional(),
})

export const createOrderSchema = z.object({
  addressId: z.string().min(1, 'Delivery address is required'),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE'], {
    message: 'Payment method is required',
  }),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  couponCode: z.string().max(50, 'Coupon code must be less than 50 characters').optional(),
})

// Review validation schema
export const reviewSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().max(1000, 'Comment must be less than 1000 characters').optional(),
  deliveryRating: z.number().min(1, 'Delivery rating must be at least 1').max(5, 'Delivery rating cannot exceed 5').optional(),
  foodRating: z.number().min(1, 'Food rating must be at least 1').max(5, 'Food rating cannot exceed 5').optional(),
})

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject must be less than 100 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message must be less than 1000 characters'),
})

// Admin validation schemas
export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['CUSTOMER', 'ADMIN', 'DELIVERY_DRIVER', 'KITCHEN_STAFF'], {
    message: 'Role is required',
  }),
})

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'], {
    message: 'Status is required',
  }),
  message: z.string().max(500, 'Message must be less than 500 characters').optional(),
})

export const storeSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required').max(100, 'Store name must be less than 100 characters').optional(),
  phoneNumber: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  deliveryRadius: z.number().min(0, 'Delivery radius must be positive').max(100, 'Delivery radius cannot exceed 100 km').optional(),
  minOrderAmount: z.number().min(0, 'Minimum order amount must be positive').optional(),
  deliveryFee: z.number().min(0, 'Delivery fee must be positive').optional(),
  freeDeliveryThreshold: z.number().min(0, 'Free delivery threshold must be positive').optional(),
  taxRate: z.number().min(0, 'Tax rate must be positive').max(1, 'Tax rate cannot exceed 100%').optional(),
  isOpen: z.boolean().optional(),
  estimatedDeliveryTime: z.number().min(10, 'Estimated delivery time must be at least 10 minutes').max(120, 'Estimated delivery time cannot exceed 120 minutes').optional(),
})

// Product validation schemas
export const productSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  categoryId: z.string().optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
})

// Coupon validation schema
export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(50, 'Coupon code must be less than 50 characters'),
})

// Driver validation schemas
export const updateDriverLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export const driverProfileSchema = z.object({
  licenseNumber: z.string().min(1, 'License number is required').max(50, 'License number must be less than 50 characters'),
  vehicleType: z.string().min(1, 'Vehicle type is required').max(50, 'Vehicle type must be less than 50 characters'),
  vehiclePlate: z.string().min(1, 'Vehicle plate is required').max(20, 'Vehicle plate must be less than 20 characters'),
})

// Common validation helpers
export const idSchema = z.string().min(1, 'ID is required')
export const emailSchema = z.string().email('Invalid email address')
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
export const priceSchema = z.number().min(0, 'Price must be positive')

// Form field validation
export const requiredString = (fieldName: string, minLength = 1) => 
  z.string().min(minLength, `${fieldName} is required`)

export const optionalString = (maxLength = 255) => 
  z.string().max(maxLength).optional()

export const positiveNumber = (fieldName: string) => 
  z.number().min(0, `${fieldName} must be positive`)

export const requiredEmail = z.string().email('Invalid email address')

// Type exports for TypeScript inference
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type ProductSearchInput = z.infer<typeof productSearchSchema> 

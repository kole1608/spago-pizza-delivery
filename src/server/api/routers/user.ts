import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc'

export const userRouter = createTRPCRouter({
  getAddresses: protectedProcedure
    .query(async ({ ctx }) => {
      const addresses = await ctx.db.address.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' },
        ],
      })

      return addresses
    }),

  addAddress: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      street: z.string().min(1),
      city: z.string().min(1),
      zipCode: z.string().min(1),
      country: z.string().default('Serbia'),
      instructions: z.string().optional(),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await ctx.db.address.updateMany({
          where: { userId: ctx.session.user.id },
          data: { isDefault: false },
        })
      }

      const address = await ctx.db.address.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      })

      return address
    }),

  updateAddress: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      street: z.string().min(1).optional(),
      city: z.string().min(1).optional(),
      zipCode: z.string().min(1).optional(),
      country: z.string().optional(),
      instructions: z.string().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Verify address belongs to user
      const existingAddress = await ctx.db.address.findFirst({
        where: { id, userId: ctx.session.user.id },
      })

      if (!existingAddress) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Address not found',
        })
      }

      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await ctx.db.address.updateMany({
          where: { userId: ctx.session.user.id, id: { not: id } },
          data: { isDefault: false },
        })
      }

      const address = await ctx.db.address.update({
        where: { id },
        data: updateData,
      })

      return address
    }),

  deleteAddress: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify address belongs to user
      const address = await ctx.db.address.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      })

      if (!address) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Address not found',
        })
      }

      await ctx.db.address.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      })

      return user
    }),
}) 

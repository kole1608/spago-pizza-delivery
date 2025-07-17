import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import bcrypt from 'bcryptjs'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/lib/trpc'

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        })
      }

      const hashedPassword = await bcrypt.hash(input.password, 12)

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          password: hashedPassword,
          phone: input.phone,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

      return user
    }),

  getSession: protectedProcedure
    .query(({ ctx }) => {
      return ctx.session
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      })

      return user
    }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { password: true },
      })

      if (!user?.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User does not have a password set',
        })
      }

      const isValidPassword = await bcrypt.compare(input.currentPassword, user.password)

      if (!isValidPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        })
      }

      const hashedNewPassword = await bcrypt.hash(input.newPassword, 12)

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { password: hashedNewPassword },
      })

      return { success: true }
    }),
}) 

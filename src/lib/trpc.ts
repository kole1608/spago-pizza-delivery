'use server'

import { initTRPC, TRPCError } from '@trpc/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { db } from './db'
import { ZodError } from 'zod'
import superjson from 'superjson'

// Create context for tRPC
export const createTRPCContext = async (opts: { req: Request; headers: Headers }) => {
  const session = await getServerSession(authOptions)

  return {
    db,
    session,
    req: opts.req,
    headers: opts.headers,
  }
}

// Initialize tRPC
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

// Export reusable router and procedure helpers
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

// Protected procedure
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    return next({
      ctx: {
        ...ctx,
        session: { ...ctx.session, user: ctx.session.user },
      },
    })
  })
)

// Admin procedure
export const adminProcedure = protectedProcedure.use(
  t.middleware(({ ctx, next }) => {
    if (ctx.session?.user.role !== 'ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
    return next({ ctx })
  })
)

// Kitchen staff procedure
export const kitchenProcedure = protectedProcedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user || !['ADMIN', 'KITCHEN_STAFF'].includes(ctx.session.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
    return next({ ctx })
  })
)

// Delivery driver procedure
export const driverProcedure = protectedProcedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user || !['ADMIN', 'DELIVERY_DRIVER'].includes(ctx.session.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
    return next({ ctx })
  })
) 

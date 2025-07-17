import { createTRPCRouter } from '@/lib/trpc'
import { authRouter } from './routers/auth'
import { productsRouter } from './routers/products'
import { ordersRouter } from './routers/orders'
import { adminRouter } from './routers/admin'
import { userRouter } from './routers/user'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  products: productsRouter,
  orders: ordersRouter,
  admin: adminRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter 

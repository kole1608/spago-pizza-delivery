import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/lib/trpc'

export const productsRouter = createTRPCRouter({
  getCategories: publicProcedure
    .query(async ({ ctx }) => {
      const categories = await ctx.db.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          products: {
            where: { status: 'ACTIVE' },
            orderBy: { sortOrder: 'asc' },
            include: {
              sizes: {
                orderBy: { size: 'asc' },
              },
              toppings: {
                include: {
                  topping: true,
                },
              },
            },
          },
        },
      })

      return categories
    }),

  getProduct: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
        include: {
          category: true,
          sizes: {
            orderBy: { size: 'asc' },
          },
          toppings: {
            include: {
              topping: true,
            },
          },
        },
      })

      return product
    }),

  getMenu: publicProcedure
    .query(async ({ ctx }) => {
      const products = await ctx.db.product.findMany({
        where: { status: 'ACTIVE' },
        orderBy: [
          { category: { sortOrder: 'asc' } },
          { sortOrder: 'asc' },
        ],
        include: {
          category: true,
          sizes: {
            orderBy: { size: 'asc' },
          },
          toppings: {
            include: {
              topping: true,
            },
          },
        },
      })

      return products
    }),

  getToppings: publicProcedure
    .query(async ({ ctx }) => {
      const toppings = await ctx.db.topping.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })

      return toppings
    }),

  searchProducts: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      categoryId: z.string().optional(),
      isVegetarian: z.boolean().optional(),
      isVegan: z.boolean().optional(),
      isGlutenFree: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        status: 'ACTIVE' as const,
        OR: [
          { name: { contains: input.query, mode: 'insensitive' as const } },
          { description: { contains: input.query, mode: 'insensitive' as const } },
        ],
        ...(input.categoryId && { categoryId: input.categoryId }),
        ...(input.isVegetarian !== undefined && { isVegetarian: input.isVegetarian }),
        ...(input.isVegan !== undefined && { isVegan: input.isVegan }),
        ...(input.isGlutenFree !== undefined && { isGlutenFree: input.isGlutenFree }),
      }

      const products = await ctx.db.product.findMany({
        where,
        include: {
          category: true,
          sizes: {
            orderBy: { size: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      })

      return products
    }),

  getFeaturedProducts: publicProcedure
    .query(async ({ ctx }) => {
      // Get products with highest ratings or most popular
      const products = await ctx.db.product.findMany({
        where: { status: 'ACTIVE' },
        take: 8,
        orderBy: { sortOrder: 'asc' },
        include: {
          category: true,
          sizes: {
            orderBy: { size: 'asc' },
          },
        },
      })

      return products
    }),

  getProductsByCategory: publicProcedure
    .input(z.object({
      categoryId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const products = await ctx.db.product.findMany({
        where: {
          categoryId: input.categoryId,
          status: 'ACTIVE',
        },
        orderBy: { sortOrder: 'asc' },
        include: {
          category: true,
          sizes: {
            orderBy: { size: 'asc' },
          },
        },
      })

      return products
    }),
}) 

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { db } from "../db";
import { products, leads, sales } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const productsRouter = router({
  // List all active products
  list: publicProcedure.query(async () => {
    const allProducts = await db.query.products.findMany({
      where: eq(products.isActive, 1),
    });
    return allProducts;
  }),

  // Get single product by slug
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const product = await db.query.products.findFirst({
        where: eq(products.slug, input.slug),
      });
      return product;
    }),

  // Create lead (email capture)
  createLead: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const lead = await db.insert(leads).values({
        productId: input.productId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        source: "landing_page",
        status: "pending",
      });
      return lead;
    }),

  // Record sale/download
  recordSale: publicProcedure
    .input(
      z.object({
        productId: z.number(),
        email: z.string().email(),
        leadId: z.number().optional(),
        amount: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const sale = await db.insert(sales).values({
        productId: input.productId,
        leadId: input.leadId,
        email: input.email,
        amount: input.amount,
        status: "completed",
        downloadCount: 0,
      });
      return sale;
    }),

  // Get sales for admin
  getSales: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const allSales = await db.query.sales.findMany();
    return allSales;
  }),

  // Get leads for admin
  getLeads: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const allLeads = await db.query.leads.findMany();
    return allLeads;
  }),
});

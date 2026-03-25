  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(leads).values({
    productId: data.productId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    source: "landing_page",
    status: "pending",
  });
  return result;
}

export async function recordSale(data: { productId: number; email: string; leadId?: number; amount: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(sales).values({
    productId: data.productId,
    leadId: data.leadId,
    email: data.email,
    amount: data.amount,
    status: "completed",
    downloadCount: 0,
  });
  return result;
}

export async function getAllLeads() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(leads);
  return result;
}

export async function getAllSales() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(sales);
  return result;
}

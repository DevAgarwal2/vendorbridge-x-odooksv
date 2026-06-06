"use server";

import { db } from "@/lib/db";
import {
  vendors,
  rfqs,
  rfqLineItems,
  rfqVendors,
  rfqAttachments,
  quotations,
  quotationLineItems,
  purchaseOrders,
  invoices,
  activityLogs,
  poItems,
  user,
  account,
  session,
} from "@/lib/db/schema";
import { eq, like, sql, count, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { requirePermission, requireUser, AuthError } from "@/lib/rbac-server";
import {
  vendorCreateSchema,
  rfqCreateSchema,
  rfqItemSchema,
  quotationCreateSchema,
  formatZodError,
  idSchema,
} from "@/lib/validation";

export type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string };

function fail(error: unknown): ActionResult<never> {
  if (error instanceof AuthError) {
    return { success: false, error: error.message };
  }
  if (error && typeof error === "object" && "issues" in error) {
    return { success: false, error: formatZodError(error as any) };
  }
  const message = error instanceof Error ? error.message : "Operation failed";
  console.error("[action error]", error);
  return { success: false, error: message };
}

async function logActivity(
  type: typeof activityLogs.$inferInsert.type,
  title: string,
  description?: string,
  actorId?: string,
  metadata?: Record<string, unknown>
) {
  await db.insert(activityLogs).values({
    type,
    title,
    description,
    actorId,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

export async function getVendors(search?: string, status?: string): Promise<any[]> {
  const conditions: any[] = [];
  if (search) conditions.push(like(vendors.name, `%${search}%`));
  if (status) conditions.push(eq(vendors.status, status as any));
  const where = conditions.length === 0
    ? undefined
    : conditions.length === 1
    ? conditions[0]
    : and(...conditions);
  return db.select().from(vendors).where(where as any).orderBy(vendors.name);
}

export async function getVendorById(id: number) {
  const { id: vendorId } = idSchema.parse({ id });
  const [v] = await db.select().from(vendors).where(eq(vendors.id, vendorId));
  return v ?? null;
}

export async function getVendorStats(id: number) {
  const { id: vendorId } = idSchema.parse({ id });
  const poCount = await db
    .select({ count: count(), total: sql<number>`COALESCE(SUM(${purchaseOrders.grandTotal}), 0)` })
    .from(purchaseOrders)
    .where(eq(purchaseOrders.vendorId, vendorId));
  const quotationCount = await db
    .select({ count: count() })
    .from(quotations)
    .where(eq(quotations.vendorId, vendorId));
  const rfqCount = await db
    .select({ count: count() })
    .from(rfqVendors)
    .where(eq(rfqVendors.vendorId, vendorId));
  return {
    purchaseOrderCount: poCount[0]?.count ?? 0,
    totalSpent: poCount[0]?.total ? Number(poCount[0].total) : 0,
    quotationCount: quotationCount[0]?.count ?? 0,
    rfqCount: rfqCount[0]?.count ?? 0,
  };
}

export async function getVendorCounts() {
  const all = await db.select({ count: count() }).from(vendors);
  const active = await db.select({ count: count() }).from(vendors).where(eq(vendors.status, "active"));
  const pending = await db.select({ count: count() }).from(vendors).where(eq(vendors.status, "pending"));
  const blocked = await db.select({ count: count() }).from(vendors).where(eq(vendors.status, "blocked"));
  return {
    all: all[0].count,
    active: active[0].count,
    pending: pending[0].count,
    blocked: blocked[0].count,
  };
}

export async function createVendor(formData: FormData): Promise<ActionResult<{ id: number }>> {
  try {
    const user = await requirePermission("vendor:create");
    const raw = {
      name: formData.get("name"),
      category: formData.get("category"),
      gstNumber: formData.get("gstNumber") || "",
      contactNumber: formData.get("contactNumber") || "",
      email: formData.get("email") || "",
      address: formData.get("address") || "",
      status: formData.get("status") || "active",
      rating: formData.get("rating") ?? 0,
    };
    const parsed = vendorCreateSchema.parse(raw);
    const [v] = await db.insert(vendors).values({
      name: parsed.name,
      category: parsed.category,
      gstNumber: parsed.gstNumber,
      contactNumber: parsed.contactNumber,
      email: parsed.email,
      address: parsed.address,
      status: parsed.status,
      rating: parsed.rating,
    }).returning();
    await logActivity("vendor", `New vendor: ${v.name}`, `Category: ${v.category}`, user.id);
    revalidatePath("/vendors");
    return { success: true, data: { id: v.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function updateVendor(id: number, formData: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("vendor:update");
    const parsed = vendorCreateSchema.parse({
      name: formData.get("name"),
      category: formData.get("category"),
      gstNumber: formData.get("gstNumber") || "",
      contactNumber: formData.get("contactNumber") || "",
      email: formData.get("email") || "",
      address: formData.get("address") || "",
      status: formData.get("status") || "active",
      rating: formData.get("rating") ?? 0,
    });
    const { id: parsedId } = idSchema.parse({ id });
    void parsedId;
    await db.update(vendors).set({
      name: parsed.name,
      category: parsed.category,
      gstNumber: parsed.gstNumber,
      contactNumber: parsed.contactNumber,
      email: parsed.email,
      address: parsed.address,
      status: parsed.status,
      rating: parsed.rating,
    }).where(eq(vendors.id, id));
    await logActivity("vendor", `Updated vendor: ${parsed.name}`, undefined, user.id);
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${id}`);
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function getRfqs(): Promise<any[]> {
  const user = await requireUser();
  // Vendors only see RFQs assigned to them (per spec: "Track RFQ status").
  if (user.role === "vendor") {
    return db
      .select({
        id: rfqs.id,
        title: rfqs.title,
        category: rfqs.category,
        status: rfqs.status,
        deadline: rfqs.deadline,
        createdAt: rfqs.createdAt,
        description: rfqs.description,
        createdById: rfqs.createdById,
      })
      .from(rfqs)
      .innerJoin(rfqVendors, eq(rfqVendors.rfqId, rfqs.id))
      .innerJoin(vendors, eq(vendors.id, rfqVendors.vendorId))
      .where(eq(vendors.email, user.email))
      .orderBy(sql`${rfqs.createdAt} desc`);
  }
  return db.select().from(rfqs).orderBy(sql`${rfqs.createdAt} desc`);
}

export async function getRfqById(id: number): Promise<any | null> {
  const { id: rfqId } = idSchema.parse({ id });
  const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId));
  if (!rfq) return null;
  const items = await db.select().from(rfqLineItems).where(eq(rfqLineItems.rfqId, rfqId));
  const assigned = await db
    .select({ vendorId: rfqVendors.vendorId })
    .from(rfqVendors)
    .where(eq(rfqVendors.rfqId, rfqId));
  return {
    ...rfq,
    items,
    assignedVendorIds: assigned.map((a: { vendorId: number }) => a.vendorId),
  };
}

export async function createRfq(
  formData: FormData,
  items: { itemName: string; quantity: number; unit: string }[],
  vendorIds: number[]
): Promise<ActionResult<{ id: number }>> {
  try {
    const user = await requirePermission("rfq:create");
    const validatedItems = items.map((i) => rfqItemSchema.parse(i));
    const parsed = rfqCreateSchema.parse({
      title: formData.get("title"),
      category: formData.get("category"),
      description: formData.get("description") || "",
      deadline: formData.get("deadline"),
      items: validatedItems,
      vendorIds,
    });
    const validVendorIds: number[] = [];
    for (const vid of parsed.vendorIds) {
      const [v] = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.id, vid));
      if (v) validVendorIds.push(vid);
    }
    if (validVendorIds.length === 0) {
      return { success: false, error: "None of the assigned vendors exist" };
    }

    const [rfq] = await db.insert(rfqs).values({
      title: parsed.title,
      category: parsed.category,
      description: parsed.description,
      deadline: parsed.deadline,
      status: "draft",
      createdById: user.id,
    }).returning();

    for (const item of parsed.items) {
      await db.insert(rfqLineItems).values({
        rfqId: rfq.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
      });
    }
    for (const vid of validVendorIds) {
      await db.insert(rfqVendors).values({ rfqId: rfq.id, vendorId: vid });
    }

    // Persist uploaded attachments
    const attachmentFiles = formData.getAll("attachments").filter((f): f is File => f instanceof File && f.size > 0);
    const savedAttachmentNames: string[] = [];
    for (const file of attachmentFiles) {
      try {
        const stored = await saveAttachment(rfq.id, file, user.id);
        savedAttachmentNames.push(stored);
      } catch (err) {
        console.error("[attachment upload]", err);
      }
    }

    await logActivity(
      "rfq",
      `New RFQ: ${rfq.title}`,
      `${parsed.items.length} item(s), ${validVendorIds.length} vendor(s)${savedAttachmentNames.length > 0 ? `, ${savedAttachmentNames.length} attachment(s)` : ""}`,
      user.id,
      { rfqId: rfq.id }
    );
    revalidatePath("/rfqs");
    return { success: true, data: { id: rfq.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function sendRfq(id: number): Promise<ActionResult> {
  try {
    const user = await requirePermission("rfq:send");
    const { id: rfqId } = idSchema.parse({ id });
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, rfqId));
    if (!rfq) return { success: false, error: "RFQ not found" };
    if (rfq.status !== "draft") {
      return { success: false, error: `Cannot send RFQ in "${rfq.status}" state` };
    }
    const items = await db.select().from(rfqLineItems).where(eq(rfqLineItems.rfqId, rfqId));
    if (items.length === 0) return { success: false, error: "RFQ has no line items" };
    const assigned = await db.select().from(rfqVendors).where(eq(rfqVendors.rfqId, rfqId));
    if (assigned.length === 0) return { success: false, error: "RFQ has no assigned vendors" };
    await db.update(rfqs).set({ status: "sent" }).where(eq(rfqs.id, rfqId));
    await logActivity("rfq", `RFQ sent: ${rfq.title}`, undefined, user.id, { rfqId });
    revalidatePath("/rfqs");
    revalidatePath(`/rfqs/${rfqId}`);
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function getQuotationsForRfq(rfqId: number): Promise<any[]> {
  const { id } = idSchema.parse({ id: rfqId });
  const qs = await db.select().from(quotations).where(eq(quotations.rfqId, id));
  const result = [];
  for (const q of qs) {
    const [v] = await db
      .select({ name: vendors.name, rating: vendors.rating })
      .from(vendors)
      .where(eq(vendors.id, q.vendorId));
    const items = await db.select().from(quotationLineItems).where(eq(quotationLineItems.quotationId, q.id));
    result.push({ ...q, vendorName: v?.name || "—", vendorRating: v?.rating ?? 0, items });
  }
  return result;
}

export async function submitQuotation(
  rfqId: number,
  vendorId: number,
  data: { gstPercent: number; deliveryDays: number; paymentTerms: string; notes?: string },
  items: { itemName: string; quantity: number; unitPrice: number; total: number }[]
): Promise<ActionResult<{ id: number }>> {
  try {
    const user = await requirePermission("quotation:create");
    const parsed = quotationCreateSchema.parse({
      rfqId,
      vendorId,
      gstPercent: data.gstPercent,
      deliveryDays: data.deliveryDays,
      paymentTerms: data.paymentTerms,
      notes: data.notes || "",
      items,
    });
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, parsed.rfqId));
    if (!rfq) return { success: false, error: "RFQ not found" };
    if (rfq.status !== "sent") {
      return { success: false, error: `Cannot submit quotation for RFQ in "${rfq.status}" state` };
    }
    const [assigned] = await db
      .select()
      .from(rfqVendors)
      .where(and(eq(rfqVendors.rfqId, parsed.rfqId), eq(rfqVendors.vendorId, parsed.vendorId)));
    if (!assigned) {
      return { success: false, error: "Vendor is not assigned to this RFQ" };
    }

    let subtotal = 0;
    for (const item of parsed.items) {
      const expectedTotal = item.quantity * item.unitPrice;
      if (Math.abs(expectedTotal - item.total) > 0.01) {
        return { success: false, error: `Line total mismatch for "${item.itemName}"` };
      }
      subtotal += item.total;
    }
    const gstPercent = parsed.gstPercent;
    const gstAmount = Math.round(subtotal * (gstPercent / 100) * 100) / 100;
    const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

    const [q] = await db.insert(quotations).values({
      rfqId: parsed.rfqId,
      vendorId: parsed.vendorId,
      subtotal,
      gstPercent,
      gstAmount,
      grandTotal,
      deliveryDays: parsed.deliveryDays,
      notes: parsed.notes,
      paymentTerms: parsed.paymentTerms,
      status: "submitted",
      submittedById: user.id,
    }).returning();

    for (const item of parsed.items) {
      await db.insert(quotationLineItems).values({
        quotationId: q.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      });
    }
    await logActivity(
      "quotation",
      `Quotation submitted for ${rfq.title}`,
      `Amount: ₹${grandTotal.toLocaleString("en-IN")}`,
      user.id,
      { quotationId: q.id, rfqId: parsed.rfqId }
    );
    revalidatePath("/quotations");
    revalidatePath(`/rfqs/${parsed.rfqId}`);
    revalidatePath("/approvals");
    return { success: true, data: { id: q.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function approveQuotation(quotationId: number): Promise<ActionResult> {
  try {
    const user = await requirePermission("quotation:approve");
    const { id } = idSchema.parse({ id: quotationId });
    const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!q) return { success: false, error: "Quotation not found" };
    if (q.status !== "submitted") {
      return { success: false, error: `Cannot approve quotation in "${q.status}" state` };
    }
    await db.update(quotations).set({ status: "approved" }).where(eq(quotations.id, id));
    await logActivity("approval", `Quotation #${id} approved`, undefined, user.id, { quotationId: id });
    revalidatePath("/approvals");
    revalidatePath("/quotations");
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function rejectQuotation(quotationId: number): Promise<ActionResult> {
  try {
    const user = await requirePermission("quotation:reject");
    const { id } = idSchema.parse({ id: quotationId });
    const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!q) return { success: false, error: "Quotation not found" };
    if (q.status !== "submitted") {
      return { success: false, error: `Cannot reject quotation in "${q.status}" state` };
    }
    await db.update(quotations).set({ status: "rejected" }).where(eq(quotations.id, id));
    await logActivity("approval", `Quotation #${id} rejected`, undefined, user.id, { quotationId: id });
    revalidatePath("/approvals");
    revalidatePath("/quotations");
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function getPendingApprovals(): Promise<any[]> {
  const qs = await db.select().from(quotations).where(eq(quotations.status, "submitted"));
  const result = [];
  for (const q of qs) {
    const [rfq] = await db.select({ title: rfqs.title }).from(rfqs).where(eq(rfqs.id, q.rfqId));
    const [v] = await db.select({ name: vendors.name }).from(vendors).where(eq(vendors.id, q.vendorId));
    result.push({ ...q, rfqTitle: rfq?.title || "—", vendorName: v?.name || "—" });
  }
  return result;
}

export async function getPurchaseOrders(): Promise<any[]> {
  return db.select().from(purchaseOrders).orderBy(sql`${purchaseOrders.createdAt} desc`);
}

export async function getPurchaseOrderById(id: number): Promise<any | null> {
  const { id: poId } = idSchema.parse({ id });
  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId));
  if (!po) return null;
  const items = await db.select().from(poItems).where(eq(poItems.poId, poId));
  const [v] = await db.select().from(vendors).where(eq(vendors.id, po.vendorId));
  return { ...po, items, vendor: v };
}

export async function createPurchaseOrderFromQuotation(quotationId: number): Promise<ActionResult<{ id: number; poNumber: string }>> {
  try {
    const user = await requirePermission("po:create");
    const { id } = idSchema.parse({ id: quotationId });
    const [q] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!q) return { success: false, error: "Quotation not found" };
    if (q.status !== "approved") {
      return { success: false, error: `Quotation must be approved first (current: "${q.status}")` };
    }
    const [existingPO] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.quotationId, id));
    if (existingPO) {
      return { success: false, error: "Purchase order already exists for this quotation" };
    }
    const items = await db.select().from(quotationLineItems).where(eq(quotationLineItems.quotationId, id));

    const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const subtotal = q.subtotal;
    const gstAmount = q.gstAmount || 0;
    const cgst = Math.round((gstAmount / 2) * 100) / 100;
    const sgst = Math.round((gstAmount / 2) * 100) / 100;
    const grandTotal = q.grandTotal;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const [po] = await db.insert(purchaseOrders).values({
      poNumber,
      rfqId: q.rfqId,
      vendorId: q.vendorId,
      quotationId: q.id,
      status: "approved",
      subtotal,
      cgst,
      sgst,
      grandTotal,
      dueDate,
      createdById: user.id,
    }).returning();

    for (const item of items) {
      await db.insert(poItems).values({
        poId: po.id,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      });
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const [inv] = await db.insert(invoices).values({
      invoiceNumber,
      poId: po.id,
      vendorId: po.vendorId,
      status: "pending_payment",
      subtotal,
      cgst,
      sgst,
      grandTotal,
      dueDate,
      createdById: user.id,
    }).returning();

    await db.update(rfqs).set({ status: "closed" }).where(eq(rfqs.id, q.rfqId));
    await logActivity("po", `PO ${poNumber} created`, `Invoice ${invoiceNumber} auto-generated`, user.id, {
      poId: po.id,
      invoiceId: inv.id,
    });
    revalidatePath("/purchase-orders");
    revalidatePath("/invoices");
    revalidatePath("/rfqs");
    return { success: true, data: { id: po.id, poNumber } };
  } catch (e) {
    return fail(e);
  }
}

export async function getInvoices(): Promise<any[]> {
  return db.select().from(invoices).orderBy(sql`${invoices.createdAt} desc`);
}

export async function getInvoiceById(id: number): Promise<any | null> {
  const { id: invId } = idSchema.parse({ id });
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invId));
  if (!inv) return null;
  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, inv.poId));
  const items = po ? await db.select().from(poItems).where(eq(poItems.poId, po.id)) : [];
  const [v] = await db.select().from(vendors).where(eq(vendors.id, inv.vendorId));
  return { ...inv, poNumber: po?.poNumber, items, vendor: v };
}

export async function markInvoicePaid(id: number): Promise<ActionResult> {
  try {
    const user = await requirePermission("invoice:mark_paid");
    const { id: invId } = idSchema.parse({ id });
    const [inv] = await db.select().from(invoices).where(eq(invoices.id, invId));
    if (!inv) return { success: false, error: "Invoice not found" };
    if (inv.status === "paid") {
      return { success: false, error: "Invoice is already paid" };
    }
    await db.update(invoices).set({ status: "paid", paidAt: new Date() }).where(eq(invoices.id, invId));
    await db.update(purchaseOrders).set({ status: "paid" }).where(eq(purchaseOrders.id, inv.poId));
    await logActivity("invoice", `Invoice ${inv.invoiceNumber} marked paid`, undefined, user.id, { invoiceId: invId });
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invId}`);
    revalidatePath("/purchase-orders");
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

export async function getActivityLogs(limit = 50): Promise<any[]> {
  return db
    .select()
    .from(activityLogs)
    .orderBy(sql`${activityLogs.createdAt} desc`)
    .limit(Math.min(Math.max(1, limit), 200));
}

export async function addActivityLog(
  type: string,
  title: string,
  description?: string
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const validTypes = ["rfq", "quotation", "approval", "po", "invoice", "vendor"] as const;
    if (!validTypes.includes(type as any)) {
      return { success: false, error: "Invalid activity type" };
    }
    await db.insert(activityLogs).values({
      type: type as any,
      title: title.trim().slice(0, 200),
      description: description?.trim().slice(0, 1000) || null,
      actorId: user.id,
    });
    revalidatePath("/activity");
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

// ============== RFQ Attachments ==============

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "rfq");
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

async function saveAttachment(rfqId: number, file: File, userId: string): Promise<string> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File "${file.name}" exceeds 10MB limit`);
  }
  const mime = file.type || "application/octet-stream";
  if (mime && !ALLOWED_MIME.has(mime)) {
    throw new Error(`File type "${mime}" not allowed`);
  }
  await ensureUploadDir();
  const safeName = sanitizeFilename(file.name || "upload");
  const hash = crypto.randomBytes(8).toString("hex");
  const storedName = `${rfqId}-${Date.now()}-${hash}-${safeName}`;
  const dest = path.join(UPLOAD_DIR, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buffer);
  await db.insert(rfqAttachments).values({
    rfqId,
    filename: file.name || "upload",
    storedName,
    mimeType: mime,
    fileSize: file.size,
    uploadedById: userId,
  });
  return file.name || "upload";
}

export async function getRfqAttachments(rfqId: number): Promise<any[]> {
  const { id } = idSchema.parse({ id: rfqId });
  return db.select().from(rfqAttachments).where(eq(rfqAttachments.rfqId, id));
}

export async function uploadRfqAttachment(
  rfqId: number,
  formData: FormData
): Promise<ActionResult<{ id: number; filename: string }>> {
  try {
    const user = await requirePermission("rfq:create");
    const { id } = idSchema.parse({ id: rfqId });
    const [rfq] = await db.select({ id: rfqs.id }).from(rfqs).where(eq(rfqs.id, id));
    if (!rfq) return { success: false, error: "RFQ not found" };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "No file provided" };
    }

    const filename = await saveAttachment(id, file, user.id);
    await logActivity("rfq", `Attachment added: ${file.name}`, `RFQ #${id}`, user.id, { rfqId: id });
    revalidatePath(`/rfqs/${id}`);
    return { success: true, data: { id, filename } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteRfqAttachment(attachmentId: number): Promise<ActionResult> {
  try {
    const user = await requirePermission("rfq:create");
    const { id } = idSchema.parse({ id: attachmentId });
    const [att] = await db.select().from(rfqAttachments).where(eq(rfqAttachments.id, id));
    if (!att) return { success: false, error: "Attachment not found" };
    const filePath = path.join(UPLOAD_DIR, att.storedName);
    try {
      await unlink(filePath);
    } catch {
      // ignore - file may already be gone
    }
    await db.delete(rfqAttachments).where(eq(rfqAttachments.id, id));
    await logActivity("rfq", `Attachment removed: ${att.filename}`, `RFQ #${att.rfqId}`, user.id, { rfqId: att.rfqId });
    revalidatePath(`/rfqs/${att.rfqId}`);
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

// ============== Vendor Rating ==============

export async function updateVendorRating(vendorId: number, rating: number): Promise<ActionResult> {
  try {
    const user = await requirePermission("vendor:update");
    const { id } = idSchema.parse({ id: vendorId });
    if (rating < 0 || rating > 5) {
      return { success: false, error: "Rating must be between 0 and 5" };
    }
    const [v] = await db.select({ id: vendors.id, name: vendors.name }).from(vendors).where(eq(vendors.id, id));
    if (!v) return { success: false, error: "Vendor not found" };
    await db.update(vendors).set({ rating }).where(eq(vendors.id, id));
    await logActivity("vendor", `Vendor rated: ${v.name}`, `${rating.toFixed(1)}/5 by ${user.name}`, user.id, { vendorId: id });
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${id}`);
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

// ============== Password Reset (in-app, no email) ==============

import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function resetPasswordInApp(formData: FormData): Promise<ActionResult> {
  try {
    const raw = {
      email: String(formData.get("email") || "").trim().toLowerCase(),
      newPassword: String(formData.get("newPassword") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
    };
    const parsed = resetPasswordSchema.parse(raw);

    // Look up the user directly via Drizzle (bypasses better-auth's request-scoped context).
    const [userRow] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.email, parsed.email));
    if (!userRow) {
      // Don't leak which emails exist; respond as success either way.
      return { success: true };
    }

    // Hash the new password with Better Auth's own hasher (scrypt, same algorithm + format).
    const hashed = await hashPassword(parsed.newPassword);

    // Update the user's "credential" account row that holds the password.
    await db
      .update(account)
      .set({ password: hashed, updatedAt: new Date() })
      .where(and(eq(account.userId, userRow.id), eq(account.providerId, "credential")));

    // Invalidate all existing sessions for the user.
    try {
      await db.delete(session).where(eq(session.userId, userRow.id));
    } catch {
      // best-effort
    }

    await logActivity(
      "vendor",
      "Password reset",
      `In-app reset for ${parsed.email}`,
      userRow.id
    );
    return { success: true };
  } catch (e) {
    return fail(e);
  }
}

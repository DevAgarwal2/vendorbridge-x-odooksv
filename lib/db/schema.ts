import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const vendors = sqliteTable(
  "vendors",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    category: text("category").notNull(),
    gstNumber: text("gst_number"),
    contactNumber: text("contact_number"),
    email: text("email"),
    address: text("address"),
    status: text("status", { enum: ["active", "pending", "blocked"] }).notNull().default("active"),
    rating: real("rating").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [
    index("vendors_name_idx").on(t.name),
    index("vendors_status_idx").on(t.status),
    index("vendors_email_idx").on(t.email),
  ]
);

export const rfqs = sqliteTable(
  "rfqs",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    deadline: integer("deadline", { mode: "timestamp" }).notNull(),
    status: text("status", { enum: ["draft", "sent", "closed"] }).notNull().default("draft"),
    createdById: text("created_by_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [
    index("rfqs_status_idx").on(t.status),
    index("rfqs_created_by_idx").on(t.createdById),
    index("rfqs_deadline_idx").on(t.deadline),
  ]
);

export const rfqLineItems = sqliteTable(
  "rfq_line_items",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    rfqId: integer("rfq_id", { mode: "number" }).notNull().references(() => rfqs.id, { onDelete: "cascade" }),
    itemName: text("item_name").notNull(),
    quantity: integer("quantity").notNull(),
    unit: text("unit").notNull().default("NOS"),
  },
  (t) => [index("rfq_items_rfq_idx").on(t.rfqId)]
);

export const rfqVendors = sqliteTable(
  "rfq_vendors",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    rfqId: integer("rfq_id", { mode: "number" }).notNull().references(() => rfqs.id, { onDelete: "cascade" }),
    vendorId: integer("vendor_id", { mode: "number" }).notNull().references(() => vendors.id, { onDelete: "restrict" }),
  },
  (t) => [
    index("rfq_vendors_rfq_idx").on(t.rfqId),
    index("rfq_vendors_vendor_idx").on(t.vendorId),
  ]
);

export const rfqAttachments = sqliteTable(
  "rfq_attachments",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    rfqId: integer("rfq_id", { mode: "number" }).notNull().references(() => rfqs.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    storedName: text("stored_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedById: text("uploaded_by_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [
    index("rfq_attachments_rfq_idx").on(t.rfqId),
  ]
);

export const quotations = sqliteTable(
  "quotations",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    rfqId: integer("rfq_id", { mode: "number" }).notNull().references(() => rfqs.id, { onDelete: "cascade" }),
    vendorId: integer("vendor_id", { mode: "number" }).notNull().references(() => vendors.id, { onDelete: "restrict" }),
    subtotal: real("subtotal").notNull().default(0),
    gstPercent: real("gst_percent").notNull().default(18),
    gstAmount: real("gst_amount").notNull().default(0),
    grandTotal: real("grand_total").notNull().default(0),
    deliveryDays: integer("delivery_days").notNull().default(7),
    notes: text("notes"),
    paymentTerms: text("payment_terms").notNull().default("30 days"),
    status: text("status", { enum: ["draft", "submitted", "approved", "rejected"] }).notNull().default("draft"),
    submittedById: text("submitted_by_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [
    index("quotations_rfq_idx").on(t.rfqId),
    index("quotations_vendor_idx").on(t.vendorId),
    index("quotations_status_idx").on(t.status),
  ]
);

export const quotationLineItems = sqliteTable(
  "quotation_line_items",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    quotationId: integer("quotation_id", { mode: "number" }).notNull().references(() => quotations.id, { onDelete: "cascade" }),
    itemName: text("item_name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    total: real("total").notNull(),
  },
  (t) => [index("quotation_items_quotation_idx").on(t.quotationId)]
);

export const purchaseOrders = sqliteTable(
  "purchase_orders",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    poNumber: text("po_number").notNull().unique(),
    rfqId: integer("rfq_id", { mode: "number" }).notNull().references(() => rfqs.id, { onDelete: "restrict" }),
    vendorId: integer("vendor_id", { mode: "number" }).notNull().references(() => vendors.id, { onDelete: "restrict" }),
    quotationId: integer("quotation_id", { mode: "number" }).references(() => quotations.id, { onDelete: "set null" }),
    status: text("status", { enum: ["draft", "approved", "sent", "pending_payment", "paid"] }).notNull().default("draft"),
    subtotal: real("subtotal").notNull().default(0),
    cgst: real("cgst").notNull().default(0),
    sgst: real("sgst").notNull().default(0),
    grandTotal: real("grand_total").notNull().default(0),
    dueDate: integer("due_date", { mode: "timestamp" }),
    createdById: text("created_by_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [
    index("po_vendor_idx").on(t.vendorId),
    index("po_status_idx").on(t.status),
    index("po_rfq_idx").on(t.rfqId),
  ]
);

export const poItems = sqliteTable(
  "po_items",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    poId: integer("po_id", { mode: "number" }).notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
    itemName: text("item_name").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: real("unit_price").notNull(),
    total: real("total").notNull(),
  },
  (t) => [index("po_items_po_idx").on(t.poId)]
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    invoiceNumber: text("invoice_number").notNull().unique(),
    poId: integer("po_id", { mode: "number" }).notNull().references(() => purchaseOrders.id, { onDelete: "restrict" }),
    vendorId: integer("vendor_id", { mode: "number" }).notNull().references(() => vendors.id, { onDelete: "restrict" }),
    status: text("status", { enum: ["draft", "sent", "pending_payment", "paid"] }).notNull().default("draft"),
    subtotal: real("subtotal").notNull().default(0),
    cgst: real("cgst").notNull().default(0),
    sgst: real("sgst").notNull().default(0),
    grandTotal: real("grand_total").notNull().default(0),
    dueDate: integer("due_date", { mode: "timestamp" }),
    paidAt: integer("paid_at", { mode: "timestamp" }),
    createdById: text("created_by_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [
    index("invoices_po_idx").on(t.poId),
    index("invoices_vendor_idx").on(t.vendorId),
    index("invoices_status_idx").on(t.status),
  ]
);

export const activityLogs = sqliteTable(
  "activity_logs",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    type: text("type", { enum: ["rfq", "quotation", "approval", "po", "invoice", "vendor"] }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    actorId: text("actor_id"),
    metadata: text("metadata"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  },
  (t) => [index("activity_type_idx").on(t.type), index("activity_created_idx").on(t.createdAt)]
);

// Better Auth tables
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["procurement_officer", "manager", "finance", "admin", "vendor"] }).notNull().default("procurement_officer"),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  country: text("country").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull(),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const merchantEmail = "demo-merchant@loopreturn.app";
  const ownerEmail = "owner@loopreturn.app";
  const adminEmail = "admin@loopreturn.app";
  const clientEmail = "alex.customer@example.com";

  // Reset demo tenant for idempotent seeds.
  const existing = await prisma.merchant.findUnique({
    where: { email: merchantEmail },
    select: { id: true },
  });

  if (existing) {
    await prisma.merchant.delete({ where: { id: existing.id } });
  }

  const merchant = await prisma.merchant.create({
    data: {
      name: "Velocity Threads",
      email: merchantEmail,
      plan: "growth",
      users: {
        create: {
          email: ownerEmail,
          name: "Ava Patel",
          role: "seller",
          passwordHash: await hash("password123", 10),
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      merchantId: merchant.id,
      email: adminEmail,
      name: "Admin Ops",
      role: "admin",
      passwordHash: await hash("password123", 10),
    },
  });

  await prisma.user.create({
    data: {
      merchantId: merchant.id,
      email: clientEmail,
      name: "Alex Carter",
      role: "client",
      passwordHash: await hash("password123", 10),
    },
  });

  const [c1, c2, c3] = await Promise.all([
    prisma.customer.create({
      data: {
        merchantId: merchant.id,
        email: "alex.customer@example.com",
        name: "Alex Carter",
        phone: "+14155550101",
      },
    }),
    prisma.customer.create({
      data: {
        merchantId: merchant.id,
        email: "mia.customer@example.com",
        name: "Mia Lee",
        phone: "+14155550102",
      },
    }),
    prisma.customer.create({
      data: {
        merchantId: merchant.id,
        email: "noah.customer@example.com",
        name: "Noah Khan",
        phone: "+14155550103",
      },
    }),
  ]);

  const products = await Promise.all([
    prisma.product.create({
      data: { merchantId: merchant.id, name: "Classic Tshirt", sku: "TSH-001", price: 29.99 },
    }),
    prisma.product.create({
      data: { merchantId: merchant.id, name: "Urban Hoodie", sku: "HOD-101", price: 69.99 },
    }),
    prisma.product.create({
      data: { merchantId: merchant.id, name: "Running Shoes", sku: "SHO-210", price: 129.99 },
    }),
    prisma.product.create({
      data: { merchantId: merchant.id, name: "Denim Jacket", sku: "JCK-300", price: 159.99 },
    }),
  ]);

  const [p1, p2, p3, p4] = products;

  await Promise.all([
    prisma.returnReason.create({
      data: {
        merchantId: merchant.id,
        code: "WRONG_SIZE",
        label: "Wrong size / fit",
        category: "fit",
      },
    }),
    prisma.returnReason.create({
      data: {
        merchantId: merchant.id,
        code: "DAMAGED",
        label: "Arrived damaged",
        category: "quality",
      },
    }),
    prisma.carrier.create({
      data: {
        merchantId: merchant.id,
        code: "UPS",
        name: "UPS",
      },
    }),
    prisma.warehouse.create({
      data: {
        merchantId: merchant.id,
        code: "MAIN",
        name: "Main Warehouse",
        address: "Newark, NJ",
      },
    }),
  ]);

  async function createOrderWithItems(customer, orderNumber, items) {
    const order = await prisma.order.create({
      data: {
        merchantId: merchant.id,
        customerId: customer.id,
        orderNumber,
        totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        currency: "USD",
        status: "fulfilled",
      },
    });

    const orderItems = await Promise.all(
      items.map((item) =>
        prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price,
            sku: item.product.sku,
          },
        })
      )
    );

    return { order, orderItems };
  }

  const o1 = await createOrderWithItems(c1, "VT-1001", [
    { product: p1, quantity: 2, price: 29.99 },
    { product: p2, quantity: 1, price: 69.99 },
  ]);
  const o2 = await createOrderWithItems(c2, "VT-1002", [
    { product: p3, quantity: 1, price: 129.99 },
    { product: p4, quantity: 1, price: 159.99 },
  ]);
  const o3 = await createOrderWithItems(c3, "VT-1003", [
    { product: p1, quantity: 1, price: 29.99 },
    { product: p3, quantity: 1, price: 129.99 },
  ]);

  const r1 = await prisma.return.create({
    data: {
      merchantId: merchant.id,
      customerId: c1.id,
      orderId: o1.order.id,
      rmaNumber: "RMA-VT-0001",
      status: "pending",
      returnReason: "Wrong size / fit",
      requestedAt: new Date("2026-03-10T10:00:00.000Z"),
      returnItems: {
        create: [
          {
            orderItemId: o1.orderItems[0].id,
            productId: p1.id,
            quantity: 1,
            condition: "opened",
          },
        ],
      },
    },
  });

  const r2 = await prisma.return.create({
    data: {
      merchantId: merchant.id,
      customerId: c2.id,
      orderId: o2.order.id,
      rmaNumber: "RMA-VT-0002",
      status: "approved",
      returnReason: "Arrived damaged",
      requestedAt: new Date("2026-03-08T09:00:00.000Z"),
      approvedAt: new Date("2026-03-08T15:00:00.000Z"),
      returnItems: {
        create: [
          {
            orderItemId: o2.orderItems[1].id,
            productId: p4.id,
            quantity: 1,
            condition: "damaged",
          },
        ],
      },
    },
  });

  const r3 = await prisma.return.create({
    data: {
      merchantId: merchant.id,
      customerId: c3.id,
      orderId: o3.order.id,
      rmaNumber: "RMA-VT-0003",
      status: "refunded",
      returnReason: "Changed my mind",
      requestedAt: new Date("2026-03-05T08:30:00.000Z"),
      approvedAt: new Date("2026-03-05T12:00:00.000Z"),
      refundedAt: new Date("2026-03-06T13:00:00.000Z"),
      returnItems: {
        create: [
          {
            orderItemId: o3.orderItems[0].id,
            productId: p1.id,
            quantity: 1,
            condition: "unopened",
          },
        ],
      },
    },
  });

  await prisma.shippingLabel.create({
    data: {
      returnId: r2.id,
      carrier: "UPS",
      trackingNumber: "1ZVTDEMO0002",
      labelUrl: "https://labels.example.com/rma-vt-0002",
      status: "created",
    },
  });

  await prisma.refund.create({
    data: {
      returnId: r3.id,
      amount: 29.99,
      paymentMethod: "original",
      status: "completed",
      processedAt: new Date("2026-03-06T13:00:00.000Z"),
    },
  });

  await prisma.exchange.create({
    data: {
      returnId: r2.id,
      status: "processing",
    },
  });

  await Promise.all([
    prisma.warehouseStock.create({
      data: {
        merchantId: merchant.id,
        productId: p1.id,
        sku: p1.sku,
        quantity: 120,
        location: "main",
      },
    }),
    prisma.warehouseStock.create({
      data: {
        merchantId: merchant.id,
        productId: p2.id,
        sku: p2.sku,
        quantity: 84,
        location: "main",
      },
    }),
    prisma.warehouseStock.create({
      data: {
        merchantId: merchant.id,
        productId: p3.id,
        sku: p3.sku,
        quantity: 42,
        location: "main",
      },
    }),
    prisma.warehouseStock.create({
      data: {
        merchantId: merchant.id,
        productId: p4.id,
        sku: p4.sku,
        quantity: 18,
        location: "damage-bay",
      },
    }),
  ]);

  await Promise.all([
    prisma.inventoryUpdate.create({
      data: {
        merchantId: merchant.id,
        productId: p1.id,
        sku: p1.sku,
        quantity: 1,
        type: "restock",
        reason: "Received good item from RMA-VT-0003",
        returnId: r3.id,
      },
    }),
    prisma.inventoryUpdate.create({
      data: {
        merchantId: merchant.id,
        productId: p4.id,
        sku: p4.sku,
        quantity: -1,
        type: "damage",
        reason: "Damaged on return inspection from RMA-VT-0002",
        returnId: r2.id,
      },
    }),
    prisma.inventoryUpdate.create({
      data: {
        merchantId: merchant.id,
        productId: p2.id,
        sku: p2.sku,
        quantity: -3,
        type: "liquidate",
        reason: "Seasonal liquidation batch",
      },
    }),
  ]);

  await Promise.all([
    prisma.fraudScore.create({
      data: {
        merchantId: merchant.id,
        returnId: r1.id,
        customerId: c1.id,
        score: 0.31,
        riskLevel: "low",
        factors: { highReturnRate: 1 },
      },
    }),
    prisma.fraudScore.create({
      data: {
        merchantId: merchant.id,
        returnId: r2.id,
        customerId: c2.id,
        score: 0.83,
        riskLevel: "high",
        factors: { repeatedItem: true, multipleAccounts: false },
      },
    }),
  ]);

  await prisma.fraudEvent.create({
    data: {
      merchantId: merchant.id,
      returnId: r2.id,
      customerId: c2.id,
      eventType: "high_risk_return",
      details: { trigger: "same_item_repeatedly_returned", score: 0.83 },
    },
  });

  await Promise.all([
    prisma.communicationEvent.create({
      data: {
        merchantId: merchant.id,
        returnId: r2.id,
        customerId: c2.id,
        channel: "email",
        eventType: "return_approved",
        recipient: c2.email,
        provider: "mock",
        providerRef: "seed-email-1",
        status: "sent",
      },
    }),
    prisma.communicationEvent.create({
      data: {
        merchantId: merchant.id,
        returnId: r3.id,
        customerId: c3.id,
        channel: "sms",
        eventType: "refund_processed",
        recipient: c3.phone || "",
        provider: "mock",
        providerRef: "seed-sms-1",
        status: "sent",
      },
    }),
  ]);

  await Promise.all([
    prisma.returnTracking.create({
      data: {
        returnId: r2.id,
        status: "label_created",
        location: "Origin Facility",
        details: { carrier: "UPS", trackingNumber: "1ZVTDEMO0002" },
      },
    }),
    prisma.returnTracking.create({
      data: {
        returnId: r2.id,
        status: "in_transit",
        location: "Transit Hub",
      },
    }),
  ]);

  await prisma.qualityInspection.create({
    data: {
      returnId: r3.id,
      customerId: c3.id,
      inspectedBy: "warehouse.agent.01",
      conditionScore: 9,
      notes: "Item returned in good condition.",
      checklist: {
        tagsAttached: true,
        noDamage: true,
      },
    },
  });

  await prisma.returnFee.create({
    data: {
      returnId: r1.id,
      amount: 4.99,
      currency: "USD",
      reason: "Customer choice return fee",
    },
  });

  await prisma.webhookEvent.create({
    data: {
      merchantId: merchant.id,
      source: "shopify",
      eventType: "orders/create",
      payload: {
        orderNumber: "VT-1004",
      },
      processed: true,
    },
  });

  console.log("Seed complete.");
  console.log("Demo seller:", ownerEmail, "/ password123");
  console.log("Demo admin:", adminEmail, "/ password123");
  console.log("Demo client:", clientEmail, "/ password123");
  console.log("Merchant:", merchant.name, merchant.email);
  console.log("Returns created: RMA-VT-0001, RMA-VT-0002, RMA-VT-0003");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

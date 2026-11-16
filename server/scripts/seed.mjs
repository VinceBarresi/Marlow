import { randomBytes, randomUUID, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const NOW = new Date("2026-11-16T01:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261115);

function pick(list) {
  return list[Math.floor(rand() * list.length)];
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlTime(date) {
  return `'${date.toISOString()}'`;
}

const passwordSalt = randomBytes(16).toString("hex");
const passwordDerived = await scryptAsync("datalab", passwordSalt, 64);
const passwordHash = `scrypt$${passwordSalt}$${passwordDerived.toString("hex")}`;

const colors = [
  "Oat",
  "Ink",
  "Sage",
  "Rust",
  "Slate",
  "Cream",
  "Black",
  "Brass",
  "Navy",
  "Clay",
  "Olive",
  "Sand",
];

const sizes = [
  "4 oz",
  "8 oz",
  "16 oz",
  "32 oz",
  "Tin",
  "Jar",
  "Box",
  "Bag",
  "Refill",
  "Gift",
  "Mini",
  "Family",
];

const lights = [
  "Brass",
  "Black",
  "White",
  "Nickel",
  "Bronze",
  "Small",
  "Medium",
  "Large",
  "Pair",
  "Single",
  "Soft White",
  "Warm",
];

const bases = [
  ["Kitchen", "KIT", "Stoneware Mug", 1800],
  ["Kitchen", "KIT", "Cast Iron Skillet", 7800],
  ["Kitchen", "KIT", "Linen Apron", 3200],
  ["Kitchen", "KIT", "Glass Carafe", 2400],
  ["Kitchen", "KIT", "Beech Cutting Board", 4200],
  ["Kitchen", "KIT", "Enamel Kettle", 6400],
  ["Kitchen", "KIT", "Stainless Mixing Bowl", 2800],
  ["Kitchen", "KIT", "Cotton Tea Towel", 1400],
  ["Kitchen", "KIT", "Ceramic Pour-Over", 3600],
  ["Kitchen", "KIT", "Walnut Salad Servers", 2600],
  ["Kitchen", "KIT", "Dutch Oven", 9800],
  ["Kitchen", "KIT", "Chef Knife", 7200],
  ["Bath", "BTH", "Turkish Cotton Towel", 2800],
  ["Bath", "BTH", "Stoneware Soap Dish", 1600],
  ["Bath", "BTH", "Linen Shower Curtain", 5400],
  ["Bath", "BTH", "Ceramic Tumbler", 1400],
  ["Bath", "BTH", "Oak Bath Tray", 4800],
  ["Bath", "BTH", "Wool Bath Mat", 6200],
  ["Bath", "BTH", "Glass Canister", 2200],
  ["Bath", "BTH", "Waffle Robe", 8800],
  ["Bedroom", "BED", "Percale Pillowcase", 3400],
  ["Bedroom", "BED", "Linen Duvet Cover", 16800],
  ["Bedroom", "BED", "Wool Throw", 9200],
  ["Bedroom", "BED", "Ceramic Table Lamp", 7400],
  ["Bedroom", "BED", "Blackout Curtain", 6800],
  ["Bedroom", "BED", "Cedar Hanger Set", 2600],
  ["Bedroom", "BED", "Quilted Coverlet", 12400],
  ["Bedroom", "BED", "Analog Alarm Clock", 3200],
  ["Outdoor", "OUT", "Enamel Camp Mug", 1800],
  ["Outdoor", "OUT", "Wool Picnic Blanket", 11000],
  ["Outdoor", "OUT", "Canvas Tote", 2800],
  ["Outdoor", "OUT", "Stainless Bottle", 3400],
  ["Outdoor", "OUT", "Picnic Basket", 7600],
  ["Outdoor", "OUT", "Garden Shears", 4200],
  ["Outdoor", "OUT", "Citronella Candle", 1600],
  ["Outdoor", "OUT", "Folding Stool", 5400],
  ["Apparel", "APP", "Cotton Tee", 2800],
  ["Apparel", "APP", "Merino Sweater", 9800],
  ["Apparel", "APP", "Chore Jacket", 14800],
  ["Apparel", "APP", "Linen Shirt", 7800],
  ["Apparel", "APP", "Denim Jean", 11800],
  ["Apparel", "APP", "Wool Beanie", 3200],
  ["Apparel", "APP", "Leather Belt", 6800],
  ["Apparel", "APP", "Canvas Sneaker", 9800],
  ["Office", "OFF", "Brass Pen", 2400],
  ["Office", "OFF", "Linen Notebook", 1800],
  ["Office", "OFF", "Oak Desk Lamp", 8600],
  ["Office", "OFF", "Desk Mug", 1600],
  ["Office", "OFF", "Leather Folio", 7200],
  ["Office", "OFF", "Chair Cushion", 4800],
  ["Office", "OFF", "Walnut Tray", 3600],
  ["Office", "OFF", "Letter Opener", 2200],
  ["Pantry", "PAN", "Olive Oil", 2400],
  ["Pantry", "PAN", "Sea Salt", 1200],
  ["Pantry", "PAN", "Coffee Beans", 1800],
  ["Pantry", "PAN", "Wildflower Honey", 1600],
  ["Pantry", "PAN", "Black Tea", 1400],
  ["Pantry", "PAN", "Bronze Cut Pasta", 900],
  ["Pantry", "PAN", "Dark Chocolate", 1200],
  ["Pantry", "PAN", "Toasted Granola", 1100],
  ["Lighting", "LIT", "Wall Sconce", 9200],
  ["Lighting", "LIT", "Paper Lantern", 3400],
  ["Lighting", "LIT", "LED Bulb Set", 1800],
  ["Lighting", "LIT", "Arc Floor Lamp", 16400],
  ["Lighting", "LIT", "Taper Candles", 1400],
  ["Lighting", "LIT", "Glass Pendant", 12800],
];

const variantFor = {
  Pantry: sizes,
  Lighting: lights,
};

const products = [];
let skuNumber = 10000;
for (const [category, prefix, baseName, priceCents] of bases) {
  const variants = variantFor[category] ?? colors;
  for (const variant of variants) {
    skuNumber += 1;
    const name = category === "Pantry" ? `${baseName}, ${variant}` : `${variant} ${baseName}`;
    products.push({
      sku: `${prefix}-${skuNumber}`,
      name,
      category,
      description: `${name}. Current Marlow stock, packed at the main warehouse.`,
      priceCents,
    });
  }
}

const firstNames = [
  "Avery",
  "Jordan",
  "Riley",
  "Casey",
  "Morgan",
  "Quinn",
  "Parker",
  "Reese",
  "Drew",
  "Shawn",
  "Taylor",
  "Cameron",
  "Hayden",
  "Rowan",
  "Emery",
  "Skyler",
  "Dakota",
  "Finley",
  "Harper",
  "Logan",
  "Sage",
  "Elliot",
  "Noah",
  "Mina",
  "Priya",
  "Luis",
  "Helena",
  "Jonah",
  "Greta",
  "Omar",
];

const lastNames = [
  "Nguyen",
  "Patel",
  "Garcia",
  "Cohen",
  "Brooks",
  "Walsh",
  "Kim",
  "Singh",
  "Ortiz",
  "Nakamura",
  "Berg",
  "Diaz",
  "Okonkwo",
  "Silva",
  "Keller",
  "Rossi",
  "Ahmed",
  "Clark",
  "Ibrahim",
  "Novak",
  "Chen",
  "Murphy",
  "Santos",
  "Adler",
  "Bennett",
];

const places = [
  ["Austin", "TX", "78701"],
  ["Seattle", "WA", "98101"],
  ["Chicago", "IL", "60601"],
  ["Denver", "CO", "80202"],
  ["Portland", "OR", "97205"],
  ["Boston", "MA", "02108"],
  ["Minneapolis", "MN", "55401"],
  ["Nashville", "TN", "37203"],
  ["Philadelphia", "PA", "19103"],
  ["San Diego", "CA", "92101"],
  ["Madison", "WI", "53703"],
  ["Ann Arbor", "MI", "48104"],
  ["Boulder", "CO", "80302"],
  ["Savannah", "GA", "31401"],
  ["Providence", "RI", "02903"],
  ["Burlington", "VT", "05401"],
  ["Santa Fe", "NM", "87501"],
  ["Charleston", "SC", "29401"],
  ["Iowa City", "IA", "52240"],
  ["Asheville", "NC", "28801"],
  ["Tucson", "AZ", "85701"],
  ["Oakland", "CA", "94607"],
  ["Pittsburgh", "PA", "15222"],
  ["Kansas City", "MO", "64105"],
  ["Richmond", "VA", "23219"],
  ["Milwaukee", "WI", "53202"],
  ["Boise", "ID", "83702"],
  ["Spokane", "WA", "99201"],
  ["Omaha", "NE", "68102"],
  ["Albany", "NY", "12207"],
];

const customerId = randomUUID();
const staffId = randomUUID();
const customers = [
  {
    id: customerId,
    email: "customer@marlow.test",
    name: "Mina Adler",
    role: "customer",
    place: places[0],
  },
];

for (let i = 0; i < 29; i += 1) {
  const name = `${firstNames[i]} ${lastNames[i]}`;
  const email = `${firstNames[i]}.${lastNames[i]}@example.com`.toLowerCase();
  customers.push({
    id: randomUUID(),
    email,
    name,
    role: "customer",
    place: places[i + 1],
  });
}

const staff = {
  id: staffId,
  email: "staff@marlow.test",
  name: "Jordan Walsh",
  role: "staff",
};

const admin = {
  id: randomUUID(),
  email: "admin@marlow.test",
  name: "Avery Chen",
  role: "admin",
};

const onHand = new Map(products.map((product) => [product.sku, 120 + Math.floor(rand() * 280)]));
const reserved = new Map(products.map((product) => [product.sku, 0]));

const leadHours = {
  paid: 0,
  picking: 6,
  shipped: 30,
  out_for_delivery: 54,
  delivered: 60,
  cancelled: 8,
};

function allowed(placed, status) {
  return placed.getTime() + leadHours[status] * 60 * 60 * 1000 <= NOW.getTime();
}

function pickStatus(placed) {
  if (rand() < 0.06 && allowed(placed, "cancelled")) return "cancelled";
  const ladder = ["delivered", "out_for_delivery", "shipped", "picking", "paid"];
  const options = ladder.filter((status) => allowed(placed, status));
  const roll = rand();
  if (roll < 0.55) return options[0];
  if (roll < 0.7) return options[Math.min(1, options.length - 1)];
  if (roll < 0.82) return options[Math.min(2, options.length - 1)];
  if (roll < 0.92) return options[Math.min(3, options.length - 1)];
  return options[options.length - 1];
}

function takeStock(sku, quantity, status) {
  const available = onHand.get(sku) - reserved.get(sku);
  if (status === "cancelled") return true;
  if (available < quantity) return false;
  if (status === "paid" || status === "picking") {
    reserved.set(sku, reserved.get(sku) + quantity);
    return true;
  }
  onHand.set(sku, onHand.get(sku) - quantity);
  return true;
}

const carriers = [
  ["UPS", "Ground"],
  ["UPS", "Express"],
  ["FedEx", "Ground"],
  ["FedEx", "Express"],
  ["USPS", "Ground"],
  ["DHL", "Express"],
];

function trackingNumber(carrier) {
  const digits = (length) => Array.from({ length }, () => Math.floor(rand() * 10)).join("");
  if (carrier === "UPS") return `1Z${digits(16)}`;
  if (carrier === "USPS") return `9400${digits(18)}`;
  if (carrier === "DHL") return digits(10);
  return digits(12);
}

const orders = [];
const lines = [];
const events = [];
const shipments = [];
let orderSequence = 100000;

function addOrder(user, placed, status) {
  const chosen = [];
  const used = new Set();
  const lineCount = 1 + Math.floor(rand() * 4);
  for (let attempt = 0; attempt < 30 && chosen.length < lineCount; attempt += 1) {
    const product = pick(products);
    if (used.has(product.sku)) continue;
    const quantity = 1 + Math.floor(rand() * 3);
    if (!takeStock(product.sku, quantity, status)) continue;
    used.add(product.sku);
    chosen.push({ product, quantity });
  }
  if (chosen.length === 0) return;

  orderSequence += 1;
  const id = randomUUID();
  const subtotal = chosen.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
  const shipping = subtotal >= 7500 ? 0 : 800;
  const tax = Math.round(subtotal * 0.08);
  const [city, region, postal] = user.place;
  orders.push({
    id,
    number: `MRW-${orderSequence}`,
    userId: user.id,
    status,
    placed,
    subtotal,
    shipping,
    tax,
    total: subtotal + shipping + tax,
    shipName: user.name,
    shipLine1: `${100 + Math.floor(rand() * 8900)} Market Street`,
    shipCity: city,
    shipRegion: region,
    shipPostalCode: postal,
    shipCountry: "US",
    email: user.email,
  });

  for (const line of chosen) {
    lines.push({
      orderId: id,
      sku: line.product.sku,
      name: line.product.name,
      quantity: line.quantity,
      unitPriceCents: line.product.priceCents,
    });
  }

  const stamps = [["paid", "Payment captured", user.email, 0]];
  if (status === "cancelled") {
    if (rand() < 0.5) stamps.push(["picking", "Pick started", staff.email, 6]);
    stamps.push(["cancelled", "Cancelled before shipment", user.email, 8]);
  } else {
    const steps = ["paid", "picking", "shipped", "out_for_delivery", "delivered"];
    const notes = {
      picking: "Pick started",
      shipped: "Handed to carrier",
      out_for_delivery: "Out for delivery",
      delivered: "Delivered",
    };
    for (const step of steps.slice(1, steps.indexOf(status) + 1)) {
      stamps.push([step, notes[step], staff.email, leadHours[step]]);
    }
  }

  for (const [step, note, actor, hours] of stamps) {
    const created = new Date(placed.getTime() + hours * 60 * 60 * 1000);
    events.push({
      orderId: id,
      status: step,
      note,
      createdAt: created > NOW ? NOW : created,
      actor,
    });
  }

  if (status === "shipped" || status === "out_for_delivery" || status === "delivered") {
    const [carrier, service] = pick(carriers);
    const shippedAt = new Date(placed.getTime() + leadHours.shipped * 60 * 60 * 1000);
    shipments.push({
      id: randomUUID(),
      orderId: id,
      carrier,
      service,
      trackingNumber: trackingNumber(carrier),
      status:
        status === "shipped"
          ? "in_transit"
          : status === "out_for_delivery"
            ? "out_for_delivery"
            : "delivered",
      shippedAt: shippedAt > NOW ? NOW : shippedAt,
      estimatedDelivery: new Date(shippedAt.getTime() + 3 * DAY),
      deliveredAt:
        status === "delivered"
          ? new Date(placed.getTime() + leadHours.delivered * 60 * 60 * 1000)
          : null,
    });
  }
}

const spotlight = [
  ["paid", 2],
  ["picking", 12],
  ["shipped", 48],
  ["out_for_delivery", 72],
  ["delivered", 24 * 20],
  ["cancelled", 26],
];

for (const [status, hoursAgo] of spotlight) {
  addOrder(customers[0], new Date(NOW.getTime() - hoursAgo * 60 * 60 * 1000), status);
}

const historyStart = new Date("2025-11-16T15:00:00.000Z").getTime();
for (let i = 0; i < 3500; i += 1) {
  const placed = new Date(historyStart + rand() * (NOW.getTime() - historyStart));
  const user = rand() < 0.12 ? customers[0] : pick(customers);
  addOrder(user, placed, pickStatus(placed));
}

for (const product of products) {
  if (skuNumber % 17 === Number(product.sku.slice(-2)) % 17 && rand() < 0.35) {
    const held = reserved.get(product.sku);
    onHand.set(product.sku, held + Math.floor(rand() * 5));
  }
}

function insert(table, columns, rows) {
  const size = 400;
  for (let index = 0; index < rows.length; index += size) {
    const slice = rows.slice(index, index + size);
    process.stdout.write(
      `INSERT INTO ${table} (${columns.join(", ")}) VALUES\n${slice.join(",\n")};\n`,
    );
  }
}

process.stdout.write("BEGIN;\n");
process.stdout.write(
  "TRUNCATE shipments, order_events, order_lines, orders, inventory, products, users RESTART IDENTITY CASCADE;\n",
);

insert(
  "users",
  ["id", "email", "password_hash", "name", "role"],
  [admin, staff, ...customers].map(
    (user) =>
      `(${sqlString(user.id)}, ${sqlString(user.email)}, ${sqlString(passwordHash)}, ${sqlString(user.name)}, ${sqlString(user.role)})`,
  ),
);

insert(
  "products",
  ["sku", "name", "category", "description", "price_cents"],
  products.map(
    (product) =>
      `(${sqlString(product.sku)}, ${sqlString(product.name)}, ${sqlString(product.category)}, ${sqlString(product.description)}, ${product.priceCents})`,
  ),
);

insert(
  "inventory",
  ["sku", "on_hand", "reserved", "reorder_point", "bin"],
  products.map((product, index) => {
    const aisle = String((index % 40) + 1).padStart(2, "0");
    const slot = String(Math.floor(index / 40) + 1).padStart(2, "0");
    return `(${sqlString(product.sku)}, ${onHand.get(product.sku)}, ${reserved.get(product.sku)}, 24, ${sqlString(`${product.sku.slice(0, 1)}-${aisle}-${slot}`)})`;
  }),
);

insert(
  "orders",
  [
    "id",
    "number",
    "user_id",
    "status",
    "placed_at",
    "subtotal_cents",
    "shipping_cents",
    "tax_cents",
    "total_cents",
    "ship_name",
    "ship_line1",
    "ship_city",
    "ship_region",
    "ship_postal_code",
    "ship_country",
  ],
  orders.map(
    (order) =>
      `(${sqlString(order.id)}, ${sqlString(order.number)}, ${sqlString(order.userId)}, ${sqlString(order.status)}, ${sqlTime(order.placed)}, ${order.subtotal}, ${order.shipping}, ${order.tax}, ${order.total}, ${sqlString(order.shipName)}, ${sqlString(order.shipLine1)}, ${sqlString(order.shipCity)}, ${sqlString(order.shipRegion)}, ${sqlString(order.shipPostalCode)}, ${sqlString(order.shipCountry)})`,
  ),
);

insert(
  "order_lines",
  ["order_id", "sku", "name", "quantity", "unit_price_cents"],
  lines.map(
    (line) =>
      `(${sqlString(line.orderId)}, ${sqlString(line.sku)}, ${sqlString(line.name)}, ${line.quantity}, ${line.unitPriceCents})`,
  ),
);

insert(
  "order_events",
  ["order_id", "status", "note", "created_at", "actor_email"],
  events.map(
    (event) =>
      `(${sqlString(event.orderId)}, ${sqlString(event.status)}, ${sqlString(event.note)}, ${sqlTime(event.createdAt)}, ${sqlString(event.actor)})`,
  ),
);

insert(
  "shipments",
  [
    "id",
    "order_id",
    "carrier",
    "service",
    "tracking_number",
    "status",
    "shipped_at",
    "estimated_delivery",
    "delivered_at",
  ],
  shipments.map(
    (shipment) =>
      `(${sqlString(shipment.id)}, ${sqlString(shipment.orderId)}, ${sqlString(shipment.carrier)}, ${sqlString(shipment.service)}, ${sqlString(shipment.trackingNumber)}, ${sqlString(shipment.status)}, ${sqlTime(shipment.shippedAt)}, ${sqlString(shipment.estimatedDelivery.toISOString().slice(0, 10))}, ${shipment.deliveredAt ? sqlTime(shipment.deliveredAt) : "NULL"})`,
  ),
);

process.stdout.write("COMMIT;\n");
console.error(
  `seeded ${products.length} products, ${orders.length} orders, ${lines.length} lines, ${shipments.length} shipments`,
);

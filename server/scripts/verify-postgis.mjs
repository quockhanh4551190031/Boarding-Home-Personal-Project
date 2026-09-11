// Script verify Task 2.1: PostGIS + BoardingHouse + Room + trigger geog
// Chạy: pnpm --filter server exec node scripts/verify-postgis.mjs
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  }),
});

try {
  // 1. PostGIS version
  const [v] = await prisma.$queryRaw`SELECT postgis_version();`;
  console.log("1. PostGIS:", v.postgis_version);

  // 2. Tables
  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' ORDER BY table_name;`;
  console.log("2. Tables:", tables.map((t) => t.table_name).join(", "));

  // 3. Trigger
  const trig = await prisma.$queryRaw`
    SELECT tgname FROM pg_trigger WHERE tgname = 'BoardingHouse_geog_sync';`;
  console.log("3. Trigger:", trig.length ? trig[0].tgname : "KHONG TON TAI");

  // 4. GIST index
  const idx = await prisma.$queryRaw`
    SELECT indexname FROM pg_indexes WHERE indexname = 'BoardingHouse_geog_gist_idx';`;
  console.log("4. GIST index:", idx.length ? idx[0].indexname : "KHONG TON TAI");

  // 5. Insert thử -> trigger phải tự fill geog
  const owner =
    (await prisma.user.findFirst({ where: { role: "LANDLORD" } })) ??
    (await prisma.user.findFirst());

  if (!owner) {
    console.log("5. SKIP: chua co user nao trong DB");
  } else {
    const bh = await prisma.boardingHouse.create({
      data: {
        ownerId: owner.id,
        name: "TEST PostGIS Nha tro",
        address: "123 Test",
        city: "TP. Ho Chi Minh",
        lat: 10.762622,
        lng: 106.660172,
      },
    });
    console.log("5. Insert BoardingHouse OK:", bh.id);

    const [r] = await prisma.$queryRaw`
      SELECT ST_AsText("geog"::geometry) AS wkt,
             ST_X("geog"::geometry) AS x,
             ST_Y("geog"::geometry) AS y
      FROM "BoardingHouse" WHERE id = ${bh.id};`;
    console.log("   geog auto-filled:", r.wkt, "| lng(x)=", r.x, " lat(y)=", r.y);

    // 6. Test ST_DWithin (chuan bi cho Sprint 3)
    const near = await prisma.$queryRaw`
      SELECT id, name,
             ST_Distance("geog", ST_SetSRID(ST_MakePoint(106.66, 10.762), 4326)::geography) AS dist_m
      FROM "BoardingHouse"
      WHERE ST_DWithin("geog", ST_SetSRID(ST_MakePoint(106.66, 10.762), 4326)::geography, 5000)
        AND "deletedAt" IS NULL;`;
    console.log(
      "6. ST_DWithin(5km):",
      near.length,
      "nha tro | gan nhat:",
      near[0] ? Math.round(Number(near[0].dist_m)) + "m" : "N/A",
    );

    // 7. Test Room + Cascade rule ton tai
    const room = await prisma.room.create({
      data: {
        boardingHouseId: bh.id,
        roomCode: "P101",
        price: 3000000,
        area: 20,
        amenities: ["wifi", "may lanh"],
        images: [],
      },
    });
    console.log("7. Insert Room OK:", room.id, "| status:", room.status);

    // Cleanup (Room bi Cascade theo BoardingHouse)
    await prisma.boardingHouse.delete({ where: { id: bh.id } });
    console.log("8. Cleanup OK (Room tu dong mat theo Cascade)");
  }
} catch (e) {
  console.error("LOI:", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

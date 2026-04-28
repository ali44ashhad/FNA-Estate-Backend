import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../database/db";
import { Project, ProjectPricingType, ProjectPropertyType } from "../modules/project/project.model";

dotenv.config();

function requireEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function parseObjectIdList(raw: string): mongoose.Types.ObjectId[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!parts.length) return [];

  const invalid = parts.filter((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalid.length) {
    throw new Error(`Invalid ObjectId(s) in SEED_PROJECT_CITY_IDS: ${invalid.join(", ")}`);
  }

  return parts.map((id) => new mongoose.Types.ObjectId(id));
}

function makeImageUrls(params: {
  count: number;
  width?: number;
  height?: number;
  sigBase: number;
}): string[] {
  const width = params.width ?? 1600;
  const height = params.height ?? 900;
  const images: string[] = [];

  // Reliable, no-auth image service. Different `seed` values yield different images.
  for (let i = 0; i < params.count; i++) {
    images.push(`https://picsum.photos/seed/${params.sigBase + i}/${width}/${height}`);
  }

  return images;
}

type SeedProject = {
  name: string;
  propertyType: ProjectPropertyType;
  pricingType: ProjectPricingType;
  status: string;
  images: string[];
  amenities: string[];
  description: string;
  units?: { type: string; minPrice: number; maxPrice: number; size?: string }[];
  price?: { min: number; max: number };
};

function buildSeedProjects(status: string): SeedProject[] {
  const amenitySets = {
    apartmentCore: [
      "Lift",
      "Power Backup",
      "CCTV",
      "Security",
      "Parking",
      "Visitor Parking",
      "Clubhouse",
      "Gym",
      "Children’s Play Area"
    ],
    apartmentPremium: [
      "Lift",
      "Power Backup",
      "CCTV",
      "Security",
      "Parking",
      "Clubhouse",
      "Gym",
      "Swimming Pool",
      "Jogging Track",
      "Indoor Games"
    ],
    villaCore: ["Private Garden", "Security", "Parking", "Power Backup", "CCTV"],
    villaPremium: [
      "Private Garden",
      "Security",
      "Parking",
      "Power Backup",
      "CCTV",
      "Clubhouse",
      "Swimming Pool",
      "Gym",
      "Outdoor Seating"
    ],
    plotCore: ["Gated Community", "Security", "CCTV", "Street Lights", "Water Supply"],
    plotPremium: [
      "Gated Community",
      "Security",
      "CCTV",
      "Street Lights",
      "Water Supply",
      "Storm Water Drains",
      "Parks",
      "Jogging Track"
    ]
  } as const;

  function makeDescription(params: {
    name: string;
    propertyType: ProjectPropertyType;
    pricingType: ProjectPricingType;
    status: string;
    highlights: string[];
  }): string {
    const safeStatus = params.status ? params.status : "active";
    const hl = params.highlights
      .map((h) => h.trim())
      .filter(Boolean)
      .map((h) => `<li>${h}</li>`)
      .join("");

    return [
      `<p><strong>${params.name}</strong> is a ${params.propertyType} project designed for modern living with thoughtful planning and easy access to daily conveniences.</p>`,
      `<p><strong>Status:</strong> ${safeStatus}. <strong>Pricing:</strong> ${params.pricingType === "direct" ? "Direct" : "Unit-based"}.</p>`,
      `<h4>Highlights</h4>`,
      `<ul>${hl}</ul>`,
      `<p>For site visits, availability, and the latest offers, please get in touch.</p>`
    ].join("\n");
  }

  const projects: SeedProject[] = [
    // Apartments (unit_based)
    {
      name: "Skyline Heights Residences",
      propertyType: "apartment",
      pricingType: "unit_based",
      status,
      amenities: [...amenitySets.apartmentPremium],
      description: makeDescription({
        name: "Skyline Heights Residences",
        propertyType: "apartment",
        pricingType: "unit_based",
        status,
        highlights: ["Premium clubhouse and pool", "Spacious unit mix with efficient layouts", "Strong security and power backup"]
      }),
      units: [
        { type: "1BHK", minPrice: 4200000, maxPrice: 5200000, size: "650-750 sq ft" },
        { type: "2BHK", minPrice: 6100000, maxPrice: 8200000, size: "980-1180 sq ft" },
        { type: "3BHK", minPrice: 9100000, maxPrice: 12500000, size: "1350-1600 sq ft" }
      ],
      images: makeImageUrls({
        count: 6,
        sigBase: 101
      })
    },
    {
      name: "Urban Nest Towers",
      propertyType: "apartment",
      pricingType: "unit_based",
      status,
      amenities: [...amenitySets.apartmentCore],
      description: makeDescription({
        name: "Urban Nest Towers",
        propertyType: "apartment",
        pricingType: "unit_based",
        status,
        highlights: ["Compact studios to 2BHK options", "Visitor parking and CCTV coverage", "Fitness and kids’ play area"]
      }),
      units: [
        { type: "Studio", minPrice: 2900000, maxPrice: 3600000, size: "420-520 sq ft" },
        { type: "1BHK", minPrice: 3800000, maxPrice: 4800000, size: "600-720 sq ft" },
        { type: "2BHK", minPrice: 5400000, maxPrice: 6900000, size: "900-1050 sq ft" }
      ],
      images: makeImageUrls({
        count: 5,
        sigBase: 111
      })
    },
    {
      name: "Lakeview Grand Apartments",
      propertyType: "apartment",
      pricingType: "unit_based",
      status,
      amenities: [...amenitySets.apartmentPremium, "Lake View"],
      description: makeDescription({
        name: "Lakeview Grand Apartments",
        propertyType: "apartment",
        pricingType: "unit_based",
        status,
        highlights: ["Lake-view facing homes (select units)", "Premium amenities and indoor games", "Well-connected neighborhood"]
      }),
      units: [
        { type: "2BHK", minPrice: 6800000, maxPrice: 8600000, size: "1020-1220 sq ft" },
        { type: "3BHK", minPrice: 9800000, maxPrice: 13900000, size: "1450-1750 sq ft" }
      ],
      images: makeImageUrls({
        count: 5,
        sigBase: 121
      })
    },
    // Apartments (direct)
    {
      name: "Metroline Suites",
      propertyType: "apartment",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.apartmentCore, "Near Metro"],
      description: makeDescription({
        name: "Metroline Suites",
        propertyType: "apartment",
        pricingType: "direct",
        status,
        highlights: ["Near metro connectivity", "Secure entry with CCTV", "Direct pricing with transparent range"]
      }),
      price: { min: 5200000, max: 9800000 },
      images: makeImageUrls({
        count: 5,
        sigBase: 131
      })
    },
    {
      name: "Garden Arcadia Condos",
      propertyType: "apartment",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.apartmentPremium, "Landscaped Gardens"],
      description: makeDescription({
        name: "Garden Arcadia Condos",
        propertyType: "apartment",
        pricingType: "direct",
        status,
        highlights: ["Landscaped gardens and jogging track", "Pool and gym access", "Family-friendly community spaces"]
      }),
      price: { min: 6300000, max: 11200000 },
      images: makeImageUrls({
        count: 6,
        sigBase: 141
      })
    },
    {
      name: "Sunrise Boulevard Homes",
      propertyType: "apartment",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.apartmentCore, "Community Hall"],
      description: makeDescription({
        name: "Sunrise Boulevard Homes",
        propertyType: "apartment",
        pricingType: "direct",
        status,
        highlights: ["Community hall for events", "Power backup and security", "Convenient access to daily essentials"]
      }),
      price: { min: 4700000, max: 8900000 },
      images: makeImageUrls({
        count: 4,
        sigBase: 151
      })
    },

    // Villas (direct)
    {
      name: "Palm Grove Villas",
      propertyType: "villa",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.villaPremium],
      description: makeDescription({
        name: "Palm Grove Villas",
        propertyType: "villa",
        pricingType: "direct",
        status,
        highlights: ["Premium villa lifestyle with clubhouse", "Private garden spaces", "Pool and gym facilities"]
      }),
      price: { min: 18500000, max: 32000000 },
      images: makeImageUrls({
        count: 6,
        sigBase: 201
      })
    },
    {
      name: "Hillside Retreat Villas",
      propertyType: "villa",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.villaCore, "Mountain View", "Jogging Track"],
      description: makeDescription({
        name: "Hillside Retreat Villas",
        propertyType: "villa",
        pricingType: "direct",
        status,
        highlights: ["Mountain-view setting (select villas)", "Quiet lanes with jogging track", "Secure community with CCTV"]
      }),
      price: { min: 21000000, max: 37500000 },
      images: makeImageUrls({
        count: 5,
        sigBase: 211
      })
    },
    {
      name: "Coastal Breeze Estates",
      propertyType: "villa",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.villaPremium, "Beach Access"],
      description: makeDescription({
        name: "Coastal Breeze Estates",
        propertyType: "villa",
        pricingType: "direct",
        status,
        highlights: ["Beach access (select stretches)", "Clubhouse + pool lifestyle", "Outdoor seating and garden spaces"]
      }),
      price: { min: 24000000, max: 42000000 },
      images: makeImageUrls({
        count: 6,
        sigBase: 221
      })
    },
    {
      name: "Orchid Courtyard Villas",
      propertyType: "villa",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.villaCore, "Community Park"],
      description: makeDescription({
        name: "Orchid Courtyard Villas",
        propertyType: "villa",
        pricingType: "direct",
        status,
        highlights: ["Community park within the enclave", "Private garden and parking", "Power backup and CCTV coverage"]
      }),
      price: { min: 19500000, max: 34000000 },
      images: makeImageUrls({
        count: 5,
        sigBase: 231
      })
    },
    // Villas (unit_based)
    {
      name: "Cedarwood Villa Enclave",
      propertyType: "villa",
      pricingType: "unit_based",
      status,
      amenities: [...amenitySets.villaPremium, "BBQ Area"],
      description: makeDescription({
        name: "Cedarwood Villa Enclave",
        propertyType: "villa",
        pricingType: "unit_based",
        status,
        highlights: ["Multiple villa configurations available", "BBQ area for gatherings", "Clubhouse and premium amenities"]
      }),
      units: [
        { type: "3BHK Villa", minPrice: 17800000, maxPrice: 23500000, size: "2100-2500 sq ft" },
        { type: "4BHK Villa", minPrice: 24500000, maxPrice: 31500000, size: "2800-3400 sq ft" }
      ],
      images: makeImageUrls({
        count: 5,
        sigBase: 241
      })
    },
    {
      name: "Silver Oak Signature Villas",
      propertyType: "villa",
      pricingType: "unit_based",
      status,
      amenities: [...amenitySets.villaPremium, "Badminton Court"],
      description: makeDescription({
        name: "Silver Oak Signature Villas",
        propertyType: "villa",
        pricingType: "unit_based",
        status,
        highlights: ["Signature villa collection with courts", "Larger 4BHK/5BHK options", "Premium clubhouse facilities"]
      }),
      units: [
        { type: "4BHK Villa", minPrice: 26500000, maxPrice: 34500000, size: "3000-3700 sq ft" },
        { type: "5BHK Villa", minPrice: 35500000, maxPrice: 46500000, size: "3900-5200 sq ft" }
      ],
      images: makeImageUrls({
        count: 6,
        sigBase: 251
      })
    },

    // Plots (direct)
    {
      name: "Greenfield Plot Community",
      propertyType: "plot",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.plotCore],
      description: makeDescription({
        name: "Greenfield Plot Community",
        propertyType: "plot",
        pricingType: "direct",
        status,
        highlights: ["Gated plot community with security", "Street lights and water supply", "Clear pricing range for quick decisions"]
      }),
      price: { min: 1800000, max: 5400000 },
      images: makeImageUrls({
        count: 4,
        sigBase: 301
      })
    },
    {
      name: "Riverbend Residential Plots",
      propertyType: "plot",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.plotPremium, "River View"],
      description: makeDescription({
        name: "Riverbend Residential Plots",
        propertyType: "plot",
        pricingType: "direct",
        status,
        highlights: ["River-view plots (select)", "Parks and jogging track", "Storm water drains and utilities"]
      }),
      price: { min: 2400000, max: 7200000 },
      images: makeImageUrls({
        count: 5,
        sigBase: 311
      })
    },
    {
      name: "Sunridge Layout Plots",
      propertyType: "plot",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.plotPremium],
      description: makeDescription({
        name: "Sunridge Layout Plots",
        propertyType: "plot",
        pricingType: "direct",
        status,
        highlights: ["Well-planned internal roads", "Parks and jogging track", "Gated community with CCTV"]
      }),
      price: { min: 2100000, max: 6800000 },
      images: makeImageUrls({
        count: 4,
        sigBase: 321
      })
    },
    {
      name: "Meadowline Corner Plots",
      propertyType: "plot",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.plotCore, "Corner Plots Available"],
      description: makeDescription({
        name: "Meadowline Corner Plots",
        propertyType: "plot",
        pricingType: "direct",
        status,
        highlights: ["Corner plots available", "Street lights and utilities", "Secure gated community"]
      }),
      price: { min: 2600000, max: 8100000 },
      images: makeImageUrls({
        count: 5,
        sigBase: 331
      })
    },
    // Plots (unit_based)
    {
      name: "Heritage Park Plot Series",
      propertyType: "plot",
      pricingType: "unit_based",
      status,
      amenities: [...amenitySets.plotPremium, "Children’s Play Area"],
      description: makeDescription({
        name: "Heritage Park Plot Series",
        propertyType: "plot",
        pricingType: "unit_based",
        status,
        highlights: ["Multiple plot sizes and categories", "Play area and parks", "Gated security with CCTV"]
      }),
      units: [
        { type: "Residential Plot", minPrice: 1700000, maxPrice: 4200000, size: "1200-1800 sq ft" },
        { type: "Corner Plot", minPrice: 2300000, maxPrice: 5600000, size: "1500-2400 sq ft" }
      ],
      images: makeImageUrls({
        count: 4,
        sigBase: 341
      })
    },
    {
      name: "Oakridge Villa Plots",
      propertyType: "plot",
      pricingType: "unit_based",
      status,
      amenities: [...amenitySets.plotPremium, "Park Facing"],
      description: makeDescription({
        name: "Oakridge Villa Plots",
        propertyType: "plot",
        pricingType: "unit_based",
        status,
        highlights: ["Premium and park-facing plots", "Jogging track and parks", "Upgraded utilities and drainage"]
      }),
      units: [
        { type: "Premium Plot", minPrice: 3200000, maxPrice: 8800000, size: "2000-4000 sq ft" },
        { type: "Park-Facing Plot", minPrice: 3900000, maxPrice: 10200000, size: "2400-4500 sq ft" }
      ],
      images: makeImageUrls({
        count: 5,
        sigBase: 351
      })
    },

    // Extra variety (mix)
    {
      name: "Central Avenue Residences",
      propertyType: "apartment",
      pricingType: "unit_based",
      status,
      amenities: [...amenitySets.apartmentCore, "Co-working Space"],
      description: makeDescription({
        name: "Central Avenue Residences",
        propertyType: "apartment",
        pricingType: "unit_based",
        status,
        highlights: ["Co-working space within campus", "Family-focused amenities", "Balanced unit mix for buyers"]
      }),
      units: [
        { type: "2BHK", minPrice: 5900000, maxPrice: 7600000, size: "920-1100 sq ft" },
        { type: "3BHK", minPrice: 8300000, maxPrice: 11200000, size: "1280-1550 sq ft" }
      ],
      images: makeImageUrls({
        count: 5,
        sigBase: 161
      })
    },
    {
      name: "Brookstone Family Villas",
      propertyType: "villa",
      pricingType: "direct",
      status,
      amenities: [...amenitySets.villaCore, "Indoor Games", "Jogging Track"],
      description: makeDescription({
        name: "Brookstone Family Villas",
        propertyType: "villa",
        pricingType: "direct",
        status,
        highlights: ["Indoor games and jogging track", "Private gardens and secure lanes", "Direct pricing for clarity"]
      }),
      price: { min: 16800000, max: 28500000 },
      images: makeImageUrls({
        count: 5,
        sigBase: 261
      })
    }
  ];

  return projects;
}

async function main() {
  const cityIdsRaw = requireEnv("SEED_PROJECT_CITY_IDS");
  const status = process.env.SEED_PROJECT_STATUS ?? "active";
  const countRaw = process.env.SEED_PROJECT_COUNT;
  const count = countRaw ? Number(countRaw) : 20;

  if (!Number.isFinite(count) || count <= 0) {
    throw new Error("Invalid SEED_PROJECT_COUNT; must be a positive number.");
  }

  const cityIds = parseObjectIdList(cityIdsRaw);
  if (!cityIds.length) {
    throw new Error("SEED_PROJECT_CITY_IDS must contain at least one valid ObjectId.");
  }

  await connectDB();

  const seedProjects = buildSeedProjects(status).slice(0, count);

  const inserted: Array<{ id: string; name: string; cityId: string }> = [];
  const updated: Array<{ id: string; name: string; cityId: string }> = [];
  const skipped: Array<{ id: string; name: string; cityId: string }> = [];

  for (let i = 0; i < seedProjects.length; i++) {
    const p = seedProjects[i];
    const cityId = cityIds[i % cityIds.length];

    const existing = await Project.findOne({
      name: p.name,
      cityId,
      isDeleted: false
    });

    if (existing) {
      const nextDoc: Partial<SeedProject> = {
        propertyType: p.propertyType,
        pricingType: p.pricingType,
        status: p.status,
        images: p.images,
        amenities: p.amenities,
        description: p.description,
        ...(p.units ? { units: p.units } : {}),
        ...(p.price ? { price: p.price } : {})
      };

      await Project.updateOne({ _id: existing._id }, { $set: nextDoc });
      updated.push({ id: String(existing._id), name: existing.name, cityId: String(existing.cityId) });
      continue;
    }

    const created = await Project.create({
      name: p.name,
      cityId,
      propertyType: p.propertyType,
      status: p.status,
      pricingType: p.pricingType,
      amenities: p.amenities,
      description: p.description,
      ...(p.units ? { units: p.units } : {}),
      ...(p.price ? { price: p.price } : {}),
      images: p.images
    });

    inserted.push({ id: String(created._id), name: created.name, cityId: String(created.cityId) });
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        message: "Projects seed completed",
        input: {
          countRequested: count,
          cityIds: cityIds.map(String),
          status
        },
        result: {
          insertedCount: inserted.length,
          updatedCount: updated.length,
          skippedCount: skipped.length,
          inserted,
          updated,
          skipped
        }
      },
      null,
      2
    )
  );
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });


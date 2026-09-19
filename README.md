# Dwell Mart AI — Shopping & Wholesale Discovery Agent

An enterprise-ready, modular AI Shopping & Wholesale Discovery Assistant built for **[Dwell Mart](https://dwellmart.in/shop?delivery=wholesale)**.

The system allows retail and wholesale customers to search products by natural language, filter by price, brand, category, and stock status, calculate tiered wholesale volume discounts, inspect inventory availability, and submit commercial wholesale inquiries through an interactive, premium chat interface.

---

## 🏗️ Architecture & Component Topology

```
Client (Web UI / useChat)
   │
   ▼
[POST /api/chat] (Next.js Route Handler)
   │
   ├── 1. Request Size & Rate Limiter (64KB max, 20 req/min sliding window)
   ├── 2. Input Sanitization & Zod Schema Validation
   │
   ▼
[Agent Orchestrator] (src/lib/ai/orchestrator.ts)
   │
   ├── Protected System Prompt Injection (Identifies as Dwell Mart Discovery Guide)
   ├── Conversation Limit Enforcement (Max 30 messages, 4,000 chars/msg)
   │
   ├── Multi-Provider Selection:
   │    ├── Google Gemini Provider (gemini-3.6-flash / gemini-flash-latest / gemini-3.5-flash)
   │    ├── OpenAI Provider (gpt-4o)
   │    └── Mock AI Provider (Deterministic, zero-network development mode)
   │
   ▼
[Controlled Tool Registry] (src/lib/ai/tools/registry.ts)
   │
   ├── Whitelist Enforcement & Zod Parameter Validation
   └── Safe Execution Loop
        ├── searchProducts (Keyword, brand, category, min/max price, stock)
        ├── getProductById / getProductDetails (Comprehensive item specs)
        ├── getProductsByCategory (Category & subcategory browsing)
        ├── filterProducts (Multi-faceted parametric filters)
        ├── getProductCategories (All 15 catalog categories)
        ├── checkInventory (Stock levels & fulfillment lead time)
        └── getWholesalePrice (Tiered volume discount math)
   │
   ▼
[Product Data Abstraction Layer] (src/lib/products/)
   │
   ├── ProductCatalogAdapter Interface
   ├── MockProductAdapter (15 categories, 50+ realistic demonstration products)
   └── Future DwellMartApiAdapter (Live API ready)
   │
   ▼
[Client UI Rendering] (src/components/chat/)
   │
   ├── Markdown Chat Bubbles
   ├── Interactive ProductCard & ProductCardList components
   └── WholesaleInquiryModal (Review, edit, and confirm quotation inquiries)
```

---

## 🛒 Supported Catalog Categories (15 Categories)

1. **Fresh Vegetables**: Farm-fresh bulk onions, potatoes, tomatoes, and exotics.
2. **Staples & Grains**: India Gate Basmati, Fortune Everyday Rice, Sona Masoori, Organic Millets.
3. **Flours & Atta**: Aashirvaad Shudh Chakki Atta, Multigrain Atta, Tata Sampann Besan.
4. **Pulses & Lentils**: Tata Sampann Toor Dal, Moong Dal, Jammu Chitra Rajma, Kabuli Chana.
5. **Cooking Oils & Ghee**: Fortune Sunflower Oil, Engine Mustard Oil, Amul Cow Ghee tins.
6. **Spices & Masalas**: MDH Deggi Mirch, Catch Garam Masala, Salem Turmeric fingers.
7. **Packaged & Instant Foods**: Maggi 2-Minute Noodles cases, Haldirams Bhujia, Kissan Ketchup.
8. **Dairy**: Amul Malai Paneer 5kg blocks, Amul Table Butter, Taaza UHT Milk cartons.
9. **Bakery**: English Oven Jumbo Sandwich Bread, Britannia Rusk bulk boxes, Artisanal Cookies.
10. **Inverters**: Luminous Zelio+ (under ₹10,000), Microtek Luxe 1400, Cruze Commercial UPS.
11. **Electrical Accessories**: Havells Reo switches, Polycab FR copper wires, Schneider MCBs.
12. **Bikes and Scooters**: Hero Destini 125, TVS XL100 Heavy Duty, Honda Activa 6G fleet.
13. **Electric Scooters**: Ather 450X Gen 3, Hero Electric Nyx cargo EV, Bounce Infinity E1+.
14. **Cycles**: Hero Royal Roadster 22", Hercules Roadeo MTB, Firefox Mist 700c Hybrid.
15. **Home and General Products**: Ergonomic Mesh Office Chairs, Prestige Cookware sets, Steel racks.

---

## 💎 Phase 3 Feature Set

- **Natural Language Discovery**: AI parses queries in English, Hindi, and Hinglish (e.g., *"Mujhe 10 kg rice chahiye"*, *"Show me inverter under 10000"*, *"Do you have electric scooters?"*).
- **Price Range & Brand Filtering**: Automatic extraction of numerical bounds (`maxPrice`, `minPrice`) and recognized brand tokens (`Luminous`, `Fortune`, `Ather`).
- **Interactive Product Cards**: Responsive Light UI product cards inside the chat stream displaying:
  - Product thumbnail / category fallback icon
  - Brand and Subcategory labels
  - Retail Price & Wholesale Tier Price in INR (`₹`)
  - Stock Status Badge (`In Stock`, `Low Stock`, `Out of Stock`)
  - Minimum Order Quantity (MOQ)
  - Data Source Badge (`Mock Demo` or `Live Store`)
  - Verified Product URL link (only rendered when an authentic URL is present)
  - `Inquire Wholesale` action button
- **Wholesale Quotation Workflow**:
  - Modal dialog allowing commercial buyers to customize required order quantity, target budget, delivery destination, and operational notes.
  - Recalculates estimated wholesale savings in real-time.
  - Requires explicit user confirmation before recording.
  - Saves confirmed inquiries safely in local client storage with unique reference ID (`inq-...`).
  - Emits conversational follow-up into the chat for automated volume tier and lead-time analysis.
- **Safety & Prompt Injection Defense**:
  - Product names, descriptions, and catalog tags are treated strictly as passive data.
  - Model is guarded against instruction injection embedded in product attributes.
  - Transparent labeling ensures demonstration data is never misrepresented as confirmed live store inventory.

---

## 🧪 Testing & Verification

Run the test suite:
```bash
npm test
```
All **74 tests** across 6 test suites pass:
```
PASS src/__tests__/phase3-product-discovery.test.ts
PASS src/__tests__/tools.test.ts
PASS src/__tests__/backend.test.ts
PASS src/__tests__/gemini.test.ts
PASS src/__tests__/validation.test.ts
PASS src/__tests__/catalog.test.ts

Test Suites: 6 passed, 6 total
Tests:       74 passed, 74 total
```

Run TypeScript strict verification:
```bash
npm run typecheck
```

Run ESLint verification:
```bash
npm run lint
```

Run production build:
```bash
npm run build
```

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
# ── AI Provider Selection (Options: "gemini" | "openai" | "mock") ──
AI_PROVIDER=gemini
AI_MOCK_MODE=false

# ── Google Gemini Configuration ──
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.6-flash

# ── OpenAI Configuration (Fallback) ──
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o

# ── Product Data Adapter (Options: "mock" | "live") ──
PRODUCT_DATA_SOURCE=mock

# ── General Settings ──
AI_TIMEOUT_MS=30000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Dwell Mart AI
```

---

## 🚀 Future Phase 4 Integration Plan

1. **Live Dwell Mart API Adapter (`DwellMartApiAdapter`)**:
   Implement `ProductCatalogAdapter` targeting live Dwell Mart catalog endpoints (`https://dwellmart.in/api/...`) with HMAC request signing and Redis response caching.
2. **Authorized B2B Wholesale Portal Sync**:
   Directly sync confirmed wholesale inquiries with Dwell Mart's ERP / CRM order management backend.
3. **Buyer Authentication & Custom Price Books**:
   Allow registered wholesale distributors to log in and unlock pre-negotiated tier pricing directly in the AI chat.

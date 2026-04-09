// itemCatalog.ts — Comprehensive kids' gear catalog for Watasu
// This file is intentionally large. It powers fuzzy search and auto-categorization.

// ─── Types ───────────────────────────────────────────────────────────────────

export type Category =
  | "Clothing"
  | "Shoes"
  | "Outerwear"
  | "Strollers"
  | "Car Seats"
  | "Gear"
  | "Feeding"
  | "Toys"
  | "Books"
  | "Furniture"
  | "Sleep"
  | "Bath"
  | "Safety"
  | "Outdoor"
  | "Electronics"
  | "Home Furniture"
  | "Appliances"
  | "Sports & Fitness"
  | "Fashion"
  | "Tools"
  | "Garden & Patio"
  | "Instruments"
  | "Auto & Moto"
  | "Home Decor"
  | "Office"
  | "Gaming"
  | "Free Stuff";

export type SizeSystem =
  | "clothing"
  | "shoes"
  | "age-range"
  | "weight-range"
  | "reading-level"
  | "one-size"
  | "adult-clothing"
  | "model-spec"
  | "dimensions"
  | "adult-shoes";

export interface CatalogEntry {
  brand?: string;
  name: string;
  category: Category;
  emoji: string;
  sizeSystem: SizeSystem;
  keywords: string[];
  popularity?: number; // how often selected by users (higher = shows first in search)
}

// ─── Size Options ────────────────────────────────────────────────────────────

export const SIZE_OPTIONS: Record<SizeSystem, string[]> = {
  clothing: [
    "Preemie",
    "NB",
    "0-3mo",
    "3-6mo",
    "6-9mo",
    "6-12mo",
    "9-12mo",
    "12-18mo",
    "18-24mo",
    "2T",
    "3T",
    "4T",
    "5T",
    "6",
    "7",
    "8",
    "10",
    "12",
    "14",
  ],
  shoes: [
    "Infant 0",
    "Infant 1",
    "Infant 2",
    "Infant 3",
    "Infant 4",
    "Toddler 5",
    "Toddler 6",
    "Toddler 7",
    "Toddler 8",
    "Toddler 9",
    "Toddler 10",
    "Kid 11",
    "Kid 12",
    "Kid 13",
    "Kid 1",
    "Kid 2",
    "Kid 3",
  ],
  "age-range": [
    "0-3mo",
    "3-6mo",
    "6-12mo",
    "1-2y",
    "2-3y",
    "3-4y",
    "4-6y",
    "6-8y",
    "8+",
  ],
  "weight-range": [
    "Up to 15 lbs",
    "Up to 22 lbs",
    "Up to 30 lbs",
    "Up to 40 lbs",
    "Up to 50 lbs",
    "Up to 65 lbs",
  ],
  "reading-level": [
    "Board books",
    "Picture books",
    "Early readers",
    "Chapter books",
  ],
  "one-size": ["One size"],
  "adult-clothing": ["XXS", "XS", "S", "M", "L", "XL", "XXL", "0", "2", "4", "6", "8", "10", "12", "14"],
  "adult-shoes": ["W 5", "W 6", "W 7", "W 8", "W 9", "W 10", "W 11", "M 7", "M 8", "M 9", "M 10", "M 11", "M 12", "M 13"],
  "model-spec": ["See description"],
  "dimensions": ["See description"],
};

// ─── Category Info ───────────────────────────────────────────────────────────

export const CATEGORY_INFO: Record<
  Category,
  { emoji: string; sizeSystem: SizeSystem }
> = {
  Clothing: { emoji: "👕", sizeSystem: "clothing" },
  Shoes: { emoji: "👟", sizeSystem: "shoes" },
  Outerwear: { emoji: "🧥", sizeSystem: "clothing" },
  Strollers: { emoji: "🍼", sizeSystem: "one-size" },
  "Car Seats": { emoji: "🚗", sizeSystem: "weight-range" },
  Gear: { emoji: "🎒", sizeSystem: "age-range" },
  Feeding: { emoji: "🍽️", sizeSystem: "age-range" },
  Toys: { emoji: "🧸", sizeSystem: "age-range" },
  Books: { emoji: "📚", sizeSystem: "reading-level" },
  Furniture: { emoji: "🪑", sizeSystem: "one-size" },
  Sleep: { emoji: "😴", sizeSystem: "age-range" },
  Bath: { emoji: "🛁", sizeSystem: "age-range" },
  Safety: { emoji: "🔒", sizeSystem: "one-size" },
  Outdoor: { emoji: "🌳", sizeSystem: "age-range" },
  Electronics: { emoji: "📱", sizeSystem: "model-spec" },
  "Home Furniture": { emoji: "🛋️", sizeSystem: "dimensions" },
  Appliances: { emoji: "🔌", sizeSystem: "model-spec" },
  "Sports & Fitness": { emoji: "🏋️", sizeSystem: "one-size" },
  Fashion: { emoji: "👗", sizeSystem: "adult-clothing" },
  Tools: { emoji: "🔧", sizeSystem: "one-size" },
  "Garden & Patio": { emoji: "🌿", sizeSystem: "one-size" },
  Instruments: { emoji: "🎸", sizeSystem: "one-size" },
  "Auto & Moto": { emoji: "🚙", sizeSystem: "model-spec" },
  "Home Decor": { emoji: "🖼️", sizeSystem: "one-size" },
  Office: { emoji: "💼", sizeSystem: "one-size" },
  Gaming: { emoji: "🎮", sizeSystem: "model-spec" },
  "Free Stuff": { emoji: "🆓", sizeSystem: "one-size" },
};

// ─── Sub-Categories (for browse-first add flow) ─────────────────────────────
// Each sub-category has a label, emoji, and keyword matchers.
// An item matches if ANY of its keywords (or name) contain ANY matcher.

export interface SubCategory {
  label: string;
  emoji: string;
  matchers: string[]; // lowercase substrings to match against keywords/name
}

export const SUB_CATEGORIES: Partial<Record<Category, SubCategory[]>> = {
  Clothing: [
    { label: "Tops", emoji: "👕", matchers: ["tee", "tshirt", "shirt", "top", "long sleeve", "short sleeve", "graphic tee", "henley"] },
    { label: "Pants", emoji: "👖", matchers: ["pants", "joggers", "jeans", "denim", "legging", "sweatpants", "track pants", "corduroy", "stretch pants", "skinny"] },
    { label: "Dresses", emoji: "👗", matchers: ["dress", "frock", "sundress", "tutu", "twirl", "party dress", "jumper dress"] },
    { label: "PJs & Sleepwear", emoji: "🌙", matchers: ["pjs", "pyjamas", "sleepwear", "sleeper", "footie", "jammies", "sleep", "blanket sleeper"] },
    { label: "Onesies & Rompers", emoji: "👶", matchers: ["onesie", "bodysuit", "romper", "one piece", "coverall", "playsuit", "sunsuit", "jumpsuit"] },
    { label: "Sets", emoji: "👔", matchers: ["set", "outfit", "multipack"] },
    { label: "Swimwear", emoji: "🩱", matchers: ["swim", "bikini", "trunks", "rash guard", "bathing suit", "sun shirt"] },
    { label: "Sweaters & Hoodies", emoji: "🧶", matchers: ["sweater", "hoodie", "pullover", "sweatshirt", "cardigan", "fleece", "zip up"] },
    { label: "Shorts", emoji: "🩳", matchers: ["shorts", "short pants", "gym shorts", "athletic shorts", "cutoffs"] },
    { label: "Skirts", emoji: "💃", matchers: ["skirt", "tulle", "pleated"] },
    { label: "Socks & Accessories", emoji: "🧦", matchers: ["socks", "hat", "beanie", "gloves", "mittens", "sunhat", "cap", "tights", "undies", "underwear"] },
  ],
  Shoes: [
    { label: "Sneakers", emoji: "👟", matchers: ["running", "athletic", "sneaker", "trainers", "tennis shoes", "athletic shoes"] },
    { label: "Boots", emoji: "🥾", matchers: ["boot", "winter", "rain", "waterproof", "snow", "chukka", "wellies"] },
    { label: "Sandals", emoji: "🩴", matchers: ["sandal", "flip flop", "summer", "open toe", "water safe", "salt water"] },
    { label: "Slip-ons", emoji: "🩰", matchers: ["slip on", "clog", "crocs", "easy on", "moccasin", "mocc", "slipper"] },
    { label: "First Walkers", emoji: "👣", matchers: ["first walker", "soft sole", "baby shoes", "first shoes", "soft motion"] },
    { label: "Dress Shoes", emoji: "👞", matchers: ["dressy", "formal", "classic"] },
  ],
  Outerwear: [
    { label: "Puffer Jackets", emoji: "🧥", matchers: ["puffy", "puffer", "down", "insulated", "nano puff", "thermoball", "powder lite"] },
    { label: "Fleece", emoji: "🧤", matchers: ["fleece", "sherpa", "synchilla", "benton springs", "denali"] },
    { label: "Rain Gear", emoji: "🌧️", matchers: ["rain", "waterproof", "torrentshell", "resolve", "switchback", "rain suit", "rain pants"] },
    { label: "Snow Gear", emoji: "❄️", matchers: ["snow", "ski", "snow suit", "winter", "insulated"] },
    { label: "Light Jackets", emoji: "🧢", matchers: ["jacket", "lightweight", "packable", "windbreaker"] },
    { label: "Vests", emoji: "🦺", matchers: ["vest", "puffer vest", "fleece vest"] },
  ],
  Toys: [
    { label: "Building & Blocks", emoji: "🧱", matchers: ["block", "lego", "duplo", "magna tiles", "magnatiles", "tegu", "building", "bricks"] },
    { label: "Dolls & Figures", emoji: "🧸", matchers: ["doll", "plush", "stuffie", "teddy", "jellycat", "lovey", "figurine", "puppet"] },
    { label: "Ride-On & Active", emoji: "🚗", matchers: ["ride on", "cozy coupe", "climber", "slide", "trike", "wagon", "balance", "pikler", "nugget", "play couch"] },
    { label: "Puzzles & Games", emoji: "🧩", matchers: ["puzzle", "jigsaw", "game"] },
    { label: "Play Sets", emoji: "🎭", matchers: ["kitchen", "play food", "doll house", "pretend", "costume", "dress up", "play set"] },
    { label: "Learning & STEM", emoji: "🔬", matchers: ["montessori", "educational", "learning", "stem", "sensory", "shape sorter", "stacking"] },
    { label: "Vehicles & Trains", emoji: "🚂", matchers: ["train", "car", "truck", "vehicle", "brio", "thomas", "tracks", "railway"] },
    { label: "Arts & Crafts", emoji: "🎨", matchers: ["crayons", "markers", "paint", "coloring", "craft", "playdoh", "clay"] },
    { label: "Music", emoji: "🎵", matchers: ["xylophone", "drum", "guitar", "tambourine", "maracas", "musical", "tonies", "toniebox"] },
  ],
  Gear: [
    { label: "Carriers & Wraps", emoji: "🤱", matchers: ["carrier", "wrap", "ergo", "babybjorn", "sling", "solly", "boba", "tula", "lillebaby", "hiking"] },
    { label: "Monitors", emoji: "📹", matchers: ["monitor", "camera", "nanit", "owlet", "infant optics", "video"] },
    { label: "Bouncers & Swings", emoji: "🪑", matchers: ["bouncer", "swing", "rocker", "mamaroo", "vibrating"] },
    { label: "Sound Machines", emoji: "🌊", matchers: ["sound machine", "white noise", "hatch", "dohm", "yogasleep", "night light"] },
    { label: "Play Yards", emoji: "🏕️", matchers: ["pack n play", "playard", "play yard", "travel crib", "portable crib"] },
    { label: "Diaper & Bath", emoji: "🧷", matchers: ["diaper", "pail", "genie", "diaper bag", "potty", "toilet", "step stool"] },
    { label: "Nursing & Feeding", emoji: "🍼", matchers: ["boppy", "nursing", "breastfeeding", "pillow", "bottle warmer", "sterilizer", "formula", "brezza"] },
    { label: "Activity & Play", emoji: "🎪", matchers: ["activity", "playmat", "gym", "tummy time", "exersaucer", "jumper", "play mat"] },
  ],
  Feeding: [
    { label: "High Chairs", emoji: "🪑", matchers: ["high chair", "tripp trapp", "stokke", "antilop", "booster"] },
    { label: "Bottles", emoji: "🍼", matchers: ["bottle", "comotomo", "avent", "dr brown", "mam", "tommee", "natural flow"] },
    { label: "Breast Pumps", emoji: "🤱", matchers: ["pump", "spectra", "medela", "elvie", "willow", "wearable", "hands free"] },
    { label: "Plates & Bowls", emoji: "🍽️", matchers: ["plate", "bowl", "ezpz", "suction", "silicone"] },
    { label: "Cups & Bottles", emoji: "🥤", matchers: ["sippy", "cup", "straw", "water bottle", "hydro", "camelbak"] },
    { label: "Bibs & Utensils", emoji: "🥄", matchers: ["bib", "spoon", "fork", "utensil", "bumkins", "num num"] },
    { label: "Lunch & Snack", emoji: "🍱", matchers: ["lunch box", "bento", "bentgo", "snack", "thermos", "omie"] },
    { label: "Storage", emoji: "🧊", matchers: ["storage", "freezer", "lansinoh", "milk"] },
  ],
};

// ─── Bundle Categories ───────────────────────────────────────────────────────

export const BUNDLE_CATEGORIES: Category[] = [
  "Clothing",
  "Shoes",
  "Outerwear",
  "Toys",
  "Books",
  "Feeding",
  "Bath",
  "Sleep",
  "Safety",
  "Outdoor",
];

// ─── Condition Options ───────────────────────────────────────────────────────

export const CONDITION_OPTIONS = ["Like new", "Great", "Good", "Fair"] as const;

// ─── Item Catalog ────────────────────────────────────────────────────────────

export const ITEM_CATALOG: CatalogEntry[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CLOTHING — Brands & Generics
  // ═══════════════════════════════════════════════════════════════════════════

  // Carter's
  { brand: "Carter's", name: "Simple Joys Bodysuit Set", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["carters", "simple joys", "onesie", "one piece"] },
  { brand: "Carter's", name: "Sleep & Play Footie", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["carters", "pjs", "pyjamas", "sleepwear", "footie"] },
  { brand: "Carter's", name: "Just One You Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["carters", "just one you", "one piece", "jumper"] },
  { brand: "Carter's", name: "Little Planet Organic Set", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["carters", "little planet", "organic", "set"] },

  // Cat & Jack (Target)
  { brand: "Cat & Jack", name: "T-Shirt", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["target", "cat and jack", "tee"] },
  { brand: "Cat & Jack", name: "Joggers", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["target", "cat and jack", "sweatpants", "pants"] },
  { brand: "Cat & Jack", name: "Jeans", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["target", "cat and jack", "denim"] },

  // Primary
  { brand: "Primary", name: "The Classic Tee", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["primary", "solid color", "basics", "plain"] },
  { brand: "Primary", name: "The Legging", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["primary", "solid color", "basics"] },
  { brand: "Primary", name: "The Baby Bodysuit", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["primary", "solid color", "basics", "onesie"] },
  { brand: "Primary", name: "The Sweatshirt", category: "Clothing", emoji: "🧶", sizeSystem: "clothing", keywords: ["primary", "solid color", "basics", "pullover"] },

  // Hanna Andersson
  { brand: "Hanna Andersson", name: "Organic Cotton Pajamas", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["hanna", "hannas", "hannah", "organic", "pjs", "sleepwear", "striped", "signature prints"] },
  { brand: "Hanna Andersson", name: "Bright Basics Dress", category: "Clothing", emoji: "👗", sizeSystem: "clothing", keywords: ["hanna", "hannas", "hannah", "bright basics"] },
  { brand: "Hanna Andersson", name: "Swim Collection Rash Guard", category: "Clothing", emoji: "🏊", sizeSystem: "clothing", keywords: ["hanna", "hannas", "swim", "sun protection", "swim collection"] },
  { brand: "Hanna Andersson", name: "Swedish Moccasins", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["hanna", "hannas", "moccasins", "slippers", "swedish"] },

  // Tea Collection
  { brand: "Tea Collection", name: "Graphic Tee", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["tea", "printed", "art"] },
  { brand: "Tea Collection", name: "Baby Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["tea", "one piece"] },
  { brand: "Tea Collection", name: "Flutter Sleeve Dress", category: "Clothing", emoji: "👗", sizeSystem: "clothing", keywords: ["tea", "flutter", "dress"] },
  { brand: "Tea Collection", name: "Side Stripe Joggers", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["tea", "joggers", "side stripe"] },

  // Mini Boden
  { brand: "Mini Boden", name: "Printed Leggings", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["boden", "printed", "colorful"] },
  { brand: "Mini Boden", name: "Fun Jersey Dress", category: "Clothing", emoji: "👗", sizeSystem: "clothing", keywords: ["boden", "fun", "jersey"] },
  { brand: "Mini Boden", name: "Shaggy-Lined Hoodie", category: "Clothing", emoji: "🧥", sizeSystem: "clothing", keywords: ["boden", "shaggy", "lined", "hoodie"] },
  { brand: "Mini Boden", name: "Cord Dungarees", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["boden", "corduroy", "dungarees", "overalls"] },

  // Zara Kids
  { brand: "Zara Kids", name: "Linen Shirt", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["zara", "button down"] },
  { brand: "Zara Kids", name: "Knit Sweater", category: "Clothing", emoji: "🧶", sizeSystem: "clothing", keywords: ["zara", "pullover"] },

  // H&M Kids
  { brand: "H&M Kids", name: "Organic Cotton Tee", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["h&m", "hm", "h and m", "basics"] },
  { brand: "H&M Kids", name: "Leggings Pack", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["h&m", "hm", "multipack"] },

  // Gap Kids
  { brand: "Gap Kids", name: "Logo Hoodie", category: "Clothing", emoji: "🧥", sizeSystem: "clothing", keywords: ["gap", "sweatshirt", "pullover", "arch logo"] },
  { brand: "Gap Kids", name: "Toddler Denim Jacket", category: "Clothing", emoji: "🧥", sizeSystem: "clothing", keywords: ["gap", "jean jacket", "babygap"] },
  { brand: "Gap Kids", name: "BabyGap Organic Bodysuit", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["gap", "babygap", "organic", "onesie"] },
  { brand: "Gap Kids", name: "Brannan Bear Sweater", category: "Clothing", emoji: "🧶", sizeSystem: "clothing", keywords: ["gap", "babygap", "brannan bear", "sweater"] },

  // Old Navy
  { brand: "Old Navy", name: "Graphic Tee", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["old navy", "printed"] },
  { brand: "Old Navy", name: "Fleece Pants", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["old navy", "sweatpants", "joggers"] },
  { brand: "Old Navy", name: "Jean Shorts", category: "Clothing", emoji: "🩳", sizeSystem: "clothing", keywords: ["old navy", "denim shorts", "cutoffs"] },

  // Nike Kids
  { brand: "Nike Kids", name: "Dri-FIT Tee", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["nike", "athletic", "sports", "drifit"] },
  { brand: "Nike Kids", name: "Tech Fleece Hoodie", category: "Clothing", emoji: "🧥", sizeSystem: "clothing", keywords: ["nike", "tech fleece", "hoodie", "athletic"] },
  { brand: "Nike Kids", name: "Sportswear Club Joggers", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["nike", "sweats", "athletic", "club", "joggers"] },

  // Adidas Kids
  { brand: "Adidas Kids", name: "Adicolor SST Track Set", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["adidas", "track suit", "athletic", "three stripes", "sst", "adicolor"] },
  { brand: "Adidas Kids", name: "Trefoil Hoodie", category: "Clothing", emoji: "🧥", sizeSystem: "clothing", keywords: ["adidas", "trefoil", "hoodie"] },
  { brand: "Adidas Kids", name: "Essentials Tee", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["adidas", "essentials", "sports"] },

  // Under Armour Kids
  { brand: "Under Armour Kids", name: "Tech T-Shirt", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["under armour", "ua", "athletic", "sports"] },
  { brand: "Under Armour Kids", name: "Athletic Shorts", category: "Clothing", emoji: "🩳", sizeSystem: "clothing", keywords: ["under armour", "ua", "sports"] },

  // New Balance Kids
  { brand: "New Balance Kids", name: "Athletic Shorts", category: "Clothing", emoji: "🩳", sizeSystem: "clothing", keywords: ["new balance", "nb", "sports"] },

  // Burt's Bees Baby
  { brand: "Burt's Bees Baby", name: "Organic Bodysuit Set", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["burts bees", "organic", "onesie", "set"] },
  { brand: "Burt's Bees Baby", name: "Sleeper Footed", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["burts bees", "organic", "pjs", "sleepwear", "footie", "sleeper"] },
  { brand: "Burt's Bees Baby", name: "Quilted Blanket", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["burts bees", "organic", "blanket", "quilted"] },

  // Gerber
  { brand: "Gerber", name: "Onesie Pack", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["gerber", "bodysuit", "multipack", "basics"] },
  { brand: "Gerber", name: "Sleep N Play", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["gerber", "sleeper", "footie"] },

  // Cloud Island (Target)
  { brand: "Cloud Island", name: "Bodysuit Set", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["cloud island", "target", "onesie", "basics"] },
  { brand: "Cloud Island", name: "Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["cloud island", "target", "one piece"] },

  // Honest Baby
  { brand: "Honest Baby", name: "Organic Pajamas", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["honest", "jessica alba", "organic", "pjs"] },
  { brand: "Honest Baby", name: "Bodysuit Pack", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["honest", "organic", "onesie"] },

  // Pact
  { brand: "Pact", name: "Organic Basics Set", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["pact", "organic", "sustainable"] },

  // Monica + Andy
  { brand: "Monica + Andy", name: "Coming Home Set", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["monica andy", "organic", "newborn"] },
  { brand: "Monica + Andy", name: "Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["monica andy", "organic"] },

  // Kickee Pants
  { brand: "Kickee Pants", name: "Bamboo Pajama Set", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["kickee", "bamboo", "pjs", "printed", "soft"] },
  { brand: "Kickee Pants", name: "Print Coverall", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["kickee", "bamboo", "print", "coverall"] },
  { brand: "Kickee Pants", name: "Footie with Zipper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["kickee", "bamboo", "zippered", "footie"] },

  // Kyte Baby
  { brand: "Kyte Baby", name: "Zippered Footie", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["kyte", "bamboo", "zipper", "footie", "romper", "zippy"] },
  { brand: "Kyte Baby", name: "Toddler Pajama Set", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["kyte", "bamboo", "pjs", "toddler"] },
  { brand: "Kyte Baby", name: "Swaddle Blanket", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["kyte", "bamboo", "swaddle", "blanket"] },

  // Little Sleepies
  { brand: "Little Sleepies", name: "Two-Piece Pajama Set", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["little sleepies", "bamboo viscose", "pjs", "printed", "buttery soft"] },
  { brand: "Little Sleepies", name: "Bamboo Viscose Zippy", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["little sleepies", "bamboo", "zip", "footie", "zippy"] },
  { brand: "Little Sleepies", name: "Swaddle & Hat Set", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["little sleepies", "swaddle", "hat", "newborn", "set"] },

  // Magnetic Me
  { brand: "Magnetic Me", name: "Modal Magnetic Footie", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["magnetic", "easy change", "modal", "footie"] },
  { brand: "Magnetic Me", name: "Magnetic Me Close Set", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["magnetic", "easy change", "close", "set"] },
  { brand: "Magnetic Me", name: "Magnetic Dress", category: "Clothing", emoji: "👗", sizeSystem: "clothing", keywords: ["magnetic", "easy change", "modal"] },

  // Kissy Kissy
  { brand: "Kissy Kissy", name: "Pima Cotton Footie", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["kissy", "pima", "luxury", "soft"] },
  { brand: "Kissy Kissy", name: "Converter Gown", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["kissy", "pima", "newborn"] },

  // Petit Bateau
  { brand: "Petit Bateau", name: "Striped Bodysuit", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["petit bateau", "french", "stripes", "mariniere"] },
  { brand: "Petit Bateau", name: "Pajamas", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["petit bateau", "french", "pjs"] },

  // Janie and Jack
  { brand: "Janie and Jack", name: "Linen Blazer", category: "Clothing", emoji: "👔", sizeSystem: "clothing", keywords: ["janie jack", "dressy", "formal", "blazer", "linen"] },
  { brand: "Janie and Jack", name: "Smocked Dress", category: "Clothing", emoji: "👗", sizeSystem: "clothing", keywords: ["janie jack", "dressy", "formal", "special occasion", "smocked"] },
  { brand: "Janie and Jack", name: "Cable Knit Sweater", category: "Clothing", emoji: "🧶", sizeSystem: "clothing", keywords: ["janie jack", "cable knit", "sweater", "preppy"] },

  // Ralph Lauren Kids
  { brand: "Ralph Lauren Kids", name: "Polo Shirt", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["ralph lauren", "polo", "preppy"] },
  { brand: "Ralph Lauren Kids", name: "Oxford Shirt", category: "Clothing", emoji: "👔", sizeSystem: "clothing", keywords: ["ralph lauren", "polo", "button down", "preppy"] },

  // Colored Organics
  { brand: "Colored Organics", name: "Organic Bodysuit", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["colored organics", "organic", "basics"] },

  // Finn + Emma
  { brand: "Finn + Emma", name: "Organic Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["finn emma", "organic", "printed"] },

  // L'ovedbaby
  { brand: "L'ovedbaby", name: "Organic Footie", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["lovedbaby", "loved baby", "organic", "footie"] },
  { brand: "L'ovedbaby", name: "Organic Leggings", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["lovedbaby", "loved baby", "organic"] },

  // Kate Quinn
  { brand: "Kate Quinn", name: "Bamboo Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["kate quinn", "bamboo", "soft"] },

  // Bamboo Little
  { brand: "Bamboo Little", name: "Bamboo Pajamas", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["bamboo little", "bamboo", "pjs"] },

  // Mightly
  { brand: "Mightly", name: "Organic Leggings", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["mightly", "organic", "fair trade"] },
  { brand: "Mightly", name: "Organic Tee", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["mightly", "organic", "fair trade"] },

  // Art & Eden
  { brand: "Art & Eden", name: "Organic T-Shirt", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["art eden", "organic", "artistic"] },

  // Rylee + Cru
  { brand: "Rylee + Cru", name: "Bubble Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["rylee cru", "boho", "vintage", "bubble"] },
  { brand: "Rylee + Cru", name: "Relaxed Tee", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["rylee cru", "boho", "relaxed"] },
  { brand: "Rylee + Cru", name: "Knit Jumpsuit", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["rylee cru", "boho", "knit", "jumpsuit"] },

  // Quincy Mae
  { brand: "Quincy Mae", name: "Ribbed Knotted Baby Gown", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["quincy mae", "organic", "muted", "neutral", "knotted gown"] },
  { brand: "Quincy Mae", name: "Drawstring Pant", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["quincy mae", "organic", "neutral", "drawstring"] },
  { brand: "Quincy Mae", name: "Pointelle Henley", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["quincy mae", "organic", "pointelle", "henley"] },

  // Mebie Baby
  { brand: "Mebie Baby", name: "Muslin Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["mebie", "muslin", "boho"] },

  // Goumi
  { brand: "Goumi", name: "Bamboo Mittens", category: "Clothing", emoji: "🧤", sizeSystem: "clothing", keywords: ["goumi", "no scratch", "mitts", "newborn"] },
  { brand: "Goumi", name: "Bamboo Booties", category: "Clothing", emoji: "🧦", sizeSystem: "clothing", keywords: ["goumi", "soft sole", "baby shoes"] },

  // Speedo Kids
  { brand: "Speedo Kids", name: "Swim Jammer", category: "Clothing", emoji: "🏊", sizeSystem: "clothing", keywords: ["speedo", "swim", "swimsuit", "racing"] },
  { brand: "Speedo Kids", name: "One-Piece Swimsuit", category: "Clothing", emoji: "🏊", sizeSystem: "clothing", keywords: ["speedo", "swim", "bathing suit"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOES
  // ═══════════════════════════════════════════════════════════════════════════

  // Nike
  { brand: "Nike", name: "Revolution 6", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["nike", "revolution", "running", "athletic"] },
  { brand: "Nike", name: "Air Max", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["nike", "airmax", "air max"] },
  { brand: "Nike", name: "Star Runner 3", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["nike", "star runner", "running", "athletic"] },
  { brand: "Nike", name: "Flex Runner 2", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["nike", "flex runner", "slip on", "easy on"] },

  // Adidas
  { brand: "Adidas", name: "Fortarun", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["adidas", "fortarun", "running", "athletic"] },
  { brand: "Adidas", name: "Stan Smith CF", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["adidas", "stan smith", "classic", "velcro"] },
  { brand: "Adidas", name: "Racer TR21", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["adidas", "racer", "running", "lightweight"] },

  // New Balance
  { brand: "New Balance", name: "Fresh Foam 650", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["new balance", "nb", "fresh foam", "650", "running"] },
  { brand: "New Balance", name: "574 Core", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["new balance", "nb", "574", "classic"] },
  { brand: "New Balance", name: "FuelCore", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["new balance", "nb", "fuelcore", "running", "athletic"] },

  // Stride Rite
  { brand: "Stride Rite", name: "Soft Motion", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["stride rite", "soft motion", "first walker", "baby shoes"] },
  { brand: "Stride Rite", name: "Made2Play", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["stride rite", "made2play", "washable", "play"] },
  { brand: "Stride Rite", name: "SRT", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["stride rite", "srt", "toddler", "walking"] },

  // See Kai Run
  { brand: "See Kai Run", name: "Atlas II", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["see kai run", "atlas", "waterproof", "boot"] },
  { brand: "See Kai Run", name: "Stevie II", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["see kai run", "stevie", "first walker", "soft sole"] },
  { brand: "See Kai Run", name: "Ryder FlexiRun", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["see kai run", "ryder", "flexirun", "sneaker"] },

  // Keen Kids
  { brand: "Keen Kids", name: "Newport H2 Sandals", category: "Shoes", emoji: "🩴", sizeSystem: "shoes", keywords: ["keen", "water shoes", "hiking", "outdoor"] },
  { brand: "Keen Kids", name: "Targhee Hiking Boots", category: "Shoes", emoji: "🥾", sizeSystem: "shoes", keywords: ["keen", "hiking", "trail"] },

  // Merrell Kids
  { brand: "Merrell Kids", name: "Trail Glove", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["merrell", "trail", "hiking", "barefoot"] },
  { brand: "Merrell Kids", name: "Hydro Sandal", category: "Shoes", emoji: "🩴", sizeSystem: "shoes", keywords: ["merrell", "water", "outdoor"] },

  // Native Shoes
  { brand: "Native Shoes", name: "Jefferson", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["native", "jefferson", "water proof", "lightweight", "EVA", "slip on"] },
  { brand: "Native Shoes", name: "Miles", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["native", "miles", "sneaker", "lightweight", "EVA"] },
  { brand: "Native Shoes", name: "Fitzsimmons", category: "Shoes", emoji: "🥾", sizeSystem: "shoes", keywords: ["native", "fitzsimmons", "rain", "lightweight", "boot"] },

  // Crocs Kids
  { brand: "Crocs Kids", name: "Classic Clog", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["crocs", "clog", "jibbitz", "slip on", "classic"] },
  { brand: "Crocs Kids", name: "Bayaband", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["crocs", "bayaband", "sporty", "clog"] },
  { brand: "Crocs Kids", name: "LiteRide", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["crocs", "literide", "comfortable", "lightweight"] },

  // UGG Kids
  { brand: "UGG Kids", name: "Classic Short II", category: "Shoes", emoji: "🥾", sizeSystem: "shoes", keywords: ["ugg", "uggs", "classic short", "sheepskin", "winter", "cozy"] },
  { brand: "UGG Kids", name: "Neumel II", category: "Shoes", emoji: "🥾", sizeSystem: "shoes", keywords: ["ugg", "uggs", "neumel", "chukka", "boot"] },
  { brand: "UGG Kids", name: "Tasman", category: "Shoes", emoji: "🥿", sizeSystem: "shoes", keywords: ["ugg", "uggs", "tasman", "slipper", "cozy"] },

  // Converse Kids
  { brand: "Converse Kids", name: "Chuck Taylor All Star", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["converse", "chucks", "chuck taylor", "classic"] },
  { brand: "Converse Kids", name: "Star Player", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["converse", "star player", "retro"] },

  // Vans Kids
  { brand: "Vans Kids", name: "Old Skool V", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["vans", "old skool", "skate", "classic", "checkerboard", "velcro"] },
  { brand: "Vans Kids", name: "Sk8-Hi Zip", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["vans", "sk8-hi", "high top", "zip", "skate"] },
  { brand: "Vans Kids", name: "Slip-On V", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["vans", "slip on", "checkerboard", "easy", "velcro"] },

  // Saucony Kids
  { brand: "Saucony Kids", name: "Jazz Sneakers", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["saucony", "running", "retro"] },

  // Tsukihoshi
  { brand: "Tsukihoshi", name: "Racer Sneakers", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["tsukihoshi", "washable", "machine wash", "lightweight"] },

  // Pediped
  { brand: "Pediped", name: "Originals Soft Sole", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["pediped", "soft sole", "first walker", "baby"] },
  { brand: "Pediped", name: "Flex Sneakers", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["pediped", "flexible", "toddler"] },

  // Robeez
  { brand: "Robeez", name: "Soft Sole Shoes", category: "Shoes", emoji: "👶", sizeSystem: "shoes", keywords: ["robeez", "soft sole", "first shoes", "baby", "leather"] },

  // Freshly Picked
  { brand: "Freshly Picked", name: "Moccasins", category: "Shoes", emoji: "👶", sizeSystem: "shoes", keywords: ["freshly picked", "moccasin", "mocc", "leather", "soft sole"] },

  // Bobux
  { brand: "Bobux", name: "Soft Sole Baby Shoe", category: "Shoes", emoji: "👶", sizeSystem: "shoes", keywords: ["bobux", "soft sole", "leather", "first walker"] },
  { brand: "Bobux", name: "Step Up Shoe", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["bobux", "first walker", "toddler"] },

  // Ten Little
  { brand: "Ten Little", name: "Everyday Sneakers", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["ten little", "wide toe", "foot shaped"] },

  // PLAE
  { brand: "PLAE", name: "Ty Sneakers", category: "Shoes", emoji: "👟", sizeSystem: "shoes", keywords: ["plae", "customizable", "tabs", "velcro"] },

  // Livie & Luca
  { brand: "Livie & Luca", name: "Mary Janes", category: "Shoes", emoji: "👞", sizeSystem: "shoes", keywords: ["livie luca", "dressy", "leather"] },

  // Salt Water Sandals
  { brand: "Salt Water Sandals", name: "Original Sandal", category: "Shoes", emoji: "🩴", sizeSystem: "shoes", keywords: ["salt water", "saltwater", "leather sandal", "water safe", "classic"] },
  { brand: "Salt Water Sandals", name: "Sun-San Surfer", category: "Shoes", emoji: "🩴", sizeSystem: "shoes", keywords: ["salt water", "saltwater", "summer"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTERWEAR
  // ═══════════════════════════════════════════════════════════════════════════

  // Patagonia Kids
  { brand: "Patagonia", name: "Baby Down Sweater Hoody", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["patagucci", "pata", "puffy", "down", "hoody"] },
  { brand: "Patagonia", name: "Baby Nano Puff Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["patagucci", "nano", "puffy", "synthetic", "nano puff"] },
  { brand: "Patagonia", name: "Kids' Retro-X Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["patagucci", "fleece", "retro", "sherpa", "retro-x"] },
  { brand: "Patagonia", name: "Kids' Torrentshell 3L Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["patagucci", "rain", "waterproof", "torrentshell", "3l"] },
  { brand: "Patagonia", name: "Synchilla Fleece", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["patagucci", "fleece", "synchilla", "snap-t"] },
  { brand: "Patagonia", name: "Baby Baggies Shorts", category: "Clothing", emoji: "🩳", sizeSystem: "clothing", keywords: ["patagucci", "pata", "baggies", "shorts", "summer"] },

  // North Face Kids
  { brand: "The North Face", name: "ThermoBall Eco Hoody", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["north face", "tnf", "thermoball", "puffy", "eco"] },
  { brand: "The North Face", name: "Reversible Mt Chimbo Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["north face", "tnf", "reversible", "mt chimbo", "fleece"] },
  { brand: "The North Face", name: "Kids' Denali Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["north face", "tnf", "denali", "fleece", "classic"] },
  { brand: "The North Face", name: "Baby Bear Full Zip", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["north face", "tnf", "baby bear", "fleece", "cozy"] },
  { brand: "The North Face", name: "Resolve Rain Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["north face", "tnf", "rain", "waterproof", "resolve"] },

  // Columbia Kids
  { brand: "Columbia", name: "Powder Lite Hooded Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["columbia", "puffy", "insulated", "powder lite"] },
  { brand: "Columbia", name: "Benton Springs Fleece", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["columbia", "fleece", "benton springs"] },
  { brand: "Columbia", name: "Switchback Rain Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["columbia", "rain", "waterproof", "switchback"] },
  { brand: "Columbia", name: "Lightning Lift Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["columbia", "insulated", "lightning lift", "winter"] },
  { brand: "Columbia", name: "Double Trouble Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["columbia", "reversible", "double trouble", "fleece"] },

  // REI Co-op
  { brand: "REI Co-op", name: "Down Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["rei", "puffy", "down"] },
  { brand: "REI Co-op", name: "Rain Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["rei", "rain", "waterproof"] },

  // Helly Hansen Kids
  { brand: "Helly Hansen", name: "Rider Insulated Suit", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["helly hansen", "hh", "snow suit", "ski"] },

  // Reima
  { brand: "Reima", name: "Reimatec Winter Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["reima", "finnish", "waterproof", "snow"] },
  { brand: "Reima", name: "Fleece Suit", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["reima", "finnish", "base layer"] },

  // Polarn O. Pyret
  { brand: "Polarn O. Pyret", name: "Shell Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["polarn", "pop", "swedish", "waterproof"] },

  // Hatley
  { brand: "Hatley", name: "Rain Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["hatley", "rain", "printed", "fun"] },
  { brand: "Hatley", name: "Splash Pants", category: "Outerwear", emoji: "👖", sizeSystem: "clothing", keywords: ["hatley", "rain pants", "waterproof"] },

  // Joules Kids
  { brand: "Joules", name: "Waterproof Packaway Jacket", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["joules", "rain", "british", "packable"] },

  // Bogs
  { brand: "Bogs", name: "Classic Insulated Boots", category: "Outerwear", emoji: "🥾", sizeSystem: "shoes", keywords: ["bogs", "rain boots", "snow boots", "waterproof", "insulated"] },
  { brand: "Bogs", name: "Rainboot", category: "Outerwear", emoji: "🥾", sizeSystem: "shoes", keywords: ["bogs", "rain boots", "waterproof"] },

  // Sorel Kids
  { brand: "Sorel", name: "Snow Commander Boot", category: "Outerwear", emoji: "🥾", sizeSystem: "shoes", keywords: ["sorel", "snow boots", "winter", "insulated"] },
  { brand: "Sorel", name: "Yoot Pac Boot", category: "Outerwear", emoji: "🥾", sizeSystem: "shoes", keywords: ["sorel", "snow boots", "winter"] },

  // Hunter Kids
  { brand: "Hunter", name: "Original Wellington Boots", category: "Outerwear", emoji: "🥾", sizeSystem: "shoes", keywords: ["hunter", "wellies", "rain boots", "classic"] },

  // Jan & Jul
  { brand: "Jan & Jul", name: "Puddle-Dry Rain Suit", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["jan jul", "rain suit", "waterproof", "one piece"] },
  { brand: "Jan & Jul", name: "GrowWith Sunhat", category: "Outerwear", emoji: "👒", sizeSystem: "clothing", keywords: ["jan jul", "sun hat", "upf", "adjustable"] },

  // Muddy Puddles
  { brand: "Muddy Puddles", name: "Waterproof All-in-One", category: "Outerwear", emoji: "🧥", sizeSystem: "clothing", keywords: ["muddy puddles", "rain suit", "waterproof"] },

  // Stonz
  { brand: "Stonz", name: "Rain Boots", category: "Outerwear", emoji: "🥾", sizeSystem: "shoes", keywords: ["stonz", "rain", "waterproof", "canada"] },
  { brand: "Stonz", name: "Mittz", category: "Outerwear", emoji: "🧤", sizeSystem: "clothing", keywords: ["stonz", "mittens", "winter", "stay on"] },

  // Calikids
  { brand: "Calikids", name: "Waterproof Mittens", category: "Outerwear", emoji: "🧤", sizeSystem: "clothing", keywords: ["calikids", "mittens", "winter", "waterproof"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // STROLLERS
  // ═══════════════════════════════════════════════════════════════════════════

  { brand: "UPPAbaby", name: "Vista V3", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["uppababy", "vista", "double", "convertible", "full size", "v3"] },
  { brand: "UPPAbaby", name: "Cruz V2", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["uppababy", "cruz", "compact", "city"] },
  { brand: "UPPAbaby", name: "Minu V2", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["uppababy", "minu", "travel", "lightweight", "umbrella"] },
  { brand: "UPPAbaby", name: "Ridge", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["uppababy", "ridge", "jogging", "all terrain"] },
  { brand: "UPPAbaby", name: "G-Luxe", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["uppababy", "g-luxe", "umbrella", "lightweight", "reclining"] },
  { brand: "Bugaboo", name: "Fox 5", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bugaboo", "fox", "full size", "luxury"] },
  { brand: "Bugaboo", name: "Dragonfly", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bugaboo", "dragonfly", "compact", "city"] },
  { brand: "Bugaboo", name: "Butterfly", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bugaboo", "butterfly", "travel", "lightweight", "compact"] },
  { brand: "Bugaboo", name: "Donkey 5", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bugaboo", "donkey", "double", "side by side", "twins"] },
  { brand: "Bugaboo", name: "Bee", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bugaboo", "bee", "compact", "city"] },
  { brand: "Nuna", name: "MIXX Next", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["nuna", "mixx", "full size"] },
  { brand: "Nuna", name: "TRVL lx", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["nuna", "trvl", "travel", "lightweight", "compact"] },
  { brand: "Nuna", name: "Demi Next", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["nuna", "demi", "double", "convertible", "next"] },
  { brand: "Doona", name: "Car Seat & Stroller", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["doona", "car seat stroller", "all in one", "convertible"] },
  { brand: "Doona", name: "Liki Trike S5", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["doona", "liki", "trike", "tricycle", "folding"] },
  { brand: "Babyzen", name: "YOYO2 6+", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["babyzen", "yoyo", "travel", "compact", "lightweight", "airplane", "6+"] },
  { brand: "Babyzen", name: "YOYO Bassinet", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["babyzen", "yoyo", "bassinet", "newborn"] },
  { brand: "Thule", name: "Urban Glide 2", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["thule", "jogging", "running", "all terrain"] },
  { brand: "Thule", name: "Spring", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["thule", "spring", "compact", "city"] },
  { brand: "BOB Gear", name: "Wayfinder Jogging Stroller", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bob", "wayfinder", "jogging", "running", "all terrain"] },
  { brand: "BOB Gear", name: "Alterrain Pro", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bob", "alterrain", "jogging", "all terrain", "pro"] },
  { brand: "Graco", name: "Modes Nest", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["graco", "travel system", "affordable"] },
  { brand: "Chicco", name: "Bravo Trio", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["chicco", "travel system", "keyfit"] },
  { brand: "Baby Jogger", name: "City Mini GT2", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["baby jogger", "city mini", "compact", "all terrain", "gt2"] },
  { brand: "Baby Jogger", name: "City Select 2", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["baby jogger", "city select", "double", "modular"] },
  { brand: "Baby Jogger", name: "City Tour 2", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["baby jogger", "city tour", "travel", "lightweight", "compact"] },
  { brand: "Silver Cross", name: "Reef", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["silver cross", "luxury", "british", "pram"] },
  { brand: "Mockingbird", name: "Single Stroller 2.0", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["mockingbird", "single", "affordable"] },
  { brand: "Mockingbird", name: "Double Stroller", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["mockingbird", "convertible", "double", "affordable"] },
  { brand: "Bumbleride", name: "Indie", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bumbleride", "indie", "all terrain", "eco"] },
  { brand: "Bumbleride", name: "Era", category: "Strollers", emoji: "🍼", sizeSystem: "one-size", keywords: ["bumbleride", "era", "reversible", "compact"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // CAR SEATS
  // ═══════════════════════════════════════════════════════════════════════════

  { brand: "Nuna", name: "RAVA Fire", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["nuna", "rava", "convertible", "luxury", "fire"] },
  { brand: "Nuna", name: "PIPA RX", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["nuna", "pipa", "infant", "carrier", "rx"] },
  { brand: "Nuna", name: "EXEC", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["nuna", "exec", "all in one", "convertible"] },
  { brand: "UPPAbaby", name: "Mesa Max", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["uppababy", "mesa", "max", "infant", "carrier"] },
  { brand: "UPPAbaby", name: "Knox", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["uppababy", "knox", "convertible"] },
  { brand: "Chicco", name: "KeyFit 35", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["chicco", "keyfit", "infant", "carrier", "35"] },
  { brand: "Chicco", name: "Fit4 4-in-1", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["chicco", "fit4", "4 in 1", "convertible", "all stages"] },
  { brand: "Graco", name: "SnugRide SnugFit 35", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["graco", "snugride", "snugfit", "infant", "carrier", "affordable"] },
  { brand: "Graco", name: "4Ever DLX", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["graco", "4ever", "dlx", "all in one", "convertible", "booster"] },
  { brand: "Graco", name: "Extend2Fit", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["graco", "extend2fit", "convertible", "rear facing", "extended"] },
  { brand: "Britax", name: "One4Life", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["britax", "all in one", "convertible", "one4life"] },
  { brand: "Britax", name: "Boulevard ClickTight", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["britax", "convertible", "clicktight", "boulevard"] },
  { brand: "Britax", name: "Willow S", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["britax", "willow", "infant", "carrier"] },
  { brand: "Clek", name: "Fllo Convertible", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["clek", "fllo", "convertible", "narrow", "compact"] },
  { brand: "Clek", name: "Foonf Convertible", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["clek", "foonf", "convertible", "safety", "heavy duty"] },
  { brand: "Clek", name: "Liing Infant Car Seat", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["clek", "liing", "infant", "carrier", "lightweight"] },
  { brand: "Maxi-Cosi", name: "Mico Luxe Infant Car Seat", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["maxi cosi", "mico", "infant", "carrier"] },
  { brand: "Cybex", name: "Sirona S", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["cybex", "sirona", "convertible", "rotating", "360"] },
  { brand: "Evenflo", name: "Revolve360 Extend", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["evenflo", "revolve", "rotating", "360", "convertible"] },
  { brand: "Diono", name: "Radian 3RXT", category: "Car Seats", emoji: "🚗", sizeSystem: "weight-range", keywords: ["diono", "radian", "slim", "narrow", "3 across", "convertible"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // GEAR
  // ═══════════════════════════════════════════════════════════════════════════

  // Carriers
  { brand: "Ergobaby", name: "Omni 360 Carrier", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["ergo", "baby carrier", "structured", "all positions"] },
  { brand: "Ergobaby", name: "Embrace Carrier", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["ergo", "baby carrier", "newborn", "soft"] },
  { brand: "Baby Bjorn", name: "Carrier Mini", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["babybjorn", "baby bjorn", "carrier", "newborn"] },
  { brand: "Baby Bjorn", name: "Carrier One", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["babybjorn", "baby bjorn", "carrier", "structured"] },
  { brand: "Lillebaby", name: "Complete All Seasons Carrier", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["lillebaby", "lille", "carrier", "mesh", "all seasons"] },
  { brand: "Solly Baby", name: "Wrap", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["solly", "wrap", "newborn", "modal", "soft"] },
  { brand: "Baby K'tan", name: "Original Wrap Carrier", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["ktan", "k'tan", "wrap", "no tie"] },
  { brand: "Boba", name: "Wrap Carrier", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["boba", "wrap", "stretchy"] },
  { brand: "Tula", name: "Explore Carrier", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["tula", "carrier", "structured", "printed"] },

  // Hiking carriers
  { brand: "Deuter", name: "Kid Comfort Hiking Carrier", category: "Gear", emoji: "🥾", sizeSystem: "one-size", keywords: ["deuter", "hiking", "backpack carrier", "outdoor"] },
  { brand: "Osprey", name: "Poco Child Carrier", category: "Gear", emoji: "🥾", sizeSystem: "one-size", keywords: ["osprey", "poco", "hiking", "backpack carrier", "outdoor"] },

  // Bouncers & swings
  { brand: "Baby Bjorn", name: "Bouncer Bliss", category: "Gear", emoji: "👶", sizeSystem: "age-range", keywords: ["babybjorn", "baby bjorn", "bouncer", "swing"] },
  { brand: "4moms", name: "MamaRoo", category: "Gear", emoji: "👶", sizeSystem: "age-range", keywords: ["4moms", "mamaroo", "swing", "bouncer", "smart"] },
  { brand: "4moms", name: "Breeze Playard", category: "Gear", emoji: "👶", sizeSystem: "age-range", keywords: ["4moms", "breeze", "pack n play", "playard", "travel crib"] },
  { brand: "Fisher-Price", name: "Infant-to-Toddler Rocker", category: "Gear", emoji: "👶", sizeSystem: "age-range", keywords: ["fisher price", "rocker", "bouncer", "vibrating"] },

  // Monitors
  { brand: "Nanit", name: "Pro Camera Baby Monitor", category: "Gear", emoji: "📹", sizeSystem: "one-size", keywords: ["nanit", "monitor", "camera", "smart", "sleep tracking"] },
  { brand: "Owlet", name: "Dream Sock", category: "Gear", emoji: "📹", sizeSystem: "one-size", keywords: ["owlet", "monitor", "oxygen", "heart rate", "sock"] },
  { brand: "Infant Optics", name: "DXR-8 Pro Monitor", category: "Gear", emoji: "📹", sizeSystem: "one-size", keywords: ["infant optics", "monitor", "camera", "video"] },

  // Sound machines
  { brand: "Hatch", name: "Rest+ Sound Machine", category: "Gear", emoji: "🔊", sizeSystem: "one-size", keywords: ["hatch", "rest", "sound machine", "night light", "ok to wake"] },
  { brand: "Yogasleep", name: "Dohm White Noise Machine", category: "Gear", emoji: "🔊", sizeSystem: "one-size", keywords: ["yogasleep", "dohm", "sound machine", "white noise", "marpac"] },

  // Misc gear
  { brand: "Skip Hop", name: "Activity Center", category: "Gear", emoji: "🎠", sizeSystem: "age-range", keywords: ["skip hop", "activity", "play", "jumper"] },
  { brand: "Baby Brezza", name: "Formula Pro", category: "Gear", emoji: "🍼", sizeSystem: "one-size", keywords: ["brezza", "formula", "maker", "automatic", "dispenser"] },
  { brand: "Bumbo", name: "Floor Seat", category: "Gear", emoji: "👶", sizeSystem: "age-range", keywords: ["bumbo", "floor seat", "sit up", "sitting"] },
  { brand: "Munchkin", name: "Diaper Pail", category: "Gear", emoji: "🗑️", sizeSystem: "one-size", keywords: ["munchkin", "diaper pail", "diaper genie", "trash"] },
  { name: "Activity Center", category: "Gear", emoji: "🎠", sizeSystem: "age-range", keywords: ["exersaucer", "activity center", "jumper", "play station"] },
  { name: "Jumper", category: "Gear", emoji: "🎠", sizeSystem: "age-range", keywords: ["doorway jumper", "johnny jump up", "bouncer"] },
  { name: "Play Mat", category: "Gear", emoji: "🧸", sizeSystem: "age-range", keywords: ["playmat", "activity mat", "tummy time", "gym"] },
  { name: "Baby Gate", category: "Gear", emoji: "🚧", sizeSystem: "one-size", keywords: ["gate", "safety gate", "stair gate", "barrier"] },
  { name: "Pack N Play", category: "Gear", emoji: "👶", sizeSystem: "one-size", keywords: ["pack and play", "playard", "travel crib", "portable crib"] },
  { name: "Diaper Bag", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["diaper bag", "backpack", "changing bag", "nappy bag"] },
  { name: "Nursing Pillow", category: "Gear", emoji: "🤱", sizeSystem: "one-size", keywords: ["boppy", "my brest friend", "nursing", "breastfeeding", "feeding pillow"] },
  { name: "Pregnancy Pillow", category: "Gear", emoji: "🤰", sizeSystem: "one-size", keywords: ["maternity pillow", "body pillow", "snoogle"] },
  { name: "Bottle Warmer", category: "Gear", emoji: "🍼", sizeSystem: "one-size", keywords: ["warmer", "bottle", "baby brezza"] },
  { name: "Sterilizer", category: "Gear", emoji: "✨", sizeSystem: "one-size", keywords: ["bottle sterilizer", "sanitizer", "uv", "steam"] },
  { name: "Baby Food Maker", category: "Gear", emoji: "🥣", sizeSystem: "one-size", keywords: ["food processor", "puree", "beaba", "baby bullet"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // FEEDING
  // ═══════════════════════════════════════════════════════════════════════════

  // High chairs
  { brand: "Stokke", name: "Tripp Trapp", category: "Feeding", emoji: "🪑", sizeSystem: "age-range", keywords: ["stokke", "tripp trapp", "wooden", "grows with child", "scandinavian"] },
  { brand: "Stokke", name: "Clikk", category: "Feeding", emoji: "🪑", sizeSystem: "age-range", keywords: ["stokke", "clikk", "high chair", "travel", "portable"] },
  { brand: "OXO Tot", name: "Sprout Chair", category: "Feeding", emoji: "🪑", sizeSystem: "age-range", keywords: ["oxo", "sprout", "wooden", "adjustable"] },
  { brand: "OXO Tot", name: "Stick & Stay Plate", category: "Feeding", emoji: "🍽️", sizeSystem: "age-range", keywords: ["oxo", "stick stay", "suction", "plate"] },
  { brand: "OXO Tot", name: "Transitions Cup", category: "Feeding", emoji: "🥤", sizeSystem: "age-range", keywords: ["oxo", "transitions", "sippy", "cup", "straw"] },
  { brand: "IKEA", name: "Antilop High Chair", category: "Feeding", emoji: "🪑", sizeSystem: "age-range", keywords: ["ikea", "antilop", "affordable", "simple", "tray"] },
  { brand: "Abiie", name: "Beyond High Chair", category: "Feeding", emoji: "🪑", sizeSystem: "age-range", keywords: ["abiie", "beyond", "wooden", "adjustable"] },
  { brand: "Lalo", name: "The Chair", category: "Feeding", emoji: "🪑", sizeSystem: "age-range", keywords: ["lalo", "modern", "high chair", "3 in 1"] },

  // Bottles
  { brand: "Dr. Brown's", name: "Natural Flow Bottle", category: "Feeding", emoji: "🍼", sizeSystem: "age-range", keywords: ["dr browns", "natural flow", "anti colic", "bottles"] },
  { brand: "Dr. Brown's", name: "Options+ Bottle", category: "Feeding", emoji: "🍼", sizeSystem: "age-range", keywords: ["dr browns", "options+", "anti colic", "bottles", "vent"] },
  { brand: "Comotomo", name: "Natural Feel Bottle (5oz)", category: "Feeding", emoji: "🍼", sizeSystem: "age-range", keywords: ["comotomo", "silicone", "natural", "soft", "wide neck", "5oz"] },
  { brand: "Comotomo", name: "Natural Feel Bottle (8oz)", category: "Feeding", emoji: "🍼", sizeSystem: "age-range", keywords: ["comotomo", "silicone", "natural", "soft", "wide neck", "8oz"] },
  { brand: "Philips Avent", name: "Natural Bottles", category: "Feeding", emoji: "🍼", sizeSystem: "age-range", keywords: ["avent", "philips", "natural", "anti colic"] },
  { brand: "MAM", name: "Anti-Colic Bottles", category: "Feeding", emoji: "🍼", sizeSystem: "age-range", keywords: ["mam", "anti colic", "self sterilizing"] },
  { brand: "Tommee Tippee", name: "Closer to Nature Bottles", category: "Feeding", emoji: "🍼", sizeSystem: "age-range", keywords: ["tommee tippee", "breast like", "natural"] },

  // Breast pumps
  { brand: "Spectra", name: "S1 Plus Breast Pump", category: "Feeding", emoji: "🤱", sizeSystem: "one-size", keywords: ["spectra", "pump", "breast pump", "rechargeable", "hospital grade"] },
  { brand: "Medela", name: "Pump In Style", category: "Feeding", emoji: "🤱", sizeSystem: "one-size", keywords: ["medela", "pump", "breast pump", "portable"] },
  { brand: "Elvie", name: "Stride Breast Pump", category: "Feeding", emoji: "🤱", sizeSystem: "one-size", keywords: ["elvie", "pump", "breast pump", "wearable", "hands free"] },
  { brand: "Willow", name: "Go Breast Pump", category: "Feeding", emoji: "🤱", sizeSystem: "one-size", keywords: ["willow", "pump", "breast pump", "wearable", "hands free"] },

  // Other feeding
  { name: "Sippy Cup", category: "Feeding", emoji: "🥤", sizeSystem: "age-range", keywords: ["sippy", "cup", "transition", "spill proof", "munchkin", "nuk"] },
  { name: "Straw Cup", category: "Feeding", emoji: "🥤", sizeSystem: "age-range", keywords: ["straw", "cup", "transition", "munchkin"] },
  { name: "Plates & Bowls Set", category: "Feeding", emoji: "🍽️", sizeSystem: "age-range", keywords: ["plates", "bowls", "suction", "silicone", "ezpz", "bumkins"] },
  { name: "Bibs", category: "Feeding", emoji: "🍽️", sizeSystem: "age-range", keywords: ["bib", "smock", "silicone bib", "bumkins", "mushie"] },
  { name: "Breast Milk Storage Bags", category: "Feeding", emoji: "🤱", sizeSystem: "one-size", keywords: ["milk storage", "freezer bags", "lansinoh", "medela"] },
  { name: "Baby Utensils", category: "Feeding", emoji: "🥄", sizeSystem: "age-range", keywords: ["spoons", "forks", "utensils", "self feeding", "num num", "grabease"] },
  { name: "Snack Container", category: "Feeding", emoji: "🍪", sizeSystem: "age-range", keywords: ["snack cup", "snack catcher", "munchkin", "on the go"] },
  { name: "Water Bottle", category: "Feeding", emoji: "💧", sizeSystem: "age-range", keywords: ["water bottle", "hydro flask", "camelbak", "thermos"] },
  { name: "Lunch Box", category: "Feeding", emoji: "🥪", sizeSystem: "age-range", keywords: ["lunch box", "bento", "bentgo", "omie", "planetbox"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOYS
  // ═══════════════════════════════════════════════════════════════════════════

  // Lovevery
  { brand: "Lovevery", name: "The Play Kits", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["lovevery", "play kits", "montessori", "developmental", "subscription"] },
  { brand: "Lovevery", name: "The Block Set", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["lovevery", "block set", "wooden", "montessori"] },
  { brand: "Lovevery", name: "The Play Gym", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["lovevery", "play gym", "activity gym", "montessori", "wooden"] },

  // Melissa & Doug
  { brand: "Melissa & Doug", name: "Wooden Building Blocks", category: "Toys", emoji: "🧱", sizeSystem: "age-range", keywords: ["melissa doug", "blocks", "wooden", "building", "classic"] },
  { brand: "Melissa & Doug", name: "Deluxe Puppet Theater", category: "Toys", emoji: "🎭", sizeSystem: "age-range", keywords: ["melissa doug", "puppet", "theater", "pretend play"] },
  { brand: "Melissa & Doug", name: "Magnetic Dress-Up", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["melissa doug", "magnetic", "dress up", "pretend"] },
  { brand: "Melissa & Doug", name: "Latches Board", category: "Toys", emoji: "🧩", sizeSystem: "age-range", keywords: ["melissa doug", "latches", "locks", "fine motor", "educational"] },

  // Fisher-Price
  { brand: "Fisher-Price", name: "Laugh & Learn Smart Stages", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["fisher price", "laugh learn", "electronic", "musical", "learning", "smart stages"] },
  { brand: "Fisher-Price", name: "Rock-a-Stack", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["fisher price", "rock a stack", "rings", "stacking", "classic"] },
  { brand: "Fisher-Price", name: "Kick & Play Piano Gym", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["fisher price", "kick play", "piano", "gym", "activity mat"] },

  // VTech
  { brand: "VTech", name: "Sit-to-Stand Learning Walker", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["vtech", "walker", "push toy", "electronic", "learning"] },
  { brand: "VTech", name: "Touch and Learn Activity Desk", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["vtech", "electronic", "learning", "desk"] },

  // Lego
  { brand: "Lego Duplo", name: "Building Set", category: "Toys", emoji: "🧱", sizeSystem: "age-range", keywords: ["lego", "duplo", "blocks", "building", "toddler"] },
  { brand: "Lego", name: "Classic Building Set", category: "Toys", emoji: "🧱", sizeSystem: "age-range", keywords: ["lego", "blocks", "building", "bricks"] },
  { brand: "Lego", name: "City Set", category: "Toys", emoji: "🧱", sizeSystem: "age-range", keywords: ["lego", "city", "vehicles", "building"] },
  { brand: "Lego", name: "Friends Set", category: "Toys", emoji: "🧱", sizeSystem: "age-range", keywords: ["lego", "friends", "building"] },

  // Magna-Tiles
  { brand: "Magna-Tiles", name: "Classic 100-Piece Set", category: "Toys", emoji: "🔷", sizeSystem: "age-range", keywords: ["magna tiles", "magnatiles", "magnetic", "building", "stem", "100 piece"] },
  { brand: "Magna-Tiles", name: "Metropolis", category: "Toys", emoji: "🔷", sizeSystem: "age-range", keywords: ["magna tiles", "magnatiles", "magnetic", "metropolis", "city"] },
  { brand: "Magna-Tiles", name: "Frost Colors", category: "Toys", emoji: "🔷", sizeSystem: "age-range", keywords: ["magna tiles", "magnatiles", "magnetic", "frost", "translucent"] },

  // Fat Brain Toys
  { brand: "Fat Brain Toys", name: "Dimpl", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["fat brain", "sensory", "pop", "silicone", "baby"] },
  { brand: "Fat Brain Toys", name: "InnyBin", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["fat brain", "shape sorter", "sensory", "baby"] },

  // Hape
  { brand: "Hape", name: "Wooden Train Set", category: "Toys", emoji: "🚂", sizeSystem: "age-range", keywords: ["hape", "train", "wooden", "tracks"] },
  { brand: "Hape", name: "Play Kitchen", category: "Toys", emoji: "🍳", sizeSystem: "age-range", keywords: ["hape", "kitchen", "pretend play", "cooking"] },

  // Plan Toys
  { brand: "Plan Toys", name: "Wooden Car Set", category: "Toys", emoji: "🚗", sizeSystem: "age-range", keywords: ["plan toys", "wooden", "cars", "sustainable", "rubber wood"] },
  { brand: "Plan Toys", name: "Tool Belt", category: "Toys", emoji: "🔧", sizeSystem: "age-range", keywords: ["plan toys", "wooden", "tools", "pretend play"] },

  // Tonies
  { brand: "Tonies", name: "Toniebox Starter Set", category: "Toys", emoji: "🎵", sizeSystem: "age-range", keywords: ["tonies", "toniebox", "audio", "stories", "music", "screen free"] },
  { brand: "Tonies", name: "Tonie Character", category: "Toys", emoji: "🎵", sizeSystem: "age-range", keywords: ["tonies", "figurine", "audio", "stories"] },

  // Nugget
  { brand: "Nugget", name: "The Nugget", category: "Toys", emoji: "🛋️", sizeSystem: "one-size", keywords: ["nugget", "comfort couch", "play couch", "foam", "fort", "building"] },

  // Pikler
  { name: "Pikler Triangle", category: "Toys", emoji: "🔺", sizeSystem: "age-range", keywords: ["pikler", "climbing", "triangle", "montessori", "gross motor"] },

  // Grimm's
  { brand: "Grimm's", name: "Rainbow Stacker", category: "Toys", emoji: "🌈", sizeSystem: "age-range", keywords: ["grimms", "wooden", "rainbow", "waldorf", "open ended"] },
  { brand: "Grimm's", name: "Building Boards", category: "Toys", emoji: "🌈", sizeSystem: "age-range", keywords: ["grimms", "wooden", "waldorf", "blocks", "open ended"] },

  // Tegu
  { brand: "Tegu", name: "Magnetic Wooden Blocks", category: "Toys", emoji: "🧱", sizeSystem: "age-range", keywords: ["tegu", "magnetic", "wooden blocks", "building"] },

  // Green Toys
  { brand: "Green Toys", name: "Dump Truck", category: "Toys", emoji: "🚚", sizeSystem: "age-range", keywords: ["green toys", "recycled", "eco", "truck", "vehicle"] },
  { brand: "Green Toys", name: "Tea Set", category: "Toys", emoji: "🫖", sizeSystem: "age-range", keywords: ["green toys", "recycled", "eco", "pretend play"] },

  // Playskool
  { brand: "Playskool", name: "Sit 'n Spin", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["playskool", "spinning", "classic"] },
  { brand: "Playskool", name: "Mr. Potato Head", category: "Toys", emoji: "🥔", sizeSystem: "age-range", keywords: ["playskool", "potato head", "classic", "pretend"] },

  // Little Tikes
  { brand: "Little Tikes", name: "Cozy Coupe", category: "Toys", emoji: "🚗", sizeSystem: "age-range", keywords: ["little tikes", "cozy coupe", "ride on", "car", "push car"] },
  { brand: "Little Tikes", name: "Activity Garden", category: "Toys", emoji: "🌻", sizeSystem: "age-range", keywords: ["little tikes", "climber", "playhouse", "outdoor"] },
  { brand: "Little Tikes", name: "First Slide", category: "Toys", emoji: "🛝", sizeSystem: "age-range", keywords: ["little tikes", "slide", "indoor", "toddler"] },

  // Step2
  { brand: "Step2", name: "Play Kitchen", category: "Toys", emoji: "🍳", sizeSystem: "age-range", keywords: ["step2", "kitchen", "pretend play", "plastic"] },
  { brand: "Step2", name: "Water Table", category: "Toys", emoji: "💧", sizeSystem: "age-range", keywords: ["step2", "water table", "outdoor", "sensory"] },

  // Radio Flyer
  { brand: "Radio Flyer", name: "Classic Red Wagon", category: "Toys", emoji: "🔴", sizeSystem: "age-range", keywords: ["radio flyer", "wagon", "red wagon", "pull wagon", "classic"] },
  { brand: "Radio Flyer", name: "Tricycle", category: "Toys", emoji: "🚲", sizeSystem: "age-range", keywords: ["radio flyer", "trike", "pedal", "riding"] },

  // Train sets
  { brand: "Brio", name: "Wooden Train Set", category: "Toys", emoji: "🚂", sizeSystem: "age-range", keywords: ["brio", "train", "wooden", "tracks", "railway"] },
  { brand: "Thomas & Friends", name: "Train Set", category: "Toys", emoji: "🚂", sizeSystem: "age-range", keywords: ["thomas", "train", "tank engine", "tracks"] },

  // Generic toys
  { name: "Stuffed Animal", category: "Toys", emoji: "🧸", sizeSystem: "age-range", keywords: ["plush", "plushie", "stuffie", "teddy bear", "lovey", "jellycat"] },
  { name: "Puzzle", category: "Toys", emoji: "🧩", sizeSystem: "age-range", keywords: ["jigsaw", "puzzle", "wooden puzzle", "floor puzzle"] },
  { name: "Art Supplies", category: "Toys", emoji: "🎨", sizeSystem: "age-range", keywords: ["crayons", "markers", "paint", "coloring", "craft", "playdoh", "clay"] },
  { name: "Play Kitchen", category: "Toys", emoji: "🍳", sizeSystem: "age-range", keywords: ["kitchen", "pretend", "cooking", "play food"] },
  { name: "Dollhouse", category: "Toys", emoji: "🏠", sizeSystem: "age-range", keywords: ["doll house", "miniature", "pretend play", "furniture"] },
  { name: "Musical Instrument", category: "Toys", emoji: "🎵", sizeSystem: "age-range", keywords: ["music", "xylophone", "drum", "piano", "guitar", "tambourine", "maracas"] },
  { name: "Dress Up Clothes", category: "Toys", emoji: "👸", sizeSystem: "age-range", keywords: ["costume", "pretend", "princess", "superhero", "dress up"] },
  { name: "Teether", category: "Toys", emoji: "👶", sizeSystem: "age-range", keywords: ["teething", "chew", "silicone", "sophie giraffe", "comotomo"] },
  { name: "Pacifier", category: "Toys", emoji: "👶", sizeSystem: "age-range", keywords: ["paci", "binky", "soothie", "dummy", "nuk", "mam"] },
  { name: "Balance Board", category: "Toys", emoji: "🏄", sizeSystem: "age-range", keywords: ["wobbel", "balance", "rocking", "gross motor"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // BOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  { name: "Board Book Set", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["board books", "baby books", "chunky", "touch feel"] },
  { brand: "Sandra Boynton", name: "Board Book Collection", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["boynton", "moo baa", "pajama time", "belly button", "board book"] },
  { brand: "Eric Carle", name: "Book Collection", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["eric carle", "hungry caterpillar", "brown bear", "board book"] },
  { brand: "Dr. Seuss", name: "Book Collection", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["dr seuss", "cat in the hat", "green eggs", "one fish", "lorax"] },
  { name: "Elephant & Piggie Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["mo willems", "elephant piggie", "pigeon", "early reader"] },
  { name: "Pete the Cat Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["pete the cat", "james dean", "groovy", "early reader"] },
  { name: "Dog Man Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["dog man", "dav pilkey", "captain underpants", "graphic novel", "comic"] },
  { name: "Diary of a Wimpy Kid", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["wimpy kid", "jeff kinney", "chapter book", "funny"] },
  { name: "Magic Tree House Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["magic tree house", "mary pope osborne", "chapter book", "adventure"] },
  { brand: "Usborne", name: "Activity Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["usborne", "sticker", "activity", "look inside", "lift flap"] },
  { brand: "DK", name: "Knowledge Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["dk", "encyclopedia", "science", "nature", "reference"] },
  { name: "Goodnight Moon", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["goodnight moon", "margaret wise brown", "classic", "bedtime"] },
  { name: "Llama Llama Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["llama llama", "anna dewdney", "red pajama"] },
  { name: "Little Blue Truck Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["little blue truck", "alice schertle", "farm", "vehicles"] },
  { name: "If You Give a Mouse a Cookie", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["mouse cookie", "laura numeroff", "series"] },
  { name: "Berenstain Bears Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["berenstain", "bears", "classic", "family"] },
  { name: "Junie B. Jones Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["junie b", "barbara park", "chapter book", "funny"] },
  { name: "Baby-Sitters Club Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["babysitters club", "bsc", "ann m martin", "graphic novel"] },
  { name: "Fly Guy Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["fly guy", "tedd arnold", "early reader", "funny"] },
  { name: "Mercer Mayer Little Critter Books", category: "Books", emoji: "📚", sizeSystem: "reading-level", keywords: ["little critter", "mercer mayer", "classic"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // FURNITURE
  // ═══════════════════════════════════════════════════════════════════════════

  // Cribs
  { brand: "Babyletto", name: "Hudson Crib", category: "Furniture", emoji: "🛏️", sizeSystem: "one-size", keywords: ["babyletto", "hudson", "crib", "modern", "3 in 1", "convertible"] },
  { brand: "Babyletto", name: "Lolly Crib", category: "Furniture", emoji: "🛏️", sizeSystem: "one-size", keywords: ["babyletto", "lolly", "crib", "modern", "convertible"] },
  { brand: "DaVinci", name: "Kalani Crib", category: "Furniture", emoji: "🛏️", sizeSystem: "one-size", keywords: ["davinci", "kalani", "crib", "classic", "convertible", "4 in 1"] },
  { brand: "IKEA", name: "SNIGLAR Crib", category: "Furniture", emoji: "🛏️", sizeSystem: "one-size", keywords: ["ikea", "sniglar", "crib", "affordable", "simple"] },
  { brand: "Pottery Barn Kids", name: "Convertible Crib", category: "Furniture", emoji: "🛏️", sizeSystem: "one-size", keywords: ["pottery barn", "pbk", "crib", "classic"] },
  { brand: "Crate & Kids", name: "Crib", category: "Furniture", emoji: "🛏️", sizeSystem: "one-size", keywords: ["crate kids", "crate barrel", "crib", "modern"] },

  // Other furniture
  { name: "Toddler Bed", category: "Furniture", emoji: "🛏️", sizeSystem: "one-size", keywords: ["toddler bed", "big kid bed", "transition", "low bed"] },
  { name: "Montessori Floor Bed", category: "Furniture", emoji: "🛏️", sizeSystem: "one-size", keywords: ["montessori", "floor bed", "low bed", "house frame"] },
  { name: "Changing Table", category: "Furniture", emoji: "👶", sizeSystem: "one-size", keywords: ["changing table", "dresser", "diaper station"] },
  { name: "Kids Dresser", category: "Furniture", emoji: "🪑", sizeSystem: "one-size", keywords: ["dresser", "drawers", "storage", "chest"] },
  { name: "Kids Bookshelf", category: "Furniture", emoji: "📚", sizeSystem: "one-size", keywords: ["bookshelf", "book shelf", "book case", "storage", "montessori"] },
  { name: "Toy Storage", category: "Furniture", emoji: "📦", sizeSystem: "one-size", keywords: ["toy box", "storage bins", "organizer", "shelves", "trofast"] },
  { brand: "Sprout", name: "Kids Table and Chairs", category: "Furniture", emoji: "🪑", sizeSystem: "one-size", keywords: ["sprout", "table", "chairs", "play table", "art table"] },
  { name: "Play Table", category: "Furniture", emoji: "🪑", sizeSystem: "one-size", keywords: ["activity table", "craft table", "art table", "lego table"] },
  { name: "Kids Desk", category: "Furniture", emoji: "🪑", sizeSystem: "one-size", keywords: ["desk", "homework", "study", "writing desk"] },
  { name: "Rocking Chair", category: "Furniture", emoji: "🪑", sizeSystem: "one-size", keywords: ["rocker", "glider", "nursery chair", "rocking"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // SLEEP
  // ═══════════════════════════════════════════════════════════════════════════

  { brand: "Halo", name: "SleepSack Swaddle", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["halo", "swaddle", "sleep sack", "wearable blanket"] },
  { brand: "Love to Dream", name: "Swaddle Up", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["love to dream", "arms up", "swaddle", "transition"] },
  { brand: "Nested Bean", name: "Zen Sack", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["nested bean", "weighted", "sleep sack", "zen"] },
  { brand: "Kyte Baby", name: "Sleep Bag", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["kyte", "bamboo", "sleep sack", "tog", "wearable blanket"] },
  { brand: "Woolino", name: "Merino Wool Sleep Sack", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["woolino", "merino", "wool", "4 season", "sleep sack"] },
  { brand: "Aden + Anais", name: "Muslin Swaddle Blankets", category: "Sleep", emoji: "😴", sizeSystem: "one-size", keywords: ["aden anais", "muslin", "swaddle", "blanket", "wrap"] },
  { brand: "Aden + Anais", name: "Sleep Sack", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["aden anais", "muslin", "sleep sack", "wearable blanket"] },
  { brand: "DockATot", name: "Deluxe+ Dock", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["dockatot", "dock a tot", "lounger", "co sleeper", "nest"] },
  { brand: "Snuggle Me", name: "Organic Lounger", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["snuggle me", "lounger", "organic", "cosleeper", "nest"] },
  { name: "Crib Sheet Set", category: "Sleep", emoji: "🛏️", sizeSystem: "one-size", keywords: ["crib sheet", "fitted sheet", "cotton", "jersey", "bamboo"] },
  { name: "Mattress Pad", category: "Sleep", emoji: "🛏️", sizeSystem: "one-size", keywords: ["mattress pad", "waterproof", "protector", "crib mattress"] },
  { name: "Blackout Curtains", category: "Sleep", emoji: "🌙", sizeSystem: "one-size", keywords: ["blackout", "curtains", "window", "dark", "sleep"] },
  { name: "Toddler Pillow", category: "Sleep", emoji: "😴", sizeSystem: "age-range", keywords: ["pillow", "toddler pillow", "little pillow", "keababies"] },
  { name: "Kids Blanket", category: "Sleep", emoji: "🛏️", sizeSystem: "age-range", keywords: ["blanket", "comforter", "quilt", "throw"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // BATH
  // ═══════════════════════════════════════════════════════════════════════════

  { brand: "Skip Hop", name: "Moby Bath Tub", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["skip hop", "moby", "whale", "bath tub", "newborn"] },
  { brand: "Boon", name: "Naked Collapsible Bath", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["boon", "naked", "bath tub", "collapsible"] },
  { brand: "Boon", name: "Bath Toy Set", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["boon", "bath toys", "pipes", "cogs", "water"] },
  { brand: "Puj", name: "Flyte Compact Bath", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["puj", "sink bath", "compact", "newborn", "soft"] },
  { brand: "Blooming Bath", name: "Lotus Baby Bath", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["blooming", "flower", "bath", "sink", "soft"] },
  { brand: "Stokke", name: "Flexi Bath", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["stokke", "flexi", "foldable", "bath tub", "travel"] },
  { name: "Bath Seat", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["bath seat", "sit up", "suction", "ring"] },
  { name: "Hooded Towels", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["hooded towel", "baby towel", "bath wrap", "animal towel"] },
  { name: "Bath Toys", category: "Bath", emoji: "🛁", sizeSystem: "age-range", keywords: ["bath toys", "rubber duck", "squirt", "stacking cups", "water toys"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // SAFETY
  // ═══════════════════════════════════════════════════════════════════════════

  { brand: "Regalo", name: "Baby Gate", category: "Safety", emoji: "🚧", sizeSystem: "one-size", keywords: ["regalo", "gate", "safety gate", "pressure mount", "stair"] },
  { brand: "Summer Infant", name: "Baby Gate", category: "Safety", emoji: "🚧", sizeSystem: "one-size", keywords: ["summer", "gate", "safety gate", "walk through"] },
  { brand: "Munchkin", name: "Baby Gate", category: "Safety", emoji: "🚧", sizeSystem: "one-size", keywords: ["munchkin", "gate", "safety gate", "auto close"] },
  { brand: "Nanit", name: "Pro Camera Monitor", category: "Safety", emoji: "📹", sizeSystem: "one-size", keywords: ["nanit", "monitor", "camera", "smart", "breathing"] },
  { brand: "Owlet", name: "Cam 2 Monitor", category: "Safety", emoji: "📹", sizeSystem: "one-size", keywords: ["owlet", "monitor", "camera", "video"] },
  { brand: "Infant Optics", name: "DXR-8 Pro", category: "Safety", emoji: "📹", sizeSystem: "one-size", keywords: ["infant optics", "monitor", "video", "night vision"] },
  { name: "Outlet Covers", category: "Safety", emoji: "🔌", sizeSystem: "one-size", keywords: ["outlet", "plug", "cover", "childproof", "electric"] },
  { name: "Cabinet Locks", category: "Safety", emoji: "🔒", sizeSystem: "one-size", keywords: ["cabinet", "lock", "childproof", "drawer", "magnetic"] },
  { name: "Corner Guards", category: "Safety", emoji: "🔒", sizeSystem: "one-size", keywords: ["corner", "guard", "bumper", "edge", "table", "childproof"] },
  { name: "Door Knob Covers", category: "Safety", emoji: "🔒", sizeSystem: "one-size", keywords: ["door knob", "cover", "childproof", "lever lock"] },
  { name: "Stove Guards", category: "Safety", emoji: "🔒", sizeSystem: "one-size", keywords: ["stove", "guard", "oven", "childproof", "kitchen"] },
  { name: "Window Guards", category: "Safety", emoji: "🔒", sizeSystem: "one-size", keywords: ["window", "guard", "safety", "fall prevention"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTDOOR
  // ═══════════════════════════════════════════════════════════════════════════

  // Bikes
  { brand: "Strider", name: "Balance Bike", category: "Outdoor", emoji: "🚲", sizeSystem: "age-range", keywords: ["strider", "balance bike", "no pedals", "learn to ride"] },
  { brand: "Woom", name: "Kids Bike", category: "Outdoor", emoji: "🚲", sizeSystem: "age-range", keywords: ["woom", "lightweight", "pedal bike", "quality"] },
  { brand: "Prevelo", name: "Kids Bike", category: "Outdoor", emoji: "🚲", sizeSystem: "age-range", keywords: ["prevelo", "lightweight", "pedal bike"] },
  { brand: "Frog Bikes", name: "Kids Bike", category: "Outdoor", emoji: "🚲", sizeSystem: "age-range", keywords: ["frog", "lightweight", "pedal bike"] },
  { name: "Balance Bike", category: "Outdoor", emoji: "🚲", sizeSystem: "age-range", keywords: ["balance bike", "no pedals", "push bike", "learn to ride"] },
  { name: "Kids Bike with Training Wheels", category: "Outdoor", emoji: "🚲", sizeSystem: "age-range", keywords: ["training wheels", "pedal bike", "first bike"] },
  { name: "Bike Helmet", category: "Outdoor", emoji: "⛑️", sizeSystem: "age-range", keywords: ["helmet", "bike helmet", "safety", "nutcase", "giro"] },

  // Scooters
  { brand: "Micro", name: "Mini Deluxe Scooter", category: "Outdoor", emoji: "🛴", sizeSystem: "age-range", keywords: ["micro", "mini", "scooter", "kick", "3 wheel"] },
  { brand: "Micro", name: "Maxi Deluxe Scooter", category: "Outdoor", emoji: "🛴", sizeSystem: "age-range", keywords: ["micro", "maxi", "scooter", "kick", "3 wheel"] },
  { brand: "Globber", name: "Primo Scooter", category: "Outdoor", emoji: "🛴", sizeSystem: "age-range", keywords: ["globber", "scooter", "3 wheel", "toddler"] },

  // Wagons
  { brand: "Veer", name: "Cruiser Wagon", category: "Outdoor", emoji: "🚗", sizeSystem: "one-size", keywords: ["veer", "wagon", "cruiser", "all terrain", "stroller wagon"] },
  { brand: "Radio Flyer", name: "Pathfinder Wagon", category: "Outdoor", emoji: "🚗", sizeSystem: "one-size", keywords: ["radio flyer", "wagon", "folding", "pull"] },
  { brand: "Wonderfold", name: "W4 Luxe Wagon", category: "Outdoor", emoji: "🚗", sizeSystem: "one-size", keywords: ["wonderfold", "wagon", "quad", "4 seater", "luxury"] },

  // Outdoor play
  { name: "Water Table", category: "Outdoor", emoji: "💧", sizeSystem: "age-range", keywords: ["water table", "sensory", "splash", "step2"] },
  { name: "Sandbox", category: "Outdoor", emoji: "🏖️", sizeSystem: "age-range", keywords: ["sandbox", "sand box", "sand table", "play sand"] },
  { name: "Swing Set", category: "Outdoor", emoji: "🎠", sizeSystem: "age-range", keywords: ["swing set", "playset", "backyard", "slide", "monkey bars"] },
  { name: "Trampoline", category: "Outdoor", emoji: "🤸", sizeSystem: "age-range", keywords: ["trampoline", "bounce", "jumping", "indoor trampoline"] },
  { name: "Play Tent", category: "Outdoor", emoji: "⛺", sizeSystem: "age-range", keywords: ["tent", "teepee", "tipi", "playhouse", "fort"] },
  { name: "Kiddie Pool", category: "Outdoor", emoji: "🏊", sizeSystem: "age-range", keywords: ["pool", "inflatable", "splash", "water", "wading"] },
  { name: "Sprinkler", category: "Outdoor", emoji: "💦", sizeSystem: "age-range", keywords: ["sprinkler", "water", "splash pad", "summer"] },

  // Camping / winter
  { name: "Kids Camping Gear", category: "Outdoor", emoji: "🏕️", sizeSystem: "age-range", keywords: ["camping", "sleeping bag", "tent", "lantern", "outdoor"] },
  { name: "Kids Ski Gear", category: "Outdoor", emoji: "⛷️", sizeSystem: "age-range", keywords: ["ski", "skiing", "snow", "helmet", "goggles", "poles"] },
  { name: "Kids Ski Boots", category: "Outdoor", emoji: "⛷️", sizeSystem: "shoes", keywords: ["ski boots", "skiing", "snow", "winter sport"] },
  { name: "Kids Skis", category: "Outdoor", emoji: "⛷️", sizeSystem: "age-range", keywords: ["skis", "skiing", "snow", "winter sport"] },
  { name: "Kids Snowboard", category: "Outdoor", emoji: "🏂", sizeSystem: "age-range", keywords: ["snowboard", "snow", "winter sport"] },
  { name: "Sled", category: "Outdoor", emoji: "🛷", sizeSystem: "age-range", keywords: ["sled", "sledding", "toboggan", "snow", "winter"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERIC CLOTHING ITEMS (no brand)
  // ═══════════════════════════════════════════════════════════════════════════

  { name: "Onesies", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["bodysuit", "one piece", "romper", "snap"] },
  { name: "Bodysuits", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["onesie", "one piece", "snap tee", "undershirt"] },
  { name: "Pajamas", category: "Clothing", emoji: "🌙", sizeSystem: "clothing", keywords: ["pjs", "pyjamas", "sleepwear", "jammies", "footie"] },
  { name: "Romper", category: "Clothing", emoji: "👶", sizeSystem: "clothing", keywords: ["one piece", "jumper", "playsuit", "sunsuit"] },
  { name: "Leggings", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["tights", "stretch pants", "skinny"] },
  { name: "Joggers", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["sweatpants", "track pants", "athletic pants", "sweats"] },
  { name: "Jeans", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["denim", "pants", "blue jeans"] },
  { name: "T-Shirt", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["tee", "tshirt", "short sleeve", "graphic tee"] },
  { name: "Long Sleeve Shirt", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["long sleeve", "top", "henley"] },
  { name: "Sweater", category: "Clothing", emoji: "🧶", sizeSystem: "clothing", keywords: ["pullover", "knit", "cardigan", "jumper"] },
  { name: "Hoodie", category: "Clothing", emoji: "🧥", sizeSystem: "clothing", keywords: ["hooded sweatshirt", "pullover", "zip up"] },
  { name: "Dress", category: "Clothing", emoji: "👗", sizeSystem: "clothing", keywords: ["frock", "jumper dress", "sundress", "party dress"] },
  { name: "Skirt", category: "Clothing", emoji: "👗", sizeSystem: "clothing", keywords: ["tutu", "pleated", "twirl"] },
  { name: "Shorts", category: "Clothing", emoji: "🩳", sizeSystem: "clothing", keywords: ["short pants", "gym shorts", "athletic shorts"] },
  { name: "Swimsuit", category: "Clothing", emoji: "🏊", sizeSystem: "clothing", keywords: ["bathing suit", "swim", "one piece", "bikini", "trunks", "rash guard"] },
  { name: "Rain Boots", category: "Clothing", emoji: "🥾", sizeSystem: "shoes", keywords: ["wellies", "rubber boots", "galoshes", "rain"] },
  { name: "Snow Boots", category: "Clothing", emoji: "🥾", sizeSystem: "shoes", keywords: ["winter boots", "insulated", "waterproof", "snow"] },
  { name: "Sandals", category: "Clothing", emoji: "🩴", sizeSystem: "shoes", keywords: ["flip flops", "summer shoes", "open toe"] },
  { name: "Sneakers", category: "Clothing", emoji: "👟", sizeSystem: "shoes", keywords: ["athletic shoes", "running shoes", "trainers", "tennis shoes"] },
  { name: "Slippers", category: "Clothing", emoji: "🥿", sizeSystem: "shoes", keywords: ["house shoes", "cozy", "fuzzy"] },
  { name: "Mittens", category: "Clothing", emoji: "🧤", sizeSystem: "clothing", keywords: ["gloves", "winter", "warm hands"] },
  { name: "Winter Hat", category: "Clothing", emoji: "🧢", sizeSystem: "clothing", keywords: ["beanie", "knit hat", "toque", "warm hat"] },
  { name: "Sun Hat", category: "Clothing", emoji: "👒", sizeSystem: "clothing", keywords: ["sunhat", "bucket hat", "upf", "wide brim", "beach hat"] },
  { name: "Baseball Cap", category: "Clothing", emoji: "🧢", sizeSystem: "clothing", keywords: ["cap", "hat", "ball cap"] },
  { name: "Socks", category: "Clothing", emoji: "🧦", sizeSystem: "clothing", keywords: ["ankle socks", "crew socks", "grip socks", "no show"] },
  { name: "Underwear", category: "Clothing", emoji: "🩲", sizeSystem: "clothing", keywords: ["undies", "briefs", "boxer briefs", "panties"] },
  { name: "Training Pants", category: "Clothing", emoji: "🩲", sizeSystem: "clothing", keywords: ["pull ups", "potty training", "training underwear"] },
  { name: "Rash Guard", category: "Clothing", emoji: "🏊", sizeSystem: "clothing", keywords: ["sun shirt", "swim shirt", "upf", "uv protection"] },
  { name: "Overalls", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["dungarees", "bib overalls", "farmer"] },
  { name: "Cardigan", category: "Clothing", emoji: "🧶", sizeSystem: "clothing", keywords: ["button up sweater", "knit", "layering"] },
  { name: "Vest", category: "Clothing", emoji: "🧥", sizeSystem: "clothing", keywords: ["puffer vest", "fleece vest", "layering"] },
  { name: "Button Down Shirt", category: "Clothing", emoji: "👔", sizeSystem: "clothing", keywords: ["dress shirt", "oxford", "collared", "formal"] },
  { name: "Polo Shirt", category: "Clothing", emoji: "👕", sizeSystem: "clothing", keywords: ["collared", "golf shirt", "preppy"] },
  { name: "Tutu", category: "Clothing", emoji: "💃", sizeSystem: "clothing", keywords: ["ballet", "tulle", "dance", "skirt"] },
  { name: "Fleece Pants", category: "Clothing", emoji: "👖", sizeSystem: "clothing", keywords: ["sweatpants", "warm", "cozy", "lounge"] },
  { name: "Costume", category: "Clothing", emoji: "🎃", sizeSystem: "clothing", keywords: ["halloween", "dress up", "pretend", "character"] },
  { name: "Maternity Clothes", category: "Clothing", emoji: "🤰", sizeSystem: "clothing", keywords: ["maternity", "pregnancy", "bump", "nursing"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL GEAR & MISC
  // ═══════════════════════════════════════════════════════════════════════════

  { name: "Backpack", category: "Gear", emoji: "🎒", sizeSystem: "age-range", keywords: ["school bag", "daypack", "book bag", "preschool"] },
  { name: "Blanket", category: "Sleep", emoji: "🛏️", sizeSystem: "one-size", keywords: ["lovey", "security blanket", "receiving blanket", "swaddle"] },
  { name: "Swaddle", category: "Sleep", emoji: "👶", sizeSystem: "age-range", keywords: ["swaddle blanket", "wrap", "muslin", "receiving"] },
  { name: "Playpen", category: "Gear", emoji: "👶", sizeSystem: "one-size", keywords: ["play yard", "playard", "pack n play", "portable crib"] },
  { name: "Activity Mat", category: "Gear", emoji: "🧸", sizeSystem: "age-range", keywords: ["play mat", "tummy time", "gym", "activity gym"] },
  { name: "Baby Carrier", category: "Gear", emoji: "🎒", sizeSystem: "one-size", keywords: ["carrier", "wrap", "sling", "structured carrier"] },
  { name: "Booster Seat", category: "Feeding", emoji: "🪑", sizeSystem: "age-range", keywords: ["booster", "portable high chair", "travel seat"] },
  { name: "Potty", category: "Gear", emoji: "🚽", sizeSystem: "age-range", keywords: ["potty chair", "training toilet", "potty training", "toilet seat"] },
  { name: "Step Stool", category: "Gear", emoji: "🪜", sizeSystem: "one-size", keywords: ["step stool", "bathroom stool", "kitchen helper", "learning tower"] },
  { name: "Night Light", category: "Sleep", emoji: "💡", sizeSystem: "one-size", keywords: ["night light", "nursery light", "dim", "hatch", "ok to wake"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTRONICS
  // ═══════════════════════════════════════════════════════════════════════════

  // Apple — iPhones
  { brand: "Apple", name: "iPhone 15", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["iphone", "iphone 15", "apple", "phone", "smartphone", "cell phone", "cell"] },
  { brand: "Apple", name: "iPhone 15 Pro", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["iphone", "iphone 15 pro", "apple", "phone", "smartphone", "pro", "titanium"] },
  { brand: "Apple", name: "iPhone 14", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["iphone", "iphone 14", "apple", "phone", "smartphone"] },
  { brand: "Apple", name: "iPhone 13", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["iphone", "iphone 13", "apple", "phone", "smartphone"] },
  { brand: "Apple", name: "iPhone SE", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["iphone", "iphone se", "apple", "phone", "smartphone", "budget", "cheap iphone"] },

  // Apple — iPads
  { brand: "Apple", name: "iPad 10th Gen", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["ipad", "apple", "tablet", "ipad 10", "10th gen"] },
  { brand: "Apple", name: "iPad Air M2", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["ipad", "ipad air", "apple", "tablet", "m2", "air"] },
  { brand: "Apple", name: "iPad Pro M4", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["ipad", "ipad pro", "apple", "tablet", "m4", "pro"] },

  // Apple — Macs
  { brand: "Apple", name: "MacBook Air M3", category: "Electronics", emoji: "💻", sizeSystem: "model-spec", keywords: ["macbook", "macbook air", "apple", "laptop", "m3", "mac", "mba"] },
  { brand: "Apple", name: "MacBook Pro M3", category: "Electronics", emoji: "💻", sizeSystem: "model-spec", keywords: ["macbook", "macbook pro", "apple", "laptop", "m3", "mac", "mbp"] },
  { brand: "Apple", name: "iMac M3", category: "Electronics", emoji: "🖥️", sizeSystem: "model-spec", keywords: ["imac", "apple", "desktop", "m3", "mac", "all in one"] },
  { brand: "Apple", name: "Mac Mini M2", category: "Electronics", emoji: "🖥️", sizeSystem: "model-spec", keywords: ["mac mini", "apple", "desktop", "m2", "mac", "mini"] },

  // Apple — Wearables & Audio
  { brand: "Apple", name: "Apple Watch Series 9", category: "Electronics", emoji: "⌚", sizeSystem: "model-spec", keywords: ["apple watch", "watch", "smartwatch", "series 9", "s9", "iwatch"] },
  { brand: "Apple", name: "Apple Watch SE", category: "Electronics", emoji: "⌚", sizeSystem: "model-spec", keywords: ["apple watch", "watch", "smartwatch", "se", "iwatch", "budget"] },
  { brand: "Apple", name: "AirPods Pro 2", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["airpods", "airpods pro", "apple", "earbuds", "wireless earbuds", "anc", "noise cancelling"] },
  { brand: "Apple", name: "AirPods Max", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["airpods max", "apple", "headphones", "over ear", "noise cancelling"] },
  { brand: "Apple", name: "HomePod Mini", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["homepod", "apple", "speaker", "smart speaker", "siri"] },
  { brand: "Apple", name: "Apple TV 4K", category: "Electronics", emoji: "📺", sizeSystem: "model-spec", keywords: ["apple tv", "apple", "streaming", "4k", "media player"] },

  // Samsung
  { brand: "Samsung", name: "Galaxy S24", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["samsung", "galaxy", "galaxy s24", "s24", "phone", "smartphone", "android"] },
  { brand: "Samsung", name: "Galaxy S24 Ultra", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["samsung", "galaxy", "galaxy s24 ultra", "s24 ultra", "phone", "smartphone", "android", "ultra"] },
  { brand: "Samsung", name: "Galaxy Z Flip 5", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["samsung", "galaxy", "z flip", "flip phone", "foldable", "flip 5"] },
  { brand: "Samsung", name: "Galaxy Z Fold 5", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["samsung", "galaxy", "z fold", "foldable", "fold 5"] },
  { brand: "Samsung", name: "Galaxy Tab S9", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["samsung", "galaxy tab", "tablet", "android tablet", "tab s9"] },
  { brand: "Samsung", name: "Galaxy Watch 6", category: "Electronics", emoji: "⌚", sizeSystem: "model-spec", keywords: ["samsung", "galaxy watch", "smartwatch", "watch 6", "android watch"] },
  { brand: "Samsung", name: "Galaxy Buds FE", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["samsung", "galaxy buds", "earbuds", "wireless earbuds", "buds fe"] },

  // Sony
  { brand: "Sony", name: "WH-1000XM5 Headphones", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["sony", "wh-1000xm5", "xm5", "headphones", "noise cancelling", "anc", "over ear", "wireless"] },
  { brand: "Sony", name: "WF-1000XM5 Earbuds", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["sony", "wf-1000xm5", "xm5", "earbuds", "wireless earbuds", "noise cancelling", "anc"] },
  { brand: "Sony", name: "SRS-XB100 Speaker", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["sony", "srs-xb100", "bluetooth speaker", "portable speaker", "speaker"] },
  { brand: "Sony", name: "Alpha a6400 Camera", category: "Electronics", emoji: "📷", sizeSystem: "model-spec", keywords: ["sony", "alpha", "a6400", "mirrorless", "camera", "aps-c"] },
  { brand: "Sony", name: "Alpha a7 III Camera", category: "Electronics", emoji: "📷", sizeSystem: "model-spec", keywords: ["sony", "alpha", "a7iii", "a7 iii", "mirrorless", "camera", "full frame"] },

  // Bose
  { brand: "Bose", name: "QuietComfort Ultra Headphones", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["bose", "qc ultra", "quietcomfort", "headphones", "noise cancelling", "anc", "over ear"] },
  { brand: "Bose", name: "SoundLink Flex Speaker", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["bose", "soundlink", "flex", "bluetooth speaker", "portable speaker"] },
  { brand: "Bose", name: "SoundLink Revolve+", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["bose", "soundlink", "revolve", "bluetooth speaker", "portable speaker", "360"] },
  { brand: "Bose", name: "QuietComfort Earbuds II", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["bose", "qc earbuds", "quietcomfort", "earbuds", "wireless earbuds", "noise cancelling"] },

  // JBL
  { brand: "JBL", name: "Charge 5", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["jbl", "charge 5", "bluetooth speaker", "portable speaker", "waterproof"] },
  { brand: "JBL", name: "Flip 6", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["jbl", "flip 6", "bluetooth speaker", "portable speaker", "waterproof"] },
  { brand: "JBL", name: "Tune 770NC", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["jbl", "tune", "770nc", "headphones", "noise cancelling", "wireless"] },
  { brand: "JBL", name: "Go 3", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["jbl", "go 3", "bluetooth speaker", "mini speaker", "portable"] },

  // Sonos
  { brand: "Sonos", name: "One SL", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["sonos", "one sl", "smart speaker", "wifi speaker", "home audio"] },
  { brand: "Sonos", name: "Era 100", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["sonos", "era 100", "smart speaker", "wifi speaker", "home audio"] },
  { brand: "Sonos", name: "Era 300", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["sonos", "era 300", "smart speaker", "spatial audio", "dolby atmos"] },
  { brand: "Sonos", name: "Beam Gen 2", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["sonos", "beam", "soundbar", "home theater", "dolby atmos"] },
  { brand: "Sonos", name: "Arc", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["sonos", "arc", "soundbar", "home theater", "dolby atmos", "premium"] },
  { brand: "Sonos", name: "Roam 2", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["sonos", "roam", "portable speaker", "bluetooth", "wifi", "waterproof"] },
  { brand: "Sonos", name: "Move 2", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["sonos", "move", "portable speaker", "bluetooth", "wifi", "battery"] },

  // Google
  { brand: "Google", name: "Pixel 8", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["google", "pixel", "pixel 8", "phone", "smartphone", "android"] },
  { brand: "Google", name: "Pixel 8 Pro", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["google", "pixel", "pixel 8 pro", "phone", "smartphone", "android", "pro"] },
  { brand: "Google", name: "Pixel Watch 2", category: "Electronics", emoji: "⌚", sizeSystem: "model-spec", keywords: ["google", "pixel watch", "smartwatch", "android watch", "fitbit"] },
  { brand: "Google", name: "Nest Hub Max", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["google", "nest hub", "smart display", "google assistant", "hub max"] },
  { brand: "Google", name: "Nest Thermostat", category: "Electronics", emoji: "🌡️", sizeSystem: "model-spec", keywords: ["google", "nest", "thermostat", "smart thermostat", "smart home"] },
  { brand: "Google", name: "Nest Doorbell", category: "Electronics", emoji: "🚪", sizeSystem: "model-spec", keywords: ["google", "nest", "doorbell", "video doorbell", "smart home", "security"] },

  // DJI
  { brand: "DJI", name: "Mini 4 Pro", category: "Electronics", emoji: "🚁", sizeSystem: "model-spec", keywords: ["dji", "mini 4 pro", "drone", "quadcopter", "camera drone", "mini drone"] },
  { brand: "DJI", name: "Air 3", category: "Electronics", emoji: "🚁", sizeSystem: "model-spec", keywords: ["dji", "air 3", "drone", "quadcopter", "camera drone"] },
  { brand: "DJI", name: "Osmo Pocket 3", category: "Electronics", emoji: "📷", sizeSystem: "model-spec", keywords: ["dji", "osmo", "pocket 3", "gimbal", "camera", "vlog", "stabilizer"] },
  { brand: "DJI", name: "Action 4", category: "Electronics", emoji: "📷", sizeSystem: "model-spec", keywords: ["dji", "action 4", "action camera", "gopro alternative", "waterproof camera"] },

  // Canon
  { brand: "Canon", name: "EOS R50", category: "Electronics", emoji: "📷", sizeSystem: "model-spec", keywords: ["canon", "eos", "r50", "mirrorless", "camera", "beginner"] },
  { brand: "Canon", name: "EOS Rebel T7", category: "Electronics", emoji: "📷", sizeSystem: "model-spec", keywords: ["canon", "eos", "rebel", "t7", "dslr", "camera", "beginner"] },
  { brand: "Canon", name: "EOS R6 Mark II", category: "Electronics", emoji: "📷", sizeSystem: "model-spec", keywords: ["canon", "eos", "r6", "mark ii", "mirrorless", "camera", "full frame"] },

  // Nintendo
  { brand: "Nintendo", name: "Switch OLED", category: "Electronics", emoji: "🎮", sizeSystem: "model-spec", keywords: ["nintendo", "switch", "oled", "game console", "gaming", "handheld"] },
  { brand: "Nintendo", name: "Switch Lite", category: "Electronics", emoji: "🎮", sizeSystem: "model-spec", keywords: ["nintendo", "switch lite", "game console", "gaming", "handheld", "portable"] },

  // Generic Electronics
  { name: "TV", category: "Electronics", emoji: "📺", sizeSystem: "model-spec", keywords: ["tv", "television", "flat screen", "smart tv", "4k", "oled", "qled", "lcd", "led"] },
  { name: "Monitor", category: "Electronics", emoji: "🖥️", sizeSystem: "model-spec", keywords: ["monitor", "display", "screen", "computer monitor", "4k monitor", "gaming monitor", "ultrawide"] },
  { name: "Laptop", category: "Electronics", emoji: "💻", sizeSystem: "model-spec", keywords: ["laptop", "notebook", "computer", "pc", "chromebook"] },
  { name: "Tablet", category: "Electronics", emoji: "📱", sizeSystem: "model-spec", keywords: ["tablet", "android tablet", "fire tablet", "kindle"] },
  { name: "Headphones", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["headphones", "over ear", "on ear", "wireless headphones", "bluetooth headphones"] },
  { name: "Wireless Earbuds", category: "Electronics", emoji: "🎧", sizeSystem: "model-spec", keywords: ["earbuds", "wireless earbuds", "bluetooth earbuds", "true wireless", "tws"] },
  { name: "Bluetooth Speaker", category: "Electronics", emoji: "🔊", sizeSystem: "model-spec", keywords: ["bluetooth speaker", "portable speaker", "wireless speaker", "outdoor speaker"] },
  { name: "Smart Watch", category: "Electronics", emoji: "⌚", sizeSystem: "model-spec", keywords: ["smartwatch", "smart watch", "fitness tracker", "wearable"] },
  { name: "Camera", category: "Electronics", emoji: "📷", sizeSystem: "model-spec", keywords: ["camera", "digital camera", "point and shoot", "dslr", "mirrorless"] },
  { name: "Drone", category: "Electronics", emoji: "🚁", sizeSystem: "model-spec", keywords: ["drone", "quadcopter", "fpv", "camera drone", "rc drone"] },
  { name: "E-reader", category: "Electronics", emoji: "📖", sizeSystem: "model-spec", keywords: ["e-reader", "ereader", "kindle", "kobo", "nook", "e-ink"] },
  { name: "Projector", category: "Electronics", emoji: "📽️", sizeSystem: "model-spec", keywords: ["projector", "home theater", "portable projector", "mini projector"] },
  { name: "Router", category: "Electronics", emoji: "📡", sizeSystem: "model-spec", keywords: ["router", "wifi router", "mesh", "modem", "networking", "wifi 6"] },
  { name: "External Hard Drive", category: "Electronics", emoji: "💾", sizeSystem: "model-spec", keywords: ["hard drive", "external drive", "ssd", "hdd", "portable drive", "storage", "backup"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME FURNITURE
  // ═══════════════════════════════════════════════════════════════════════════

  // IKEA
  { brand: "IKEA", name: "KALLAX Shelf", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["ikea", "kallax", "shelf", "bookshelf", "cube storage", "shelving unit", "expedit"] },
  { brand: "IKEA", name: "MALM Dresser", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["ikea", "malm", "dresser", "chest of drawers", "drawer", "bedroom"] },
  { brand: "IKEA", name: "HEMNES Bed Frame", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["ikea", "hemnes", "bed", "bed frame", "bedroom"] },
  { brand: "IKEA", name: "POÄNG Chair", category: "Home Furniture", emoji: "🪑", sizeSystem: "dimensions", keywords: ["ikea", "poang", "poäng", "chair", "armchair", "accent chair", "rocking"] },
  { brand: "IKEA", name: "LACK Coffee Table", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["ikea", "lack", "coffee table", "side table", "end table"] },
  { brand: "IKEA", name: "BILLY Bookcase", category: "Home Furniture", emoji: "📚", sizeSystem: "dimensions", keywords: ["ikea", "billy", "bookcase", "bookshelf", "shelving"] },
  { brand: "IKEA", name: "PAX Wardrobe", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["ikea", "pax", "wardrobe", "closet", "armoire", "storage"] },
  { brand: "IKEA", name: "KIVIK Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["ikea", "kivik", "sofa", "couch", "sectional"] },
  { brand: "IKEA", name: "NORDLI Chest", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["ikea", "nordli", "chest", "dresser", "drawer", "modular"] },
  { brand: "IKEA", name: "BRIMNES Daybed", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["ikea", "brimnes", "daybed", "bed", "guest bed", "trundle"] },

  // West Elm
  { brand: "West Elm", name: "Mid-Century Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["west elm", "mid century", "sofa", "couch", "mcm", "modern"] },
  { brand: "West Elm", name: "Andes Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["west elm", "andes", "sofa", "couch", "sectional"] },
  { brand: "West Elm", name: "Terrace Dining Table", category: "Home Furniture", emoji: "🍽️", sizeSystem: "dimensions", keywords: ["west elm", "terrace", "dining table", "table", "outdoor"] },
  { brand: "West Elm", name: "Mid-Century Nightstand", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["west elm", "mid century", "nightstand", "bedside table", "mcm"] },
  { brand: "West Elm", name: "Industrial Storage Desk", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["west elm", "industrial", "desk", "office desk", "storage desk"] },

  // Pottery Barn
  { brand: "Pottery Barn", name: "York Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["pottery barn", "pb", "york", "sofa", "couch"] },
  { brand: "Pottery Barn", name: "Benchwright Dining Table", category: "Home Furniture", emoji: "🍽️", sizeSystem: "dimensions", keywords: ["pottery barn", "pb", "benchwright", "dining table", "farmhouse"] },
  { brand: "Pottery Barn", name: "Farmhouse Bed", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["pottery barn", "pb", "farmhouse", "bed", "bed frame"] },
  { brand: "Pottery Barn", name: "Hudson Dresser", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["pottery barn", "pb", "hudson", "dresser", "chest of drawers"] },

  // CB2
  { brand: "CB2", name: "Avec Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["cb2", "avec", "sofa", "couch", "modern"] },
  { brand: "CB2", name: "Helix Desk", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["cb2", "helix", "desk", "office desk", "modern"] },
  { brand: "CB2", name: "Gwyneth Bed", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["cb2", "gwyneth", "bed", "bed frame", "modern", "platform"] },

  // Crate & Barrel
  { brand: "Crate & Barrel", name: "Gather Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["crate and barrel", "crate & barrel", "c&b", "gather", "sofa", "couch"] },
  { brand: "Crate & Barrel", name: "Village Dining Chair", category: "Home Furniture", emoji: "🪑", sizeSystem: "dimensions", keywords: ["crate and barrel", "crate & barrel", "c&b", "village", "dining chair", "chair"] },
  { brand: "Crate & Barrel", name: "Tate Bookcase", category: "Home Furniture", emoji: "📚", sizeSystem: "dimensions", keywords: ["crate and barrel", "crate & barrel", "c&b", "tate", "bookcase", "bookshelf"] },

  // Restoration Hardware
  { brand: "Restoration Hardware", name: "Cloud Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["restoration hardware", "rh", "cloud", "sofa", "couch", "sectional", "modular"] },
  { brand: "Restoration Hardware", name: "Parsons Dining Table", category: "Home Furniture", emoji: "🍽️", sizeSystem: "dimensions", keywords: ["restoration hardware", "rh", "parsons", "dining table", "table"] },
  { brand: "Restoration Hardware", name: "Maison Bed", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["restoration hardware", "rh", "maison", "bed", "bed frame"] },

  // Article
  { brand: "Article", name: "Sven Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["article", "sven", "sofa", "couch", "leather", "mid century"] },
  { brand: "Article", name: "Ceni Sofa", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["article", "ceni", "sofa", "couch", "modern"] },
  { brand: "Article", name: "Timber Dining Table", category: "Home Furniture", emoji: "🍽️", sizeSystem: "dimensions", keywords: ["article", "timber", "dining table", "table", "wood"] },
  { brand: "Article", name: "Forma Chair", category: "Home Furniture", emoji: "🪑", sizeSystem: "dimensions", keywords: ["article", "forma", "chair", "dining chair", "modern"] },

  // Generic Home Furniture
  { name: "Couch", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["couch", "sofa", "loveseat", "settee"] },
  { name: "Sectional", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["sectional", "sectional sofa", "l-shaped", "modular sofa"] },
  { name: "Dining Table", category: "Home Furniture", emoji: "🍽️", sizeSystem: "dimensions", keywords: ["dining table", "kitchen table", "table", "eat"] },
  { name: "Coffee Table", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["coffee table", "living room table", "cocktail table"] },
  { name: "Dresser", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["dresser", "chest of drawers", "bureau", "bedroom storage"] },
  { name: "Nightstand", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["nightstand", "bedside table", "night table", "end table"] },
  { name: "Bookshelf", category: "Home Furniture", emoji: "📚", sizeSystem: "dimensions", keywords: ["bookshelf", "bookcase", "shelving", "shelves", "display shelf"] },
  { name: "Desk", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["desk", "writing desk", "computer desk", "home office"] },
  { name: "Bed Frame", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["bed frame", "bed", "platform bed", "headboard", "footboard"] },
  { name: "Queen Mattress", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["queen mattress", "mattress", "queen bed", "queen size"] },
  { name: "King Mattress", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["king mattress", "mattress", "king bed", "king size", "cal king"] },
  { name: "Twin Mattress", category: "Home Furniture", emoji: "🛏️", sizeSystem: "dimensions", keywords: ["twin mattress", "mattress", "twin bed", "twin size", "single"] },
  { name: "Rug", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["rug", "area rug", "carpet", "runner", "floor covering"] },
  { name: "Bar Cart", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["bar cart", "drink cart", "cocktail cart", "serving cart"] },
  { name: "TV Stand", category: "Home Furniture", emoji: "📺", sizeSystem: "dimensions", keywords: ["tv stand", "media console", "entertainment center", "tv cabinet"] },
  { name: "Console Table", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["console table", "entry table", "entryway", "hallway table", "sofa table"] },
  { name: "Accent Chair", category: "Home Furniture", emoji: "🪑", sizeSystem: "dimensions", keywords: ["accent chair", "armchair", "lounge chair", "reading chair", "club chair"] },
  { name: "Ottoman", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["ottoman", "footrest", "pouf", "foot stool", "storage ottoman"] },
  { name: "Recliner", category: "Home Furniture", emoji: "🛋️", sizeSystem: "dimensions", keywords: ["recliner", "reclining chair", "lazy boy", "la-z-boy", "rocker recliner"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLIANCES
  // ═══════════════════════════════════════════════════════════════════════════

  // Dyson
  { brand: "Dyson", name: "V15 Detect", category: "Appliances", emoji: "🔌", sizeSystem: "model-spec", keywords: ["dyson", "v15", "detect", "vacuum", "cordless vacuum", "stick vacuum"] },
  { brand: "Dyson", name: "V12 Slim", category: "Appliances", emoji: "🔌", sizeSystem: "model-spec", keywords: ["dyson", "v12", "slim", "vacuum", "cordless vacuum", "stick vacuum", "lightweight"] },
  { brand: "Dyson", name: "Airwrap", category: "Appliances", emoji: "💇", sizeSystem: "model-spec", keywords: ["dyson", "airwrap", "hair styler", "curling", "hair tool", "multi styler"] },
  { brand: "Dyson", name: "Supersonic Hair Dryer", category: "Appliances", emoji: "💇", sizeSystem: "model-spec", keywords: ["dyson", "supersonic", "hair dryer", "blow dryer"] },
  { brand: "Dyson", name: "Pure Cool Tower", category: "Appliances", emoji: "🌬️", sizeSystem: "model-spec", keywords: ["dyson", "pure cool", "fan", "air purifier", "tower fan", "bladeless"] },
  { brand: "Dyson", name: "Hot+Cool", category: "Appliances", emoji: "🌬️", sizeSystem: "model-spec", keywords: ["dyson", "hot cool", "fan", "heater", "space heater", "bladeless"] },

  // KitchenAid
  { brand: "KitchenAid", name: "Artisan Stand Mixer", category: "Appliances", emoji: "🍰", sizeSystem: "model-spec", keywords: ["kitchenaid", "artisan", "stand mixer", "mixer", "baking", "kitchen aid"] },
  { brand: "KitchenAid", name: "Pro 600 Stand Mixer", category: "Appliances", emoji: "🍰", sizeSystem: "model-spec", keywords: ["kitchenaid", "pro 600", "stand mixer", "mixer", "professional", "kitchen aid"] },

  // Breville
  { brand: "Breville", name: "Barista Express", category: "Appliances", emoji: "☕", sizeSystem: "model-spec", keywords: ["breville", "barista express", "espresso", "coffee machine", "grinder"] },
  { brand: "Breville", name: "Smart Oven Air Fryer Pro", category: "Appliances", emoji: "🔌", sizeSystem: "model-spec", keywords: ["breville", "smart oven", "air fryer", "toaster oven", "convection"] },
  { brand: "Breville", name: "Juice Fountain", category: "Appliances", emoji: "🥤", sizeSystem: "model-spec", keywords: ["breville", "juice fountain", "juicer", "juice extractor"] },

  // Ninja
  { brand: "Ninja", name: "Foodi Air Fryer", category: "Appliances", emoji: "🍟", sizeSystem: "model-spec", keywords: ["ninja", "foodi", "air fryer", "air fry", "crisp"] },
  { brand: "Ninja", name: "Creami", category: "Appliances", emoji: "🍦", sizeSystem: "model-spec", keywords: ["ninja", "creami", "ice cream maker", "frozen treats", "sorbet", "gelato"] },
  { brand: "Ninja", name: "Professional Blender", category: "Appliances", emoji: "🥤", sizeSystem: "model-spec", keywords: ["ninja", "blender", "professional", "smoothie", "blend"] },
  { brand: "Ninja", name: "Speedi", category: "Appliances", emoji: "🍲", sizeSystem: "model-spec", keywords: ["ninja", "speedi", "rapid cooker", "air fryer", "multi cooker"] },

  // Vitamix
  { brand: "Vitamix", name: "A3500", category: "Appliances", emoji: "🥤", sizeSystem: "model-spec", keywords: ["vitamix", "a3500", "blender", "smart blender", "high performance"] },
  { brand: "Vitamix", name: "E310", category: "Appliances", emoji: "🥤", sizeSystem: "model-spec", keywords: ["vitamix", "e310", "blender", "explorian", "smoothie"] },
  { brand: "Vitamix", name: "FoodCycler", category: "Appliances", emoji: "♻️", sizeSystem: "model-spec", keywords: ["vitamix", "foodcycler", "composter", "food waste", "composting"] },

  // Instant Pot
  { brand: "Instant Pot", name: "Duo Plus", category: "Appliances", emoji: "🍲", sizeSystem: "model-spec", keywords: ["instant pot", "instapot", "duo plus", "pressure cooker", "multi cooker", "slow cooker"] },
  { brand: "Instant Pot", name: "Pro Crisp", category: "Appliances", emoji: "🍲", sizeSystem: "model-spec", keywords: ["instant pot", "instapot", "pro crisp", "pressure cooker", "air fryer", "multi cooker"] },
  { brand: "Instant Pot", name: "Duo Mini", category: "Appliances", emoji: "🍲", sizeSystem: "model-spec", keywords: ["instant pot", "instapot", "duo mini", "pressure cooker", "small", "compact"] },

  // Nespresso
  { brand: "Nespresso", name: "Vertuo Next", category: "Appliances", emoji: "☕", sizeSystem: "model-spec", keywords: ["nespresso", "vertuo", "next", "coffee maker", "espresso", "pod", "capsule"] },
  { brand: "Nespresso", name: "Vertuo Pop", category: "Appliances", emoji: "☕", sizeSystem: "model-spec", keywords: ["nespresso", "vertuo", "pop", "coffee maker", "espresso", "compact"] },
  { brand: "Nespresso", name: "Pixie", category: "Appliances", emoji: "☕", sizeSystem: "model-spec", keywords: ["nespresso", "pixie", "coffee maker", "espresso", "original line"] },
  { brand: "Nespresso", name: "Lattissima", category: "Appliances", emoji: "☕", sizeSystem: "model-spec", keywords: ["nespresso", "lattissima", "coffee maker", "espresso", "milk frother", "latte"] },

  // iRobot
  { brand: "iRobot", name: "Roomba j7+", category: "Appliances", emoji: "🤖", sizeSystem: "model-spec", keywords: ["irobot", "roomba", "j7", "robot vacuum", "self emptying", "smart mapping"] },
  { brand: "iRobot", name: "Roomba Combo j9+", category: "Appliances", emoji: "🤖", sizeSystem: "model-spec", keywords: ["irobot", "roomba", "j9", "combo", "robot vacuum", "robot mop", "self emptying"] },
  { brand: "iRobot", name: "Braava Jet M6", category: "Appliances", emoji: "🤖", sizeSystem: "model-spec", keywords: ["irobot", "braava", "m6", "robot mop", "mopping"] },

  // Shark
  { brand: "Shark", name: "Navigator Lift-Away", category: "Appliances", emoji: "🔌", sizeSystem: "model-spec", keywords: ["shark", "navigator", "lift-away", "vacuum", "upright vacuum"] },
  { brand: "Shark", name: "Vertex Pro", category: "Appliances", emoji: "🔌", sizeSystem: "model-spec", keywords: ["shark", "vertex", "pro", "vacuum", "upright", "powered lift-away"] },
  { brand: "Shark", name: "AI Robot VacMop", category: "Appliances", emoji: "🤖", sizeSystem: "model-spec", keywords: ["shark", "ai", "robot vacuum", "vacmop", "robot mop", "smart"] },

  // Generic Appliances
  { name: "Vacuum", category: "Appliances", emoji: "🔌", sizeSystem: "model-spec", keywords: ["vacuum", "vacuum cleaner", "hoover", "upright", "canister"] },
  { name: "Blender", category: "Appliances", emoji: "🥤", sizeSystem: "model-spec", keywords: ["blender", "smoothie maker", "food processor"] },
  { name: "Air Fryer", category: "Appliances", emoji: "🍟", sizeSystem: "model-spec", keywords: ["air fryer", "air fry", "convection", "healthy fry"] },
  { name: "Coffee Maker", category: "Appliances", emoji: "☕", sizeSystem: "model-spec", keywords: ["coffee maker", "coffee machine", "drip coffee", "brew"] },
  { name: "Stand Mixer", category: "Appliances", emoji: "🍰", sizeSystem: "model-spec", keywords: ["stand mixer", "mixer", "baking", "dough"] },
  { name: "Toaster Oven", category: "Appliances", emoji: "🔌", sizeSystem: "model-spec", keywords: ["toaster oven", "toaster", "convection oven", "countertop oven"] },
  { name: "Rice Cooker", category: "Appliances", emoji: "🍚", sizeSystem: "model-spec", keywords: ["rice cooker", "rice maker", "zojirushi", "instant rice"] },
  { name: "Robot Vacuum", category: "Appliances", emoji: "🤖", sizeSystem: "model-spec", keywords: ["robot vacuum", "robovac", "autonomous vacuum", "smart vacuum"] },
  { name: "Washer", category: "Appliances", emoji: "🧺", sizeSystem: "model-spec", keywords: ["washer", "washing machine", "laundry", "front load", "top load"] },
  { name: "Dryer", category: "Appliances", emoji: "🧺", sizeSystem: "model-spec", keywords: ["dryer", "clothes dryer", "laundry", "tumble dryer"] },
  { name: "Dishwasher", category: "Appliances", emoji: "🍽️", sizeSystem: "model-spec", keywords: ["dishwasher", "dish washer", "kitchen appliance"] },
  { name: "Refrigerator", category: "Appliances", emoji: "🧊", sizeSystem: "model-spec", keywords: ["refrigerator", "fridge", "freezer", "mini fridge"] },
  { name: "Microwave", category: "Appliances", emoji: "🔌", sizeSystem: "model-spec", keywords: ["microwave", "microwave oven", "countertop microwave"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPORTS & FITNESS
  // ═══════════════════════════════════════════════════════════════════════════

  // Peloton
  { brand: "Peloton", name: "Bike+", category: "Sports & Fitness", emoji: "🚴", sizeSystem: "one-size", keywords: ["peloton", "bike+", "bike plus", "spin bike", "exercise bike", "cycling", "indoor cycling"] },
  { brand: "Peloton", name: "Tread+", category: "Sports & Fitness", emoji: "🏃", sizeSystem: "one-size", keywords: ["peloton", "tread+", "tread plus", "treadmill", "running"] },
  { brand: "Peloton", name: "Row", category: "Sports & Fitness", emoji: "🚣", sizeSystem: "one-size", keywords: ["peloton", "row", "rowing machine", "rower", "indoor rowing"] },
  { brand: "Peloton", name: "Guide", category: "Sports & Fitness", emoji: "💪", sizeSystem: "one-size", keywords: ["peloton", "guide", "strength training", "camera", "workout"] },

  // Trek
  { brand: "Trek", name: "Marlin", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["trek", "marlin", "mountain bike", "mtb", "trail bike", "hardtail"] },
  { brand: "Trek", name: "FX", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["trek", "fx", "hybrid bike", "commuter", "fitness bike"] },
  { brand: "Trek", name: "Domane", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["trek", "domane", "road bike", "endurance", "carbon"] },
  { brand: "Trek", name: "Madone", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["trek", "madone", "road bike", "aero", "race bike", "carbon"] },

  // Specialized
  { brand: "Specialized", name: "Rockhopper", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["specialized", "rockhopper", "mountain bike", "mtb", "hardtail"] },
  { brand: "Specialized", name: "Sirrus", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["specialized", "sirrus", "hybrid bike", "commuter", "fitness"] },
  { brand: "Specialized", name: "Allez", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["specialized", "allez", "road bike", "entry road", "aluminum"] },
  { brand: "Specialized", name: "Stumpjumper", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["specialized", "stumpjumper", "mountain bike", "mtb", "full suspension", "trail"] },

  // Giant
  { brand: "Giant", name: "Escape", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["giant", "escape", "hybrid bike", "commuter", "fitness"] },
  { brand: "Giant", name: "Talon", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["giant", "talon", "mountain bike", "mtb", "hardtail"] },
  { brand: "Giant", name: "Defy", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["giant", "defy", "road bike", "endurance"] },
  { brand: "Giant", name: "Trance", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["giant", "trance", "mountain bike", "mtb", "full suspension", "trail"] },

  // Yeti
  { brand: "Yeti", name: "Tundra 45 Cooler", category: "Sports & Fitness", emoji: "🧊", sizeSystem: "one-size", keywords: ["yeti", "tundra", "cooler", "ice chest", "hard cooler", "45"] },
  { brand: "Yeti", name: "Rambler", category: "Sports & Fitness", emoji: "🧊", sizeSystem: "one-size", keywords: ["yeti", "rambler", "tumbler", "water bottle", "insulated"] },
  { brand: "Yeti", name: "Hopper M20", category: "Sports & Fitness", emoji: "🧊", sizeSystem: "one-size", keywords: ["yeti", "hopper", "m20", "soft cooler", "backpack cooler"] },

  // REI Co-op
  { brand: "REI Co-op", name: "Half Dome Tent", category: "Sports & Fitness", emoji: "⛺", sizeSystem: "one-size", keywords: ["rei", "half dome", "tent", "camping", "backpacking tent"] },
  { brand: "REI Co-op", name: "Trailbreak Sleeping Bag", category: "Sports & Fitness", emoji: "🛏️", sizeSystem: "one-size", keywords: ["rei", "trailbreak", "sleeping bag", "camping", "backpacking"] },
  { brand: "REI Co-op", name: "Flash Pack", category: "Sports & Fitness", emoji: "🎒", sizeSystem: "one-size", keywords: ["rei", "flash", "backpack", "hiking pack", "daypack"] },

  // Osprey
  { brand: "Osprey", name: "Atmos AG 65", category: "Sports & Fitness", emoji: "🎒", sizeSystem: "one-size", keywords: ["osprey", "atmos", "ag 65", "backpack", "hiking", "backpacking", "65l"] },
  { brand: "Osprey", name: "Daylite Pack", category: "Sports & Fitness", emoji: "🎒", sizeSystem: "one-size", keywords: ["osprey", "daylite", "daypack", "backpack", "hiking", "everyday"] },
  { brand: "Osprey", name: "Tempest", category: "Sports & Fitness", emoji: "🎒", sizeSystem: "one-size", keywords: ["osprey", "tempest", "backpack", "hiking", "women's pack"] },

  // NordicTrack
  { brand: "NordicTrack", name: "S22i Studio Bike", category: "Sports & Fitness", emoji: "🚴", sizeSystem: "one-size", keywords: ["nordictrack", "s22i", "studio bike", "exercise bike", "spin bike", "ifit"] },
  { brand: "NordicTrack", name: "T Series Treadmill", category: "Sports & Fitness", emoji: "🏃", sizeSystem: "one-size", keywords: ["nordictrack", "t series", "treadmill", "running", "ifit"] },
  { brand: "NordicTrack", name: "Vault", category: "Sports & Fitness", emoji: "💪", sizeSystem: "one-size", keywords: ["nordictrack", "vault", "home gym", "smart mirror", "strength", "ifit"] },

  // Bowflex
  { brand: "Bowflex", name: "SelectTech Dumbbells", category: "Sports & Fitness", emoji: "🏋️", sizeSystem: "one-size", keywords: ["bowflex", "selecttech", "dumbbells", "adjustable dumbbells", "weights"] },
  { brand: "Bowflex", name: "Max Trainer", category: "Sports & Fitness", emoji: "🏋️", sizeSystem: "one-size", keywords: ["bowflex", "max trainer", "elliptical", "stepper", "hiit"] },
  { brand: "Bowflex", name: "Revolution", category: "Sports & Fitness", emoji: "🏋️", sizeSystem: "one-size", keywords: ["bowflex", "revolution", "home gym", "cable machine", "strength"] },

  // Generic Sports & Fitness
  { name: "Bicycle", category: "Sports & Fitness", emoji: "🚲", sizeSystem: "one-size", keywords: ["bicycle", "bike", "cycling", "road bike", "mountain bike", "hybrid"] },
  { name: "Treadmill", category: "Sports & Fitness", emoji: "🏃", sizeSystem: "one-size", keywords: ["treadmill", "running machine", "cardio", "home gym"] },
  { name: "Dumbbells", category: "Sports & Fitness", emoji: "🏋️", sizeSystem: "one-size", keywords: ["dumbbells", "dumbbell set", "free weights", "weight set"] },
  { name: "Weight Bench", category: "Sports & Fitness", emoji: "🏋️", sizeSystem: "one-size", keywords: ["weight bench", "bench press", "workout bench", "flat bench", "incline bench"] },
  { name: "Yoga Mat", category: "Sports & Fitness", emoji: "🧘", sizeSystem: "one-size", keywords: ["yoga mat", "exercise mat", "fitness mat", "pilates"] },
  { name: "Kayak", category: "Sports & Fitness", emoji: "🛶", sizeSystem: "one-size", keywords: ["kayak", "canoe", "paddling", "water sport", "inflatable kayak"] },
  { name: "Skis", category: "Sports & Fitness", emoji: "⛷️", sizeSystem: "one-size", keywords: ["skis", "skiing", "ski set", "downhill", "cross country", "alpine"] },
  { name: "Snowboard", category: "Sports & Fitness", emoji: "🏂", sizeSystem: "one-size", keywords: ["snowboard", "snowboarding", "board", "bindings", "snow"] },
  { name: "Golf Clubs", category: "Sports & Fitness", emoji: "⛳", sizeSystem: "one-size", keywords: ["golf clubs", "golf set", "irons", "driver", "putter", "golf bag"] },
  { name: "Surfboard", category: "Sports & Fitness", emoji: "🏄", sizeSystem: "one-size", keywords: ["surfboard", "surf", "longboard", "shortboard", "foam board"] },
  { name: "Skateboard", category: "Sports & Fitness", emoji: "🛹", sizeSystem: "one-size", keywords: ["skateboard", "skate", "deck", "cruiser", "longboard"] },
  { name: "Tennis Racket", category: "Sports & Fitness", emoji: "🎾", sizeSystem: "one-size", keywords: ["tennis racket", "tennis racquet", "racket", "wilson", "head", "babolat"] },
  { name: "Elliptical", category: "Sports & Fitness", emoji: "🏋️", sizeSystem: "one-size", keywords: ["elliptical", "elliptical machine", "cross trainer", "cardio"] },
  { name: "Rowing Machine", category: "Sports & Fitness", emoji: "🚣", sizeSystem: "one-size", keywords: ["rowing machine", "rower", "erg", "concept2", "indoor rowing"] },
  { name: "Pull-Up Bar", category: "Sports & Fitness", emoji: "💪", sizeSystem: "one-size", keywords: ["pull-up bar", "pullup bar", "chin up bar", "doorway bar"] },
  { name: "Camping Tent", category: "Sports & Fitness", emoji: "⛺", sizeSystem: "one-size", keywords: ["tent", "camping tent", "backpacking tent", "4 person", "2 person"] },
  { name: "Sleeping Bag", category: "Sports & Fitness", emoji: "🛏️", sizeSystem: "one-size", keywords: ["sleeping bag", "camping", "mummy bag", "down", "synthetic"] },
  { name: "Hiking Backpack", category: "Sports & Fitness", emoji: "🎒", sizeSystem: "one-size", keywords: ["hiking backpack", "backpacking pack", "hiking pack", "trail pack"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // FASHION
  // ═══════════════════════════════════════════════════════════════════════════

  // Nike
  { brand: "Nike", name: "Air Force 1", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["nike", "air force 1", "af1", "forces", "white shoes", "classic", "sneakers"] },
  { brand: "Nike", name: "Air Max 90", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["nike", "air max", "air max 90", "am90", "sneakers", "retro"] },
  { brand: "Nike", name: "Dunk Low", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["nike", "dunk", "dunk low", "dunks", "sneakers", "sb"] },
  { brand: "Nike", name: "Air Jordan 1", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["nike", "jordan", "jordan 1", "jordans", "aj1", "air jordan", "sneakers", "retro"] },
  { brand: "Nike", name: "Metcon", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["nike", "metcon", "training shoe", "crossfit", "gym shoe", "workout"] },

  // Adidas
  { brand: "Adidas", name: "Ultraboost", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["adidas", "ultraboost", "ultra boost", "running", "boost", "sneakers"] },
  { brand: "Adidas", name: "Stan Smith", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["adidas", "stan smith", "stans", "classic", "white sneakers", "tennis"] },
  { brand: "Adidas", name: "Samba OG", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["adidas", "samba", "sambas", "samba og", "classic", "indoor soccer", "retro"] },
  { brand: "Adidas", name: "NMD", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["adidas", "nmd", "r1", "sneakers", "boost", "lifestyle"] },
  { brand: "Adidas", name: "Yeezy Slide", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["adidas", "yeezy", "yeezy slide", "slide", "sandal", "kanye"] },

  // Lululemon
  { brand: "Lululemon", name: "Align Leggings", category: "Fashion", emoji: "👗", sizeSystem: "adult-clothing", keywords: ["lululemon", "lulu", "align", "leggings", "yoga pants", "tights", "nulu"] },
  { brand: "Lululemon", name: "Wunder Train", category: "Fashion", emoji: "👗", sizeSystem: "adult-clothing", keywords: ["lululemon", "lulu", "wunder train", "leggings", "workout", "everlux"] },
  { brand: "Lululemon", name: "Scuba Hoodie", category: "Fashion", emoji: "👗", sizeSystem: "adult-clothing", keywords: ["lululemon", "lulu", "scuba", "hoodie", "oversized", "half zip", "full zip"] },
  { brand: "Lululemon", name: "Everywhere Belt Bag", category: "Fashion", emoji: "👜", sizeSystem: "one-size", keywords: ["lululemon", "lulu", "belt bag", "fanny pack", "everywhere", "crossbody", "ebb"] },
  { brand: "Lululemon", name: "Define Jacket", category: "Fashion", emoji: "👗", sizeSystem: "adult-clothing", keywords: ["lululemon", "lulu", "define", "jacket", "zip up", "luon"] },

  // Patagonia
  { brand: "Patagonia", name: "Better Sweater", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["patagonia", "better sweater", "fleece", "jacket", "quarter zip", "pullover"] },
  { brand: "Patagonia", name: "Nano Puff", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["patagonia", "nano puff", "jacket", "insulated", "puffer", "packable"] },
  { brand: "Patagonia", name: "Torrentshell", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["patagonia", "torrentshell", "rain jacket", "waterproof", "shell"] },
  { brand: "Patagonia", name: "R1 Pullover", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["patagonia", "r1", "pullover", "fleece", "midlayer", "technical"] },
  { brand: "Patagonia", name: "Black Hole Duffel", category: "Fashion", emoji: "👜", sizeSystem: "one-size", keywords: ["patagonia", "black hole", "duffel", "bag", "travel", "gym bag"] },

  // The North Face
  { brand: "The North Face", name: "Nuptse Jacket", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["north face", "tnf", "nuptse", "puffer", "down jacket", "700 fill", "winter"] },
  { brand: "The North Face", name: "Thermoball Eco", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["north face", "tnf", "thermoball", "insulated", "jacket", "eco"] },
  { brand: "The North Face", name: "Osito Fleece", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["north face", "tnf", "osito", "fleece", "jacket", "women's", "soft"] },
  { brand: "The North Face", name: "Jester Backpack", category: "Fashion", emoji: "🎒", sizeSystem: "one-size", keywords: ["north face", "tnf", "jester", "backpack", "school", "daypack"] },
  { brand: "The North Face", name: "Borealis", category: "Fashion", emoji: "🎒", sizeSystem: "one-size", keywords: ["north face", "tnf", "borealis", "backpack", "school", "daypack", "laptop"] },

  // Free People
  { brand: "Free People", name: "FP Movement", category: "Fashion", emoji: "👗", sizeSystem: "adult-clothing", keywords: ["free people", "fp", "fp movement", "activewear", "workout", "athleisure"] },
  { brand: "Free People", name: "We The Free Tee", category: "Fashion", emoji: "👗", sizeSystem: "adult-clothing", keywords: ["free people", "fp", "we the free", "tee", "t-shirt", "oversized"] },

  // Birkenstock
  { brand: "Birkenstock", name: "Arizona", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["birkenstock", "birks", "arizona", "sandal", "slides", "two strap"] },
  { brand: "Birkenstock", name: "Boston Clog", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["birkenstock", "birks", "boston", "clog", "clogs", "suede"] },
  { brand: "Birkenstock", name: "Gizeh", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["birkenstock", "birks", "gizeh", "thong sandal", "flip flop"] },

  // Dr. Martens
  { brand: "Dr. Martens", name: "1460 Boot", category: "Fashion", emoji: "👢", sizeSystem: "adult-shoes", keywords: ["dr martens", "doc martens", "docs", "1460", "boot", "8-eye", "combat boot"] },
  { brand: "Dr. Martens", name: "1461 Oxford", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["dr martens", "doc martens", "docs", "1461", "oxford", "3-eye", "shoe"] },
  { brand: "Dr. Martens", name: "Jadon Platform", category: "Fashion", emoji: "👢", sizeSystem: "adult-shoes", keywords: ["dr martens", "doc martens", "docs", "jadon", "platform", "boot", "chunky"] },

  // Generic Fashion
  { name: "Jeans", category: "Fashion", emoji: "👖", sizeSystem: "adult-clothing", keywords: ["jeans", "denim", "pants", "levis", "skinny", "straight", "wide leg", "bootcut"] },
  { name: "Dress", category: "Fashion", emoji: "👗", sizeSystem: "adult-clothing", keywords: ["dress", "maxi", "midi", "mini", "cocktail", "summer dress", "formal"] },
  { name: "Blazer", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["blazer", "sport coat", "suit jacket", "business", "professional"] },
  { name: "Sneakers", category: "Fashion", emoji: "👟", sizeSystem: "adult-shoes", keywords: ["sneakers", "shoes", "kicks", "trainers", "athletic shoes", "tennis shoes"] },
  { name: "Boots", category: "Fashion", emoji: "👢", sizeSystem: "adult-shoes", keywords: ["boots", "ankle boots", "booties", "combat boots", "chelsea boots", "winter boots"] },
  { name: "Heels", category: "Fashion", emoji: "👠", sizeSystem: "adult-shoes", keywords: ["heels", "high heels", "pumps", "stilettos", "wedges", "block heel"] },
  { name: "Sandals", category: "Fashion", emoji: "👡", sizeSystem: "adult-shoes", keywords: ["sandals", "flip flops", "slides", "strappy", "gladiator", "platform sandal"] },
  { name: "Handbag", category: "Fashion", emoji: "👜", sizeSystem: "one-size", keywords: ["handbag", "purse", "tote", "shoulder bag", "designer bag", "leather bag"] },
  { name: "Crossbody Bag", category: "Fashion", emoji: "👜", sizeSystem: "one-size", keywords: ["crossbody", "cross body", "messenger bag", "sling bag", "small bag"] },
  { name: "Sunglasses", category: "Fashion", emoji: "🕶️", sizeSystem: "one-size", keywords: ["sunglasses", "shades", "ray-ban", "oakley", "aviator", "wayfarer"] },
  { name: "Watch", category: "Fashion", emoji: "⌚", sizeSystem: "one-size", keywords: ["watch", "wristwatch", "timepiece", "analog", "automatic", "mechanical"] },
  { name: "Winter Coat", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["winter coat", "parka", "down coat", "heavy coat", "puffy coat", "warm coat"] },
  { name: "Rain Jacket", category: "Fashion", emoji: "🧥", sizeSystem: "adult-clothing", keywords: ["rain jacket", "raincoat", "waterproof jacket", "shell", "windbreaker"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOLS
  // ═══════════════════════════════════════════════════════════════════════════

  // DeWalt
  { brand: "DeWalt", name: "20V MAX Drill", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["dewalt", "drill", "20v", "cordless drill", "driver", "power tools", "battery", "dcd"] },
  { brand: "DeWalt", name: "Impact Driver", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["dewalt", "impact driver", "20v", "cordless", "power tools", "battery", "dcf"] },
  { brand: "DeWalt", name: "Circular Saw", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["dewalt", "circular saw", "circ saw", "20v", "cordless", "power tools", "battery", "dcs"] },
  { brand: "DeWalt", name: "Miter Saw", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["dewalt", "miter saw", "mitre saw", "chop saw", "compound", "sliding", "dws"] },
  { brand: "DeWalt", name: "Table Saw", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["dewalt", "table saw", "jobsite", "portable", "dwe", "power tools"] },

  // Milwaukee
  { brand: "Milwaukee", name: "M18 FUEL Drill", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["milwaukee", "m18", "fuel", "drill", "cordless drill", "power tools", "battery", "red"] },
  { brand: "Milwaukee", name: "Impact Driver", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["milwaukee", "m18", "impact driver", "cordless", "power tools", "fuel"] },
  { brand: "Milwaukee", name: "Sawzall", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["milwaukee", "sawzall", "reciprocating saw", "recip saw", "m18", "demo"] },
  { brand: "Milwaukee", name: "Packout Tool Box", category: "Tools", emoji: "🧰", sizeSystem: "one-size", keywords: ["milwaukee", "packout", "tool box", "tool storage", "modular", "organizer"] },

  // Makita
  { brand: "Makita", name: "LXT Drill", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["makita", "lxt", "drill", "cordless drill", "18v", "power tools", "battery", "teal"] },
  { brand: "Makita", name: "Impact Driver", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["makita", "lxt", "impact driver", "18v", "cordless", "power tools"] },
  { brand: "Makita", name: "Circular Saw", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["makita", "circular saw", "circ saw", "18v", "cordless", "lxt"] },

  // Ryobi
  { brand: "Ryobi", name: "ONE+ Drill", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["ryobi", "one+", "drill", "cordless drill", "18v", "power tools", "battery", "green"] },
  { brand: "Ryobi", name: "Leaf Blower", category: "Tools", emoji: "🍃", sizeSystem: "one-size", keywords: ["ryobi", "leaf blower", "blower", "one+", "cordless", "40v"] },
  { brand: "Ryobi", name: "Mower", category: "Tools", emoji: "🌿", sizeSystem: "one-size", keywords: ["ryobi", "mower", "lawn mower", "one+", "cordless", "40v", "electric mower"] },

  // Generic Tools
  { name: "Drill", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["drill", "power drill", "cordless drill", "drill driver", "hammer drill"] },
  { name: "Circular Saw", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["circular saw", "circ saw", "skill saw", "cordless saw"] },
  { name: "Miter Saw", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["miter saw", "mitre saw", "chop saw", "compound saw"] },
  { name: "Table Saw", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["table saw", "jobsite saw", "cabinet saw", "contractor saw"] },
  { name: "Impact Driver", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["impact driver", "impact", "cordless impact", "hex driver"] },
  { name: "Sander", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["sander", "orbital sander", "belt sander", "palm sander", "random orbit"] },
  { name: "Router", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["router", "wood router", "plunge router", "trim router", "woodworking"] },
  { name: "Tool Set", category: "Tools", emoji: "🧰", sizeSystem: "one-size", keywords: ["tool set", "tool kit", "hand tools", "socket set", "wrench set"] },
  { name: "Workbench", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["workbench", "work bench", "garage bench", "workshop"] },
  { name: "Ladder", category: "Tools", emoji: "🪜", sizeSystem: "one-size", keywords: ["ladder", "step ladder", "extension ladder", "a-frame", "folding ladder"] },
  { name: "Power Washer", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["power washer", "pressure washer", "electric washer", "psi"] },
  { name: "Generator", category: "Tools", emoji: "⚡", sizeSystem: "one-size", keywords: ["generator", "portable generator", "inverter generator", "backup power"] },
  { name: "Air Compressor", category: "Tools", emoji: "🔧", sizeSystem: "one-size", keywords: ["air compressor", "compressor", "pancake", "portable compressor", "pneumatic"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // GARDEN & PATIO
  // ═══════════════════════════════════════════════════════════════════════════

  // Weber
  { brand: "Weber", name: "Spirit II E-310", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["weber", "spirit", "e-310", "gas grill", "grill", "bbq", "propane", "3 burner"] },
  { brand: "Weber", name: "Genesis", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["weber", "genesis", "gas grill", "grill", "bbq", "propane", "premium"] },
  { brand: "Weber", name: "Smokey Mountain Cooker", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["weber", "smokey mountain", "smoker", "charcoal", "bbq", "wsm"] },
  { brand: "Weber", name: "Kettle Original", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["weber", "kettle", "original", "charcoal grill", "grill", "bbq", "classic"] },

  // Traeger
  { brand: "Traeger", name: "Ironwood", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["traeger", "ironwood", "pellet grill", "smoker", "bbq", "wifi", "smart grill"] },
  { brand: "Traeger", name: "Pro 575", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["traeger", "pro 575", "pellet grill", "smoker", "bbq", "wifi"] },
  { brand: "Traeger", name: "Ranger", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["traeger", "ranger", "portable", "pellet grill", "smoker", "tailgate", "camping"] },

  // EGO
  { brand: "EGO", name: "Power+ Mower", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["ego", "power+", "mower", "lawn mower", "electric", "battery", "cordless", "56v"] },
  { brand: "EGO", name: "Blower", category: "Garden & Patio", emoji: "🍃", sizeSystem: "one-size", keywords: ["ego", "blower", "leaf blower", "electric", "battery", "cordless", "56v"] },
  { brand: "EGO", name: "String Trimmer", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["ego", "string trimmer", "weed whacker", "weed eater", "edger", "56v"] },
  { brand: "EGO", name: "Snow Blower", category: "Garden & Patio", emoji: "❄️", sizeSystem: "one-size", keywords: ["ego", "snow blower", "snowblower", "electric", "battery", "56v", "winter"] },

  // Generic Garden & Patio
  { name: "Lawn Mower", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["lawn mower", "mower", "push mower", "riding mower", "self propelled"] },
  { name: "Grill", category: "Garden & Patio", emoji: "🔥", sizeSystem: "one-size", keywords: ["grill", "bbq", "barbecue", "gas grill", "charcoal grill"] },
  { name: "Smoker", category: "Garden & Patio", emoji: "🔥", sizeSystem: "one-size", keywords: ["smoker", "bbq smoker", "charcoal smoker", "electric smoker", "offset"] },
  { name: "Leaf Blower", category: "Garden & Patio", emoji: "🍃", sizeSystem: "one-size", keywords: ["leaf blower", "blower", "yard cleanup", "cordless blower"] },
  { name: "Chainsaw", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["chainsaw", "chain saw", "tree cutting", "electric chainsaw", "gas chainsaw"] },
  { name: "String Trimmer", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["string trimmer", "weed whacker", "weed eater", "edger", "line trimmer"] },
  { name: "Patio Set", category: "Garden & Patio", emoji: "🪑", sizeSystem: "one-size", keywords: ["patio set", "outdoor furniture", "patio furniture", "dining set", "table and chairs"] },
  { name: "Patio Umbrella", category: "Garden & Patio", emoji: "☂️", sizeSystem: "one-size", keywords: ["patio umbrella", "outdoor umbrella", "sun shade", "market umbrella", "cantilever"] },
  { name: "Fire Pit", category: "Garden & Patio", emoji: "🔥", sizeSystem: "one-size", keywords: ["fire pit", "firepit", "outdoor fire", "solo stove", "propane fire pit"] },
  { name: "Planter", category: "Garden & Patio", emoji: "🌱", sizeSystem: "one-size", keywords: ["planter", "flower pot", "plant pot", "garden planter", "ceramic pot"] },
  { name: "Garden Hose", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["garden hose", "hose", "water hose", "expandable hose", "hose reel"] },
  { name: "Wheelbarrow", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["wheelbarrow", "wheel barrow", "garden cart", "yard cart"] },
  { name: "Raised Garden Bed", category: "Garden & Patio", emoji: "🌱", sizeSystem: "one-size", keywords: ["raised garden bed", "raised bed", "garden box", "planter box", "vegetable garden"] },
  { name: "Outdoor Rug", category: "Garden & Patio", emoji: "🌿", sizeSystem: "one-size", keywords: ["outdoor rug", "patio rug", "all weather rug", "deck rug"] },
  { name: "Adirondack Chair", category: "Garden & Patio", emoji: "🪑", sizeSystem: "one-size", keywords: ["adirondack", "adirondack chair", "outdoor chair", "patio chair", "deck chair", "polywood"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // MUSICAL INSTRUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Fender
  { brand: "Fender", name: "Player Stratocaster", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["fender", "strat", "stratocaster", "electric guitar", "player series", "sss"] },
  { brand: "Fender", name: "Player Telecaster", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["fender", "tele", "telecaster", "electric guitar", "player series"] },
  { brand: "Fender", name: "Frontman Amp", category: "Instruments", emoji: "🔊", sizeSystem: "one-size", keywords: ["fender", "frontman", "amp", "amplifier", "guitar amp", "practice amp"] },
  { brand: "Fender", name: "Precision Bass", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["fender", "p bass", "precision bass", "bass guitar", "bass", "pbass"] },
  { brand: "Fender", name: "Jazz Bass", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["fender", "j bass", "jazz bass", "bass guitar", "bass", "jbass"] },

  // Gibson
  { brand: "Gibson", name: "Les Paul Standard", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["gibson", "les paul", "lp", "standard", "electric guitar", "humbucker"] },
  { brand: "Gibson", name: "SG Standard", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["gibson", "sg", "standard", "electric guitar", "double cutaway"] },
  { brand: "Gibson", name: "J-45 Acoustic", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["gibson", "j-45", "j45", "acoustic guitar", "dreadnought", "acoustic"] },

  // Taylor
  { brand: "Taylor", name: "GS Mini", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["taylor", "gs mini", "acoustic guitar", "travel guitar", "small body", "acoustic"] },
  { brand: "Taylor", name: "214ce", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["taylor", "214ce", "acoustic electric", "grand auditorium", "cutaway", "acoustic"] },
  { brand: "Taylor", name: "Academy 12", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["taylor", "academy", "12", "acoustic guitar", "beginner", "acoustic"] },

  // Yamaha
  { brand: "Yamaha", name: "FG800 Acoustic", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["yamaha", "fg800", "acoustic guitar", "dreadnought", "beginner", "acoustic"] },
  { brand: "Yamaha", name: "P-125 Digital Piano", category: "Instruments", emoji: "🎹", sizeSystem: "one-size", keywords: ["yamaha", "p-125", "p125", "digital piano", "keyboard", "weighted keys", "88 key"] },
  { brand: "Yamaha", name: "HS5 Monitor", category: "Instruments", emoji: "🔊", sizeSystem: "one-size", keywords: ["yamaha", "hs5", "studio monitor", "speaker", "reference monitor", "active monitor"] },
  { brand: "Yamaha", name: "DTX502 E-Drums", category: "Instruments", emoji: "🥁", sizeSystem: "one-size", keywords: ["yamaha", "dtx", "dtx502", "electronic drums", "e-drums", "drum kit", "electric drums"] },

  // Roland
  { brand: "Roland", name: "TD-17 E-Drums", category: "Instruments", emoji: "🥁", sizeSystem: "one-size", keywords: ["roland", "td-17", "td17", "electronic drums", "e-drums", "v-drums", "electric drums"] },
  { brand: "Roland", name: "FP-30X Piano", category: "Instruments", emoji: "🎹", sizeSystem: "one-size", keywords: ["roland", "fp-30x", "fp30x", "digital piano", "portable piano", "weighted", "88 key"] },
  { brand: "Roland", name: "BOSS Katana Amp", category: "Instruments", emoji: "🔊", sizeSystem: "one-size", keywords: ["roland", "boss", "katana", "amp", "amplifier", "guitar amp", "modeling amp"] },
  { brand: "Roland", name: "Juno-DS Synth", category: "Instruments", emoji: "🎹", sizeSystem: "one-size", keywords: ["roland", "juno", "juno-ds", "synthesizer", "synth", "keyboard", "workstation"] },

  // Generic Instruments
  { name: "Acoustic Guitar", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["acoustic guitar", "guitar", "steel string", "nylon string", "classical guitar"] },
  { name: "Electric Guitar", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["electric guitar", "guitar", "solid body", "semi hollow", "humbucker", "single coil"] },
  { name: "Bass Guitar", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["bass guitar", "bass", "electric bass", "4 string", "5 string"] },
  { name: "Keyboard", category: "Instruments", emoji: "🎹", sizeSystem: "one-size", keywords: ["keyboard", "keys", "synthesizer", "midi", "arranger", "workstation"] },
  { name: "Digital Piano", category: "Instruments", emoji: "🎹", sizeSystem: "one-size", keywords: ["digital piano", "electric piano", "stage piano", "weighted keys", "88 key"] },
  { name: "Drum Kit", category: "Instruments", emoji: "🥁", sizeSystem: "one-size", keywords: ["drum kit", "drums", "drum set", "acoustic drums", "snare", "cymbals", "toms"] },
  { name: "Electronic Drums", category: "Instruments", emoji: "🥁", sizeSystem: "one-size", keywords: ["electronic drums", "e-drums", "electric drums", "mesh heads", "drum module"] },
  { name: "Ukulele", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["ukulele", "uke", "soprano", "concert", "tenor", "baritone"] },
  { name: "Violin", category: "Instruments", emoji: "🎻", sizeSystem: "one-size", keywords: ["violin", "fiddle", "strings", "bow", "full size", "4/4", "3/4"] },
  { name: "Amp", category: "Instruments", emoji: "🔊", sizeSystem: "one-size", keywords: ["amp", "amplifier", "guitar amp", "bass amp", "combo amp", "head", "cabinet"] },
  { name: "Guitar Pedals", category: "Instruments", emoji: "🎸", sizeSystem: "one-size", keywords: ["guitar pedals", "effects pedals", "pedal board", "stompbox", "overdrive", "distortion", "delay", "reverb"] },
  { name: "Microphone", category: "Instruments", emoji: "🎤", sizeSystem: "one-size", keywords: ["microphone", "mic", "condenser", "dynamic", "usb mic", "sm58", "sm57", "recording"] },
  { name: "PA Speaker", category: "Instruments", emoji: "🔊", sizeSystem: "one-size", keywords: ["pa speaker", "pa system", "powered speaker", "active speaker", "monitor", "live sound"] },
  { name: "DJ Controller", category: "Instruments", emoji: "🎧", sizeSystem: "one-size", keywords: ["dj controller", "dj", "mixer", "pioneer", "numark", "traktor", "serato"] },
  { name: "Turntable", category: "Instruments", emoji: "🎵", sizeSystem: "one-size", keywords: ["turntable", "record player", "vinyl", "phono", "lp", "audio technica", "technics"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // GAMING
  // ═══════════════════════════════════════════════════════════════════════════

  // Nintendo
  { brand: "Nintendo", name: "Switch OLED", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["nintendo", "switch", "oled", "game console", "handheld", "portable"] },
  { brand: "Nintendo", name: "Switch Lite", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["nintendo", "switch lite", "game console", "handheld", "portable"] },
  { brand: "Nintendo", name: "Pro Controller", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["nintendo", "pro controller", "switch controller", "gamepad", "wireless"] },

  // Sony
  { brand: "Sony", name: "PS5", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["sony", "ps5", "playstation", "playstation 5", "console", "gaming", "disc"] },
  { brand: "Sony", name: "PS5 Digital", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["sony", "ps5", "ps5 digital", "playstation", "playstation 5", "digital edition", "no disc"] },
  { brand: "Sony", name: "DualSense Controller", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["sony", "dualsense", "ps5 controller", "playstation", "gamepad", "wireless"] },
  { brand: "Sony", name: "PSVR2", category: "Gaming", emoji: "🥽", sizeSystem: "model-spec", keywords: ["sony", "psvr2", "psvr", "playstation vr", "virtual reality", "vr headset", "ps5 vr"] },
  { brand: "Sony", name: "PS4 Pro", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["sony", "ps4", "ps4 pro", "playstation 4", "console", "gaming"] },

  // Microsoft
  { brand: "Microsoft", name: "Xbox Series X", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["microsoft", "xbox", "series x", "xsx", "console", "gaming", "4k"] },
  { brand: "Microsoft", name: "Xbox Series S", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["microsoft", "xbox", "series s", "xss", "console", "gaming", "digital"] },
  { brand: "Microsoft", name: "Xbox Controller", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["microsoft", "xbox", "controller", "gamepad", "wireless", "xbox controller"] },

  // Generic Gaming
  { name: "Gaming PC", category: "Gaming", emoji: "🖥️", sizeSystem: "model-spec", keywords: ["gaming pc", "gaming computer", "desktop", "custom pc", "gaming rig", "tower"] },
  { name: "Gaming Monitor", category: "Gaming", emoji: "🖥️", sizeSystem: "model-spec", keywords: ["gaming monitor", "144hz", "240hz", "1440p", "4k", "curved", "ips", "refresh rate"] },
  { name: "Gaming Headset", category: "Gaming", emoji: "🎧", sizeSystem: "model-spec", keywords: ["gaming headset", "headset", "gaming audio", "mic", "wireless headset", "steelseries", "hyperx", "razer"] },
  { name: "Gaming Chair", category: "Gaming", emoji: "🪑", sizeSystem: "model-spec", keywords: ["gaming chair", "gamer chair", "secretlab", "ergonomic", "racing chair"] },
  { name: "VR Headset", category: "Gaming", emoji: "🥽", sizeSystem: "model-spec", keywords: ["vr headset", "virtual reality", "oculus", "meta quest", "quest 3", "vr"] },
  { name: "Retro Console", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["retro console", "retro gaming", "classic", "nes", "snes", "genesis", "n64", "gamecube", "vintage"] },
  { name: "Game Collection", category: "Gaming", emoji: "🎮", sizeSystem: "model-spec", keywords: ["game collection", "games", "video games", "game lot", "game bundle", "used games"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTO & MOTO
  // ═══════════════════════════════════════════════════════════════════════════

  { name: "Car", category: "Auto & Moto", emoji: "🚙", sizeSystem: "model-spec", keywords: ["car", "vehicle", "auto", "sedan", "suv", "truck", "van", "minivan", "used car", "honda", "toyota", "ford", "chevy", "tesla", "bmw", "audi", "mercedes", "lexus", "subaru", "hyundai", "kia"] },
  { name: "Motorcycle", category: "Auto & Moto", emoji: "🏍️", sizeSystem: "model-spec", keywords: ["motorcycle", "motorbike", "bike", "harley", "honda", "yamaha", "kawasaki", "ducati", "cruiser", "sport bike"] },
  { name: "Scooter", category: "Auto & Moto", emoji: "🛵", sizeSystem: "model-spec", keywords: ["scooter", "moped", "vespa", "electric scooter", "kick scooter", "e-scooter"] },
  { name: "E-Bike", category: "Auto & Moto", emoji: "🚲", sizeSystem: "model-spec", keywords: ["e-bike", "ebike", "electric bike", "electric bicycle", "pedal assist", "rad", "aventon", "lectric"] },
  { name: "Roof Rack", category: "Auto & Moto", emoji: "🚙", sizeSystem: "model-spec", keywords: ["roof rack", "cargo rack", "thule", "yakima", "crossbars", "roof bars", "car rack"] },
  { name: "Bike Rack", category: "Auto & Moto", emoji: "🚲", sizeSystem: "model-spec", keywords: ["bike rack", "bicycle rack", "hitch rack", "trunk rack", "thule", "yakima", "kuat"] },
  { name: "Car Cover", category: "Auto & Moto", emoji: "🚙", sizeSystem: "model-spec", keywords: ["car cover", "vehicle cover", "auto cover", "weather protection", "outdoor cover"] },
  { name: "Tire Set", category: "Auto & Moto", emoji: "🚙", sizeSystem: "model-spec", keywords: ["tires", "tire set", "wheels", "rims", "all season", "winter tires", "snow tires", "summer tires"] },
  { name: "Jump Starter", category: "Auto & Moto", emoji: "🔋", sizeSystem: "model-spec", keywords: ["jump starter", "jumper", "battery booster", "portable jump", "car battery", "dead battery"] },
  { name: "Dash Cam", category: "Auto & Moto", emoji: "📷", sizeSystem: "model-spec", keywords: ["dash cam", "dashcam", "car camera", "driving recorder", "viofo", "garmin", "nextbase"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOME DECOR
  // ═══════════════════════════════════════════════════════════════════════════

  { name: "Wall Art", category: "Home Decor", emoji: "🖼️", sizeSystem: "one-size", keywords: ["wall art", "canvas", "print", "painting", "poster", "framed art", "artwork"] },
  { name: "Mirror", category: "Home Decor", emoji: "🪞", sizeSystem: "one-size", keywords: ["mirror", "wall mirror", "floor mirror", "vanity mirror", "full length", "decorative mirror"] },
  { name: "Throw Pillows", category: "Home Decor", emoji: "🛋️", sizeSystem: "one-size", keywords: ["throw pillows", "accent pillows", "decorative pillows", "cushions", "pillow covers"] },
  { name: "Curtains", category: "Home Decor", emoji: "🪟", sizeSystem: "one-size", keywords: ["curtains", "drapes", "window treatments", "blackout curtains", "sheer curtains", "panels"] },
  { name: "Lamp", category: "Home Decor", emoji: "💡", sizeSystem: "one-size", keywords: ["lamp", "table lamp", "floor lamp", "desk lamp", "lighting", "accent light"] },
  { name: "Chandelier", category: "Home Decor", emoji: "💡", sizeSystem: "one-size", keywords: ["chandelier", "pendant light", "hanging light", "ceiling light", "light fixture"] },
  { name: "Vase", category: "Home Decor", emoji: "🏺", sizeSystem: "one-size", keywords: ["vase", "flower vase", "ceramic vase", "glass vase", "decorative vase"] },
  { name: "Picture Frames", category: "Home Decor", emoji: "🖼️", sizeSystem: "one-size", keywords: ["picture frames", "photo frames", "gallery wall", "frame set", "matted frame"] },
  { name: "Candle Holder", category: "Home Decor", emoji: "🕯️", sizeSystem: "one-size", keywords: ["candle holder", "candlestick", "candelabra", "tealight holder", "pillar holder"] },
  { name: "Clock", category: "Home Decor", emoji: "🕐", sizeSystem: "one-size", keywords: ["clock", "wall clock", "mantel clock", "decorative clock", "modern clock"] },
  { name: "Tapestry", category: "Home Decor", emoji: "🖼️", sizeSystem: "one-size", keywords: ["tapestry", "wall hanging", "textile art", "macrame", "woven"] },
  { name: "Area Rug", category: "Home Decor", emoji: "🛋️", sizeSystem: "one-size", keywords: ["area rug", "rug", "carpet", "floor covering", "oriental rug", "modern rug", "shag"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // OFFICE
  // ═══════════════════════════════════════════════════════════════════════════

  // Herman Miller
  { brand: "Herman Miller", name: "Aeron Chair", category: "Office", emoji: "💼", sizeSystem: "one-size", keywords: ["herman miller", "aeron", "office chair", "ergonomic", "mesh", "task chair", "hm"] },
  { brand: "Herman Miller", name: "Embody Chair", category: "Office", emoji: "💼", sizeSystem: "one-size", keywords: ["herman miller", "embody", "office chair", "ergonomic", "gaming", "hm"] },
  { brand: "Herman Miller", name: "Sayl Chair", category: "Office", emoji: "💼", sizeSystem: "one-size", keywords: ["herman miller", "sayl", "office chair", "ergonomic", "design", "hm"] },

  // Steelcase
  { brand: "Steelcase", name: "Leap V2", category: "Office", emoji: "💼", sizeSystem: "one-size", keywords: ["steelcase", "leap", "v2", "office chair", "ergonomic", "task chair"] },
  { brand: "Steelcase", name: "Gesture Chair", category: "Office", emoji: "💼", sizeSystem: "one-size", keywords: ["steelcase", "gesture", "office chair", "ergonomic", "arm support"] },

  // Generic Office
  { name: "Standing Desk", category: "Office", emoji: "💼", sizeSystem: "one-size", keywords: ["standing desk", "sit stand desk", "adjustable desk", "uplift", "flexispot", "jarvis", "electric desk"] },
  { name: "Office Chair", category: "Office", emoji: "💼", sizeSystem: "one-size", keywords: ["office chair", "desk chair", "task chair", "ergonomic chair", "swivel chair"] },
  { name: "Desk Lamp", category: "Office", emoji: "💡", sizeSystem: "one-size", keywords: ["desk lamp", "task light", "led lamp", "reading lamp", "office lamp"] },
  { name: "Filing Cabinet", category: "Office", emoji: "🗄️", sizeSystem: "one-size", keywords: ["filing cabinet", "file cabinet", "drawer", "storage", "lateral file"] },
  { name: "Monitor Arm", category: "Office", emoji: "🖥️", sizeSystem: "one-size", keywords: ["monitor arm", "monitor mount", "vesa mount", "desk mount", "dual monitor", "ergotron"] },
  { name: "Printer", category: "Office", emoji: "🖨️", sizeSystem: "one-size", keywords: ["printer", "laser printer", "inkjet", "all in one", "scanner", "copier", "hp", "brother", "canon"] },
  { name: "Whiteboard", category: "Office", emoji: "📋", sizeSystem: "one-size", keywords: ["whiteboard", "dry erase board", "marker board", "magnetic board", "glass board"] },

  // ═══════════════════════════════════════════════════════════════════════════
  // FREE STUFF
  // ═══════════════════════════════════════════════════════════════════════════

  { name: "Moving Boxes", category: "Free Stuff", emoji: "📦", sizeSystem: "one-size", keywords: ["moving boxes", "cardboard boxes", "boxes", "packing", "free boxes", "shipping boxes"] },
  { name: "Firewood", category: "Free Stuff", emoji: "🪵", sizeSystem: "one-size", keywords: ["firewood", "fire wood", "logs", "kindling", "wood", "free wood"] },
  { name: "Scrap Wood", category: "Free Stuff", emoji: "🪵", sizeSystem: "one-size", keywords: ["scrap wood", "lumber", "plywood", "scrap", "free lumber", "wood scraps"] },
  { name: "Mulch", category: "Free Stuff", emoji: "🌿", sizeSystem: "one-size", keywords: ["mulch", "wood chips", "garden mulch", "landscaping", "free mulch", "compost"] },
  { name: "Free Stuff (Misc)", category: "Free Stuff", emoji: "🆓", sizeSystem: "one-size", keywords: ["free", "free stuff", "curb alert", "curbside", "giveaway", "take it", "must go", "first come"] },
];

// ─── Categories list ─────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  "Clothing",
  "Shoes",
  "Outerwear",
  "Strollers",
  "Car Seats",
  "Gear",
  "Feeding",
  "Toys",
  "Books",
  "Furniture",
  "Sleep",
  "Bath",
  "Safety",
  "Outdoor",
  "Electronics",
  "Home Furniture",
  "Appliances",
  "Sports & Fitness",
  "Fashion",
  "Tools",
  "Garden & Patio",
  "Instruments",
  "Auto & Moto",
  "Home Decor",
  "Office",
  "Gaming",
  "Free Stuff",
];

// ─── Search ──────────────────────────────────────────────────────────────────

export function searchCatalog(query: string): CatalogEntry[] {
  if (!query || query.trim().length === 0) return [];

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  const scored: { entry: CatalogEntry; score: number }[] = [];

  for (const entry of ITEM_CATALOG) {
    const haystack = [
      entry.brand ?? "",
      entry.name,
      ...entry.keywords,
    ]
      .join(" ")
      .toLowerCase();

    let matched = 0;
    for (const term of terms) {
      if (haystack.includes(term)) {
        matched++;
      }
    }

    if (matched === 0) continue;

    // Score: fraction of query terms that matched, with a bonus for matching all terms
    let score = matched / terms.length;
    if (matched === terms.length) score += 1;

    // Bonus for exact brand or name match
    const lowerQuery = query.toLowerCase();
    if (entry.brand && entry.brand.toLowerCase().includes(lowerQuery)) {
      score += 0.5;
    }
    if (entry.name.toLowerCase().includes(lowerQuery)) {
      score += 0.5;
    }

    scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map((s) => s.entry);
}

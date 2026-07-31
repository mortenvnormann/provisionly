#!/usr/bin/env node
/**
 * Merge Phase-1 da/en (+ Nordic) grocery aliases into data/category-aliases.json
 * and write a focused Supabase migration.
 *
 * Run: node scripts/expand-da-en-aliases.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const dataFile = join(root, "data", "category-aliases.json");
const migrationFile = join(
  root,
  "supabase",
  "migrations",
  "20260731120000_expand_da_en_nordic_aliases.sql",
);

function n(alias) {
  return alias.trim().toLowerCase().replace(/\s+/g, " ");
}

function add(map, slug, language, terms) {
  for (const term of terms) {
    const alias = n(term);
    if (!alias) continue;
    const key = `${alias}\0${language}`;
    if (!map.has(key)) {
      map.set(key, { alias, slug, language });
    }
  }
}

/** @type {Map<string, { alias: string, slug: string, language: string }>} */
const additions = new Map();

// --- Danish (priority) ---
add(additions, "dairy", "da", [
  "mælk", "minimælk", "sødmælk", "letmælk", "skummetmælk", "laktoose free mælk", "laktosefri mælk",
  "fløde", "piskefløde", "madlavningsfløde", "creme fraiche", "creme fraîche", "sour cream",
  "yoghurt", "græsk yoghurt", "skyr", "kefir", "kærnemælk", "tykmælk",
  "smør", "saltet smør", "usaltet smør", "margarine", "plantebaseret smør",
  "ost", "cheddar", "mozarella", "mozzarella", "parmesan", "feta", "hytteost", "ricotta",
  "brie", "camembert", "danbo", "havarti", "rygeost", "flødeost", "philadelphia",
  "æg", "æggehvider", "æggeblommer",
]);
add(additions, "produce", "da", [
  "æble", "æbler", "banan", "bananer", "appelsin", "appelsiner", "citron", "citroner", "lime",
  "vindruer", "jordbær", "hindbær", "blåbær", "bær", "pære", "pærer", "blomme", "blommer",
  "fersken", "nektarin", "mango", "ananas", "melon", "vandmelon", "kiwi", "avocado", "avokado",
  "tomat", "tomater", "agurk", "agurker", "salat", "iceberg", "rucola", "spinat", "grønkål",
  "broccoli", "blomkål", "gulerod", "gulerødder", "kartoffel", "kartofler", "søde kartofler",
  "løg", "rødløg", "hvidløg", "porre", "porreer", "peberfrugt", "chili", "squash", "zucchini",
  "aubergine", "champignon", "svampe", "majs", "ærter", "bønner", "grønne bønner", "asparges",
  "selleri", "sellerirod", "persille", "dild", "basilikum", "koriander", "mynte", "ingefær",
  "friske urter", "salatmix", "kål", "hvidkål", "rødkål", "kinakål", "radise", "radiser",
]);
add(additions, "meat_fish", "da", [
  "kylling", "kyllingefileter", "kyllingefilet", "kyllingelår", "kyllingevinger",
  "hakket kylling", "kalkun", "oksekød", "hakket oksekød", "hakkebøf", "bøf", "steak",
  "svinekød", "hakket svinekød", "flæskesteg", "bacon", "skinke", "pølse", "pølser",
  "frankfurter", "hotdogs", "medister", "leverpostej", "paté",
  "laks", "laksefilet", "torsk", "torskefileter", "rødspætte", "fiskefilet", "rejer", "scampi",
  "muslinger", "tun", "tun på dåse", "ansjoser", "sild", "røget laks",
]);
add(additions, "bakery", "da", [
  "brød", "rugbrød", "toastbrød", "franskbrød", "boller", "rundstykker", "ciabatta",
  "focaccia", "bagel", "bagels", "croissant", "wienerbrød", "kage", "muffins", "cookies",
  "kiks", "knækbrød", "tortillas", "pita", "pitabrød", "naan", "hamburgerboller",
  "hotdogbrød", "brownie", "tærte", "butterdej",
]);
add(additions, "frozen", "da", [
  "is", "flødeis", "vaniljeis", "chokoladeis", "sorbet", "ispinde",
  "frosne grøntsager", "frosne bær", "frosne jordbær", "frosne rejer", "fiske pinde", "fiskepinde",
  "ovn fries", "pommes frites", "frossen pizza", "færdigret", "frossen færdigret",
  "frosne kødboller", "frosne burgerbøffer", "frossen spinat", "edamame",
]);
add(additions, "pantry", "da", [
  "ris", "basmatiris", "jasminris", "grød ris", "pasta", "spaghetti", "penne", "fusilli",
  "nudler", "æggenudler", "couscous", "quinoa", "havregryn", "mysli", "müsli", "cornflakes",
  "mel", "hvedemel", "rugmel", "sukker", "flormelis", "brun farin", "honning", "sirup",
  "olie", "olivenolie", "rapsolie", "eddike", "balsamico", "sojasauce", "sojasauce",
  "tomatpuré", "hakkede tomater", "passata", "dåsetomater", "bønner på dåse", "kikærter",
  "linser", "bouillon", "bouillonterning", "salt", "peber", "krydderier", "kanel", "paprika",
  "karry", "spidskommen", "oregano", "timian", "laurbærblade", "bagepulver", "gær",
  "vaniljesukker", "kakao", "chokolade", "mørk chokolade", "nutella", "peanutbutter",
  "marmelade", "syltetøj", "jordbærsyltetøj", "mayonnaise", "ketchup", "sennep", "remoulade",
  "dressing", "pesto", "hummus", "tortillachips",
]);
add(additions, "beverages", "da", [
  "vand", "danskvand", "kildevand", "sodavand", "cola", "fanta", "sprite", "juice",
  "appelsinjuice", "æblejuice", "smoothie", "kaffe", "filterkaffe", "espresso", "kapsler",
  "te", "grøn te", "urte te", "kakao drik", "øl", "vin", "rødvin", "hvidvin", "cider",
  "energidrik", "saftevand", "saft", "mælkedrik", "havredrik", "sojadrik", "mandeldrik",
]);
add(additions, "snacks", "da", [
  "chips", "kartoffelchips", "nachos", "popcorn", "slik", "chokoladebar", "bolcher",
  "tyggegummi", "nødder", "cashewnødder", "mandler", "peanuts", "valnødder", "rosiner",
  "tørret frugt", "proteinbar", "kiks snack", "kiks", "kiks saltede",
]);
add(additions, "household", "da", [
  "toiletpapir", "køkkenrulle", "opvaskemiddel", "opvasketabs", "vaskemiddel", "skyllemiddel",
  "rengøringsmiddel", "allrengøring", "blegevand", "affaldsposer", "fryseposer", "folie",
  "bagepapir", "madpapir", "tandpasta", "tandbørste", "shampoo", "balsam", "sæbe",
  "håndsæbe", "deodorant", "barberskum", "bind", "tamponer", "bleer", "vådservietter",
  "batterier", "stearinlys", "tændstikker", "lyspærer",
]);

// --- English expansion ---
add(additions, "dairy", "en", [
  "semi skimmed milk", "whole milk", "skim milk", "lactose free milk", "oat milk",
  "almond milk", "soy milk", "coconut milk drink", "whipping cream", "single cream",
  "double cream", "sour cream", "creme fraiche", "greek yogurt", "skyr", "quark",
  "cottage cheese", "cream cheese", "butter unsalted", "plant butter", "eggs free range",
]);
add(additions, "produce", "en", [
  "spring onion", "scallions", "sweet potato", "bell pepper", "courgette", "zucchini",
  "aubergine", "eggplant", "rocket", "arugula", "coriander", "cilantro", "fresh herbs",
  "mixed salad", "berry mix", "stone fruit",
]);
add(additions, "meat_fish", "en", [
  "chicken breast", "chicken thighs", "minced chicken", "minced beef", "ground beef",
  "pork mince", "bacon rashers", "smoked salmon", "cod fillets", "prawns", "shrimp",
  "tinned tuna", "canned tuna", "turkey mince",
]);
add(additions, "bakery", "en", [
  "sourdough", "wholemeal bread", "hot dog buns", "burger buns", "pita bread", "naan bread",
  "pastry sheet", "puff pastry", "digestives", "crackers",
]);
add(additions, "pantry", "en", [
  "tinned tomatoes", "chopped tomatoes", "passata", "tomato puree", "chickpeas",
  "black beans", "kidney beans", "stock cube", "bouillon", "caster sugar", "brown sugar",
  "plain flour", "self raising flour", "olive oil extra virgin", "rapeseed oil",
  "soy sauce", "dark chocolate", "peanut butter", "strawberry jam",
]);
add(additions, "beverages", "en", [
  "sparkling water", "still water", "orange juice", "apple juice", "filter coffee",
  "green tea", "herbal tea", "energy drink", "oat drink", "almond drink",
]);
add(additions, "household", "en", [
  "washing up liquid", "dishwasher tablets", "laundry detergent", "fabric softener",
  "bin bags", "freezer bags", "cling film", "baking paper", "kitchen roll", "toilet paper",
]);

// --- Nordic (sv / no / fi) ---
add(additions, "dairy", "sv", [
  "mjölk", "standardmjölk", "lättmjölk", "grädde", "vispgrädde", "crème fraiche",
  "yoghurt", "kvarg", "smör", "ägg", "ost", "fetaost", "keso",
]);
add(additions, "produce", "sv", [
  "äpple", "äpplen", "banan", "apelsin", "citron", "tomat", "gurka", "sallad", "spenat",
  "morot", "morötter", "potatis", "lök", "vitlök", "paprika", "broccoli", "blomkål",
]);
add(additions, "meat_fish", "sv", [
  "kyckling", "nötfärs", "fläskfärs", "bacon", "lax", "torsk", "räkor",
]);
add(additions, "bakery", "sv", ["bröd", "knäckebröd", "bullar", "tortilla"]);
add(additions, "beverages", "sv", ["vatten", "läsk", "juice", "kaffe", "te"]);
add(additions, "household", "sv", ["toalettpapper", "diskmedel", "tvättmedel"]);

add(additions, "dairy", "no", [
  "melk", "lettmelk", "helmelk", "fløte", "rømme", "yoghurt", "smør", "egg", "ost", "cottage cheese",
]);
add(additions, "produce", "no", [
  "eple", "epler", "banan", "appelsin", "sitron", "tomat", "agurk", "salat", "spinat",
  "gulrot", "potet", "løk", "hvitløk", "paprika", "brokkoli", "blomkål",
]);
add(additions, "meat_fish", "no", [
  "kylling", "kjøttdeig", "bacon", "laks", "torsk", "reker",
]);
add(additions, "bakery", "no", ["brød", "knekkebrød", "rundstykker"]);
add(additions, "beverages", "no", ["vann", "brus", "juice", "kaffe", "te"]);
add(additions, "household", "no", ["toalettpapir", "oppvaskmiddel", "vaskemiddel"]);

add(additions, "dairy", "fi", [
  "maito", "kerma", "vispikerma", "jogurtti", "voi", "muna", "juusto", "raehjuusto",
]);
add(additions, "produce", "fi", [
  "omena", "banaani", "appelsiini", "sitruuna", "tomaatti", "kurkku", "salaatti", "pinaatti",
  "porkkana", "peruna", "sipuli", "valkosipuli", "paprika", "broccoli", "kukkakaali",
]);
add(additions, "meat_fish", "fi", [
  "kana", "jauheliha", "pekoni", "lohi", "turska", "katkaravut",
]);
add(additions, "bakery", "fi", ["leipä", "näkkileipä", "sämpylä"]);
add(additions, "beverages", "fi", ["vesi", "limsa", "mehu", "kahvi", "tee"]);
add(additions, "household", "fi", ["wc-paperi", "astianpesuaine", "pyykinpesuaine"]);

const existing = JSON.parse(await readFile(dataFile, "utf8"));
const existingKeys = new Set(
  existing.map((row) => `${n(row.alias)}\0${row.language ?? ""}`),
);

const newRows = [];
for (const [key, row] of additions) {
  if (existingKeys.has(key)) continue;
  existingKeys.add(key);
  newRows.push(row);
  existing.push(row);
}

await writeFile(dataFile, `${JSON.stringify(existing, null, 2)}\n`, "utf8");

function escapeSql(value) {
  return value.replace(/'/g, "''");
}

const bySlug = new Map();
for (const row of newRows) {
  if (!bySlug.has(row.slug)) bySlug.set(row.slug, []);
  bySlug.get(row.slug).push(row);
}

const parts = [
  "-- Expand Danish/English (+ Nordic) category aliases for hybrid categorisation Phase 1.",
  "-- Generated by scripts/expand-da-en-aliases.mjs",
  "",
];

for (const [slug, rows] of bySlug) {
  const values = rows
    .map(
      (row) =>
        `  ('${escapeSql(row.alias)}', (select id from public.categories where slug = '${slug}'), '${row.language}')`,
    )
    .join(",\n");
  parts.push(
    `insert into public.category_aliases (alias_normalized, category_id, language)\nvalues\n${values}\non conflict (alias_normalized, language) do nothing;\n`,
  );
}

await writeFile(migrationFile, `${parts.join("\n")}\n`, "utf8");

console.log(`Added ${newRows.length} aliases (${existing.length} total in JSON)`);
console.log(`Wrote ${migrationFile}`);

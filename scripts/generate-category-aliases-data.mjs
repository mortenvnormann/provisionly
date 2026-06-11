#!/usr/bin/env node
/**
 * One-time generator for data/category-aliases.json (v1.1 dictionary expansion).
 * Run: node scripts/generate-category-aliases-data.mjs
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const LOCALES = ["en", "de", "fr", "nl", "da", "sv", "no", "fi"];
const outFile = join(import.meta.dirname, "..", "data", "category-aliases.json");

function add(entries, slug, terms) {
  for (const [lang, aliases] of Object.entries(terms)) {
    for (const alias of aliases) {
      entries.push({
        alias: alias.trim().toLowerCase().replace(/\s+/g, " "),
        slug,
        language: lang === "null" ? null : lang,
      });
    }
  }
}

const entries = [];

// --- FROZEN (priority) ---
add(entries, "frozen", {
  en: [
    "frozen peas", "frozen corn", "frozen spinach", "frozen broccoli", "frozen cauliflower",
    "frozen green beans", "frozen mixed vegetables", "frozen carrots", "frozen berries",
    "frozen strawberries", "frozen raspberries", "frozen blueberries", "frozen mango",
    "frozen pineapple", "frozen pizza", "frozen lasagne", "frozen fries", "frozen chips",
    "frozen fish fingers", "frozen chicken nuggets", "frozen chicken strips", "frozen prawns",
    "frozen salmon", "frozen cod", "frozen haddock", "frozen mince", "frozen meatballs",
    "frozen burgers", "frozen waffles", "frozen pancakes", "frozen pastry", "frozen pie",
    "frozen ready meal", "frozen dinner", "frozen soup", "frozen garlic bread",
    "ice cream", "vanilla ice cream", "chocolate ice cream", "strawberry ice cream",
    "sorbet", "gelato", "frozen yogurt", "ice lollies", "ice pops", "frozen dessert",
    "frozen fruit", "frozen smoothie mix", "frozen edamame", "frozen hash browns",
    "frozen onion rings", "frozen spring rolls", "frozen dumplings", "frozen gyoza",
    "frozen samosas", "frozen burrito", "frozen quiche", "frozen mac and cheese",
    "frozen shepherd's pie", "frozen cottage pie", "frozen fish pie", "frozen vegetables",
    "frozen chips oven", "frozen roast potatoes", "frozen sweet potato fries",
  ],
  de: [
    "tiefkühl erbsen", "tiefkühlerbsen", "tiefkühl mais", "tiefkühlspinat", "tiefkühlbrokkoli",
    "tiefkühlblumenkohl", "tiefkühlbohnen", "tiefkühlgemüse", "tiefkühlkarotten",
    "tiefkühlbeeren", "tiefkühlerdbeeren", "tiefkühlhimbeeren", "tiefkühlheidelbeeren",
    "tiefkühl mango", "tiefkühl ananas", "tiefkühlpizza", "tiefkühllasagne", "pommes frites tiefkühl",
    "fischstäbchen", "chicken nuggets", "chicken strips", "tiefkühlgarnelen", "tiefkühllachs",
    "tiefkühlkabeljau", "tiefkühlhackfleisch", "tiefkühl frikadellen", "tiefkühl burger",
    "tiefkühlwaffeln", "tiefkühlpfannkuchen", "tiefkühlteig", "tiefkühlkuchen",
    "fertiggericht tiefkühl", "tiefkühlsuppe", "knoblauchbrot tiefkühl", "eis", "vanilleeis",
    "schokoladeneis", "erdbeereis", "sorbet", "gelato", "frozen joghurt", "eis am stiel",
    "tiefkühlobst", "tiefkühl smoothie", "tiefkühl edamame", "rösti tiefkühl",
    "zwiebelringe tiefkühl", "frühlingsrollen tiefkühl", "maultaschen tiefkühl",
    "tiefkühl burrito", "tiefkühl quiche", "tiefkühl mac and cheese", "tiefkühl auflauf",
    "fischauflauf tiefkühl", "tiefkühlkartoffeln", "süßkartoffelpommes tiefkühl",
  ],
  fr: [
    "petits pois surgelés", "maïs surgelé", "épinards surgelés", "brocoli surgelé",
    "chou-fleur surgelé", "haricots verts surgelés", "légumes surgelés", "carottes surgelées",
    "fruits rouges surgelés", "fraises surgelées", "framboises surgelées", "myrtilles surgelées",
    "mangue surgelée", "ananas surgelé", "pizza surgelée", "lasagnes surgelées",
    "frites surgelées", "batonnets de poisson", "nuggets de poulet", "crevettes surgelées",
    "saumon surgelé", "cabillaud surgelé", "viande hachée surgelée", "boulettes surgelées",
    "burgers surgelés", "gaufres surgelées", "crêpes surgelées", "pâtisserie surgelée",
    "tarte surgelée", "plat cuisiné surgelé", "soupe surgelée", "pain à l'ail surgelé",
    "glace", "glace vanille", "glace chocolat", "glace fraise", "sorbet", "gelato",
    "yaourt glacé", "esquimaux", "fruits surgelés", "edamame surgelé", "rösti surgelé",
    "oignons rings surgelés", "nems surgelés", "raviolis surgelés", "burrito surgelé",
    "quiche surgelée", "gratin surgelé", "pommes de terre surgelées",
  ],
  nl: [
    "diepvries erwten", "diepvries maïs", "diepvries spinazie", "diepvries broccoli",
    "diepvries bloemkool", "diepvries sperziebonen", "diepvries groenten", "diepvries wortelen",
    "diepvries bessen", "diepvries aardbeien", "diepvries frambozen", "diepvries bosbessen",
    "diepvries mango", "diepvries ananas", "diepvries pizza", "diepvries lasagne",
    "diepvries friet", "diepvries patat", "vissticks", "kippenuggets", "diepvries garnalen",
    "diepvries zalm", "diepvries kabeljauw", "diepvries gehakt", "diepvries gehaktballen",
    "diepvries burgers", "diepvries wafels", "diepvries pannenkoeken", "diepvries deeg",
    "diepvries taart", "diepvries maaltijd", "diepvries soep", "diepvries knoflookbrood",
    "ijs", "vanille ijs", "chocolade ijs", "aardbeien ijs", "sorbet", "frozen yoghurt",
    "waterijs", "diepvries fruit", "diepvries edamame", "diepvries aardappelen",
    "diepvries uienringen", "diepvries loempia's", "diepvries dumplings", "diepvries burrito",
    "diepvries quiche", "diepvries ovenschotel",
  ],
  da: [
    "frosne ærter", "frosne majs", "frossen spinat", "frossen broccoli", "frossen blomkål",
    "frosne bønner", "frosne grøntsager", "frosne gulerødder", "frosne bær", "frosne jordbær",
    "frosne hindbær", "frosne blåbær", "frossen mango", "frossen ananas", "frossen pizza",
    "frossen lasagne", "frosne pomfritter", "fiskefrikadeller", "kyllingenuggets",
    "frosne rejer", "frossen laks", "frossen torsk", "frossent hakket kød", "frosne frikadeller",
    "frosne burgers", "frosne vafler", "frosne pandekager", "frossen tærte", "frossen ret",
    "frossen suppe", "is", "vaniljeis", "chokoladeis", "jordbæris", "sorbet", "islagkage",
    "frossen frugt", "frosne kartofler", "frosne forårsruller", "frossen quiche",
  ],
  sv: [
    "frysta ärtor", "fryst majs", "fryst spenat", "fryst broccoli", "fryst blomkål",
    "frysta bönor", "frysta grönsaker", "frysta morötter", "frysta bär", "frysta jordgubbar",
    "frysta hallon", "frysta blåbär", "fryst mango", "fryst ananas", "fryst pizza",
    "fryst lasagne", "frysta pommes", "fiskpinnar", "kycklingnuggets", "frysta räkor",
    "fryst lax", "fryst torsk", "fryst färs", "frysta köttbullar", "frysta hamburgare",
    "frysta våfflor", "frysta pannkakor", "fryst paj", "fryst färdigrätt", "fryst soppa",
    "glass", "vaniljglass", "chokladglass", "jordgubbsglass", "sorbet", "fryst frukt",
    "frysta potatis", "frysta vårrullar", "fryst quiche",
  ],
  no: [
    "frosne erter", "frossen mais", "frossen spinat", "frossen brokkoli", "frossen blomkål",
    "frosne bønner", "frosne grønnsaker", "frosne gulrøtter", "frosne bær", "frosne jordbær",
    "frosne bringebær", "frosne blåbær", "frossen mango", "frossen ananas", "frossen pizza",
    "frossen lasagne", "frosne pommes frites", "fiskepinner", "kyllingnuggets", "frosne reker",
    "frossen laks", "frossen torsk", "frossent kjøttdeig", "frosne kjøttboller", "frosne burgere",
    "frosne vafler", "frosne pannekaker", "frossen pai", "frossen ferdigrett", "frossen suppe",
    "iskrem", "vaniljeis", "sjokoladeis", "jordbæris", "sorbet", "frossen frukt",
    "frosne poteter", "frosne vårruller", "frossen quiche",
  ],
  fi: [
    "pakastetut herneet", "pakastemaissi", "pakastespinatti", "pakasteparsakaali",
    "pakastekukkakaali", "pakastejuurekset", "pakastemarjat", "pakastemansikat",
    "pakaste vadelmat", "pakaste mustikat", "pakastemango", "pakasteananas",
    "pakastepizza", "pakastelasagne", "pakasteranskalaiset", "kalapuikot", "kananugetit",
    "pakaste katkaravut", "pakastelohi", "pakasteturska", "pakastejauheliha", "pakastelihapullat",
    "pakastehampurilaiset", "pakastevohvelit", "pakastepannukakut", "pakastepiirakka",
    "pakasteruoka", "pakastikeitto", "jäätelö", "vaniljajäätelö", "suklaa jäätelö",
    "mansikkajäätelö", "sorbetti", "pakastehedelmät", "pakasteperunat", "pakastekevätrullat",
  ],
  null: ["frozen", "tiefkühl", "surgelé", "diepvries", "frost", "fryst", "frossen", "pakaste"],
});

// --- SNACKS (priority) ---
add(entries, "snacks", {
  en: [
    "chips", "crisps", "potato chips", "tortilla chips", "nachos", "popcorn", "pretzels",
    "nuts", "almonds", "peanuts", "cashews", "walnuts", "pistachios", "mixed nuts",
    "trail mix", "chocolate", "milk chocolate", "dark chocolate", "white chocolate",
    "chocolate bar", "candy", "sweets", "gummy bears", "liquorice", "lollipops",
    "cookies", "biscuits", "crackers", "rice cakes", "granola bar", "protein bar",
    "energy bar", "cereal bar", "muesli bar", "fruit snacks", "dried fruit snacks",
    "beef jerky", "snack mix", "cheese puffs", "corn snacks", "pork scratchings",
    "hummus chips", "veggie chips", "kettle chips", "salted peanuts", "roasted peanuts",
    "hazelnuts", "macadamia", "pecans", "sunflower seeds", "pumpkin seeds",
    "marshmallows", "wafer", "wafers", "shortbread", "digestive biscuits",
    "oreos", "ginger snaps", "mini cheddars", "pringles", "doritos", "cheetos",
    "skittles", "m&m's", "haribo", "maltesers", "twix", "snickers", "kit kat",
    "peanut butter cups", "trail mix bar", "fruit leather", "fruit gummies",
  ],
  de: [
    "chips", "kartoffelchips", "tortilla chips", "nachos", "popcorn", "brezeln", "salzbrezeln",
    "nüsse", "mandeln", "erdnüsse", "cashewkerne", "walnüsse", "pistazien", "nussmischung",
    "studentenfutter", "schokolade", "vollmilchschokolade", "zartbitterschokolade",
    "schokoriegel", "süßigkeiten", "gummibärchen", "lakritz", "lutscher", "kekse", "kekse",
    "cracker", "reiswaffeln", "müsliriegel", "proteinriegel", "energieriegel", "fruchtriegel",
    "beef jerky", "snack mix", "flips", "maissnacks", "schweinekrusten", "gemüsechips",
    "gesalzene erdnüsse", "geröstete erdnüsse", "haselnüsse", "macadamia", "pecannüsse",
    "sonnenblumenkerne", "kürbiskerne", "marshmallows", "waffeln", "butterkekse",
    "prinzenrolle", "leibniz", "oreo", "pringles", "haribo", "maltesers", "twix", "snickers",
  ],
  fr: [
    "chips", "chips de pomme de terre", "chips tortilla", "nachos", "pop-corn", "bretzels",
    "noix", "amandes", "cacahuètes", "noix de cajou", "noix de grenoble", "pistaches",
    "mélange de noix", "chocolat", "chocolat au lait", "chocolat noir", "barre chocolatée",
    "bonbons", "oursons gélifiés", "réglisse", "sucettes", "biscuits", "crackers",
    "galettes de riz", "barre céréales", "barre protéinée", "barre énergétique",
    "jerky", "bâtonnets", "cacahuètes salées", "noisettes", "graines de tournesol",
    "graines de courge", "guimauves", "gaufrettes", "sablés", "oreo", "pringles", "haribo",
  ],
  nl: [
    "chips", "aardappelchips", "tortilla chips", "nacho's", "popcorn", "pretzels",
    "noten", "amandelen", "pinda's", "cashewnoten", "walnoten", "pistachenoten", "notenmix",
    "chocolade", "melkchocolade", "pure chocolade", "chocoladereep", "snoep", "winegums",
    "drop", "lolly's", "koekjes", "biscuits", "crackers", "rijstwafels", "mueslireep",
    "proteinereep", "energiereep", "beef jerky", "zoute pinda's", "hazelnoten",
    "zonnebloempitten", "pompoenpitten", "marshmallows", "wafels", "oreo's", "pringles",
    "haribo", "maltesers", "twix", "snickers",
  ],
  da: [
    "chips", "kartoffelchips", "tortilla chips", "nachos", "popcorn", "kridtler", "saltkringler",
    "nødder", "mandler", "peanuts", "cashewnødder", "valnødder", "pistacienødder", "nøddeblanding",
    "chokolade", "mælkechokolade", "mørk chokolade", "chokoladebar", "slik", "vingummi",
    "lakrids", "slikkepinde", "kiks", "crackers", "riskager", "müslibar", "proteinbar",
    "energibar", "saltede peanuts", "hasselnødder", "solsikkekerner", "græskarkerner",
    "skumfiduser", "vafler", "oreo", "pringles", "haribo", "maltesers", "twix", "snickers",
  ],
  sv: [
    "chips", "potatischips", "tortillachips", "nachos", "popcorn", "pretzlar", "kringlor",
    "nötter", "mandlar", "jordnötter", "cashewnötter", "valnötter", "pistagenötter", "nötblandning",
    "choklad", "mjölkchoklad", "mörk choklad", "chokladkaka", "godis", "gelégodis",
    "lakrits", "sugtabletter", "kex", "crackers", "riskakor", "müslibar", "proteinbar",
    "energibar", "saltade jordnötter", "hasselnötter", "solrosfrön", "pumpafrön",
    "marshmallows", "våfflor", "oreo", "pringles", "haribo", "maltesers", "twix", "snickers",
  ],
  no: [
    "chips", "potetgull", "tortillachips", "nachos", "popcorn", "pretzels", "saltkringler",
    "nøtter", "mandler", "peanøtter", "cashewnøtter", "valnøtter", "pistasjnøtter", "nøtteblanding",
    "sjokolade", "melkesjokolade", "mørk sjokolade", "sjokoladeplate", "godteri", "seiggodt",
    "lakris", "sukkerstenger", "kjeks", "crackers", "riskaker", "müslibar", "proteinbar",
    "energibar", "saltede peanøtter", "hasselnøtter", "solsikkefrø", "gresskarfrø",
    "marshmallows", "vafler", "oreo", "pringles", "haribo", "maltesers", "twix", "snickers",
  ],
  fi: [
    "sipsit", "perunasipsit", "tortillasipsit", "nachot", "popcorn", "pretzelit",
    "pähkinät", "mantelit", "maapähkinät", "cashewpähkinät", "saksanpähkinät", "pistaasipähkinät",
    "pähkinäsekoitus", "suklaa", "maitosuklaa", "tumma suklaa", "suklaapatukka", "karkit",
    "karkkimix", "lakritsi", "tikkukarkit", "keksit", "näkkileipä", "riisikakut", "myslipatukka",
    "proteiinipatukka", "energiapatukka", "suolapähkinät", "hasselpähkinät", "auringonkukansiemenet",
    "kurpitsansiemenet", "vaahtokarkit", "vohvelit", "oreo", "pringles", "haribo", "maltesers",
  ],
  null: ["snack", "snacks", "chips", "chocolate", "candy", "popcorn", "nuts"],
});

// --- HOUSEHOLD (priority) ---
add(entries, "household", {
  en: [
    "toilet paper", "kitchen roll", "paper towels", "tissues", "facial tissues",
    "laundry detergent", "washing powder", "washing liquid", "fabric softener",
    "dish soap", "washing up liquid", "dishwasher tablets", "dishwasher salt",
    "rinse aid", "all-purpose cleaner", "bathroom cleaner", "glass cleaner",
    "floor cleaner", "bleach", "disinfectant", "surface wipes", "cleaning wipes",
    "sponges", "scourers", "scrubbing brush", "rubber gloves", "bin bags",
    "trash bags", "food bags", "freezer bags", "cling film", "aluminium foil",
    "baking paper", "parchment paper", "foil trays", "batteries", "aa batteries",
    "aaa batteries", "light bulbs", "led bulbs", "candles", "matches", "lighters",
    "air freshener", "insect spray", "fly spray", "mothballs", "shoe polish",
    "furniture polish", "drain cleaner", "limescale remover", "oven cleaner",
    "toilet cleaner", "toilet brush", "plunger", "mop", "broom", "dustpan",
    "vacuum bags", "laundry basket", "hangers", "clothes pegs", "ironing board cover",
    "stain remover", "colour catcher", "dryer sheets", "lint roller", "zip bags",
    "storage bags", "sandwich bags", "foil", "wrap", "kitchen foil",
  ],
  de: [
    "toilettenpapier", "küchenrolle", "papiertücher", "taschentücher", "waschmittel",
    "waschpulver", "weichspüler", "spülmittel", "geschirrspültabs", "geschirrspülsalz",
    "klarspüler", "allzweckreiniger", "badreiniger", "glasreiniger", "bodenreiniger",
    "bleiche", "desinfektionsmittel", "feuchttücher", "schwämme", "topfreiniger",
    "gummihandschuhe", "müllbeutel", "gefrierbeutel", "frischhaltefolie", "alufolie",
    "backpapier", "aluschalen", "batterien", "aa batterien", "aaa batterien",
    "glühbirnen", "led lampen", "kerzen", "streichhölzer", "feuerzeug", "raumspray",
    "insektenspray", "mottenschutz", "schuhcreme", "möbelpolitur", "rohrreiniger",
    "kalklöser", "ofenreiniger", "wc reiniger", "wc bürste", "pümpel", "wischmopp",
    "besen", "kehrschaufel", "staubsaugerbeutel", "wäschekorb", "kleiderbügel",
    "wäscheklammern", "fleckenentferner", "trocknertücher", "fusselrolle", "zip beutel",
    "brotbeutel", "sandwich beutel",
  ],
  fr: [
    "papier toilette", "essuie-tout", "papier essuie-tout", "mouchoirs", "lessive",
    "lessive liquide", "adoucissant", "liquide vaisselle", "pastilles lave-vaisselle",
    "sel lave-vaisselle", "liquide rinçage", "nettoyant multi-usages", "nettoyant salle de bain",
    "nettoyant vitres", "nettoyant sol", "eau de javel", "désinfectant", "lingettes",
    "éponges", "gants en caoutchouc", "sacs poubelle", "sacs congélation", "film alimentaire",
    "papier aluminium", "papier cuisson", "plaques aluminium", "piles", "piles aa", "piles aaa",
    "ampoules", "ampoules led", "bougies", "allumettes", "briquet", "désodorisant",
    "insecticide", "antimites", "cirage chaussures", "cire meubles", "déboucheur",
    "détartrant", "nettoyant four", "nettoyant wc", "brosse wc", "débouchoir", "serpillière",
    "balai", "pelle", "sacs aspirateur", "panier à linge", "cintres", "pinces à linge",
    "détachant", "lingettes sèche-linge", "rouleau adhésif", "sacs zip",
  ],
  nl: [
    "wc papier", "toiletpapier", "keukenrol", "keukenpapier", "tissues", "zakdoekjes",
    "wasmiddel", "waspoeder", "wasverzachter", "afwasmiddel", "vaatwastabletten",
    "vaatwaszout", "glansspoelmiddel", "allesreiniger", "badkamerreiniger", "glasreiniger",
    "vloerreiniger", "bleek", "desinfectiemiddel", "schoonmaakdoekjes", "sponzen",
    "schuursponsjes", "rubber handschoenen", "vuilniszakken", "afvalzakken", "vrieszakken",
    "vershoudfolie", "aluminiumfolie", "bakpapier", "aluminium schalen", "batterijen",
    "aa batterijen", "aaa batterijen", "lampen", "led lampen", "kaarsen", "lucifers",
    "aansteker", "luchtverfrisser", "insectenspray", "mottenballen", "schoensmeer",
    "meubelpolish", "ontstopper", "kalkaanslag verwijderaar", "ovenreiniger", "wc reiniger",
    "wc borstel", "dweil", "bezem", "stofblik", "stofzuigerzakken", "wasmand",
    "kledinghangers", "wasknijpers", "vlekverwijderaar", "drogerdoekjes", "pluisroller",
    "zipzakken", "boterhamzakjes",
  ],
  da: [
    "toiletpapir", "køkkenrulle", "papirhåndklæder", "lommetørklæder", "vaskemiddel",
    "vaskepulver", "skyllemiddel", "opvaskemiddel", "opvasketabs", "opvaskesalt",
    "afspændingsmiddel", "rengøringsmiddel", "badeværelsesrengøring", "glasrens",
    "gulvrens", "bleach", "desinfektionsmiddel", "rengøringsklude", "svampe",
    "gummihandsker", "affaldsposer", "fryseposer", "plastfolie", "aluminiumfolie",
    "bagepapir", "alufoliebakker", "batterier", "aa batterier", "aaa batterier",
    "pærer", "led pærer", "stearinlys", "tændstikker", "lighter", "luftfrisker",
    "insektmiddel", "mølbolde", "sko polish", "møbelpolish", "afløbsrens",
    "kalkfjerner", "ovnrens", "toiletrens", "toiletbørste", "svupper", "kost",
    "fejebakke", "støvsugerposer", "vasketøjskurv", "bøjler", "klemmer",
    "pletfjerner", "tørreklude", "fnugroller", "lynlåsposer",
  ],
  sv: [
    "toalettpapper", "hushållspapper", "pappershanddukar", "näsdukar", "tvättmedel",
    "tvättpulver", "sköljmedel", "diskmedel", "maskindiskmedel", "maskindisktabletter",
    "diskmaskinsalt", "avspänningsmedel", "allrengöringsmedel", "badrumsrengöring",
    "glasrengöring", "golvrengöring", "blekmedel", "desinfektionsmedel", "rengöringsdukar",
    "svampar", "gummihandskar", "soppåsar", "fryspåsar", "plastfolie", "aluminiumfolie",
    "bakplåtspapper", "aluminiumformar", "batterier", "aa batterier", "aaa batterier",
    "glödlampor", "led lampor", "ljus", "tändstickor", "tändare", "luftfräschare",
    "insektsmedel", "malbollar", "skokräm", "möbelpolish", "avloppsrensare",
    "kalkborttagare", "ugnrengöring", "toalettrengöring", "toalettborste", "mopp",
    "kvast", "sopset", "dammsugarpåsar", "tvättkorg", "galgar", "tvättklämmor",
    "fläckborttagare", "torktumlardukar", "luddroller", "blixtlåspåsar",
  ],
  no: [
    "toalettpapir", "kjøkkenrull", "papirhåndklær", "lommetørklær", "vaskemiddel",
    "vaskepulver", "skyllemiddel", "oppvaskmiddel", "oppvasktabletter", "oppvaskesalt",
    "avspylingsmiddel", "rengjøringsmiddel", "baderomsrengjøring", "glassrens",
    "gulvrens", "blekemiddel", "desinfeksjonsmiddel", "rengjøringskluter", "svamper",
    "gummihansker", "søppelposer", "fryseposer", "plastfolie", "aluminiumsfolie",
    "bakepapir", "aluminiumsformer", "batterier", "aa batterier", "aaa batterier",
    "pærer", "led pærer", "lys", "fyrstikker", "lighter", "luftfrisker",
    "insektmiddel", "møllkuler", "skokrem", "møbelpolish", "avløpsåpner",
    "kalkfjerner", "ovnrens", "toalettrens", "toalettbørste", "mopp", "kost",
    "feiebrett", "støvsugerposer", "skittentøyskurv", "kleshengere", "klesklyper",
    "flekkfjerner", "tørketrommelark", "fnugrull", "glidelåsposer",
  ],
  fi: [
    "wc paperi", "talouspaperi", "nenäliinat", "pesuaine", "pesujauhe", "huuhteluaine",
    "astianpesuaine", "astianpesutabletit", "astianpesusuola", "huuhtelukirkaste",
    "yleispuhdistusaine", "kylpyhuoneen puhdistusaine", "lasinpuhdistusaine",
    "lattianpuhdistusaine", "valkaisuaine", "desinfiointiaine", "siivousliinat",
    "pesusienet", "kumihanskat", "roskapussit", "pakastepussit", "muovikelmu",
    "alumiinifolio", "leivinpaperi", "alumiivuoat", "paristot", "aa paristot",
    "aaa paristot", "lamput", "led lamput", "kynttilät", "tulitikut", "sytytin",
    "ilmanraikastin", "hyönteismyrkky", "koirumot", "kenkävoide", "huonekaluöljy",
    "viemäriavain", "kalkinpoistoaine", "uuninpuhdistusaine", "wc puhdistusaine",
    "wc harja", "moppi", "luuta", "lapiosetti", "pölynimuripussit", "pyykkikori",
    "vaateripustimet", "pyykkipoika", "tahranpoistoaine", "kuivausrumpupyykki",
    "nukkarulla", "zip pussit",
  ],
  null: ["detergent", "bleach", "foil", "batteries", "tissues", "cleaner"],
});

// --- PRODUCE ---
add(entries, "produce", {
  en: [
    "apple", "apples", "banana", "bananas", "orange", "oranges", "lemon", "lemons", "lime",
    "grape", "grapes", "strawberry", "strawberries", "blueberry", "blueberries", "raspberry",
    "raspberries", "blackberry", "blackberries", "cherry", "cherries", "peach", "peaches",
    "pear", "pears", "plum", "plums", "mango", "pineapple", "watermelon", "melon", "kiwi",
    "avocado", "tomato", "tomatoes", "cucumber", "cucumbers", "lettuce", "spinach", "kale",
    "rocket", "arugula", "cabbage", "broccoli", "cauliflower", "carrot", "carrots", "celery",
    "onion", "onions", "red onion", "garlic", "shallot", "leek", "potato", "potatoes",
    "sweet potato", "pepper", "bell pepper", "chilli", "chili", "mushroom", "mushrooms",
    "zucchini", "courgette", "aubergine", "eggplant", "asparagus", "green beans", "peas",
    "corn", "beetroot", "radish", "parsley", "coriander", "cilantro", "basil", "mint",
    "ginger root", "spring onion", "scallion", "fennel", "butternut squash", "pumpkin",
  ],
  de: [
    "apfel", "äpfel", "banane", "bananen", "orange", "orangen", "zitrone", "zitronen", "limette",
    "traube", "trauben", "erdbeere", "erdbeeren", "heidelbeere", "himbeere", "brombeere",
    "kirsche", "kirschen", "pfirsich", "birne", "pflaume", "mango", "ananas", "wassermelone",
    "melone", "kiwi", "avocado", "tomate", "tomaten", "gurke", "gurken", "salat", "spinat",
    "grünkohl", "rucola", "kohl", "brokkoli", "blumenkohl", "karotte", "möhre", "sellerie",
    "zwiebel", "rote zwiebel", "knoblauch", "schalotte", "lauch", "kartoffel", "kartoffeln",
    "süßkartoffel", "paprika", "chili", "pilz", "pilze", "zucchini", "aubergine", "spargel",
    "grüne bohnen", "erbsen", "mais", "rote bete", "rettich", "petersilie", "koriander",
    "basilikum", "minze", "ingwer", "frühlingszwiebel", "fenchel", "butternut kürbis", "kürbis",
  ],
  fr: [
    "pomme", "pommes", "banane", "orange", "citron", "citron vert", "raisin", "fraise",
    "myrtille", "framboise", "mûre", "cerise", "pêche", "poire", "prune", "mangue", "ananas",
    "pastèque", "melon", "kiwi", "avocat", "tomate", "concombre", "laitue", "épinard",
    "chou kale", "roquette", "chou", "brocoli", "chou-fleur", "carotte", "céleri", "oignon",
    "oignon rouge", "ail", "échalote", "poireau", "pomme de terre", "patate douce", "poivron",
    "piment", "champignon", "courgette", "aubergine", "asperge", "haricots verts", "petits pois",
    "maïs", "betterave", "radis", "persil", "coriandre", "basilic", "menthe", "gingembre",
    "ciboule", "fenouil", "courge", "potiron",
  ],
  nl: [
    "appel", "appels", "banaan", "sinaasappel", "citroen", "limoen", "druif", "druiven",
    "aardbei", "aardbeien", "bosbes", "framboos", "braam", "kers", "perzik", "peer", "pruim",
    "mango", "ananas", "watermeloen", "meloen", "kiwi", "avocado", "tomaat", "tomaten",
    "komkommer", "sla", "spinazie", "boerenkool", "rucola", "kool", "broccoli", "bloemkool",
    "wortel", "selderij", "ui", "rode ui", "knoflook", "sjalot", "prei", "aardappel",
    "aardappelen", "zoete aardappel", "paprika", "chili", "champignon", "courgette",
    "aubergine", "asperge", "sperziebonen", "erwten", "maïs", "biet", "radijs", "peterselie",
    "koriander", "basilicum", "munt", "gember", "lente-ui", "venkel", "pompoen",
  ],
  da: [
    "æble", "æbler", "banan", "appelsin", "citron", "lime", "drue", "druer", "jordbær",
    "blåbær", "hindbær", "brombær", "kirsebær", "fersken", "pære", "blomme", "mango",
    "ananas", "vandmelon", "melon", "kiwi", "avocado", "tomat", "tomater", "agurk",
    "salat", "spinat", "grønkål", "rucola", "kål", "broccoli", "blomkål", "gulerod",
    "selleri", "løg", "rødløg", "hvidløg", "skalotteløg", "porre", "kartoffel", "kartofler",
    "søde kartofler", "peberfrugt", "chili", "svamp", "svampe", "zucchini", "aubergine",
    "asparges", "bønner", "ærter", "majs", "rødbede", "radise", "persille", "koriander",
    "basilikum", "mynte", "ingefær", "forårsløg", "fennikel", "græskar",
  ],
  sv: [
    "äpple", "banan", "apelsin", "citron", "lime", "druva", "druvor", "jordgubbe", "jordgubbar",
    "blåbär", "hallon", "björnbär", "körsbär", "persika", "päron", "plommon", "mango",
    "ananas", "vattenmelon", "melon", "kiwi", "avokado", "tomat", "tomater", "gurka",
    "sallad", "spenat", "grönkål", "rucola", "kål", "broccoli", "blomkål", "morot", "morötter",
    "selleri", "lök", "rödlök", "vitlök", "schalottenlök", "purjolök", "potatis", "sötpotatis",
    "paprika", "chili", "svamp", "svampar", "zucchini", "aubergine", "sparris", "bönor",
    "ärtor", "majs", "rödbeta", "rädisa", "persilja", "koriander", "basilika", "mynta",
    "ingefära", "salladslök", "fänkål", "pumpa",
  ],
  no: [
    "eple", "epler", "banan", "appelsin", "sitron", "lime", "drue", "druer", "jordbær",
    "blåbær", "bringebær", "bjørnebær", "kirsebær", "fersken", "pære", "plomme", "mango",
    "ananas", "vannmelon", "melon", "kiwi", "avokado", "tomat", "tomater", "agurk",
    "salat", "spinat", "grønnkål", "ruccola", "kål", "brokkoli", "blomkål", "gulrot", "gulrøtter",
    "selleri", "løk", "rødløk", "hvitløk", "sjalottløk", "purre", "potet", "poteter",
    "søtpotet", "paprika", "chili", "sopp", "sopper", "zucchini", "aubergine", "asparges",
    "bønner", "erter", "mais", "rødbete", "reddik", "persille", "koriander", "basilikum",
    "mynte", "ingefær", "vårløk", "fennikel", "gresskar",
  ],
  fi: [
    "omena", "omenat", "banaani", "appelsiini", "sitruuna", "lime", "viinirypäle", "mansikka",
    "mansikat", "mustikka", "vadelma", "karhunvatukka", "kirsikka", "persikka", "päärynä",
    "luumu", "mango", "ananas", "vesimeloni", "meloni", "kiivi", "avokado", "tomaatti",
    "tomaatit", "kurkku", "salaatti", "pinaatti", "lehtikaali", "ruohosipuli", "kaali",
    "parsakaali", "kukkakaali", "porkkana", "porkkanat", "selleri", "sipuli", "punasipuli",
    "valkosipuli", "salottisipuli", "purjo", "peruna", "perunat", "bataatti", "paprika",
    "chili", "sieni", "sienet", "kesäkurpitsa", "munakoiso", "parsa", "pavut", "herneet",
    "maissi", "punajuuri", "retiisi", "persilja", "koriander", "basilika", "minttu",
    "inkivääri", "sipulinvarsit", "fenkoli", "kurpitsa",
  ],
  null: ["avocado", "mango", "basil", "mint", "ginger"],
});

// --- DAIRY ---
add(entries, "dairy", {
  en: [
    "milk", "semi-skimmed milk", "skimmed milk", "whole milk", "oat milk", "almond milk",
    "soy milk", "cheese", "cheddar", "mozzarella", "parmesan", "feta", "brie", "camembert",
    "cream cheese", "cottage cheese", "ricotta", "goat cheese", "blue cheese", "grated cheese",
    "sliced cheese", "butter", "salted butter", "unsalted butter", "margarine", "yogurt",
    "greek yogurt", "natural yogurt", "fruit yogurt", "cream", "double cream", "single cream",
    "sour cream", "creme fraiche", "whipping cream", "eggs", "egg", "free range eggs",
    "quark", "kefir", "buttermilk", "condensed milk", "evaporated milk",
  ],
  de: [
    "milch", "haltbare milch", "hafermilch", "mandelmilch", "sojamilch", "käse", "cheddar",
    "mozzarella", "parmesan", "feta", "brie", "camembert", "frischkäse", "hüttenkäse", "ricotta",
    "ziegenkäse", "blauschimmelkäse", "geriebener käse", "scheibenkäse", "butter", "margarine",
    "joghurt", "griechischer joghurt", "naturjoghurt", "fruchtjoghurt", "sahne", "schlagsahne",
    "saure sahne", "crème fraîche", "eier", "ei", "freilandeier", "quark", "kefir", "buttermilch",
    "kondensmilch", "kaffeesahne",
  ],
  fr: [
    "lait", "lait demi-écrémé", "lait écrémé", "lait entier", "lait d'avoine", "lait d'amande",
    "lait de soja", "fromage", "cheddar", "mozzarella", "parmesan", "feta", "brie", "camembert",
    "fromage frais", "cottage cheese", "ricotta", "fromage de chèvre", "bleu", "fromage râpé",
    "beurre", "margarine", "yaourt", "yaourt grec", "yaourt nature", "yaourt aux fruits",
    "crème", "crème fraîche", "crème liquide", "crème épaisse", "oeufs", "oeuf", "oeufs bio",
    "fromage blanc", "kéfir", "babeurre", "lait concentré",
  ],
  nl: [
    "melk", "halfvolle melk", "magere melk", "volle melk", "havermelk", "amandelmelk",
    "sojamelk", "kaas", "cheddar", "mozzarella", "parmezaan", "feta", "brie", "camembert",
    "roomkaas", "cottage cheese", "ricotta", "geitenkaas", "blauwe kaas", "geraspte kaas",
    "plakken kaas", "boter", "margarine", "yoghurt", "griekse yoghurt", "natuuryoghurt",
    "vruchtenyoghurt", "room", "slagroom", "zure room", "crème fraîche", "eieren", "ei",
    "scharreleieren", "kwark", "kefir", "karnemelk", "gecondenseerde melk",
  ],
  da: [
    "mælk", "letmælk", "skummetmælk", "sødmælk", "havremælk", "mandelmælk", "sojamælk",
    "ost", "cheddar", "mozzarella", "parmesan", "feta", "brie", "camembert", "flødeost",
    "cottage cheese", "ricotta", "gedeost", "blåskimmelost", "revet ost", "smør", "margarine",
    "yoghurt", "græsk yoghurt", "naturyoghurt", "frugtyoghurt", "fløde", "piskefløde",
    "creme fraiche", "æg", "fritgående æg", "kvark", "kefir", "kærnemælk", "kondenseret mælk",
  ],
  sv: [
    "mjölk", "lättmjölk", "skummjölk", "standardmjölk", "havremjölk", "mandelmjölk", "sojamjölk",
    "ost", "cheddar", "mozzarella", "parmesan", "feta", "brie", "camembert", "färskost",
    "cottage cheese", "ricotta", "getost", "blåmögelost", "riven ost", "smör", "margarin",
    "yoghurt", "grekisk yoghurt", "naturell yoghurt", "fruktyoghurt", "grädde", "vispgrädde",
    "crème fraiche", "ägg", "frigående ägg", "kvarg", "kefir", "kärnmjölk", "kondenserad mjölk",
  ],
  no: [
    "melk", "lettmelk", "skummet melk", "helmelk", "havremelk", "mandelmelk", "soyamelk",
    "ost", "cheddar", "mozzarella", "parmesan", "feta", "brie", "camembert", "kremost",
    "cottage cheese", "ricotta", "geitost", "blåmuggost", "revet ost", "smør", "margarin",
    "yoghurt", "gresk yoghurt", "naturell yoghurt", "fruktyoghurt", "fløte", "kremfløte",
    "creme fraiche", "egg", "frittgående egg", "kvarg", "kefir", "kulturmelk", "kondensert melk",
  ],
  fi: [
    "maito", "kevytmaito", "rasvaton maito", "täysmaito", "kauramaito", "mantelimaito",
    "soijamaito", "juusto", "cheddar", "mozzarella", "parmesaani", "feta", "brie", "camembert",
    "tuorejuusto", "ricotta", "vuohenjuusto", "sinihomejuusto", "raastettu juusto", "voi",
    "margariini", "jugurtti", "kreikkalainen jugurtti", "maustamaton jugurtti", "hedelmäjugurtti",
    "kerma", "vispikerma", "crème fraîche", "kananmunat", "muna", "kvarkki", "kefir",
    "piimä", "sakeutettu maito",
  ],
  null: ["milk", "cheese", "butter", "yogurt", "cream", "eggs"],
});

// --- MEAT & FISH ---
add(entries, "meat_fish", {
  en: [
    "chicken", "chicken breast", "chicken thighs", "chicken wings", "whole chicken",
    "turkey", "duck", "beef", "steak", "sirloin", "ribeye", "mince", "ground beef",
    "beef stew", "roast beef", "pork", "pork chops", "pork belly", "bacon", "ham",
    "sausages", "chorizo", "salami", "lamb", "lamb chops", "lamb mince", "veal",
    "salmon", "smoked salmon", "trout", "cod", "haddock", "tuna", "mackerel", "sardines",
    "prawns", "shrimp", "crab", "mussels", "fish", "fish fillets", "fish fingers",
    "liver", "kidney", "minced meat", "meatballs", "burger patties", "prosciutto",
    "pancetta", "venison", "rabbit",
  ],
  de: [
    "hähnchen", "hähnchenbrust", "hähnchenschenkel", "hähnchenflügel", "ganzes hähnchen",
    "pute", "ente", "rindfleisch", "steak", "rumpsteak", "entrecôte", "hackfleisch",
    "rindergulasch", "braten", "schweinefleisch", "schweinekoteletts", "schweinebauch",
    "speck", "schinken", "würstchen", "wurst", "chorizo", "salami", "lamm", "lammkoteletts",
    "lammhack", "kalbfleisch", "lachs", "räucherlachs", "forelle", "kabeljau", "seehecht",
    "thunfisch", "makrele", "sardinen", "garnelen", "krabben", "miesmuscheln", "fisch",
    "fischfilets", "fischstäbchen", "leber", "nierchen", "frikadellen", "burger patties",
    "prosciutto", "pancetta", "wild", "kaninchen",
  ],
  fr: [
    "poulet", "blanc de poulet", "cuisses de poulet", "ailes de poulet", "poulet entier",
    "dinde", "canard", "boeuf", "steak", "rumsteck", "entrecôte", "viande hachée",
    "boeuf bourguignon", "rôti de boeuf", "porc", "côtelettes de porc", "poitrine de porc",
    "lard", "jambon", "saucisses", "chorizo", "salami", "agneau", "côtelettes d'agneau",
    "veau", "saumon", "saumon fumé", "truite", "cabillaud", "églefin", "thon", "maquereau",
    "sardines", "crevettes", "crabe", "moules", "poisson", "filets de poisson",
    "batonnets de poisson", "foie", "rognons", "boulettes", "steaks hachés", "prosciutto",
    "pancetta", "gibier", "lapin",
  ],
  nl: [
    "kip", "kipfilet", "kippendijen", "kippenvleugels", "hele kip", "kalkoen", "eend",
    "rundvlees", "biefstuk", "runderlappen", "rundergehakt", "stoofvlees", "varkensvlees",
    "varkenskoteletten", "buikspek", "spek", "ham", "worstjes", "worst", "chorizo", "salami",
    "lam", "lamsvlees", "lamsgehakt", "kalfsvlees", "zalm", "gerookte zalm", "forel",
    "kabeljauw", "heek", "tonijn", "makreel", "sardines", "garnalen", "krab", "mosselen",
    "vis", "visfilets", "vissticks", "lever", "nier", "gehaktballen", "hamburgers",
    "prosciutto", "pancetta", "wild", "konijn",
  ],
  da: [
    "kylling", "kyllingebryst", "kyllingelår", "kyllingevinger", "hel kylling", "kalkun",
    "and", "oksekød", "bøf", "entrecote", "hakket oksekød", "oksegullasch", "svinekød",
    "svinekoteletter", "bacon", "skinke", "pølser", "medister", "chorizo", "salami",
    "lam", "lammekoteletter", "hakket lam", "kalvekød", "laks", "røget laks", "ørred",
    "torsk", "kulmule", "tun", "makrel", "sardiner", "rejer", "krabbe", "muslinger",
    "fisk", "fiskefileter", "fiskefrikadeller", "lever", "nyrer", "frikadeller",
    "bøffer", "prosciutto", "pancetta", "vildt", "kanin",
  ],
  sv: [
    "kyckling", "kycklingbröst", "kycklinglår", "kycklingvingar", "hel kyckling", "kalkon",
    "anka", "nötkött", "biff", "entrecote", "nötfärs", "grytbitar", "fläsk", "fläskkotletter",
    "bacon", "skinka", "korv", "korvar", "chorizo", "salami", "lamm", "lammkotletter",
    "lammfärs", "kalvkött", "lax", "rökt lax", "öring", "torsk", "kolja", "tonfisk",
    "makrill", "sardiner", "räkor", "krabba", "musslor", "fisk", "fiskfiléer", "fiskpinnar",
    "lever", "njurar", "köttbullar", "hamburgare", "prosciutto", "pancetta", "vilt", "kanin",
  ],
  no: [
    "kylling", "kyllingbryst", "kyllinglår", "kyllingvinger", "hel kylling", "kalkun",
    "and", "storfekjøtt", "biff", "entrecôte", "kjøttdeig", "oksekjøtt", "svinekjøtt",
    "svinekoteletter", "bacon", "skinke", "pølser", "chorizo", "salami", "lam", "lammekoteletter",
    "lammekjøttdeig", "kalvkjøtt", "laks", "røkt laks", "ørret", "torsk", "hyse", "tunfisk",
    "makrell", "sardiner", "reker", "krabbe", "muslinger", "fisk", "fiskefileter", "fiskepinner",
    "lever", "nyrer", "kjøttboller", "burger", "prosciutto", "pancetta", "vilt", "kanin",
  ],
  fi: [
    "kana", "kananrinta", "kananreidet", "kanansiivet", "kokonainen kana", "kalkkuna",
    "ankka", "naudanliha", "pihvi", "jauheliha", "naudan paisti", "sianliha", "possun kyljykset",
    "pekoni", "kinkku", "makkara", "makkarat", "chorizo", "salami", "lammas", "lammaspihvit",
    "lammasjauheliha", "vasikka", "lohi", "savulohi", "taimen", "turska", "kolja", "tonnikala",
    "makrilli", "sardiinit", "katkaravut", "rapu", "simpukat", "kala", "kalafileet", "kalapuikot",
    "maksa", "munuaiset", "lihapullat", "hampurilaispihvit", "prosciutto", "pancetta",
    "riista", "kani",
  ],
  null: ["bacon", "salmon", "tuna", "sausage", "ham"],
});

// --- BAKERY ---
add(entries, "bakery", {
  en: [
    "bread", "white bread", "brown bread", "wholemeal bread", "sourdough", "baguette",
    "ciabatta", "pita", "naan", "tortilla wrap", "rolls", "buns", "burger buns",
    "hot dog buns", "croissant", "pain au chocolat", "danish pastry", "muffin", "scone",
    "bagel", "donut", "doughnut", "cake", "sponge cake", "cupcake", "pie", "tart",
    "pastry", "puff pastry", "shortcrust pastry", "focaccia", "rye bread", "pumpernickel",
  ],
  de: [
    "brot", "weißbrot", "vollkornbrot", "sauerteigbrot", "baguette", "ciabatta", "pita",
    "naan", "wrap", "brötchen", "semmeln", "burgerbrötchen", "hotdog brötchen", "croissant",
    "schokocroissant", "plunder", "muffin", "scone", "bagel", "donut", "kuchen", "cupcake",
    "torte", "kuchen", "blätterteig", "mürbeteig", "focaccia", "roggenbrot", "pumpernickel",
  ],
  fr: [
    "pain", "pain blanc", "pain complet", "pain de campagne", "baguette", "ciabatta", "pita",
    "naan", "wrap", "petits pains", "brioche", "pain burger", "pain hot dog", "croissant",
    "pain au chocolat", "viennoiserie", "muffin", "scone", "bagel", "beignet", "gâteau",
    "cupcake", "tarte", "pâtisserie", "pâte feuilletée", "pâte brisée", "focaccia",
    "pain de seigle", "pumpernickel",
  ],
  nl: [
    "brood", "wit brood", "bruin brood", "volkorenbrood", "zuurdesem brood", "stokbrood",
    "baguette", "ciabatta", "pita", "naan", "wrap", "bolletjes", "broodjes", "hamburgerbroodjes",
    "hotdog broodjes", "croissant", "chocolade croissant", "deens gebak", "muffin", "scone",
    "bagel", "donut", "taart", "cupcake", "gebak", "bladerdeeg", "boterdeeg", "focaccia",
    "roggebrood", "pumpernickel",
  ],
  da: [
    "brød", "hvidt brød", "fuldkornsbrød", "surdejsbrød", "baguette", "ciabatta", "pita",
    "naan", "wrap", "boller", "rundstykker", "burgerboller", "pølsebrød", "croissant",
    "chokoladecroissant", "wienerbrød", "muffin", "scone", "bagel", "donut", "kage",
    "cupcake", "tærte", "bagværk", "butterdej", "mørdej", "focaccia", "rugbrød", "pumpernickel",
  ],
  sv: [
    "bröd", "vitt bröd", "fullkornsbröd", "surdegsbröd", "baguette", "ciabatta", "pita",
    "naan", "wrap", "frallor", "bullar", "hamburgerbröd", "korvbröd", "croissant",
    "chokladcroissant", "dansk pastry", "muffin", "scone", "bagel", "munk", "kaka",
    "cupcake", "paj", "bakverk", "smördeg", "focaccia", "rågbröd", "pumpernickel",
  ],
  no: [
    "brød", "hvitt brød", "fullkornsbrød", "surdeigsbrød", "baguette", "ciabatta", "pita",
    "naan", "wrap", "rundstykker", "boller", "hamburgerbrød", "pølsebrød", "croissant",
    "sjokoladecroissant", "wienerbrød", "muffin", "scone", "bagel", "smultring", "kake",
    "cupcake", "pai", "bakverk", "smørdeig", "focaccia", "rugbrød", "pumpernickel",
  ],
  fi: [
    "leipä", "valkoinen leipä", "täysjyväleipä", "hapantaikinaleipä", "patonki", "baguette",
    "ciabatta", "pita", "naan", "wrap", "sämpylä", "sämpylät", "hampurilaissämpylä",
    "hot dog sämpylä", "croissant", "suklaacroissant", "muffini", "scone", "bagel", "donitsi",
    "kakku", "cupcake", "piirakka", "leivonnaiset", "voitaikina", "focaccia", "ruisleipä",
    "pumpernickel",
  ],
  null: ["bread", "baguette", "croissant", "bagel"],
});

// --- PANTRY ---
add(entries, "pantry", {
  en: [
    "rice", "basmati rice", "jasmine rice", "brown rice", "pasta", "spaghetti", "penne",
    "fusilli", "lasagne sheets", "noodles", "flour", "plain flour", "self-raising flour",
    "bread flour", "sugar", "caster sugar", "brown sugar", "icing sugar", "salt", "pepper",
    "black pepper", "olive oil", "vegetable oil", "sunflower oil", "coconut oil", "vinegar",
    "balsamic vinegar", "soy sauce", "tomato sauce", "passata", "canned tomatoes", "beans",
    "kidney beans", "chickpeas", "lentils", "couscous", "quinoa", "oats", "porridge oats",
    "cereal", "cornflakes", "honey", "jam", "peanut butter", "nutella", "stock cubes",
    "bouillon", "baking powder", "baking soda", "yeast", "cocoa powder", "vanilla extract",
    "spices", "curry powder", "paprika", "cumin", "oregano", "thyme", "cinnamon",
    "mustard", "ketchup", "mayonnaise", "tinned tuna", "canned corn", "coconut milk",
  ],
  de: [
    "reis", "basmatireis", "jasminreis", "brauner reis", "nudeln", "spaghetti", "penne",
    "fusilli", "lasagneplatten", "mehl", "weizenmehl", "backmehl", "zucker", "brauner zucker",
    "puderzucker", "salz", "pfeffer", "olivenöl", "sonnenblumenöl", "kokosöl", "essig",
    "balsamico", "sojasoße", "tomatensoße", "passata", "dosentomaten", "bohnen",
    "kidneybohnen", "kichererbsen", "linsen", "couscous", "quinoa", "haferflocken", "müsli",
    "cornflakes", "honig", "marmelade", "erdnussbutter", "brühwürfel", "backpulver",
    "natron", "hefe", "kakaopulver", "vanilleextrakt", "gewürze", "currypulver", "paprika",
    "kreuzkümmel", "oregano", "thymian", "zimt", "senf", "ketchup", "mayonnaise",
    "thunfisch dose", "mais dose", "kokosmilch",
  ],
  fr: [
    "riz", "riz basmati", "riz jasmin", "riz complet", "pâtes", "spaghetti", "penne",
    "fusilli", "feuilles de lasagne", "farine", "sucre", "sucre roux", "sucre glace",
    "sel", "poivre", "huile d'olive", "huile de tournesol", "huile de coco", "vinaigre",
    "vinaigre balsamique", "sauce soja", "sauce tomate", "passata", "tomates en conserve",
    "haricots", "haricots rouges", "pois chiches", "lentilles", "couscous", "quinoa",
    "flocons d'avoine", "céréales", "corn flakes", "miel", "confiture", "beurre de cacahuète",
    "cubes de bouillon", "levure chimique", "bicarbonate", "levure", "cacao en poudre",
    "extrait de vanille", "épices", "curry", "paprika", "cumin", "origan", "thym", "cannelle",
    "moutarde", "ketchup", "mayonnaise", "thon en conserve", "maïs en conserve", "lait de coco",
  ],
  nl: [
    "rijst", "basmatirijst", "jasmijnrijst", "zilvervliesrijst", "pasta", "spaghetti", "penne",
    "fusilli", "lasagnebladen", "bloem", "suiker", "bruine suiker", "poedersuiker", "zout",
    "peper", "olijfolie", "zonnebloemolie", "kokosolie", "azijn", "balsamico", "sojasaus",
    "tomatensaus", "passata", "tomaten in blik", "bonen", "kidneybonen", "kikkererwten",
    "linzen", "couscous", "quinoa", "havermout", "ontbijtgranen", "cornflakes", "honing",
    "jam", "pindakaas", "bouillonblokjes", "bakpoeder", "natrium bicarbonaat", "gist",
    "cacaopoeder", "vanille extract", "kruiden", "kerriepoeder", "paprika", "komijn",
    "oregano", "tijm", "kaneel", "mosterd", "ketchup", "mayonaise", "tonijn in blik",
    "mais in blik", "kokosmelk",
  ],
  da: [
    "ris", "basmatiris", "jasminris", "brune ris", "pasta", "spaghetti", "penne", "fusilli",
    "lasagneplader", "mel", "sukker", "brun sukker", "flormelis", "salt", "peber",
    "olivenolie", "solsikkeolie", "kokosolie", "eddike", "balsamico", "sojasauce",
    "tomatsauce", "passata", "hakkede tomater", "bønner", "kidneybønner", "kikærter",
    "linser", "couscous", "quinoa", "havregryn", "morgenmadsprodukter", "cornflakes", "honning",
    "syltetøj", "peanutbutter", "bouillonterninger", "bagepulver", "natron", "gær",
    "kakaopulver", "vaniljeekstrakt", "krydderier", "karry", "paprika", "spidskommen",
    "oregano", "timian", "kanel", "sennep", "ketchup", "mayonnaise", "tonfisk på dåse",
    "majs på dåse", "kokosmælk",
  ],
  sv: [
    "ris", "basmatiris", "jasminris", "brunt ris", "pasta", "spaghetti", "penne", "fusilli",
    "lasagneplattor", "mjöl", "socker", "brunt socker", "florsocker", "salt", "peppar",
    "olivolja", "solrosolja", "kokosolja", "vinäger", "balsamvinäger", "sojasås",
    "tomatsås", "passata", "krossade tomater", "bönor", "kidneybönor", "kikärtor",
    "linser", "couscous", "quinoa", "havregryn", "frukostflingor", "cornflakes", "honung",
    "sylt", "jordnötssmör", "buljongtärningar", "bakpulver", "natron", "jäst", "kakaopulver",
    "vaniljextrakt", "kryddor", "curry", "paprika", "spiskummin", "oregano", "timjan",
    "kanel", "senap", "ketchup", "majonnäs", "tonfisk i burk", "majs i burk", "kokosmjölk",
  ],
  no: [
    "ris", "basmatiris", "jasminris", "brun ris", "pasta", "spaghetti", "penne", "fusilli",
    "lasagneplater", "mel", "sukker", "brunt sukker", "melis", "salt", "pepper",
    "olivenolje", "solsikkeolje", "kokosolje", "eddik", "balsamico", "soyasaus",
    "tomatsaus", "passata", "hermetiske tomater", "bønner", "kidneybønner", "kikerter",
    "linser", "couscous", "quinoa", "havregryn", "frokostblandinger", "cornflakes", "honning",
    "syltetøy", "peanøttsmør", "buljongterninger", "bakepulver", "natron", "gjær", "kakaopulver",
    "vaniljeekstrakt", "krydder", "karri", "paprika", "spisskummen", "oregano", "timian",
    "kanel", "sennep", "ketchup", "majones", "tonfisk på boks", "mais på boks", "kokosmelk",
  ],
  fi: [
    "riisi", "basmatiriisi", "jasmiiniriisi", "täysjyväriisi", "pasta", "spagetti", "penne",
    "fusilli", "lasagnelevyt", "jauho", "sokeri", "ruskea sokeri", "tomusokeri", "suola",
    "pippuri", "oliiviöljy", "auringonkukkaöljy", "kookosöljy", "etikka", "balsamico",
    "soijakastike", "tomattikastike", "passata", "tomaattimurska", "pavut", "kidneypavut",
    "kikherneet", "linssit", "couscous", "quinoa", "kaurahiutaleet", "mysli", "cornflakes",
    "hunaja", "hillo", "maapähkinävoi", "liemikuutiot", "leivinjauhe", "ruokasooda",
    "hiiva", "kaakaojauhe", "vaniljauute", "mausteet", "curry", "paprika", "juustokumina",
    "oregano", "timjami", "kaneli", "sinappi", "ketsuppi", "majoneesi", "tonnikala purkissa",
    "maissi purkissa", "kookosmaito",
  ],
  null: ["rice", "pasta", "flour", "sugar", "salt", "oil", "honey", "oats", "quinoa"],
});

// --- BEVERAGES ---
add(entries, "beverages", {
  en: [
    "water", "sparkling water", "still water", "mineral water", "juice", "orange juice",
    "apple juice", "cranberry juice", "coffee", "ground coffee", "instant coffee", "coffee beans",
    "tea", "green tea", "black tea", "herbal tea", "beer", "lager", "ale", "wine", "red wine",
    "white wine", "rosé", "prosecco", "champagne", "soda", "cola", "lemonade", "tonic water",
    "energy drink", "sports drink", "kombucha", "smoothie", "milkshake", "hot chocolate",
    "cocoa", "cordial", "squash", "ginger ale", "root beer", "iced tea",
  ],
  de: [
    "wasser", "sprudelwasser", "stilles wasser", "mineralwasser", "saft", "orangensaft",
    "apfelsaft", "kaffee", "gemahlener kaffee", "löslicher kaffee", "kaffeebohnen", "tee",
    "grüner tee", "schwarzer tee", "kräutertee", "bier", "lager", "wein", "rotwein",
    "weißwein", "rosé", "prosecco", "sekt", "limonade", "cola", "tonic", "energy drink",
    "sportgetränk", "kombucha", "smoothie", "milchshake", "kakao", "sirup", "ginger ale",
    "eistee",
  ],
  fr: [
    "eau", "eau pétillante", "eau plate", "eau minérale", "jus", "jus d'orange", "jus de pomme",
    "café", "café moulu", "café soluble", "grains de café", "thé", "thé vert", "thé noir",
    "tisane", "bière", "vin", "vin rouge", "vin blanc", "rosé", "prosecco", "champagne",
    "soda", "cola", "limonade", "tonic", "boisson énergisante", "boisson sportive",
    "kombucha", "smoothie", "milkshake", "chocolat chaud", "sirop", "ginger ale", "thé glacé",
  ],
  nl: [
    "water", "bruiswater", "plat water", "mineraalwater", "sap", "sinaasappelsap",
    "appelsap", "koffie", "gemalen koffie", "oploskoffie", "koffiebonen", "thee",
    "groene thee", "zwarte thee", "kruidenthee", "bier", "wijn", "rode wijn", "witte wijn",
    "rosé", "prosecco", "champagne", "frisdrank", "cola", "limonade", "tonic", "energy drink",
    "sportdrank", "kombucha", "smoothie", "milkshake", "warme chocolademelk", "siroop",
    "ginger ale", "ijsthee",
  ],
  da: [
    "vand", "danskvand", "stille vand", "mineralvand", "juice", "appelsinjuice", "æblejuice",
    "kaffe", "formalet kaffe", "instant kaffe", "kaffebønner", "te", "grøn te", "sort te",
    "urtete", "øl", "vin", "rødvin", "hvidvin", "rosé", "prosecco", "champagne", "sodavand",
    "cola", "lemonade", "tonic", "energidrik", "sportdrik", "kombucha", "smoothie",
    "milkshake", "varm chokolade", "saft", "ginger ale", "iste",
  ],
  sv: [
    "vatten", "kolsyrat vatten", "stillavatten", "mineralvatten", "juice", "apelsinjuice",
    "äppeljuice", "kaffe", "malet kaffe", "snabbkaffe", "kaffebönor", "te", "grönt te",
    "svart te", "örtte", "öl", "vin", "rödvin", "vitt vin", "rosé", "prosecco", "champagne",
    "läsk", "cola", "lemonad", "tonic", "energidryck", "sportdryck", "kombucha", "smoothie",
    "milkshake", "varm choklad", "saft", "ginger ale", "iste",
  ],
  no: [
    "vann", "mineralvann", "kullsyrevann", "stillevann", "juice", "appelsinjuice", "eplejuice",
    "kaffe", "malt kaffe", "pulverkaffe", "kaffebønner", "te", "grønn te", "svart te",
    "urtete", "øl", "vin", "rødvin", "hvitvin", "rosé", "prosecco", "champagne", "brus",
    "cola", "limonade", "tonic", "energidrikk", "sportdrikk", "kombucha", "smoothie",
    "milkshake", "varm sjokolade", "saft", "ginger ale", "iste",
  ],
  fi: [
    "vesi", "hiilihapotettu vesi", "juomavesi", "mineraalivesi", "mehu", "appelsiinimehu",
    "omenamehu", "kahvi", "jauhettu kahvi", "pikakahvi", "kahvipavut", "tee", "vihreä tee",
    "musta tee", "yrttitee", "olut", "viini", "punaviini", "valkoviini", "rosé", "prosecco",
    "samppanja", "virvoitusjuoma", "cola", "limonadi", "tonic", "energiajuoma", "urheilujuoma",
    "kombucha", "smoothie", "pirtelö", "kaakao", "mehutiiviste", "ginger ale", "jäätee",
  ],
  null: ["water", "juice", "coffee", "tea", "beer", "wine", "cola"],
});

// --- GENERAL (minimal) ---
add(entries, "general", {
  en: ["miscellaneous", "other", "various", "assorted", "unknown item"],
  de: ["sonstiges", "verschiedenes", "diverses"],
  fr: ["divers", "autre", "autres"],
  nl: ["overig", "diversen", "divers"],
  da: ["diverse", "andet", "øvrigt"],
  sv: ["övrigt", "diverse", "annat"],
  no: ["diverse", "annet", "øvrig"],
  fi: ["muu", "sekalaista", "muut"],
  null: ["misc", "other", "various"],
});

// Deduplicate
const seen = new Set();
const deduped = [];
for (const e of entries) {
  const key = `${e.alias}\0${e.language ?? ""}`;
  if (seen.has(key)) continue;
  seen.add(key);
  deduped.push(e);
}

// Cap per slug (~1400-1600 total); priority categories get higher caps
const CAPS = {
  frozen: 240,
  snacks: 240,
  household: 240,
  produce: 175,
  dairy: 135,
  meat_fish: 155,
  bakery: 95,
  pantry: 155,
  beverages: 115,
  general: 25,
};

function capBySlug(rows) {
  const bySlug = new Map();
  for (const row of rows) {
    if (!bySlug.has(row.slug)) bySlug.set(row.slug, []);
    bySlug.get(row.slug).push(row);
  }

  const capped = [];
  for (const [slug, slugRows] of bySlug) {
    const limit = CAPS[slug] ?? slugRows.length;
    const buckets = new Map();
    for (const row of slugRows) {
      const lang = row.language ?? "null";
      if (!buckets.has(lang)) buckets.set(lang, []);
      buckets.get(lang).push(row);
    }
    const langs = [...buckets.keys()];
    const picked = [];
    let i = 0;
    while (picked.length < limit && langs.some((l) => buckets.get(l).length > 0)) {
      const lang = langs[i % langs.length];
      const bucket = buckets.get(lang);
      if (bucket.length > 0) picked.push(bucket.shift());
      i++;
    }
    capped.push(...picked);
  }
  return capped;
}

const final = capBySlug(deduped);

await writeFile(outFile, JSON.stringify(final, null, 2) + "\n");

const bySlug = {};
for (const e of final) {
  bySlug[e.slug] = (bySlug[e.slug] ?? 0) + 1;
}

console.log(`Wrote ${outFile}`);
console.log(`Total entries: ${final.length}`);
console.log("By slug:", bySlug);

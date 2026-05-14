// Curated ALDI USA product database with nutrition facts.
// Used to ground meal plan generation in real ALDI products and accurate macros.
// Brand key: Kirkwood=poultry, Friendly Farms=dairy, Millville=cereals/oats,
// Simply Nature=organic, Happy Farms=cheese, Northern Catch=canned fish,
// Specially Selected=premium, Season's Choice=frozen veg, L'Oven Fresh=bread

export const ALDI_PRODUCTS = {
  protein: [
    { name: 'Kirkwood Boneless Skinless Chicken Breast', serving: '4 oz (113g)', cal: 110, p: 26, c: 0, f: 2.5 },
    { name: 'Kirkwood Chicken Breast Tenderloins', serving: '3.5 oz (100g)', cal: 100, p: 22, c: 0, f: 1.5 },
    { name: 'Kirkwood 99% Lean Ground Turkey', serving: '4 oz (113g)', cal: 135, p: 24, c: 0, f: 3 },
    { name: 'Kirkwood Never Any! Mild Italian Chicken Sausage', serving: '1 link (85g)', cal: 150, p: 18, c: 4, f: 8 },
    { name: 'Ground Beef 93% Lean (ALDI)', serving: '4 oz (113g)', cal: 172, p: 23, c: 0, f: 8 },
    { name: 'Ground Beef 96% Lean (ALDI)', serving: '4 oz (113g)', cal: 140, p: 24, c: 0, f: 4.5 },
    { name: 'Northern Catch Chunk Light Tuna in Water', serving: '1 can (85g)', cal: 110, p: 25, c: 0, f: 1 },
    { name: 'Specially Selected Sockeye Salmon Fillet', serving: '5 oz (142g)', cal: 298, p: 25, c: 0, f: 22 },
    { name: 'Friendly Farms Large Eggs', serving: '1 large egg', cal: 70, p: 6, c: 0.5, f: 5 },
    { name: 'Friendly Farms Liquid Egg Whites', serving: '3 tbsp (46g)', cal: 25, p: 5.5, c: 0.4, f: 0 },
  ],
  dairy: [
    { name: 'Friendly Farms Nonfat Plain Greek Yogurt', serving: '5.3 oz (150g)', cal: 90, p: 16, c: 6, f: 0 },
    { name: 'Friendly Farms Whole Milk Greek Yogurt', serving: '1/2 cup (113g)', cal: 113, p: 10, c: 5, f: 6 },
    { name: 'Friendly Farms 2% Ultra-Filtered Milk', serving: '1 cup (240ml)', cal: 120, p: 14, c: 7, f: 4.5 },
    { name: 'Friendly Farms 2% Reduced Fat Milk', serving: '1 cup (240ml)', cal: 120, p: 8, c: 12, f: 4.5 },
    { name: 'Friendly Farms Low Fat 2% Cottage Cheese', serving: '1/2 cup', cal: 80, p: 11, c: 5, f: 2 },
    { name: 'Happy Farms Reduced Fat Shredded Cheddar', serving: '1/4 cup (28g)', cal: 90, p: 7, c: 2, f: 6 },
    { name: 'Happy Farms String Cheese', serving: '1 piece (28g)', cal: 80, p: 6, c: 1, f: 6 },
    { name: 'Happy Farms Parmesan Shredded', serving: '1 tbsp (5g)', cal: 20, p: 2, c: 0, f: 1.5 },
  ],
  grains: [
    { name: 'Millville Old Fashioned Rolled Oats', serving: '1/2 cup dry (40g)', cal: 150, p: 5, c: 27, f: 3 },
    { name: 'L\'Oven Fresh 100% Whole Wheat Bread', serving: '1 slice (28g)', cal: 60, p: 3, c: 12, f: 0.5 },
    { name: 'L\'Oven Fresh Fit & Active 35-Cal Whole Wheat Bread', serving: '1 slice (17g)', cal: 35, p: 2, c: 6, f: 0.5 },
    { name: 'Reggano Whole Wheat Penne', serving: '2 oz dry (56g)', cal: 200, p: 7, c: 40, f: 1.5 },
    { name: 'Reggano Spaghetti', serving: '2 oz dry (56g)', cal: 200, p: 7, c: 40, f: 1.5 },
    { name: 'Simply Nature Brown Rice & Quinoa Penne', serving: '2 oz dry (56g)', cal: 210, p: 8, c: 37, f: 3 },
    { name: 'Season\'s Choice Steamable Brown Rice', serving: '1 cup cooked (195g)', cal: 216, p: 5, c: 45, f: 1.8 },
    { name: 'Rice cakes (ALDI lightly salted)', serving: '1 cake', cal: 35, p: 1, c: 7, f: 0 },
  ],
  pantry: [
    { name: 'Simply Nature Organic Creamy Almond Butter', serving: '2 tbsp (32g)', cal: 190, p: 7, c: 6, f: 17 },
    { name: 'Simply Nature Organic Creamy Peanut Butter', serving: '2 tbsp (32g)', cal: 190, p: 8, c: 7, f: 16 },
    { name: 'Millville Elevation Vanilla Whey Protein Powder', serving: '1 scoop (37g)', cal: 170, p: 30, c: 8, f: 2.5 },
    { name: 'Simply Nature Canned Black Beans', serving: '1/2 cup', cal: 110, p: 7, c: 20, f: 0 },
    { name: 'Simply Nature Canned Chickpeas', serving: '1/2 cup', cal: 135, p: 7, c: 22, f: 2 },
  ],
  produce: [
    { name: 'Banana', serving: '1 medium (118g)', cal: 105, p: 1.3, c: 27, f: 0.4 },
    { name: 'Blueberries (ALDI fresh/frozen)', serving: '1/2 cup (75g)', cal: 43, p: 0.6, c: 11, f: 0.2 },
    { name: 'Strawberries (ALDI fresh)', serving: '1 cup (152g)', cal: 49, p: 1, c: 12, f: 0.5 },
    { name: 'Apple (ALDI Gala)', serving: '1 medium (182g)', cal: 95, p: 0.5, c: 25, f: 0.3 },
    { name: 'Season\'s Choice Frozen Broccoli Florets', serving: '1 cup (91g)', cal: 30, p: 3, c: 6, f: 0 },
    { name: 'Season\'s Choice Frozen Spinach', serving: '1/2 cup cooked (95g)', cal: 30, p: 4, c: 3, f: 0 },
    { name: 'Season\'s Choice Frozen Steamable Mixed Veg', serving: '1/2 cup (85g)', cal: 50, p: 2, c: 10, f: 0 },
    { name: 'Baby spinach (ALDI fresh)', serving: '2 cups (60g)', cal: 14, p: 1.8, c: 2.2, f: 0.2 },
    { name: 'Sweet potato (ALDI)', serving: '1 medium (130g)', cal: 112, p: 2, c: 26, f: 0.1 },
  ],
}

// Flat list for prompt injection — returns a formatted string by category
export function formatProductsForPrompt() {
  const lines = []

  lines.push('=== ALDI PRODUCTS TO USE (use these specific brand names and macros) ===')

  lines.push('\nPROTEINS:')
  ALDI_PRODUCTS.protein.forEach(p =>
    lines.push(`  • ${p.name} | ${p.serving} = ${p.cal} cal, ${p.p}g P, ${p.c}g C, ${p.f}g F`)
  )

  lines.push('\nDAIRY:')
  ALDI_PRODUCTS.dairy.forEach(p =>
    lines.push(`  • ${p.name} | ${p.serving} = ${p.cal} cal, ${p.p}g P, ${p.c}g C, ${p.f}g F`)
  )

  lines.push('\nGRAINS & CARBS:')
  ALDI_PRODUCTS.grains.forEach(p =>
    lines.push(`  • ${p.name} | ${p.serving} = ${p.cal} cal, ${p.p}g P, ${p.c}g C, ${p.f}g F`)
  )

  lines.push('\nPANTRY:')
  ALDI_PRODUCTS.pantry.forEach(p =>
    lines.push(`  • ${p.name} | ${p.serving} = ${p.cal} cal, ${p.p}g P, ${p.c}g C, ${p.f}g F`)
  )

  lines.push('\nPRODUCE:')
  ALDI_PRODUCTS.produce.forEach(p =>
    lines.push(`  • ${p.name} | ${p.serving} = ${p.cal} cal, ${p.p}g P, ${p.c}g C, ${p.f}g F`)
  )

  lines.push('\n=== END ALDI PRODUCTS ===')

  return lines.join('\n')
}

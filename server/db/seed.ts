import { seedAlaCarta } from './seeds/alaCarta'
import { seedAyceMenu } from './seeds/ayceMenu'
import { seedBranches } from './seeds/branches'
import { seedDesserts } from './seeds/desserts'
import { seedDrinkGroups } from './seeds/drinkGroups'
import { seedDrinkSubGroups } from './seeds/drinkSubGroups'
import { seedDrinks } from './seeds/drinks'
import { seedExpressMenu } from './seeds/expressMenu'
import { seedKidsMenu } from './seeds/kidsMenu'
import { seedMenuCategories } from './seeds/menuCategories'
import { seedMenuItemOptions } from './seeds/menuItemOptions'

async function main() {
  console.log('▶ Running all seeds…\n')

  await seedBranches()
  await seedMenuCategories()
  await seedDrinkGroups()
  await seedDrinkSubGroups()
  await seedDrinks()
  await seedExpressMenu()
  await seedAyceMenu()
  await seedDesserts()
  await seedKidsMenu()
  await seedAlaCarta()
  // Depends on both seedDrinks() (Vaso Sumo) and seedAlaCarta() (Ramen XL)
  // having already inserted the menu_items rows it attaches option groups to.
  await seedMenuItemOptions()

  console.log('\n✓ All seeds complete')
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

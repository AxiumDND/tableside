import type { MutableRefObject } from 'react'
import {
  applyShopInventory,
  applyShopStock,
  generateShopInventory,
  shopTypeFromMarkdown
} from '../../../shared/shopStock'
import { applyShopStanding, type ShopStanding } from '../../../shared/shopStanding'
import { matchStockArt } from '../../../shared/stockArt'
import type { ShopStockOffer } from '../../../shared/shopCatalogs'

export interface ShopStockActions {
  rerollShopStock: () => Promise<void>
  changeShopStock: (stock: ShopStockOffer[]) => Promise<void>
  changeShopStanding: (standing: ShopStanding) => Promise<void>
}

/**
 * Shop-note inventory actions: reroll the generated stock, replace the offered
 * stock, and set the party's standing. All persist through the injected
 * `persistMarkdown` (the note's own save path).
 */
export function useShopStock({
  path,
  markdownRef,
  persistMarkdown
}: {
  path: string
  markdownRef: MutableRefObject<string>
  persistMarkdown: (next: string) => Promise<void>
}): ShopStockActions {
  async function rerollShopStock(): Promise<void> {
    if (!path) return
    const stem = (path.split('/').pop() ?? '').replace(/\.md$/i, '')
    const type = shopTypeFromMarkdown(markdownRef.current) || matchStockArt(stem, 'shop')?.id || 'General Store'
    await persistMarkdown(applyShopInventory(markdownRef.current, generateShopInventory(type)))
  }

  async function changeShopStock(stock: ShopStockOffer[]): Promise<void> {
    await persistMarkdown(applyShopStock(markdownRef.current, stock))
  }

  async function changeShopStanding(standing: ShopStanding): Promise<void> {
    await persistMarkdown(applyShopStanding(markdownRef.current, standing))
  }

  return { rerollShopStock, changeShopStock, changeShopStanding }
}

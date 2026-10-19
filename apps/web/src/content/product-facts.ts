import { PUBLIC_PRODUCT_CATALOG } from "../../../../packages/core/src/marketing/public-catalog"

export const productFacts = PUBLIC_PRODUCT_CATALOG
export const providerNames = productFacts.providers.map((provider) => provider.name)
export const providerCount = productFacts.providers.length

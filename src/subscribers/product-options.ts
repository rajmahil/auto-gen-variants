import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

export default async function handleProductOptionsChange({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query");
  const productModuleService = container.resolve(Modules.PRODUCT);

  const { data: productOption } = await query.graph({
    entity: "product_option",
    fields: ["*", "product.*"],
    filters: {
      id: data.id,
    },
  });

  if (!productOption?.length) {
    return;
  }

  const productId = productOption[0]?.product?.id;

  if (!productId) {
    return;
  }

  await productModuleService.updateProducts(productId, {
    metadata: {
      dismiss_variant_generation: "false",
    },
  });

  console.log(`Product ${productId} was updated in the subscriber`);
}

export const config: SubscriberConfig = {
  event: ["product-option.created", "product-option.updated"],
};

import { useMemo } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import {
  DataGrid,
  createDataGridHelper,
  createDataGridPriceColumns,
} from "../../data-grid";
import { HttpTypes } from "@medusajs/framework/types";
import { sdk } from "../../lib/sdk";
import { useQuery } from "@tanstack/react-query";

type ProductCreateSchemaType = any;

type VariantPricingFormProps = {
  form: UseFormReturn<ProductCreateSchemaType>;
};

const ProductVariantPrice = ({ form }: VariantPricingFormProps) => {
  const { data: currencies } = useQuery({
    queryKey: ["store"],
    queryFn: async () => {
      return await sdk.admin.store.list().then(({ stores }) => {
        return stores[0].supported_currencies;
      });
    },
  });

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await sdk.admin.region.list({ limit: 9999 });
      return response.regions;
    },
  });

  const { data: pricePreferences } = useQuery({
    queryKey: ["price-preferences"],
    queryFn: async () => {
      const response = await sdk.admin.pricePreference.list();
      return response.price_preferences;
    },
  });

  const variants = useWatch({
    control: form.control,
    name: "variants",
  }) as any;

  const columns = useVariantPriceGridColumns({
    variants,
    currencies,
    regions,
    pricePreferences,
  });

  return (
    <DataGrid
      columns={columns}
      data={variants}
      state={form}
      onEditingChange={(editing) => {}}
    />
  );
};
const columnHelper = createDataGridHelper<
  HttpTypes.AdminProductVariant,
  ProductCreateSchemaType
>();

const useVariantPriceGridColumns = ({
  variants = [],
  currencies = [],
  regions = [],
  pricePreferences = [],
}: {
  variants: HttpTypes.AdminProductVariant[];
  currencies?: HttpTypes.AdminStore["supported_currencies"];
  regions?: HttpTypes.AdminRegion[];
  pricePreferences?: HttpTypes.AdminPricePreference[];
}) => {
  return useMemo(() => {
    return [
      columnHelper.column({
        id: "Title",
        header: "Title",
        cell: (context) => {
          const entity = context.row.original;
          return (
            <DataGrid.ReadonlyCell context={context}>
              <div className="flex h-full w-full items-center gap-x-2 overflow-hidden">
                <span className="truncate">{entity.title}</span>
              </div>
            </DataGrid.ReadonlyCell>
          );
        },
        disableHiding: true,
      }),

      ...createDataGridPriceColumns<
        HttpTypes.AdminProductVariant,
        ProductCreateSchemaType
      >({
        currencies: currencies.map((c) => c.currency_code),
        regions,
        pricePreferences,
        getFieldName: (context, value) => {
          if (context.column.id?.startsWith("currency_prices")) {
            return `variants.${context.row.index}.prices.${value}`;
          }
          return `variants.${context.row.index}.prices.${value}`;
        },
        t: (key: any) => key,
      }),
    ];
  }, [currencies, regions, pricePreferences]);
};

export default ProductVariantPrice;

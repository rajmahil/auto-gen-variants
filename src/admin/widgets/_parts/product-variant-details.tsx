import { useMemo } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { DataGrid, createDataGridHelper } from "../../data-grid";
import { HttpTypes } from "@medusajs/framework/types";
import { useTranslation } from "react-i18next";
import { DataGridTextCell } from "../../data-grid/components";

type ProductCreateSchemaType = any;

type VariantInventoryFormProps = {
  form: UseFormReturn<ProductCreateSchemaType>;
};

const ProductVariantInventory = ({ form }: VariantInventoryFormProps) => {
  const columns = useVariantInventoryGridColumns();

  const variants = useWatch({
    control: form.control,
    name: "variants",
  }) as HttpTypes.AdminProductVariant[];

  console.log("variants", variants);

  return (
    <DataGrid
      columns={columns}
      data={variants}
      state={form}
      onEditingChange={() => {}}
    />
  );
};

const columnHelper = createDataGridHelper<
  HttpTypes.AdminProductVariant,
  ProductCreateSchemaType
>();

const useVariantInventoryGridColumns = () => {
  const { t } = useTranslation();

  return useMemo(() => {
    return [
      columnHelper.column({
        id: t("fields.title"),
        header: t("fields.title"),
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

      // SKU (text)
      columnHelper.column({
        id: "sku", // must match field name
        header: "SKU",
        field: (context) => `variants.${context.row.index}.sku`,
        type: "text",
        cell: (context) => <DataGridTextCell context={context} />,
        disableHiding: true,
      }),

      // Manage inventory (boolean)
      columnHelper.column({
        id: "manage_inventory",
        name: t("fields.managedInventory"),
        header: t("fields.managedInventory"),
        field: (context) => `variants.${context.row.index}.manage_inventory`,
        type: "boolean",
        cell: (context) => {
          return <DataGrid.BooleanCell context={context} />;
        },
      }),
      //   // Allow backorders (boolean)
      columnHelper.column({
        id: "allow_backorder",
        name: t("fields.allowBackorder"),
        header: t("fields.allowBackorder"),
        field: (context) => `variants.${context.row.index}.allow_backorder`,
        type: "boolean",
        cell: (context) => {
          return <DataGrid.BooleanCell context={context} />;
        },
      }),
    ];
  }, [t]);
};

export default ProductVariantInventory;

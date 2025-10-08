import { useMemo, useState, useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRevalidator } from "react-router-dom";

import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  AdminCreateProductVariant,
  AdminProduct,
  DetailWidgetProps,
} from "@medusajs/framework/types";

import {
  Badge,
  Button,
  Container,
  DataTable,
  DataTableRowSelectionState,
  FocusModal,
  Heading,
  ProgressTabs,
  Text,
  createDataTableColumnHelper,
  toast,
  useDataTable,
  usePrompt,
} from "@medusajs/ui";
import { Loader } from "@medusajs/icons";

import { sdk } from "../lib/sdk";
import { castNumber } from "../utils/case-number";
import ProductVariantDetails from "./_parts/product-variant-details";
import ProductVariantPrice from "./_parts/product-variant-price";

/* ------------------------------------------------------------------ */
/* Constants & Types                                                   */
/* ------------------------------------------------------------------ */

const LIMIT = 15 as const;

type VariantDraftOption = {
  option_id: string;
  option_value_id?: string;
  name: string;
  value: string;
};

type VariantDraft = {
  id: string; // local client id/slug for the draft row
  title: string; // "Green / M"
  sku: string | null;
  options: VariantDraftOption[];
  optionByTitle: Record<string, string>;
  combinationKey: string;
};

/* ------------------------------------------------------------------ */
/* Schema                                                              */
/* ------------------------------------------------------------------ */

const UpdateVariantPricesSchema = z.object({
  variants: z.array(
    z.object({
      title: z.string(),
      sku: z.string().nullable(),
      allow_backorder: z.boolean().optional(),
      manage_inventory: z.boolean().optional(),
      prices: z
        .record(z.string(), z.string().or(z.number()).optional())
        .optional(),
    })
  ),
});
type UpdateVariantPricesSchemaType = z.infer<typeof UpdateVariantPricesSchema>;

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

/** Build draft rows for combinations that don't yet exist on the product. */
const getVariantsToCreate = (
  product: AdminProduct | undefined
): VariantDraft[] => {
  if (!product) return [];

  const options = product.options ?? [];
  const optionValues = options.map((o) => o.values ?? []);

  // Nothing to do if no options, or an option has zero values
  if (
    !options.length ||
    optionValues.some((vals) => (vals?.length ?? 0) === 0)
  ) {
    return [];
  }

  const existingVariants = product.variants ?? [];

  // Serialize existing combinations in the same order as product.options
  const existingVariantCombinations = new Set(
    existingVariants.map((variant) =>
      options
        .map(
          (opt) => variant.options?.find((vo) => vo.option_id === opt.id)?.value
        )
        .filter(Boolean)
        .join("|")
    )
  );

  // Cartesian product of option values
  const allCombinations: string[][] = [];
  const walk = (current: string[], depth: number) => {
    if (depth === optionValues.length) {
      allCombinations.push([...current]);
      return;
    }
    for (const v of optionValues[depth]) {
      if (v?.value) {
        current.push(v.value);
        walk(current, depth + 1);
        current.pop();
      }
    }
  };
  walk([], 0);

  // Filter out combos we already have
  const missing = allCombinations
    .map((combo) => combo.join("|"))
    .filter((k) => !existingVariantCombinations.has(k))
    .map((k) => k.split("|"));

  // Build UI + payload shape
  return missing.map((values) => {
    const optionEntries = values.map((value, idx) => {
      const opt = product.options?.[idx];
      const val = opt?.values?.find((vv) => vv.value === value);
      return {
        option_id: opt?.id as string,
        option_value_id: val?.id,
        name: opt?.title || "",
        value,
      };
    });

    const optionByTitle = Object.fromEntries(
      optionEntries.map((e) => [e.name, e.value])
    );
    const combinationKey = optionEntries
      .map((e) => `${e.name}:${e.value}`)
      .join("|");
    const id = values.join("-").toLowerCase().replace(/\s+/g, "-");

    return {
      id,
      title: values.join(" / "),
      sku: null,
      options: optionEntries,
      optionByTitle,
      combinationKey,
    } satisfies VariantDraft;
  });
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

const AutoGenerateVariants = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const dialog = usePrompt();
  const queryClient = useQueryClient();
  const { revalidate } = useRevalidator();

  const [step, setStep] = useState<string>("details");
  const [variantSheetOpen, setVariantSheetOpen] = useState<boolean>(false);
  const [pagination, setPagination] = useState<{
    pageSize: number;
    pageIndex: number;
  }>({
    pageSize: LIMIT,
    pageIndex: 0,
  });
  const [rowSelection, setRowSelection] = useState<DataTableRowSelectionState>(
    {}
  );

  /* ----------------------------- Queries --------------------------- */

  const { data: productWithVariants, isLoading } = useQuery({
    queryKey: ["product", product?.id, "variants-options"],
    enabled: Boolean(product?.id),
    queryFn: () =>
      sdk.admin.product.retrieve(product?.id as string, {
        fields:
          "options.*,options.values.*,variants.*,variants.options.*,variants.prices.*",
      }),
  });

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await sdk.admin.region.list({ limit: 9999 });
      return response.regions;
    },
  });

  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) return {};
    return regions.reduce((acc, reg) => {
      acc[reg.id] = reg.currency_code;
      return acc;
    }, {} as Record<string, string>);
  }, [regions]);

  const fetchedProduct: AdminProduct | undefined = productWithVariants?.product;

  /* --------------------------- Form Setup -------------------------- */

  const form = useForm<UpdateVariantPricesSchemaType>({
    resolver: zodResolver(UpdateVariantPricesSchema, {}),
    defaultValues: {
      variants: fetchedProduct?.variants?.map((variant: any) => ({
        title: variant.title,
        sku: "",
        allow_backorder: false,
        manage_inventory: false,
        prices: variant.prices.reduce((acc: any, price: any) => {
          if (price.rules?.region_id) {
            acc[price.rules.region_id] = price.amount;
          } else {
            acc[price.currency_code] = price.amount;
          }
          return acc;
        }, {}),
      })) as any,
    },
  });

  /* --------------------------- Derived UI -------------------------- */

  const variantsToGenerate = useMemo(
    () => getVariantsToCreate(fetchedProduct),
    [fetchedProduct]
  );

  const optionTitles = useMemo(
    () => (fetchedProduct?.options ?? []).map((o) => o.title),
    [fetchedProduct]
  );

  const columnHelper = createDataTableColumnHelper<VariantDraft>();

  const baseColumns = useMemo(
    () => [
      columnHelper.select(),
      columnHelper.accessor("title", {
        header: "Variant",
        enableSorting: true,
        sortLabel: "Variant",
        sortAscLabel: "A–Z",
        sortDescLabel: "Z–A",
      }),
    ],
    [columnHelper]
  );

  const optionColumns = useMemo(
    () =>
      optionTitles.map((title) =>
        columnHelper.accessor((row) => row.optionByTitle[title] ?? "-", {
          id: title,
          header: title,
          cell: ({ getValue }) => {
            const v = getValue<string>();
            return v === "-" ? "-" : <Badge size="2xsmall">{v}</Badge>;
          },
          enableSorting: true,
          sortAscLabel: "A–Z",
          sortDescLabel: "Z–A",
        })
      ),
    [columnHelper, optionTitles]
  );

  const columns = useMemo(
    () => [...baseColumns, ...optionColumns],
    [baseColumns, optionColumns]
  );

  const selectedCount = Object.keys(rowSelection).length;

  /* ---------------------------- Mutations -------------------------- */

  const { mutate: createVariantsMutation, isPending } = useMutation({
    mutationFn: async (reqData: AdminCreateProductVariant[]) => {
      return await sdk.admin.product.batchVariants(product!.id, {
        create: reqData,
      });
    },
    onSuccess: async () => {
      revalidate();
      await queryClient.invalidateQueries({
        queryKey: ["product", product?.id, "variants-options"],
      });
      await queryClient.invalidateQueries({ refetchType: "all" });
      toast.success("Variants created successfully");
      setVariantSheetOpen(false);
      setRowSelection({});
      setStep("details");
      form.reset();
    },
    onError: () => {
      toast.error("Failed to create variants. Please try again.");
    },
  });

  const { mutate: updateProductMetadata } = useMutation({
    mutationFn: async (metadata: Record<string, any>) => {
      return await sdk.admin.product.update(product!.id, { metadata });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["product", product?.id, "variants-options"],
      });
      toast.success("Widget dismissed successfully!");
    },
    onError: (error) => {
      console.error("Failed to update product metadata:", error);
    },
  });

  /* ---------------------------- Handlers --------------------------- */

  const handleDismiss = useCallback(async () => {
    const confirmed = await dialog({
      title: "Are you sure?",
      description:
        "The Auto-Generate Variants widget will be removed, until new option combinations are detected.",
    });
    if (confirmed) {
      updateProductMetadata({ dismiss_variant_generation: "true" });
    }
  }, [dialog, updateProductMetadata]);

  const handleSubmit = form.handleSubmit((values) => {
    const selectedRows = Object.keys(rowSelection);
    const variantsOnlySelected = variantsToGenerate.filter(
      (variant) => variant.id && selectedRows.includes(variant.id)
    );

    const reqData = values.variants.map((variant, ind) => ({
      title: variant.title,
      sku: variant.sku || undefined,
      allow_backorder: variant.allow_backorder,
      manage_inventory: variant.manage_inventory,
      options: variantsOnlySelected[ind]?.optionByTitle,
      prices: Object.entries(variant.prices || {})
        .filter(([_, value]) => value !== "" && typeof value !== "undefined")
        .map(([currencyCodeOrRegionId, value]: any) => {
          const regionId = currencyCodeOrRegionId.startsWith("reg_")
            ? currencyCodeOrRegionId
            : undefined;
          const currencyCode = currencyCodeOrRegionId.startsWith("reg_")
            ? regionsCurrencyMap[regionId as string]
            : currencyCodeOrRegionId;

          let existingId = undefined;

          if (regionId) {
            existingId = productWithVariants?.product?.variants?.[
              ind
            ]?.prices?.find(
              (p) => (p as any).rules?.["region_id"] === regionId
            )?.id;
          } else {
            existingId = productWithVariants?.product?.variants?.[
              ind
            ]?.prices?.find(
              (p) =>
                p.currency_code === currencyCode &&
                Object.keys((p as any).rules ?? {}).length === 0
            )?.id;
          }

          const amount = castNumber(value);

          return {
            id: existingId,
            currency_code: currencyCode,
            amount,
            ...(regionId ? { rules: { region_id: regionId } } : {}),
          };
        }),
    }));

    createVariantsMutation(reqData);
  });

  /* --------------------------- DataTable --------------------------- */

  const paginatedVariants = useMemo(() => {
    const startIndex = pagination.pageIndex * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return variantsToGenerate.slice(startIndex, endIndex);
  }, [variantsToGenerate, pagination.pageIndex, pagination.pageSize]);

  const table = useDataTable({
    columns,
    data: paginatedVariants,
    getRowId: (row) => row.id,
    rowCount: variantsToGenerate.length,
    isLoading,
    pagination: { state: pagination, onPaginationChange: setPagination },
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: (updated) => {
        setRowSelection(updated);

        const selectedVariantIds = Object.keys(updated);
        const selectedVariants = variantsToGenerate.filter((v) =>
          selectedVariantIds.includes(v.id)
        );

        form.setValue(
          "variants",
          selectedVariants.map((v) => ({
            title: v.title,
            sku: v.sku,
            allow_backorder: false,
            manage_inventory: false,
            prices: {},
          }))
        );
      },
    },
  });

  /* ------------------------------ Guard --------------------------- */

  if (isLoading || !fetchedProduct || variantsToGenerate.length === 0) {
    return null;
  }

  /* ------------------------------ Condition to show/hide widget --------------------------- */

  if (
    productWithVariants?.product?.metadata?.dismiss_variant_generation ===
    "true"
  ) {
    return (
      <Container className="flex flex-row items-center justify-between gap-4">
        <Text className="text-ui-fg-subtle">
          Found {variantsToGenerate.length} variant combinations that don&apos;t
          exist yet.
        </Text>
        <Button
          variant="secondary"
          size="small"
          onClick={() => {
            updateProductMetadata({ dismiss_variant_generation: "false" });
          }}
        >
          Show Widget
        </Button>
      </Container>
    );
  }

  /* ------------------------------ Render -------------------------- */

  return (
    <>
      <Container className="divide-y p-0">
        <DataTable instance={table}>
          <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <div className="w-full flex flex-col gap-1">
              <Heading level="h2">Auto-Generate Variants</Heading>
              <Text className="text-ui-fg-subtle">
                Some option combinations don&apos;t have variants yet. Review
                the list and create the ones you need.
              </Text>
            </div>
          </DataTable.Toolbar>

          <DataTable.Table />

          <div className="w-full px-6 py-4 bg-ui-bg-subtle border-b flex flex-row items-center justify-end gap-2">
            <Button
              disabled={isPending}
              onClick={handleDismiss}
              size="small"
              variant="secondary"
            >
              Dismiss
            </Button>
            <Button
              size="small"
              disabled={selectedCount === 0 || isPending}
              onClick={() => setVariantSheetOpen(true)}
            >
              Create {selectedCount || null} Variant
              {selectedCount > 1 ? "s" : ""}
            </Button>
          </div>

          <DataTable.Pagination />
        </DataTable>
      </Container>

      <FocusModal open={variantSheetOpen} onOpenChange={setVariantSheetOpen}>
        <FocusModal.Content>
          <ProgressTabs
            defaultValue="details"
            value={step}
            onValueChange={setStep}
            className="flex h-full flex-col overflow-hidden"
          >
            <FormProvider {...form}>
              <form
                onSubmit={handleSubmit}
                className="flex h-full flex-col overflow-hidden"
              >
                <FocusModal.Header className="!py-0">
                  <div className="border-l w-full">
                    <ProgressTabs.List>
                      <ProgressTabs.Trigger value="details" status="completed">
                        Details
                      </ProgressTabs.Trigger>
                      <ProgressTabs.Trigger value="prices" status="in-progress">
                        Prices
                      </ProgressTabs.Trigger>
                    </ProgressTabs.List>
                  </div>
                </FocusModal.Header>

                <FocusModal.Body className="overflow-y-auto ">
                  <ProgressTabs.Content value="details" asChild>
                    <ProductVariantDetails form={form} />
                  </ProgressTabs.Content>
                  <ProgressTabs.Content value="prices" asChild>
                    <ProductVariantPrice form={form} />
                  </ProgressTabs.Content>
                </FocusModal.Body>
                <FocusModal.Footer className="border-ui-border-base flex items-center justify-end gap-x-2 border-t p-4  w-full ">
                  <div className="flex items-center justify-end gap-2">
                    <FocusModal.Close asChild>
                      <Button
                        disabled={isPending}
                        variant="secondary"
                        size="small"
                        type="button"
                      >
                        Cancel
                      </Button>
                    </FocusModal.Close>

                    {step === "prices" ? (
                      <Button type="submit" disabled={isPending} size="small">
                        {isPending && <Loader className="animate-spin" />}
                        Save
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={isPending}
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          setStep("prices");
                        }}
                      >
                        Continue
                      </Button>
                    )}
                  </div>
                </FocusModal.Footer>
              </form>
            </FormProvider>
          </ProgressTabs>
        </FocusModal.Content>
      </FocusModal>
    </>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default AutoGenerateVariants;

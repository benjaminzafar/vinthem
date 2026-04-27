"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { Product, ProductOption, ProductVariant } from '@/store/useCartStore';
import { Plus, X, ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { MediaPickerModal } from './admin/MediaPickerModal';
import { buildVariantsFromOptions } from '@/lib/product-variants';

interface VariantEditorProps {
  formData: Partial<Product>;
  setFormData: (data: Partial<Product>) => void;
}

export function VariantEditor({ formData, setFormData }: VariantEditorProps) {
  const [pickingForColor, setPickingForColor] = useState<string | null>(null);
  const [pickingForVariantIndex, setPickingForVariantIndex] = useState<number | null>(null);

  const options = formData.options || [];
  const variants = formData.variants || [];

  const updateOptionsAndVariants = (newOptions: ProductOption[]) => {
    const newVariants = buildVariantsFromOptions(
      newOptions,
      variants,
      Number(formData.price) || 0,
      formData.sku || ''
    );

    setFormData({
      ...formData,
      options: newOptions,
      variants: newVariants,
    });
  };

  const handleAddOption = () => {
    if (options.length >= 3) {
      toast.error('Maximum 3 options allowed');
      return;
    }

    setFormData({
      ...formData,
      options: [...options, { name: '', values: [] }],
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    updateOptionsAndVariants(newOptions);
  };

  const handleOptionNameChange = (index: number, name: string) => {
    const newOptions = [...options];
    newOptions[index].name = name;
    updateOptionsAndVariants(newOptions);
  };

  const handleOptionValuesChange = (index: number, valuesStr: string) => {
    const newOptions = [...options];
    newOptions[index].values = valuesStr.split(',').map((value) => value.trim()).filter(Boolean);
    updateOptionsAndVariants(newOptions);
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const colorOption = options.find((option) => {
    const normalizedName = option.name.toLowerCase();
    return normalizedName === 'color' || normalizedName === 'colour' || normalizedName === 'färg';
  });

  const handleColorImageUpload = (colorName: string, url: string) => {
    if (!colorOption) {
      return;
    }

    const newVariants = variants.map((variant) => {
      if (variant.options && variant.options[colorOption.name] === colorName) {
        return { ...variant, imageUrl: url };
      }

      return variant;
    });

    setFormData({ ...formData, variants: newVariants });
  };

  const handleRemoveColorImage = (colorName: string) => {
    if (!colorOption) return;
    const newVariants = variants.map((variant) => {
      if (variant.options && variant.options[colorOption.name] === colorName) {
        const { imageUrl, ...rest } = variant;
        // Also remove snake_case if present
        const { image_url, ...rest2 } = rest as any;
        return { ...rest2, imageUrl: '' };
      }
      return variant;
    });
    setFormData({ ...formData, variants: newVariants });
    toast.success(`Removed image for all ${colorName} variants`);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-zinc-900">Options</h3>
          <p className="text-xs text-zinc-500">
            Add only the option groups you need. The top AI Designer can fill these automatically.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="p-3 bg-zinc-50 rounded-[6px] border border-zinc-200 relative">
            <button
              type="button"
              onClick={() => handleRemoveOption(index)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-[0.18em] mb-1.5">Option Name</label>
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => handleOptionNameChange(index, e.target.value)}
                  placeholder="e.g., Size, Color"
                  className="w-full h-10 px-3 border border-gray-200/60 rounded-[4px] text-sm focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-zinc-700 uppercase tracking-[0.18em] mb-1.5">Option Values</label>
                <input
                  type="text"
                  value={option.values.join(', ')}
                  onChange={(e) => handleOptionValuesChange(index, e.target.value)}
                  placeholder="e.g., Red, Blue, Green"
                  className="w-full h-10 px-3 border border-gray-200/60 rounded-[4px] text-sm focus:ring-2 focus:ring-zinc-900"
                />
                <p className="text-[10px] text-zinc-500 mt-1">Separate values with commas. Variants are generated automatically.</p>
              </div>
            </div>
          </div>
        ))}

        {options.length < 3 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center text-xs font-bold text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-4 h-4 mr-1" /> Add another option
          </button>
        )}
      </div>

      {variants.length > 0 ? (
        <div className="mt-5 space-y-5">
          {colorOption && colorOption.values.length > 0 && (
            <div className="bg-zinc-50 p-4 rounded-[6px] border border-zinc-200">
              <h4 className="text-sm font-bold text-zinc-900 mb-2">Color Images</h4>
              <p className="text-xs text-zinc-500 mb-4">Upload an image for each color. This image will automatically be applied to all variants of this color, and will be used on the product page.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {colorOption.values.map((colorVal) => {
                  const variantWithColor = variants.find((variant) => variant.options && variant.options[colorOption.name] === colorVal && (variant.imageUrl || (variant as any).image_url));
                  const imageUrl = variantWithColor ? (variantWithColor.imageUrl || (variantWithColor as any).image_url) : '';

                  return (
                    <div key={colorVal} className="flex flex-col items-center gap-2">
                      <div className="relative w-full aspect-square rounded-md border border-gray-200/60 overflow-hidden flex items-center justify-center group bg-white">
                        {imageUrl ? (
                          <Image 
                            src={imageUrl} 
                            alt={colorVal} 
                            width={160}
                            height={160}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="text-[10px] font-black text-zinc-500 uppercase text-center leading-tight tracking-wider">Empty</div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 cursor-default transition-all duration-200 scale-95 group-hover:scale-100">
                          <div className="flex gap-2">
                            <label className="p-2 bg-white rounded-full text-zinc-900 hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-pointer" title="Upload New">
                              <Upload className="w-4 h-4" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const toastId = toast.loading(`Uploading image for ${colorVal}...`);
                                  try {
                                    const formDataUpload = new FormData();
                                    formDataUpload.append('file', file);
                                    formDataUpload.append('path', `variants/${Date.now()}_${file.name}`);

                                    const res = await fetch('/api/upload', {
                                      method: 'POST',
                                      body: formDataUpload
                                    });

                                    if (!res.ok) throw new Error('Upload failed');
                                    const { url } = await res.json();
                                    
                                    handleColorImageUpload(colorVal, url);
                                    toast.success(`Applied to all ${colorVal} variants`, { id: toastId });
                                  } catch (error) {
                                    const message = error instanceof Error ? error.message : 'Upload failed';
                                    toast.error(message, { id: toastId });
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setPickingForColor(colorVal)}
                              className="p-2 bg-white rounded-full text-zinc-900 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              title="Select from Library"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                            {imageUrl && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColorImage(colorVal)}
                                className="p-2 bg-white rounded-full text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Remove Image"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <span className="text-[8px] font-black text-white uppercase tracking-widest text-center px-2">
                            {imageUrl ? 'Change Image' : 'Add Image'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-700">{colorVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-base font-bold text-zinc-900 mb-2">Variants & Pricing</h3>
            <p className="text-xs text-zinc-500 mb-3">Set price, stock, and SKU for each generated combination.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Image</th>
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Variant</th>
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Price</th>
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Stock</th>
                    <th className="py-3 px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">SKU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {variants.map((variant, index) => (
                    <tr key={variant.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4">
                        <div className="relative w-12 h-12 rounded-lg border border-gray-200/60 overflow-hidden flex items-center justify-center group bg-white">
                          {variant.imageUrl || (variant as any).image_url ? (
                            <Image 
                              src={variant.imageUrl || (variant as any).image_url} 
                              alt="Variant" 
                              width={48}
                              height={48}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="text-[8px] font-black text-zinc-500 uppercase text-center leading-tight">...</div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-all">
                            <label className="p-1 px-1.5 bg-white/90 rounded text-zinc-900 hover:bg-white cursor-pointer" title="Upload">
                              <Upload className="w-2.5 h-2.5" />
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const toastId = toast.loading('Uploading...');
                                  try {
                                    const formDataUpload = new FormData();
                                    formDataUpload.append('file', file);
                                    formDataUpload.append('path', `variants/${Date.now()}_${file.name}`);

                                    const res = await fetch('/api/upload', {
                                      method: 'POST',
                                      body: formDataUpload
                                    });

                                    if (!res.ok) throw new Error('Upload failed');
                                    const { url } = await res.json();

                                    handleVariantChange(index, 'imageUrl', url);
                                    toast.success('Done', { id: toastId });
                                  } catch (error) {
                                    const message = error instanceof Error ? error.message : 'Upload failed';
                                    toast.error(message, { id: toastId });
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setPickingForVariantIndex(index)}
                              className="p-1 px-1.5 bg-white/90 rounded text-zinc-900 hover:bg-white"
                              title="Library"
                            >
                              <ImageIcon className="w-2.5 h-2.5" />
                            </button>
                            {(variant.imageUrl || (variant as any).image_url) && (
                              <button
                                type="button"
                                onClick={() => handleVariantChange(index, 'imageUrl', '')}
                                className="p-1 px-1.5 bg-white/90 rounded text-rose-500 hover:bg-rose-50"
                                title="Remove"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-zinc-900">
                          {Object.values(variant.options || {}).join(' / ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={variant.price || ''}
                          onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value) || 0)}
                          className="w-24 px-3 py-1.5 border border-gray-200/60 rounded-lg text-sm"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={variant.stock || 0}
                          onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value) || 0)}
                          className="w-24 px-3 py-1.5 border border-gray-200/60 rounded-lg text-sm"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={variant.sku || ''}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          className="w-32 px-3 py-1.5 border border-gray-200/60 rounded-lg text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-5 p-5 border border-dashed border-zinc-300 rounded-[6px] bg-zinc-50 text-center">
          <p className="text-sm font-bold text-zinc-600 mb-1">No variants generated yet</p>
          <p className="text-xs text-zinc-500">Type comma-separated values above to generate variants manually, or use the top AI Designer to fill options and variants in one pass.</p>
        </div>
      )}

      <MediaPickerModal
        isOpen={pickingForColor !== null || pickingForVariantIndex !== null}
        onClose={() => {
          setPickingForColor(null);
          setPickingForVariantIndex(null);
        }}
        onSelect={(url) => {
          if (pickingForColor !== null) {
            handleColorImageUpload(pickingForColor, url);
            toast.success(`Image applied to all ${pickingForColor} variants`);
          } else if (pickingForVariantIndex !== null) {
            handleVariantChange(pickingForVariantIndex, 'imageUrl', url);
            toast.success('Individual variant image updated');
          }
          setPickingForColor(null);
          setPickingForVariantIndex(null);
        }}
        title="Select Variant Image"
      />
    </div>
  );
}

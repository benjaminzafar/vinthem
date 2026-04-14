"use client";
import React, { useState } from 'react';
import { Product, ProductOption, ProductVariant } from '@/store/useCartStore';
import { Plus, X, Wand2, Loader2 } from 'lucide-react';
import { genAI } from '@/lib/gemini';
import { toast } from 'sonner';

interface VariantEditorProps {
  formData: Partial<Product>;
  setFormData: (data: Partial<Product>) => void;
}

export function VariantEditor({ formData, setFormData }: VariantEditorProps) {
  const [generating, setGenerating] = useState(false);

  // Ensure options array exists
  const options = formData.options || [];
  const variants = formData.variants || [];

  const handleAddOption = () => {
    if (options.length >= 3) {
      toast.error("Maximum 3 options allowed");
      return;
    }
    setFormData({
      ...formData,
      options: [...options, { name: '', values: [] }]
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
    newOptions[index].values = valuesStr.split(',').map(v => v.trim()).filter(Boolean);
    updateOptionsAndVariants(newOptions);
  };

  const updateOptionsAndVariants = (newOptions: ProductOption[]) => {
    const newVariants = generateVariants(newOptions, variants, formData.price || 0, formData.sku || '');
    setFormData({
      ...formData,
      options: newOptions,
      variants: newVariants
    });
  };

  const generateVariants = (
    opts: ProductOption[], 
    existingVariants: ProductVariant[], 
    basePrice: number, 
    baseSku: string
  ): ProductVariant[] => {
    const validOptions = opts.filter(o => o.name && o.values.length > 0);
    if (validOptions.length === 0) return [];

    const combinations: Record<string, string>[] = [{}];

    for (const option of validOptions) {
      const currentCombinations = [...combinations];
      combinations.length = 0;

      for (const combo of currentCombinations) {
        for (const value of option.values) {
          combinations.push({ ...combo, [option.name]: value });
        }
      }
    }

    return combinations.map(combo => {
      // Find existing variant to preserve data
      const existing = existingVariants.find(v => {
        if (!v.options) return false;
        return Object.keys(combo).every(k => v.options![k] === combo[k]) &&
               Object.keys(v.options).every(k => v.options![k] === combo[k]);
      });

      if (existing) return existing;

      const comboValues = Object.values(combo).join('-');
      return {
        id: Math.random().toString(36).substring(7),
        options: combo,
        stock: 0,
        price: basePrice,
        sku: baseSku ? `${baseSku}-${comboValues}`.toUpperCase() : '',
        imageUrl: ''
      };
    });
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const colorOption = options.find(o => o.name.toLowerCase() === 'color' || o.name.toLowerCase() === 'colour' || o.name.toLowerCase() === 'färg');

  const handleColorImageUpload = (colorName: string, url: string) => {
    if (!colorOption) return;
    const newVariants = variants.map(v => {
      if (v.options && v.options[colorOption.name] === colorName) {
        return { ...v, imageUrl: url };
      }
      return v;
    });
    setFormData({ ...formData, variants: newVariants });
  };

  const generateAIVariants = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Please enter a product title and description first.");
      return;
    }

    setGenerating(true);
    try {
      const prompt = `You are an e-commerce expert. Based on the following product, suggest Shopify-style variant options (like Size, Color, Material) and their possible values.
      
Product Title: ${formData.title}
Product Description: ${formData.description}

Return ONLY a valid JSON array of objects with 'name' (string) and 'values' (array of strings). Do not include markdown formatting or any other text.
Example: [{"name": "Size", "values": ["S", "M", "L"]}, {"name": "Color", "values": ["Black", "White"]}]`;

      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        }
      });

      const aiResponse = await model.generateContent(prompt);
      let jsonStr = aiResponse.response.text() || '[]';
      // Clean up markdown if present
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
      }

      const suggestedOptions = JSON.parse(jsonStr) as ProductOption[];
      if (suggestedOptions && suggestedOptions.length > 0) {
        updateOptionsAndVariants(suggestedOptions);
        toast.success("AI generated variants successfully!");
      } else {
        toast.error("AI did not return valid options.");
      }
    } catch (error) {
      console.error("AI Variant Error:", error);
      toast.error("Failed to generate variants with AI.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Options</h3>
          <p className="text-sm text-zinc-500">Manage product options like Size, Color, or Material.</p>
        </div>
        <button
          type="button"
          onClick={generateAIVariants}
          disabled={generating}
          className="w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          AI Generate Options
        </button>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={index} className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 relative">
            <button
              type="button"
              onClick={() => handleRemoveOption(index)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-red-500"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Option Name</label>
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => handleOptionNameChange(index, e.target.value)}
                  placeholder="e.g., Size, Color"
                  className="w-full px-4 py-2.5 border border-gray-200/60 rounded-md text-sm focus:ring-2 focus:ring-zinc-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Option Values (comma separated)</label>
                <input
                  type="text"
                  value={option.values.join(', ')}
                  onChange={(e) => handleOptionValuesChange(index, e.target.value)}
                  placeholder="e.g., Red, Blue, Green (type comma to separate)"
                  className="w-full px-4 py-2.5 border border-gray-200/60 rounded-md text-sm focus:ring-2 focus:ring-zinc-900"
                />
                <p className="text-[10px] text-zinc-500 mt-1.5">Separate options with a comma. A table will appear below to upload images for each color.</p>
              </div>
            </div>
          </div>
        ))}

        {options.length < 3 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center text-sm font-bold text-zinc-600 hover:text-zinc-900"
          >
            <Plus className="w-4 h-4 mr-1" /> Add another option
          </button>
        )}
      </div>

      {variants.length > 0 ? (
        <div className="mt-8 space-y-8">
          {colorOption && colorOption.values.length > 0 && (
            <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200">
              <h4 className="text-sm font-bold text-zinc-900 mb-2">Color Images</h4>
              <p className="text-xs text-zinc-500 mb-4">Upload an image for each color. This image will automatically be applied to all variants of this color, and will be used as the color swatch on the product page.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {colorOption.values.map((colorVal) => {
                  // Find the first variant with this color to get its image
                  const variantWithColor = variants.find(v => v.options && v.options[colorOption.name] === colorVal);
                  const imageUrl = variantWithColor?.imageUrl;

                  return (
                    <div key={colorVal} className="flex flex-col items-center gap-2">
                      <div className="relative w-full aspect-square rounded-md border border-gray-200/60 overflow-hidden flex items-center justify-center group">
                        {imageUrl ? (
                          <img src={imageUrl} alt={colorVal} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[10px] font-bold text-zinc-400 uppercase text-center leading-tight">Add<br/>Image</div>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <Plus className="w-5 h-5 text-white" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const toastId = toast.loading(`Uploading image for ${colorVal}...`);
                              try {
                                const { uploadImageWithTimeout } = await import('@/lib/upload');
                                const url = await uploadImageWithTimeout(file, `variants/${Date.now()}_${file.name}`);
                                handleColorImageUpload(colorVal, url);
                                toast.success(`Image applied to all ${colorVal} variants`, { id: toastId });
                              } catch (err: any) {
                                toast.error(err.message || 'Upload failed', { id: toastId });
                              }
                            }}
                          />
                        </label>
                      </div>
                      <span className="text-xs font-bold text-zinc-700">{colorVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-zinc-900 mb-4">Variants & Pricing</h3>
            <p className="text-sm text-zinc-500 mb-4">Set prices, stock, and SKUs for each specific variant combination.</p>
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
                      <div className="relative w-12 h-12 rounded-lg border border-gray-200/60 overflow-hidden flex items-center justify-center group">
                        {variant.imageUrl ? (
                          <img src={variant.imageUrl} alt="Variant" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-[8px] font-bold text-zinc-400 uppercase text-center leading-tight">Add<br/>Img</div>
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <Plus className="w-4 h-4 text-white" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const toastId = toast.loading('Uploading variant image...');
                              try {
                                const { uploadImageWithTimeout } = await import('@/lib/upload');
                                const url = await uploadImageWithTimeout(file, `variants/${Date.now()}_${file.name}`);
                                handleVariantChange(index, 'imageUrl', url);
                                toast.success('Image uploaded', { id: toastId });
                              } catch (err: any) {
                                toast.error(err.message || 'Upload failed', { id: toastId });
                              }
                            }}
                          />
                        </label>
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
                        onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value))}
                        className="w-24 px-3 py-1.5 border border-gray-200/60 rounded-lg text-sm"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={variant.stock || 0}
                        onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value))}
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
        <div className="mt-8 p-8 border border-dashed border-zinc-300 rounded-lg bg-zinc-50 text-center">
          <p className="text-sm font-bold text-zinc-600 mb-1">No variants generated yet</p>
          <p className="text-xs text-zinc-500">Type comma-separated values (like "Red, Blue") in the options above to generate variants. You can then upload specific images for each color.</p>
        </div>
      )}
    </div>
  );
}

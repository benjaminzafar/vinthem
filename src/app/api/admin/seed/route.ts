import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const clear = searchParams.get('clear') === 'true';

    if (clear) {
      // Delete test products (using all known seed prefixes)
      const { error: delProdError } = await supabase
        .from('products')
        .delete()
        .or('sku.ilike.LIV-CHAIR-%,sku.ilike.BED-NIGHT-%,sku.ilike.KIT-PLATE-%,sku.ilike.SEED-%');
      
      if (delProdError) throw delProdError;

      return NextResponse.json({ success: true, message: 'Test data cleared successfully' });
    }

    // 1. Fetch ALL existing categories to ensure we seed into the user's actual structure
    const { data: existingCats, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug');

    if (catError) throw catError;

    if (!existingCats || existingCats.length === 0) {
        return NextResponse.json({ 
            success: false, 
            error: 'No categories found. Please create at least one collection in the admin dashboard before seeding products.' 
        }, { status: 400 });
    }

    // 2. Generate Products for EVERY existing category (5 per category)
    const products: any[] = [];
    
    existingCats.forEach((cat) => {
        for (let i = 1; i <= 5; i++) {
            products.push({
                title: `${cat.name} Premium Piece ${i}`,
                description: `A master-standard selection for the ${cat.name} collection, piece #${i}.`,
                price: 1500 + (Math.random() * 5000),
                stock: 20,
                category: cat.name,
                category_id: cat.id,
                image_url: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80`,
                is_featured: i === 1,
                sku: `SEED-${cat.slug.toUpperCase()}-${i}`
            });
        }
    });

    // 3. Upsert products to avoid duplicates
    const { error: prodError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'sku' });

    if (prodError) throw prodError;

    return NextResponse.json({ 
        success: true, 
        message: `Successfully seeded ${products.length} products across ${existingCats.length} categories.`,
        categoriesPopulated: existingCats.length,
        productsCreated: products.length
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed failed';
    console.error('Seed Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

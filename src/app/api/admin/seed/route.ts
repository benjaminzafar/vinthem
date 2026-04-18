import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const supabase = await createClient();
  
    // 1. Define Beautiful Categories
    const categories = [
      {
        name: 'Living Room',
        slug: 'living-room',
        description: 'Serene and minimal designs for your gathering space.',
        is_featured: true,
        show_in_hero: true,
        image_url: 'https://images.unsplash.com/photo-1618220179428-22790b46a015?auto=format&fit=crop&w=800'
      },
      {
        name: 'Bedroom',
        slug: 'bedroom',
        description: 'Restful textures and calming tones for your sanctuary.',
        is_featured: true,
        show_in_hero: true,
        image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800'
      },
      {
        name: 'Kitchen',
        slug: 'kitchen',
        description: 'Functional elegance for the heart of your home.',
        is_featured: true,
        show_in_hero: false,
        image_url: 'https://images.unsplash.com/photo-1556911220-e15224bbaf40?auto=format&fit=crop&w=800'
      }
    ];

    // Upsert categories to avoid duplicates
    const { data: insertedCats, error: catError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'slug' })
      .select();

    if (catError) throw catError;

    const catMap = Object.fromEntries(insertedCats.map(c => [c.name, c.id]));

    // 3. Define 21 Beautiful Products (7 per category)
    const products = [];
    
    // Living Room Products
    for (let i = 1; i <= 7; i++) {
        products.push({
            title: `Scandinavian Living Chair ${i}`,
            description: `A master-standard piece for your living space, edition ${i}.`,
            price: 4500 + (i * 100),
            stock: 10,
            category: 'Living Room',
            category_id: catMap['Living Room'],
            image_url: `https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80`,
            is_featured: i % 2 === 0,
            sku: `LIV-CHAIR-${i}`
        });
    }

    // Bedroom Products
    for (let i = 1; i <= 7; i++) {
        products.push({
            title: `Nordic Nightstand ${i}`,
            description: `Minimalist storage for your bedroom sanctuary, model ${i}.`,
            price: 1200 + (i * 50),
            stock: 15,
            category: 'Bedroom',
            category_id: catMap['Bedroom'],
            image_url: `https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80`,
            is_featured: i % 2 === 0,
            sku: `BED-NIGHT-${i}`
        });
    }

    // Kitchen Products
    for (let i = 1; i <= 7; i++) {
        products.push({
            title: `Artisanal Ceramic Plate ${i}`,
            description: `Hand-finished kitchenware for the modern home, set ${i}.`,
            price: 85 + (i * 5),
            stock: 30,
            category: 'Kitchen',
            category_id: catMap['Kitchen'],
            image_url: `https://images.unsplash.com/photo-1594913785162-e6785b42fbb1?auto=format&fit=crop&w=800&q=80`,
            is_featured: i % 2 === 0,
            sku: `KIT-PLATE-${i}`
        });
    }

    const { error: prodError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'sku' });

    if (prodError) throw prodError;

    return NextResponse.json({ 
        success: true, 
        message: 'Seeded 21 beautiful products successfully',
        categoriesFound: insertedCats.length,
        productsCreated: products.length
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed failed';
    console.error('Seed Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

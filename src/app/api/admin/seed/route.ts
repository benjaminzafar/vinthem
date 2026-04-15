import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminBearerUser } from '@/lib/admin';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const adminContext = await (async () => {
    try {
      return await requireAdminBearerUser(request.headers.get('Authorization'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      const status = message === 'Forbidden: Admin access required' ? 403 : 401;
      return NextResponse.json({ error: message }, { status });
    }
  })();

  if (adminContext instanceof NextResponse) {
    return adminContext;
  }

  try {
    const { supabase } = adminContext;
  
    // 1. Clear existing test data (optional, but keep it clean)
    // We won't clear real data, only seed new ones.

    // 2. Define Beautiful Categories
    const categories = [
      {
        name: 'Living Room',
        slug: 'living-room',
        description: 'Serene and minimal designs for your gathering space.',
        is_featured: true,
        show_in_hero: true,
        image_url: 'https://images.unsplash.com/photo-1618220179428-22790b46a015?q=80&w=2727&auto=format&fit=crop'
      },
      {
        name: 'Bedroom',
        slug: 'bedroom',
        description: 'Restful textures and calming tones for your sanctuary.',
        is_featured: true,
        show_in_hero: true,
        image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2940&auto=format&fit=crop'
      },
      {
        name: 'Kitchen',
        slug: 'kitchen',
        description: 'Functional elegance for the heart of your home.',
        is_featured: true,
        show_in_hero: false,
        image_url: 'https://images.unsplash.com/photo-1556911220-e15224bbaf40?q=80&w=2940&auto=format&fit=crop'
      }
    ];

    const { data: insertedCats, error: catError } = await supabase
      .from('categories')
      .insert(categories)
      .select();

    if (catError) throw catError;

    const catMap = Object.fromEntries(insertedCats.map(c => [c.name, c.id]));

    // 3. Define Beautiful Products
    const products = [
      {
        title: 'Mavren Modular Sofa',
        description: 'Handcrafted with premium linen and sustainable oak.',
        price: 12499,
        stock: 5,
        category: 'Living Room',
        category_id: catMap['Living Room'],
        image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2940&auto=format&fit=crop',
        is_featured: true,
        sku: 'MAV-SOFA-01'
      },
      {
        title: 'Nordic Oak Bed Frame',
        description: 'Solid European oak with a natural oil finish.',
        price: 8990,
        stock: 8,
        category: 'Bedroom',
        category_id: catMap['Bedroom'],
        image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2940&auto=format&fit=crop',
        is_featured: true,
        sku: 'MAV-BED-02'
      },
      {
        title: 'Ceramic Arch Vase',
        description: 'Matte white stoneware, individually hand-thrown.',
        price: 450,
        stock: 25,
        category: 'Living Room',
        category_id: catMap['Living Room'],
        image_url: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?q=80&w=2940&auto=format&fit=crop',
        is_featured: true,
        sku: 'MAV-VASE-03'
      },
      {
        title: 'Minimalist Wall Clock',
        description: 'Silent movement with brushed aluminum markers.',
        price: 699,
        stock: 12,
        category: 'Kitchen',
        category_id: catMap['Kitchen'],
        image_url: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?q=80&w=2940&auto=format&fit=crop',
        is_featured: true,
        sku: 'MAV-CLOCK-04'
      }
    ];

    const { error: prodError } = await supabase
      .from('products')
      .insert(products);

    if (prodError) throw prodError;

    return NextResponse.json({ success: true, message: 'Seeded beautiful data successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Seed failed';
    console.error('Seed Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

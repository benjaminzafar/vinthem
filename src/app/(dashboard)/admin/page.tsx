"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, where, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { GoogleGenAI, Type } from '@google/genai';
import { Product } from '@/store/useCartStore';
import { useSettingsStore, defaultSettings, MenuLink, FooterSection, LocalizedString, StorefrontSettings as StorefrontSettingsType } from '@/store/useSettingsStore';
import { Category } from '@/types';
import { CategoryModal } from '@/components/CategoryModal';
import { ProductModal } from '@/components/admin/ProductModal';
import { ResponsiveTabs } from '@/components/ResponsiveTabs';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { useCustomConfirm } from '@/components/ConfirmationContext';
import { BlogPost } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import * as Sentry from "@sentry/react";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ReviewGenerator } from '@/components/ReviewGenerator';
import { AIPostMaker } from '@/components/AIPostMaker';
import { VariantEditor } from '@/components/VariantEditor';
import Markdown from 'react-markdown';

export interface StaticPage {
  id?: string;
  title: LocalizedString;
  slug: string;
  content: LocalizedString;
  updatedAt: string;
}

// ... existing imports ...
import { StorefrontSettings as StorefrontSettingsNew } from '@/components/admin/StorefrontSettings';
import { IntegrationsManager } from '@/components/admin/IntegrationsManager';
import { CustomersAndCRMManager } from '@/components/admin/CustomersAndCRMManager';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Layout, 
  Users, 
  FileText, 
  FileCode, 
  Settings, 
  MessageSquare, 
  Plus, 
  PlusCircle,
  Edit, 
  Trash2, 
  RefreshCw, 
  RefreshCcw,
  TrendingUp, 
  TrendingDown, 
  Globe, 
  ImageIcon, 
  Eye, 
  User, 
  Grid, 
  AlignLeft, 
  Code, 
  Download, 
  Filter, 
  Star, 
  Languages, 
  Info, 
  Save, 
  Search, 
  Sparkles, 
  Menu, 
  LogOut, 
  Upload, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  ArrowLeft, 
  Mail, 
  Calendar, 
  LinkIcon,
  DollarSign,
  X,
  Truck,
  Palette,
  Camera,
  Bug,
  MoreVertical,
  Wand2,
  Database
} from 'lucide-react';
// ... existing imports ...

// ... existing code ...

// ... existing code ...

// ... in AdminDashboard component, add a new tab or section for ReviewGenerator ...

import { AdminHeader } from '@/components/admin/AdminHeader';
import { NotificationCenter } from '@/components/admin/NotificationCenter';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Stage, Layer, Line as KonvaLine } from 'react-konva';
import { toast } from 'sonner';
import { getAI } from '@/lib/gemini';
import { handleFirestoreError, OperationType } from '@/utils/firestoreErrorHandler';



import { useDebounce } from '@/hooks/useDebounce';

const downloadXLSX = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

const downloadCSV = (data: any[], fileName: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function CollectionManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const customConfirm = useCustomConfirm();

  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const toggleShowInHero = async (category: Category) => {
    try {
      await updateDoc(doc(db, 'categories', category.id!), {
        showInHero: !category.showInHero
      });
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const toggleAllCollections = () => {
    const parentCategories = categories.filter(c => !c.parentId);
    if (selectedCollections.length === parentCategories.length) {
      setSelectedCollections([]);
    } else {
      setSelectedCollections(parentCategories.map(p => p.id!));
    }
  };

  const toggleCollectionSelection = (id: string) => {
    if (selectedCollections.includes(id)) {
      setSelectedCollections(selectedCollections.filter(cId => cId !== id));
    } else {
      setSelectedCollections([...selectedCollections, id]);
    }
  };

  const deleteSelectedCollections = async () => {
    const confirmed = await customConfirm('Delete Collections', `Are you sure you want to delete ${selectedCollections.length} collections?`);
    if (!confirmed) return;

    const toastId = toast.loading('Deleting collections...');
    try {
      await Promise.all(selectedCollections.map(id => deleteDoc(doc(db, 'categories', id))));
      toast.success('Collections deleted successfully', { id: toastId });
      setSelectedCollections([]);
    } catch (error) {
      console.error("Error deleting collections:", error);
      toast.error('Failed to delete collections', { id: toastId });
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => {
      console.error("Error fetching categories:", error);
      toast.error('Failed to load collections. Please check console.');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      console.error("Error fetching products:", error);
      toast.error('Failed to load products. Please check console.');
    });
    return unsubscribe;
  }, []);

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<string | null> => {
    const file = e.target.files?.[0];
    if (!file) return null;

    setUploading(true);
    const toastId = toast.loading('Uploading image...');

    try {
      const { uploadImageWithTimeout } = await import('@/lib/upload');
      const url = await uploadImageWithTimeout(file, `categories/${Date.now()}_${file.name}`);
      
      toast.success('Image uploaded successfully', { id: toastId });
      return url;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || 'Failed to upload image', { id: toastId });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Collections"
        description="Organize your products into categories"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search collections..."
        }}
        primaryAction={{
          label: "Add Collection",
          icon: Plus,
          onClick: () => { setEditingCategory(null); setIsCategoryModalOpen(true); }
        }}
        secondaryActions={[
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredCategories, 'collections') }
        ]}
        statsLabel={`${filteredCategories.length} collections`}
      />

      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-zinc-900">All Collections</h3>
          {selectedCollections.length > 0 && (
            <button onClick={deleteSelectedCollections} className="w-full sm:w-auto flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors">
              Delete ({selectedCollections.length})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-4 font-bold">
                  <input type="checkbox" checked={selectedCollections.length === categories.filter(c => !c.parentId).length && categories.filter(c => !c.parentId).length > 0} onChange={toggleAllCollections} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                </th>
                <th className="px-6 py-4 font-bold">Collection</th>
                <th className="px-6 py-4 font-bold">Products</th>
                <th className="px-6 py-4 font-bold">Show in Hero</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(() => {
                const getSorted = (parentId: string | null = null, level: number = 0): { category: Category, level: number }[] => {
                  let result: { category: Category, level: number }[] = [];
                  const children = filteredCategories.filter(c => c.parentId === parentId);
                  
                  children.forEach(child => {
                    result.push({ category: child, level });
                    result.push(...getSorted(child.id, level + 1));
                  });
                  
                  return result;
                };
                return getSorted().map(({ category: parent, level }) => (
                  <tr key={parent.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedCollections.includes(parent.id!)} onChange={() => toggleCollectionSelection(parent.id!)} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4" style={{ paddingLeft: `${level * 20 + 24}px` }}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center overflow-hidden">
                          {parent.imageUrl && parent.imageUrl.trim() !== "" ? (
                            <img src={parent.imageUrl} alt={parent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="w-6 h-6 text-zinc-400" />
                          )}
                        </div>
                        <span className="font-bold text-zinc-900">{parent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {products.filter(p => p.category === parent.name).length}
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={!!parent.showInHero} 
                        onChange={() => toggleShowInHero(parent)} 
                        className="w-5 h-5 rounded border-zinc-300 cursor-pointer" 
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setEditingCategory(parent); setIsCategoryModalOpen(true); }}
                        className="text-zinc-400 hover:text-zinc-900 p-2 rounded-full hover:bg-zinc-100 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-lg font-medium text-zinc-900">No collections yet</p>
              <p className="text-sm text-zinc-500 mt-1">Create collections to organize your products.</p>
            </div>
          ) : null}
        <CategoryModal 
          isOpen={isCategoryModalOpen} 
          onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
          category={editingCategory}
          categories={categories}
          products={products}
          onUpload={handleCategoryImageUpload}
        />
      </div>
    </div>
  );
}

function ReviewGeneratorNew() {
  const [products, setProducts] = useState<Product[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return unsubscribe;
  }, []);

  const handleGenerateReview = async (product: Product) => {
    setGeneratingProductId(product.id!);
    setGenerating(true);
    const toastId = toast.loading('Generating fake review...');
    try {
      const ai = getAI();
      const prompt = `Generate a realistic, positive customer review for the following product:
      Title: ${product.title}
      Category: ${product.category}
      
      Return the response in JSON format: {"rating": number (1-5), "comment": "string", "userName": "string"}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const review = JSON.parse(response.text || '{}');
      
      await addDoc(collection(db, `products/${product.id}/reviews`), {
        productId: product.id,
        userId: 'fake-user',
        userName: review.userName || 'Anonymous User',
        rating: review.rating || 5,
        comment: review.comment || 'Great product!',
        createdAt: serverTimestamp().toString()
      });

      toast.success('Fake review generated!', { id: toastId });
    } catch (error) {
      console.error('Error generating review:', error);
      toast.error('Failed to generate review.', { id: toastId });
    } finally {
      setGeneratingProductId(null);
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Fake Review Generator</h2>
      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200/60 rounded">
              <span className="font-medium text-gray-900">{product.title}</span>
              <button
                onClick={() => handleGenerateReview(product)}
                disabled={generating && generatingProductId === product.id}
                className="w-full sm:w-auto flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 py-3 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {generating && generatingProductId === product.id ? 'Generating...' : 'Generate Review'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Overview({ onProductClick, onSeedClick }: { onProductClick: (product: Product) => void, onSeedClick: () => void }) {
  const [activeChartTab, setActiveChartTab] = useState('revenue');
  const [timeRange, setTimeRange] = useState('6months');
  const [metric, setMetric] = useState('revenue');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawingMode, setDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<any[]>([]);
  const [visibleInventoryCount, setVisibleInventoryCount] = useState(10);
  const [visibleTopPerformersCount, setVisibleTopPerformersCount] = useState(10);
  const stageRef = useRef<any>(null);

  const handleMouseDown = (e: any) => {
    if (!drawingMode) return;
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    const qOrders = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching orders:", error);
    });

    const qProducts = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    const qRefunds = query(collection(db, 'refund_requests'));
    const unsubscribeRefunds = onSnapshot(qRefunds, (snapshot) => {
      setRefundRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error fetching refund requests:", error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeRefunds();
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    if (timeRange === '1week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === '1month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === '3months') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (timeRange === '6months') {
      startDate.setMonth(now.getMonth() - 6);
    } else if (timeRange === '12months') {
      startDate.setMonth(now.getMonth() - 12);
    }
    
    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });
  }, [orders, timeRange]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      if (order.status !== 'Cancelled') {
        return sum + (Number(order.total) || 0);
      }
      return sum;
    }, 0);
  }, [filteredOrders]);

  const activeOrders = useMemo(() => {
    return filteredOrders.filter(order => order.status === 'Processing' || order.status === 'Pending' || !order.status).length;
  }, [filteredOrders]);

  const avgOrderValue = useMemo(() => {
    const validOrders = filteredOrders.filter(order => order.status !== 'Cancelled');
    if (validOrders.length === 0) return 0;
    return totalRevenue / validOrders.length;
  }, [filteredOrders, totalRevenue]);

  const trendData = useMemo(() => {
    const now = new Date();
    const data: { name: string, revenue: number, orders: number, date: Date }[] = [];

    if (timeRange === '1week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        data.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), revenue: 0, orders: 0, date: d });
      }
    } else if (timeRange === '1month') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - (i * 7));
        data.push({ name: `Week ${i + 1}`, revenue: 0, orders: 0, date: d });
      }
    } else {
      const monthsToShow = timeRange === '12months' ? 12 : (timeRange === '3months' ? 3 : 6);
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        data.push({ name: d.toLocaleDateString('en-US', { month: 'short' }), revenue: 0, orders: 0, date: d });
      }
    }

    filteredOrders.forEach(order => {
      if (order.createdAt && order.status !== 'Cancelled') {
        const orderDate = new Date(order.createdAt);
        
        const match = data.find(point => {
            if (timeRange === '1week') {
                return orderDate.toDateString() === point.date.toDateString();
            } else if (timeRange === '1month') {
                const diffTime = Math.abs(orderDate.getTime() - point.date.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
            } else {
                return orderDate.getMonth() === point.date.getMonth() && orderDate.getFullYear() === point.date.getFullYear();
            }
        });

        if (match) {
          match.revenue += (Number(order.total) || 0);
          match.orders += 1;
        }
      }
    });

    return data.map(({ name, revenue, orders }) => ({ name, revenue, orders }));
  }, [filteredOrders, timeRange]);

  const topProductsList = useMemo(() => {
    const productSales: Record<string, { sales: number, revenue: number }> = {};
    
    orders.forEach(order => {
      if (order.status !== 'Cancelled' && order.items) {
        order.items.forEach((item: any) => {
          if (!productSales[item.id]) {
            productSales[item.id] = { sales: 0, revenue: 0 };
          }
          productSales[item.id].sales += (item.quantity || 1);
          productSales[item.id].revenue += ((item.price || 0) * (item.quantity || 1));
        });
      }
    });

    const sortedProducts = Object.entries(productSales)
      .map(([id, data]) => {
        const product = products.find(p => p.id === id);
        return {
          name: product ? product.title : `Product ${id.slice(0, 8)}`,
          sales: data.sales,
          revenue: `${data.revenue.toLocaleString()} SEK`,
          rawRevenue: data.revenue
        };
      })
      .sort((a, b) => b.rawRevenue - a.rawRevenue);

    return {
      items: sortedProducts.slice(0, visibleTopPerformersCount),
      hasMore: sortedProducts.length > visibleTopPerformersCount
    };
  }, [orders, products, visibleTopPerformersCount]);

  const inventoryAnalyst = useMemo(() => {
    const lowStockThreshold = 5;
    
    // Helper to get total stock for a product, considering variants
    const getProductStock = (p: Product) => {
      if (p.variants && p.variants.length > 0) {
        return p.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
      }
      return Number(p.stock) || 0;
    };

    const lowStock = products.filter(p => getProductStock(p) <= lowStockThreshold);
    const outOfStock = products.filter(p => getProductStock(p) === 0);
    const totalStock = products.reduce((sum, p) => sum + getProductStock(p), 0);
    
    return {
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      totalStock,
      lowStockProducts: lowStock.slice(0, visibleInventoryCount),
      hasMoreLowStock: lowStock.length > visibleInventoryCount
    };
  }, [products, visibleInventoryCount]);

  const stats = [
    { name: 'Total Revenue', value: `${totalRevenue.toLocaleString()} SEK`, icon: DollarSign, change: '+0%', changeType: 'positive' },
    { name: 'Active Orders', value: activeOrders.toString(), icon: ShoppingCart, change: '+0%', changeType: 'positive' },
    { name: 'Avg. Order Value', value: `${Math.round(avgOrderValue).toLocaleString()} SEK`, icon: DollarSign, change: '+0%', changeType: 'positive' },
    { name: 'All products', value: inventoryAnalyst.totalStock.toString(), icon: Package, change: '+0%', changeType: 'positive' },
    { name: 'Low Stock Items', value: inventoryAnalyst.lowStockCount.toString(), icon: TrendingDown, change: `${inventoryAnalyst.lowStockCount} items`, changeType: 'negative' },
    { name: 'Refund Requests', value: refundRequests.length.toString(), icon: RefreshCcw, change: `${refundRequests.filter(r => r.status === 'Pending').length} pending`, changeType: 'negative' },
  ];

  const { settings } = useSettingsStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-zinc-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <AdminHeader 
        title="Store Overview"
        description="Real-time performance metrics and inventory insights."
        secondaryActions={[
          { label: 'Seed Test Data', icon: Database, onClick: onSeedClick },
          { label: 'Export Report', icon: Download, onClick: () => downloadXLSX(filteredOrders, 'store_report') }
        ]}
      />

      {/* Primary Analytics: Store Performance */}
      <div className="bg-white border border-zinc-100 rounded-3xl p-4 sm:pl-2 sm:pr-6 sm:py-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6 px-4 sm:px-6">
          <div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight">Revenue & Growth</h3>
            <p className="text-zinc-500 text-sm font-medium">Visualizing your store's financial trajectory.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)} 
              className="flex-1 sm:flex-none text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-zinc-100 rounded-xl px-3 sm:px-4 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
            >
              <option value="1week">Last 7 Days</option>
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last Year</option>
            </select>
            <select 
              value={metric} 
              onChange={(e) => setMetric(e.target.value)} 
              className="flex-1 sm:flex-none text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-zinc-100 rounded-xl px-3 sm:px-4 py-2 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
            >
              <option value="revenue">Revenue (SEK)</option>
              <option value="orders">Order Volume</option>
            </select>
          </div>
        </div>
        
        <div className="h-[300px] sm:h-[400px] w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 0, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.05}/>
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 800 }} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 800 }} 
                width={40}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-xl shadow-zinc-900/5 min-w-[160px]">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">{label}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{metric}</span>
                          <span className="text-sm font-black text-zinc-900">
                             {(payload[0]?.value ?? 0).toLocaleString()} {metric === 'revenue' ? 'SEK' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area 
                type="monotone" 
                dataKey={metric} 
                stroke="#18181b" 
                fill="url(#colorMetric)" 
                strokeWidth={3} 
                dot={{ fill: '#18181b', strokeWidth: 2, r: 4, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Minimalist Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-zinc-50 border border-zinc-100 p-6 rounded-2xl transition-all hover:bg-zinc-100/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white border border-zinc-200 rounded-lg flex items-center justify-center text-zinc-900">
                <stat.icon className="w-4 h-4" />
              </div>
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{stat.name}</h3>
            </div>
            <p className="text-2xl font-black text-zinc-900 tracking-tight">{stat.value}</p>
            <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${stat.changeType === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Analyst */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">Inventory Health</h3>
              <p className="text-zinc-500 text-xs font-medium">Stock levels and replenishment alerts.</p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {inventoryAnalyst.outOfStockCount} Out
              </div>
              <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {inventoryAnalyst.lowStockCount} Low
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {inventoryAnalyst.lowStockProducts.length > 0 ? (
              inventoryAnalyst.lowStockProducts.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => onProductClick(p)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-2xl hover:bg-zinc-100/50 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 transition-colors shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900 truncate">{p.title}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full shrink-0 ml-2">
                    {p.stock} Units
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                <p className="text-zinc-400 font-bold text-sm">All products fully stocked</p>
              </div>
            )}

            {inventoryAnalyst.hasMoreLowStock && (
              <button 
                onClick={() => setVisibleInventoryCount(prev => prev + 10)}
                className="w-full py-4 border border-zinc-100 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
              >
                Load More Products
              </button>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-4 sm:p-8">
          <div className="mb-8">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Top Performers</h3>
            <p className="text-zinc-500 text-xs font-medium">Best selling products by revenue.</p>
          </div>
          
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-black">
                  <th className="px-4 py-4">Product</th>
                  <th className="px-4 py-4">Sales</th>
                  <th className="px-4 py-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {topProductsList.items.length > 0 ? topProductsList.items.map((product, index) => (
                  <tr key={index} className="group hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-5 font-bold text-zinc-900 text-sm truncate max-w-[150px] sm:max-w-none">{product.name}</td>
                    <td className="px-4 py-5 text-zinc-500 text-xs sm:text-sm font-medium">{product.sales}</td>
                    <td className="px-4 py-5 text-zinc-900 font-black text-sm text-right">{product.revenue}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-zinc-300 font-bold text-sm italic">No sales recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {topProductsList.hasMore && (
            <div className="mt-6">
              <button 
                onClick={() => setVisibleTopPerformersCount(prev => prev + 10)}
                className="w-full py-4 border border-zinc-100 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all"
              >
                Load More Performers
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderManager({ onSeedClick }: { onSeedClick?: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateOrder = async (orderId: string, updates: any) => {
    setUpdatingOrderId(orderId);
    const toastId = toast.loading('Updating order...');
    try {
      await updateDoc(doc(db, 'orders', orderId), updates);
      toast.success('Order updated successfully', { id: toastId });
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error(error.message || 'Failed to update order', { id: toastId });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (
      (order.orderId && order.orderId.toLowerCase().includes(searchLower)) ||
      (order.id && order.id.toLowerCase().includes(searchLower)) ||
      (order.customerEmail && order.customerEmail.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Orders"
        description="Manage and track customer orders"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search orders..."
        }}
        secondaryActions={[
          { label: 'Seed Test Data', icon: Database, onClick: onSeedClick },
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredOrders, 'orders') }
        ].filter(a => a.onClick !== undefined) as any}
        statsLabel={`${filteredOrders.length} orders`}
      />

      {/* Info Message */}
      <div className="bg-amber-50 border border-amber-200 rounded p-4 text-sm text-amber-800 flex items-center gap-3">
        <RefreshCcw className="w-5 h-5 text-amber-600 shrink-0" />
        <p>Automated label printing requires configuration. Please go to Shipping Settings to enable your preferred service and configure your API settings.</p>
      </div>

      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 sm:px-6 py-4 font-semibold">Order ID</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Date</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Customer</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Total</th>
                <th className="px-4 sm:px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr 
                    className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <td className="px-4 sm:px-6 py-4 font-medium font-mono text-sm flex items-center text-zinc-900 group-hover:text-zinc-900">
                      {expandedOrderId === order.id ? <ChevronDown className="w-4 h-4 mr-2 text-zinc-400 shrink-0" /> : <ChevronRight className="w-4 h-4 mr-2 text-zinc-400 shrink-0" />}
                      <span className="truncate">#{order.orderId || order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 font-medium truncate max-w-[200px]">{order.customerEmail || 'Guest'}</td>
                    <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{order.total?.toLocaleString()} SEK</td>
                    <td className="px-4 sm:px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-green-50 text-green-700 border border-green-200/50' : 
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                        'bg-amber-50 text-amber-700 border border-amber-200/50'
                      }`}>
                        {order.status || 'Processing'}
                      </span>
                    </td>
                  </tr>
                  {expandedOrderId === order.id && (
                    <tr>
                      <td colSpan={5} className="p-0 bg-gray-50/50 border-b border-gray-100">
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          className="px-12 py-6"
                        >
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Order Items</h4>
                          <div className="space-y-3">
                            {order.items?.map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden border border-gray-200/50">
                                    {item.image && item.image.trim() !== "" ? (
                                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Package className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} × {item.price} SEK</p>
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {(item.quantity * item.price).toLocaleString()} SEK
                                </div>
                              </div>
                            ))}
                            {(!order.items || order.items.length === 0) && (
                              <p className="text-sm text-gray-500">No items found for this order.</p>
                            )}
                          </div>

                          <div className="mt-8 pt-6 border-t border-gray-200/60 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Update Status</h4>
                              <div className="flex items-center space-x-3">
                                <select
                                  value={order.status || 'Pending'}
                                  onChange={(e) => handleUpdateOrder(order.id, { status: e.target.value })}
                                  disabled={updatingOrderId === order.id}
                                  className="flex-1 bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Processing">Processing (Picking)</option>
                                  <option value="Shipped">Shipped (Sending)</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="Refunded">Refunded</option>
                                  <option value="Replaced">Replaced</option>
                                </select>
                                {updatingOrderId === order.id && <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Tracking Information</h4>
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  placeholder="Carrier (e.g., PostNord, DHL)"
                                  defaultValue={order.trackingCarrier || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== order.trackingCarrier) {
                                      handleUpdateOrder(order.id, { trackingCarrier: e.target.value });
                                    }
                                  }}
                                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
                                />
                                <input
                                  type="text"
                                  placeholder="Tracking Number"
                                  defaultValue={order.trackingNumber || ''}
                                  onBlur={(e) => {
                                    if (e.target.value !== order.trackingNumber) {
                                      handleUpdateOrder(order.id, { trackingNumber: e.target.value });
                                    }
                                  }}
                                  className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-zinc-900 focus:border-zinc-900 block w-full p-2.5"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-900">No orders yet</p>
                    <p className="text-sm mt-1">When customers place orders, they will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function PageManager() {
  const customConfirm = useCustomConfirm();
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<StaticPage | null>(null);
  const [activeTranslationLang, setActiveTranslationLang] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  const filteredPages = pages.filter(page => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (
      (page.title.en && page.title.en.toLowerCase().includes(searchLower)) ||
      (page.title.sv && page.title.sv.toLowerCase().includes(searchLower)) ||
      (page.slug && page.slug.toLowerCase().includes(searchLower))
    );
  });

  const toggleAllPages = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(pages.map(p => p.id!));
    }
  };

  const togglePageSelection = (id: string) => {
    if (selectedPages.includes(id)) {
      setSelectedPages(selectedPages.filter(pId => pId !== id));
    } else {
      setSelectedPages([...selectedPages, id]);
    }
  };

  const deleteSelectedPages = async () => {
    const confirmed = await customConfirm('Delete Pages', `Are you sure you want to delete ${selectedPages.length} pages?`);
    if (!confirmed) return;

    const toastId = toast.loading('Deleting pages...');
    try {
      await Promise.all(selectedPages.map(id => deleteDoc(doc(db, 'pages', id))));
      toast.success('Pages deleted successfully', { id: toastId });
      setSelectedPages([]);
    } catch (error) {
      console.error("Error deleting pages:", error);
      toast.error('Failed to delete pages', { id: toastId });
    }
  };
  const [seeding, setSeeding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const settings = useSettingsStore((state) => state.settings);
  const languages = settings.languages || ['en'];
  
  const [formData, setFormData] = useState<{
    title: LocalizedString;
    slug: string;
    content: LocalizedString;
  }>({
    title: { en: '' },
    slug: '',
    content: { en: '' }
  });

  const handleAIAutoComplete = async () => {
    if (!formData.title.en) {
      toast.error('Please provide an English title first.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('AI is generating content...');
    try {
      const ai = getAI();
      const prompt = `Generate professional content for a static page titled "${formData.title.en}" for an e-commerce store.
      Return ONLY the markdown content, no other commentary.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });
      
      const text = response.text || '';
      setFormData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          en: text.trim()
        }
      }));
      toast.success('Content generated!', { id: toastId });
    } catch (error) {
      console.error("AI AutoComplete error:", error);
      toast.error('Failed to generate content', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslate = async () => {
    if (!formData.title.en || !formData.content.en) {
      toast.error('Please provide English title and content first.');
      return;
    }
    
    setGenerating(true);
    const toastId = toast.loading('Translating to all languages...');
    
    try {
      const ai = getAI();
      const prompt = `Translate the following title and content into these languages: ${languages.filter(l => l !== 'en').join(', ')}.
      Title: "${formData.title.en}"
      Content: "${formData.content.en}"
      Return ONLY a JSON object matching this structure:
      {
        "title": { "langCode": "translated title" },
        "content": { "langCode": "translated content" }
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const translations = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        title: {
          ...prev.title,
          ...(translations.title || {})
        },
        content: {
          ...prev.content,
          ...(translations.content || {})
        }
      }));
      toast.success('Translated successfully!', { id: toastId });
    } catch (error) {
      console.error("AI Translate error:", error);
      toast.error('Failed to translate content', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'pages'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StaticPage[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pages');
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = await customConfirm('Delete Page', 'Are you sure you want to delete this page?');
    if (confirmed) {
      try {
        await deleteDoc(doc(db, 'pages', id));
        toast.success('Page deleted');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'pages');
        toast.error('Failed to delete page');
      }
    }
  };

  const handleEdit = (page: StaticPage) => {
    setEditingPage(page);
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPage(null);
    setFormData({ title: { en: '' }, slug: '', content: { en: '' } });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pageData = {
        title: formData.title,
        slug: formData.slug || formData.title.en?.toLowerCase().replace(/\s+/g, '-'),
        content: formData.content,
        updatedAt: new Date().toISOString()
      };

      if (editingPage?.id) {
        await updateDoc(doc(db, 'pages', editingPage.id!), pageData);
        toast.success('Page updated successfully');
      } else {
        await addDoc(collection(db, 'pages'), pageData);
        toast.success('Page added successfully');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error('Failed to save page');
    }
  };

  const handleSeedPages = async () => {
    setSeeding(true);
    const toastId = toast.loading('Seeding default pages...');
    try {
      const defaultPages = [
        { title: 'Support', slug: 'support', content: '# Support\n\nHow can we help you today?' },
        { title: 'FAQ', slug: 'faq', content: '# Frequently Asked Questions\n\nFind answers to common questions here.' },
        { title: 'Shipping & Returns', slug: 'shipping-returns', content: '# Shipping & Returns\n\nOur policies on shipping and returns.' },
        { title: 'Contact Us', slug: 'contact', content: '# Contact Us\n\nGet in touch with our team.' },
        { title: 'Privacy Policy', slug: 'privacy-policy', content: '# Privacy Policy\n\nYour privacy is important to us.' }
      ];

      for (const page of defaultPages) {
        // Check if page already exists by slug
        const q = query(collection(db, 'pages'), where('slug', '==', page.slug));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await addDoc(collection(db, 'pages'), {
            ...page,
            updatedAt: new Date().toISOString()
          });
        }
      }
      toast.success('Default pages seeded successfully!', { id: toastId });
    } catch (error) {
      console.error("Seeding error:", error);
      toast.error('Failed to seed pages', { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Pages"
        description="Manage static pages like About, Contact, and Policies"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search pages..."
        }}
        primaryAction={{
          label: "Add Page",
          icon: Plus,
          onClick: handleAddNew
        }}
        secondaryActions={[
          { label: 'Seed Defaults', icon: RefreshCw, onClick: handleSeedPages },
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredPages, 'pages') }
        ]}
        statsLabel={`${filteredPages.length} pages`}
      />
      
      <div className="py-8 border-b border-gray-200/60 last:border-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-4 font-bold">
                  <input type="checkbox" checked={selectedPages.length === pages.length && pages.length > 0} onChange={toggleAllPages} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                </th>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Slug</th>
                <th className="px-6 py-4 font-bold">Last Updated</th>
                <th className="px-6 py-4 font-bold text-right">
                  {selectedPages.length > 0 && (
                    <button onClick={deleteSelectedPages} className="w-full sm:w-auto flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors">
                      Delete ({selectedPages.length})
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-zinc-50 transition-colors group">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedPages.includes(page.id!)} onChange={() => togglePageSelection(page.id!)} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-zinc-900">{page.title['en']}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 font-mono">
                    <span className="bg-zinc-100 px-2 py-1 rounded">/{page.slug}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    {new Date(page.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(page)}
                        className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        title="Edit Page"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(page.id!)}
                        className="p-2 text-red-500 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <div className="w-12 h-12 bg-zinc-50 rounded flex items-center justify-center mx-auto mb-3">
                      <FileCode className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-lg font-medium text-zinc-900">No pages yet</p>
                    <p className="text-sm mt-1">Add a page manually or seed default pages to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
              <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">{editingPage ? 'Edit Page' : 'Add New Page'}</h3>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleAIAutoComplete}
                  disabled={generating}
                  className="flex items-center justify-center px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  {generating ? '...' : 'Auto-Fill'}
                </button>
                <button 
                  type="button"
                  onClick={handleAITranslate}
                  disabled={generating}
                  className="flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  <Languages className="w-3.5 h-3.5 mr-1.5" />
                  {generating ? '...' : 'Translate'}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-zinc-50/30">
              <form onSubmit={handleSubmit} className="px-4 py-3 space-y-4">
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 border-b border-zinc-200">
                  <button 
                    type="button"
                    onClick={() => setActiveTranslationLang(null)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTranslationLang === null ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                  >
                    {languages[0]?.trim().toUpperCase() || 'EN'}
                  </button>
                  {languages?.slice(1).map(lang => (
                    <button 
                      key={lang}
                      type="button"
                      onClick={() => setActiveTranslationLang(lang.trim())}
                      className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTranslationLang === lang.trim() ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}
                    >
                      {lang.trim().toUpperCase()}
                    </button>
                  ))}
                </div>

                {activeTranslationLang ? (
                  <div className="space-y-4 py-4">
                    <h4 className="text-sm font-semibold text-zinc-900">Translation: {activeTranslationLang.toUpperCase()}</h4>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Title ({activeTranslationLang.toUpperCase()})</label>
                      <input 
                        type="text" 
                        value={formData.title[activeTranslationLang] || ''} 
                        onChange={e => setFormData(prev => ({ ...prev, title: { ...prev.title, [activeTranslationLang]: e.target.value } }))} 
                        className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Content ({activeTranslationLang.toUpperCase()})</label>
                      <textarea 
                        style={{ minHeight: '160px' }}
                        value={formData.content[activeTranslationLang] || ''} 
                        onChange={e => setFormData(prev => ({ ...prev, content: { ...prev.content, [activeTranslationLang]: e.target.value } }))} 
                        className="w-full border border-zinc-200 rounded-md p-4 focus:ring-2 focus:ring-zinc-900 outline-none font-mono text-sm" 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Title (Default)</label>
                        <input required type="text" value={formData.title[languages[0]] || ''} onChange={e => setFormData({...formData, title: {...formData.title, [languages[0]]: e.target.value}})} className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Slug (URL path)</label>
                        <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="e.g. privacy-policy" className="w-full border border-zinc-200 rounded-md px-4 h-[44px] focus:ring-2 focus:ring-zinc-900 outline-none text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Content (Default)</label>
                      <textarea 
                        required 
                        style={{ minHeight: '160px' }}
                        value={formData.content[languages[0]] || ''} 
                        onChange={e => setFormData({...formData, content: {...formData.content, [languages[0]]: e.target.value}})} 
                        className="w-full border border-zinc-200 rounded-md p-4 focus:ring-2 focus:ring-zinc-900 outline-none font-mono text-sm"></textarea>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-zinc-200 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); setEditingPage(null); }}
                    className="flex-1 flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-6 h-[44px] text-sm font-medium rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 h-[44px] text-sm font-medium rounded-md transition-colors">{editingPage ? 'Update Page' : 'Add Page'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}











const PRESET_COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Gray', hex: '#6B7280' },
];

function ProductList({ selectedProductId, onClearSelection }: { selectedProductId: string | null, onClearSelection: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
    product.id.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const { settings } = useSettingsStore();
  const customConfirm = useCustomConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const productsToAdd = results.data as any[];
        // Add products to database
        for (const product of productsToAdd) {
          if (product.title) {
            await addDoc(collection(db, 'products'), {
              title: product.title,
              description: product.description || '',
              price: Number(product.price) || 0,
              stock: Number(product.stock) || 0,
              imageUrl: product.imageUrl || '',
              category: product.category || '',
              createdAt: serverTimestamp()
            });
          }
        }
        toast.success('Products imported successfully');
      }
    });
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct(null);
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (selectedProductId && products.length > 0) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        handleOpenModal(product);
      }
    }
  }, [selectedProductId, products]);
  
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const toggleAllProducts = () => {
    setSelectedProducts(prev => 
      prev.length === products.length ? [] : products.map(p => p.id)
    );
  };

  const deleteSelectedProducts = async () => {
    if (await customConfirm('Delete Products', 'Are you sure you want to delete the selected products?')) {
      for (const id of selectedProducts) {
        await deleteDoc(doc(db, 'products', id));
      }
      setSelectedProducts([]);
      toast.success('Selected products deleted');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast.error('Failed to load products.');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (id: string) => {
    const confirmed = await customConfirm('Delete Product', 'Are you sure you want to delete this product?');
    if (!confirmed) return;

    const toastId = toast.loading('Deleting product...');
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted successfully', { id: toastId });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error('Failed to delete product', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
      <AdminHeader 
        title="Products"
        description="Manage your product catalog and inventory"
        primaryAction={{
          label: "Add Product",
          icon: Plus,
          onClick: () => handleOpenModal()
        }}
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search products..."
        }}
        secondaryActions={[
          { label: 'Import CSV', icon: FileCode, onClick: () => fileInputRef.current?.click() },
          { label: 'Export CSV', icon: Download, onClick: () => downloadCSV(filteredProducts, 'products') },
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredProducts, 'products') }
        ]}
        statsLabel={`${filteredProducts.length} products`}
      />
      
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-zinc-900 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 py-8 border-b border-gray-200/60 last:border-0">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-b border-zinc-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 font-bold">
                  <input type="checkbox" checked={selectedProducts.length === products.length && products.length > 0} onChange={toggleAllProducts} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                </th>
                <th className="px-4 sm:px-6 py-4 font-bold">Product</th>
                <th className="px-4 sm:px-6 py-4 font-bold hidden md:table-cell">SKU</th>
                <th className="px-4 sm:px-6 py-4 font-bold hidden lg:table-cell">ID</th>
                <th className="px-4 sm:px-6 py-4 font-bold hidden sm:table-cell">Price</th>
                <th className="px-4 sm:px-6 py-4 font-bold hidden sm:table-cell">Stock</th>
                <th className="px-4 sm:px-6 py-4 font-bold text-right">
                  {selectedProducts.length > 0 && (
                    <button onClick={deleteSelectedProducts} className="w-full sm:w-auto flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors">
                      Delete ({selectedProducts.length})
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleProductSelection(product.id)} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded bg-zinc-100 overflow-hidden flex-shrink-0 border border-zinc-200">
                        {product.imageUrl && <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 truncate max-w-[150px] sm:max-w-none">{product.title}</span>
                        <span className="text-[10px] text-zinc-400 md:hidden">SKU: {product.sku || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-600 hidden md:table-cell font-mono text-xs">{product.sku || 'N/A'}</td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-400 hidden lg:table-cell font-mono text-[10px]">{product.id}</td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-600 hidden sm:table-cell whitespace-nowrap">{product.price} SEK</td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-600 hidden sm:table-cell">{product.stock}</td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => updateDoc(doc(db, 'products', product.id!), { starred: !product.starred })}
                        className={`${product.starred ? 'text-amber-500' : 'text-zinc-400'} p-2 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors`}
                        title={product.starred ? "Unstar Product" : "Star Product"}
                      >
                        <Star className={`w-4 h-4 ${product.starred ? 'fill-amber-500' : ''}`} />
                      </button>
                      <button 
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingProduct(null); 
          onClearSelection();
        }}
        product={editingProduct}
        categories={categories}
        settings={settings}
      />
    </div>
  );
}


function DatabaseManager() {
  const [loading, setLoading] = useState(false);
  const customConfirm = useCustomConfirm();

  const handleSeedData = async () => {
    const confirmed = await customConfirm(
      'Seed Test Data',
      'This will create test support tickets and orders. Are you sure?',
      { confirmLabel: 'Seed Data', confirmVariant: 'primary' }
    );
    if (!confirmed) return;

    setLoading(true);
    const toastId = toast.loading('Seeding test data...');
    try {
      const batch = writeBatch(db);
      
      // Seed Support Tickets
      const ticketStatuses = ['open', 'in-progress', 'resolved', 'closed'];
      ticketStatuses.forEach((status, i) => {
        const ticketRef = doc(collection(db, 'tickets'));
        batch.set(ticketRef, {
          subject: `Test Ticket ${i + 1}`,
          description: `This is a test support ticket with status ${status}.`,
          status: status,
          customerEmail: auth.currentUser?.email || 'test@example.com',
          createdAt: new Date().toISOString(),
          isTestData: true
        });
      });

      // Seed Orders
      const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      orderStatuses.forEach((status, i) => {
        const orderRef = doc(collection(db, 'orders'));
        batch.set(orderRef, {
          orderId: `TEST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          userId: auth.currentUser?.uid || 'test-user-id',
          customerEmail: auth.currentUser?.email || 'test-customer@example.com',
          total: Math.floor(Math.random() * 5000) + 500,
          status: status,
          items: [
            { id: 'test-item-1', name: 'Test Product A', price: 299, quantity: 1 },
            { id: 'test-item-2', name: 'Test Product B', price: 499, quantity: 2 }
          ],
          createdAt: new Date(Date.now() - i * 86400000).toISOString(), // Spread over days
          isTestData: true
        });
      });

      await batch.commit();
      toast.success('Test data seeded successfully', { id: toastId });
    } catch (error: any) {
      console.error('Seed error:', error);
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    const confirmed = await customConfirm(
      'Clear Test Data',
      'This will remove all documents marked as test data. This action cannot be undone. Are you sure?',
      { confirmLabel: 'Clear Data', confirmVariant: 'danger' }
    );
    if (!confirmed) return;

    setLoading(true);
    const toastId = toast.loading('Clearing test data...');
    try {
      const collections = ['tickets', 'orders'];
      let deletedCount = 0;

      for (const collName of collections) {
        const q = query(collection(db, collName), where('isTestData', '==', true));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(d => {
            batch.delete(d.ref);
            deletedCount++;
          });
          await batch.commit();
        }
      }

      toast.success(`Cleared ${deletedCount} test records.`, { id: toastId });
    } catch (error: any) {
      console.error('Clear error:', error);
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader 
        title="Database Management"
        description="Seed or clear test data for development and support"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-100 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">Seed Test Data</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Generate sample support tickets and orders with various statuses to test your dashboard and workflows.
          </p>
          <button
            onClick={handleSeedData}
            disabled={loading}
            className="w-full flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 px-6 h-12 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
            Seed Test Data
          </button>
        </div>

        <div className="bg-white border border-zinc-100 rounded-3xl p-8 space-y-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">Clear Test Data</h3>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Remove all records marked as test data from the database. This will not affect real customer data.
          </p>
          <button
            onClick={handleClearData}
            disabled={loading}
            className="w-full flex items-center justify-center bg-white text-rose-600 hover:bg-rose-50 border border-rose-100 px-6 h-12 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Clear Test Data
          </button>
        </div>
      </div>
    </div>
  );
}

function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const customConfirm = useCustomConfirm();
  const settings = useSettingsStore((state) => state.settings);

  const filteredPosts = posts.filter(post => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    return (
      (post.title.en && post.title.en.toLowerCase().includes(searchLower)) ||
      (post.title.sv && post.title.sv.toLowerCase().includes(searchLower)) ||
      (post.author && post.author.toLowerCase().includes(searchLower))
    );
  });

  const toggleAllPosts = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(p => p.id!));
    }
  };

  const togglePostSelection = (id: string) => {
    if (selectedPosts.includes(id)) {
      setSelectedPosts(selectedPosts.filter(pId => pId !== id));
    } else {
      setSelectedPosts([...selectedPosts, id]);
    }
  };

  const deleteSelectedPosts = async () => {
    const confirmed = await customConfirm('Delete Posts', `Are you sure you want to delete ${selectedPosts.length} posts?`);
    if (!confirmed) return;

    const toastId = toast.loading('Deleting posts...');
    try {
      await Promise.all(selectedPosts.map(id => deleteDoc(doc(db, 'blogs', id))));
      toast.success('Posts deleted successfully', { id: toastId });
      setSelectedPosts([]);
    } catch (error) {
      console.error("Error deleting posts:", error);
      toast.error('Failed to delete posts', { id: toastId });
    }
  };

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: { en: '', sv: '', fi: '', da: '' },
    excerpt: { en: '', sv: '', fi: '', da: '' },
    content: { en: '', sv: '', fi: '', da: '' },
    imageUrl: '',
    author: ''
  });

  const [generating, setGenerating] = useState(false);

  const handleAIAutoComplete = async () => {
    if (!formData.title?.en) {
      toast.error('Please provide an English title first.');
      return;
    }
    setGenerating(true);
    const toastId = toast.loading('AI is generating content...');
    try {
      const ai = getAI();
      const prompt = `Generate a blog post excerpt and content for a post titled "${formData.title.en}" for an e-commerce store.
      Return ONLY a JSON object matching this structure:
      {
        "excerpt": "A short engaging summary",
        "content": "The full markdown content of the blog post"
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const generated = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        excerpt: {
          ...prev.excerpt,
          en: generated.excerpt || ''
        },
        content: {
          ...prev.content,
          en: generated.content || ''
        }
      }));
      toast.success('Content generated!', { id: toastId });
    } catch (error) {
      console.error("AI AutoComplete error:", error);
      toast.error('Failed to generate content', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const handleAITranslate = async () => {
    if (!formData.title?.en || !formData.content?.en) {
      toast.error('Please provide English title and content first.');
      return;
    }
    
    setGenerating(true);
    const toastId = toast.loading('Translating to all languages...');
    const languages = settings.languages || ['en'];
    
    try {
      const ai = getAI();
      const prompt = `Translate the following title, excerpt, and content into these languages: ${languages.filter(l => l !== 'en').join(', ')}.
      Title: "${formData.title.en}"
      Excerpt: "${formData.excerpt?.en || ''}"
      Content: "${formData.content.en}"
      Return ONLY a JSON object matching this structure:
      {
        "title": { "langCode": "translated title" },
        "excerpt": { "langCode": "translated excerpt" },
        "content": { "langCode": "translated content" }
      }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const translations = JSON.parse(response.text || '{}');
      setFormData(prev => ({
        ...prev,
        title: {
          ...prev.title,
          ...(translations.title || {})
        },
        excerpt: {
          ...prev.excerpt,
          ...(translations.excerpt || {})
        },
        content: {
          ...prev.content,
          ...(translations.content || {})
        }
      }));
      toast.success('Translated successfully!', { id: toastId });
    } catch (error) {
      console.error("AI Translate error:", error);
      toast.error('Failed to translate content', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching blogs:", error);
      toast.error('Failed to load blog posts.');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleOpenModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost(post);
      setFormData(post);
    } else {
      setEditingPost(null);
      setFormData({
        title: { en: '', sv: '', fi: '', da: '' },
        excerpt: { en: '', sv: '', fi: '', da: '' },
        content: { en: '', sv: '', fi: '', da: '' },
        imageUrl: '',
        author: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Uploading image...');

    try {
      const { uploadImageWithTimeout } = await import('@/lib/upload');
      const url = await uploadImageWithTimeout(file, `blogs/${Date.now()}_${file.name}`);
      setFormData({ ...formData, imageUrl: url });
      toast.success('Image uploaded successfully', { id: toastId });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || 'Failed to upload image', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(editingPost ? 'Updating post...' : 'Adding post...');
    
    try {
      if (editingPost) {
        await updateDoc(doc(db, 'blogs', editingPost.id!), formData);
        toast.success('Post updated successfully', { id: toastId });
      } else {
        await addDoc(collection(db, 'blogs'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Post added successfully', { id: toastId });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error('Failed to save post', { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await customConfirm('Delete Post', 'Are you sure you want to delete this post?');
    if (!confirmed) return;

    const toastId = toast.loading('Deleting post...');
    try {
      await deleteDoc(doc(db, 'blogs', id));
      toast.success('Post deleted successfully', { id: toastId });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error('Failed to delete post', { id: toastId });
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      <AdminHeader 
        title="Journal / Blog"
        description="Manage your blog posts and news"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Search posts..."
        }}
        primaryAction={{
          label: "New Post",
          icon: Plus,
          onClick: () => handleOpenModal()
        }}
        secondaryActions={[
          { label: 'Export XLSX', icon: Download, onClick: () => downloadXLSX(filteredPosts, 'blog_posts') }
        ]}
        statsLabel={`${filteredPosts.length} posts`}
      />
      
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-zinc-900 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 py-8 border-b border-gray-200/60 last:border-0">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-50/50 border-b border-zinc-200">
              <tr>
                <th className="px-4 sm:px-6 py-4 font-bold w-12">
                  <input type="checkbox" checked={selectedPosts.length === posts.length && posts.length > 0} onChange={toggleAllPosts} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                </th>
                <th className="px-4 sm:px-6 py-4 font-bold">Title</th>
                <th className="px-4 sm:px-6 py-4 font-bold hidden sm:table-cell">Author</th>
                <th className="px-4 sm:px-6 py-4 font-bold">Date</th>
                <th className="px-4 sm:px-6 py-4 font-bold text-right">
                  {selectedPosts.length > 0 && (
                    <button onClick={deleteSelectedPosts} className="w-full sm:w-auto flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors">
                      Delete ({selectedPosts.length})
                    </button>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <input type="checkbox" checked={selectedPosts.includes(post.id!)} onChange={() => togglePostSelection(post.id!)} className="w-5 h-5 rounded border-zinc-300 cursor-pointer" />
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-medium text-zinc-900 max-w-[150px] sm:max-w-[300px] truncate" title={typeof post.title === 'string' ? post.title : post.title?.en}>
                      {typeof post.title === 'string' ? post.title : post.title?.en}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-600 hidden sm:table-cell whitespace-nowrap">{post.author}</td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-600 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(post)}
                        className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                        title="Edit Post"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id!)}
                        className="p-2 text-red-500 hover:text-red-900 hover:bg-red-50 rounded transition-colors"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No blog posts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Blog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200/60 shadow-xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-3 py-2 h-[52px] border-b border-zinc-200 bg-zinc-50/50">
              <h3 className="text-[16px] font-semibold text-zinc-900 tracking-tight">
                {editingPost ? 'Edit Blog Post' : 'New Blog Post'}
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleAIAutoComplete}
                  disabled={generating}
                  className="flex items-center justify-center px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                  {generating ? '...' : 'Auto-Fill'}
                </button>
                <button 
                  type="button"
                  onClick={handleAITranslate}
                  disabled={generating}
                  className="flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  <Languages className="w-3.5 h-3.5 mr-1.5" />
                  {generating ? '...' : 'Translate'}
                </button>
                <button onClick={handleCloseModal} className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors h-[36px] w-[36px] flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-zinc-50/30">
              <form onSubmit={handleSave} className="px-4 py-3 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Cover Image</label>
                    <div className="space-y-2">
                      {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Preview" className="w-full aspect-video object-cover rounded-md border border-zinc-200" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center bg-zinc-50 rounded-md border border-zinc-200 text-zinc-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <label className="cursor-pointer flex items-center justify-center w-full h-10 px-4 border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors text-sm font-medium text-zinc-700">
                        {uploading ? 'Uploading...' : 'Upload Image'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Author</label>
                    <input
                      type="text"
                      required
                      value={formData.author || ''}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Translations</label>
                    <div className="flex gap-1 p-1 bg-zinc-100 rounded-md overflow-x-auto custom-scrollbar">
                      {settings.languages.map(lang => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setSelectedLang(lang)}
                          className={`flex-1 px-3 h-[36px] rounded-md text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedLang === lang ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                        >
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Title"
                        value={typeof formData.title === 'string' ? (selectedLang === 'en' ? formData.title : '') : (formData.title?.[selectedLang] || '')}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          title: { ...(typeof formData.title === 'string' ? { en: formData.title } : formData.title), [selectedLang]: e.target.value } as any
                        })}
                        className="w-full px-4 h-[44px] bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm"
                      />
                      <textarea
                        placeholder="Excerpt"
                        rows={3}
                        value={typeof formData.excerpt === 'string' ? (selectedLang === 'en' ? formData.excerpt : '') : (formData.excerpt?.[selectedLang] || '')}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          excerpt: { ...(typeof formData.excerpt === 'string' ? { en: formData.excerpt } : formData.excerpt), [selectedLang]: e.target.value } as any
                        })}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm resize-none"
                      />
                      <textarea
                        placeholder="Content"
                        style={{ minHeight: '160px' }}
                        value={typeof formData.content === 'string' ? (selectedLang === 'en' ? formData.content : '') : (formData.content?.[selectedLang] || '')}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          content: { ...(typeof formData.content === 'string' ? { en: formData.content } : formData.content), [selectedLang]: e.target.value } as any
                        })}
                        className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900 transition-all text-sm font-mono resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setIsModalOpen(false); setEditingPost(null); }}
                    className="flex-1 flex items-center justify-center bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200 px-6 h-[44px] text-sm font-medium rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center bg-zinc-900 text-white hover:bg-zinc-800 border border-transparent px-6 h-[44px] text-sm font-medium rounded-md transition-colors disabled:opacity-50"
                  >
                    {editingPost ? 'Save Changes' : 'Add Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function AdminDashboard() {
  const { isAdmin, isAuthLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const customConfirm = useCustomConfirm();

  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && isAdmin === false) {
      router.replace('/');
    }
  }, [isAdmin, isAuthLoading, router]);

  if (isAuthLoading) { return <div className='flex items-center justify-center min-h-screen bg-gray-50'><div className='w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin'></div></div>; } if (!isAdmin) {
    return null;
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'collections', label: 'Collections', icon: Layout },
    { id: 'customers', label: 'Customers & CRM', icon: Users },
    { id: 'blogs', label: 'Journal / Blog', icon: FileText },
    { id: 'pages', label: 'Pages', icon: FileCode },
    { id: 'storefront', label: 'Storefront', icon: Settings },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  ];

  return (
    <div className="min-h-screen bg-white flex w-full font-sans selection:bg-zinc-900/30">
      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-white/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 bg-white text-zinc-600 z-50 flex flex-col  md:hidden"
            >
              <div className="flex items-center justify-between px-6 h-16 border-b border-slate-200/60">
                <h1 className="text-xl font-bold text-zinc-900 flex items-center tracking-tight">
                  <Settings className="w-5 h-5 mr-2 text-zinc-900" /> Admin
                </h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-500 hover:text-zinc-900 rounded transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { 
                      setActiveTab(item.id); 
                      setSelectedProductId(null);
                      setIsMobileMenuOpen(false); 
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md transition-all ${
                      activeTab === item.id 
                        ? 'bg-zinc-900 text-white font-medium' 
                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-zinc-500'}`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
              <div className="p-4 border-t border-slate-200/60">
                <button
                  onClick={() => auth.signOut()}
                  className="justify-start space-x-3 hover:bg-red-50 w-full sm:w-auto flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 px-6 py-3 text-sm font-medium rounded-md transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-white text-zinc-600 flex-shrink-0 flex-col h-screen sticky top-0 z-20 border-r border-slate-200/60">
        <div className="flex items-center p-6 h-16 border-b border-slate-200/60">
          <h1 className="text-lg font-bold text-zinc-900 flex items-center tracking-tight">
            <Settings className="w-5 h-5 mr-3 text-zinc-900" />
            Admin
          </h1>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="px-4 mb-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedProductId(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-all ${
                activeTab === item.id 
                  ? 'bg-zinc-900 text-white font-semibold shadow-sm' 
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-white' : 'text-zinc-400'}`} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>
        
        <div className="p-6 border-t border-slate-200/60">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center text-white font-bold text-sm mr-3">
              A
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 truncate">Admin User</p>
            </div>
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full flex items-center space-x-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200/60 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 -ml-2 mr-2 text-zinc-500 hover:bg-slate-100 rounded md:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-slate-800 capitalize hidden sm:block">
                {navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="hidden md:flex relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-9 pr-4 py-2 bg-slate-100/50 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 transition-all w-64"
                />
              </div>
              
              <NotificationCenter onNavigate={(path) => setActiveTab(path)} />
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:px-6 lg:py-8 custom-scrollbar">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="max-w-7xl mx-auto w-full pb-12"
          >
            {activeTab === 'overview' && <Overview onProductClick={(p) => { setSelectedProductId(p.id); setActiveTab('products'); }} onSeedClick={() => setActiveTab('database')} />}
            {activeTab === 'orders' && <OrderManager onSeedClick={() => setActiveTab('database')} />}
            {activeTab === 'products' && <ProductList selectedProductId={selectedProductId} onClearSelection={() => setSelectedProductId(null)} />}
            {activeTab === 'collections' && <CollectionManager />}
            {activeTab === 'customers' && <CustomersAndCRMManager />}
            {activeTab === 'blogs' && <BlogManager />}
            {activeTab === 'pages' && <PageManager />}
            {activeTab === 'database' && <DatabaseManager />}
            {activeTab === 'storefront' && (
              <StorefrontSettingsNew 
                handleSaveSettings={async (settings) => {
                  const toastId = toast.loading('Saving storefront settings...');
                  try {
                    await setDoc(doc(db, 'settings', 'storefront'), settings, { merge: true });
                    toast.success('Storefront settings saved successfully', { id: toastId });
                  } catch (error) {
                    console.error('Error saving settings:', error);
                    toast.error('Failed to save settings', { id: toastId });
                  }
                }} 
              />
            )}
            {activeTab === 'integrations' && <IntegrationsManager />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}



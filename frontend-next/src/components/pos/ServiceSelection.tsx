'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Clock, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { posApi } from '@/lib/api';
import { useCartStore } from '@/stores/cartStore';
import type { Service, Product } from '@/types/pos';

interface ServiceSelectionProps {
  onCheckout?: () => void;
}

export function ServiceSelection({ onCheckout }: ServiceSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { items, addItem } = useCartStore();

  // Fetch services using TanStack Query
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['pos-services'],
    queryFn: posApi.getServices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch products using TanStack Query
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products'],
    queryFn: posApi.getProducts,
    staleTime: 5 * 60 * 1000,
  });

  // Get unique categories from services
  const categories = useMemo(() => {
    const cats = new Set<string>();
    services.forEach((s: Service) => {
      if (s.category) cats.add(s.category);
    });
    return Array.from(cats);
  }, [services]);

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    return services.filter((service: Service) => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleAddService = (service: Service) => {
    addItem({
      id: service.id,
      name: service.name,
      price: service.price,
      type: 'service',
    });
  };

  const handleAddProduct = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      type: 'product',
    });
  };

  const isLoading = servicesLoading || productsLoading;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search services and products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "primary" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Services Grid */}
      {!isLoading && filteredServices.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Services
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredServices.map((service: Service) => (
              <Card
                key={service.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleAddService(service)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{service.name}</p>
                      {service.category && (
                        <Badge variant="neutral" className="text-xs">
                          {service.category}
                        </Badge>
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-lg font-bold mt-2">${service.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!isLoading && filteredProducts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Retail Products
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product: Product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleAddProduct(product)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{product.name}</p>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-lg font-bold mt-2">${product.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredServices.length === 0 && filteredProducts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No services or products found.</p>
          {searchQuery && (
            <Button variant="link" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

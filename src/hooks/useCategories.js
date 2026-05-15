import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryStore } from '@/api/base44Client';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryStore.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, icon }) => categoryStore.add({ name: name.trim(), icon }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ oldName, name, icon }) =>
      categoryStore.update(oldName, { name: name.trim(), icon }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name) => categoryStore.delete(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

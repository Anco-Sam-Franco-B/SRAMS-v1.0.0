import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function QueryProvider({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        onError: (error) => {
          toast.error(error?.response?.data?.error || 'Something went wrong');
        },
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

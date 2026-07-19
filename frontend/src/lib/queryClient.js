import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(error?.response?.data?.error || 'Something went wrong');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(error?.response?.data?.error || 'Operation failed');
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;

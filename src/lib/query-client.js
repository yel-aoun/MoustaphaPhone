import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			// Refresh when the tab regains focus so newly added products show up
			refetchOnWindowFocus: true,
			staleTime: 20_000,
			retry: 1,
		},
	},
});
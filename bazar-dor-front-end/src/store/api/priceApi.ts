import { baseApi } from '../baseApi';

export const priceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrices: builder.query({
      query: (params?: any) => ({ url: '/prices', params }),
      providesTags: ['Price'],
    }),
    getBasket: builder.query({
      query: (bazarId: string) => ({ url: '/prices/basket', params: { bazarId } }),
      providesTags: ['Price'],
    }),
    getHeatmap: builder.query({
      query: (productId: string) => ({ url: '/prices/heatmap', params: { productId } }),
      providesTags: ['Price'],
    }),
    getPriceHistory: builder.query({
      query: ({ productId, bazarId }: { productId: string; bazarId?: string }) => ({
        url: `/prices/history/${productId}`,
        params: bazarId ? { bazarId } : {},
      }),
      providesTags: ['Price'],
    }),
    submitPrice: builder.mutation({
      query: (formData: FormData) => ({
        url: '/prices',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Price'],
    }),
    votePrice: builder.mutation({
      query: ({ priceId, voteType }: { priceId: string; voteType: 'up' | 'down' }) => ({
        url: `/prices/${priceId}/vote`,
        method: 'POST',
        body: { voteType },
      }),
      invalidatesTags: ['Price'],
    }),
    markStockOut: builder.mutation({
      query: (priceId: string) => ({ url: `/prices/${priceId}/stock-out`, method: 'POST' }),
      invalidatesTags: ['Price'],
    }),
    deletePrice: builder.mutation({
      query: (priceId: string) => ({ url: `/prices/${priceId}`, method: 'DELETE' }),
      invalidatesTags: ['Price'],
    }),
  }),
});

export const {
  useGetPricesQuery,
  useGetBasketQuery,
  useGetHeatmapQuery,
  useGetPriceHistoryQuery,
  useSubmitPriceMutation,
  useVotePriceMutation,
  useMarkStockOutMutation,
  useDeletePriceMutation,
} = priceApi;

import { baseApi } from '../baseApi';

export const priceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPrices: builder.query({
      query: (params?: any) => ({ url: '/prices', params }),
      providesTags: ['Price'],
    }),
    deletePrice: builder.mutation({
      query: (id: string) => ({ url: `/prices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Price'],
    }),
  }),
});

export const {
  useGetPricesQuery,
  useDeletePriceMutation,
} = priceApi;

import { baseApi } from '../baseApi';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params?: any) => ({ url: '/products', params }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query({
      query: (id: string) => `/products/${id}`,
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id: string) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;

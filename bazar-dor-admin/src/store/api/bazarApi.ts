import { baseApi } from '../baseApi';

export const bazarApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBazars: builder.query({
      query: (params?: any) => ({ url: '/bazars', params }),
      providesTags: ['Bazar'],
    }),
    createBazar: builder.mutation({
      query: (body) => ({ url: '/bazars/add', method: 'POST', body }),
      invalidatesTags: ['Bazar'],
    }),
    updateBazar: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/bazars/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Bazar'],
    }),
    deleteBazar: builder.mutation({
      query: (id: string) => ({ url: `/bazars/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Bazar'],
    }),
  }),
});

export const {
  useGetBazarsQuery,
  useCreateBazarMutation,
  useUpdateBazarMutation,
  useDeleteBazarMutation,
} = bazarApi;

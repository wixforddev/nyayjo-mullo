import { baseApi } from '../baseApi';

export const alertApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query({
      query: (params?: any) => ({ url: '/alerts', params }),
      providesTags: ['Alert'],
    }),
    createAlert: builder.mutation({
      query: (body) => ({ url: '/alerts', method: 'POST', body }),
      invalidatesTags: ['Alert'],
    }),
    updateAlert: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/alerts/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Alert'],
    }),
    deleteAlert: builder.mutation({
      query: (id: string) => ({ url: `/alerts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Alert'],
    }),
  }),
});

export const {
  useGetAlertsQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useDeleteAlertMutation,
} = alertApi;

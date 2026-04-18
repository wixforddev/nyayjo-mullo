import { baseApi } from '../baseApi';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyStats: builder.query({
      query: () => '/users/me/stats',
      providesTags: ['User'],
    }),
    getLeaderboard: builder.query({
      query: () => '/users/leaderboard',
      providesTags: ['User'],
    }),
    getUsers: builder.query({
      query: (params?: any) => ({ url: '/users', params }),
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetMyStatsQuery,
  useGetLeaderboardQuery,
  useGetUsersQuery,
  useUpdateProfileMutation,
} = userApi;

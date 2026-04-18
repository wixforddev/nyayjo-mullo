import { baseApi } from '../baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    verifyEmail: builder.mutation({
      query: (body) => ({ url: '/auth/verify-email', method: 'POST', body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({ url: '/auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({ url: '/auth/reset-password', method: 'POST', body }),
    }),
    changePassword: builder.mutation({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
    }),
    deleteAccount: builder.mutation({
      query: (body) => ({ url: '/auth/delete-me', method: 'POST', body }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyEmailMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useDeleteAccountMutation,
} = authApi;

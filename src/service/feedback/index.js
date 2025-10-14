import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { dynamicBaseQuery } from '../badRequestHandler'

export const getImagesUrl = createApi({
  reducerPath: 'getImagesUrl',
  baseQuery: dynamicBaseQuery,
  endpoints: (builder) => ({
    addFeedback: builder.mutation({
      query: (body) => ({
        url: "/feedBack/addFeedback",   // <-- no leading slash
        method: "POST",
        body,
      }),
    }),
    getImagesUrl: builder.mutation({
      query: (body) => ({
        url: "/image",   // <-- no leading slash
        method: "POST",
        body,
      }),
    }),
    departmentList: builder.query({
      query: (body) => ({
        url: "/feedback/departmentList",   // <-- no leading slash
        method: "GET",
        body,
      }),
    }),
    imageDelete: builder.mutation({
      query: (img) => ({
        url: `/image?image=${encodeURIComponent(img)}`, // <-- no leading slash
        method: "DELETE",
      }),
    }),
  }),
})

export const { useGetImagesUrlMutation, useImageDeleteMutation,useAddFeedbackMutation ,useDepartmentListQuery} = getImagesUrl

import { configureStore } from "@reduxjs/toolkit";

import { getImagesUrl } from "./feedback";

export const store = configureStore({
  reducer: {
  
    [getImagesUrl.reducerPath]: getImagesUrl.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
 
      .concat(getImagesUrl.middleware)

});
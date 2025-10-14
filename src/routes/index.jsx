import {
  createBrowserRouter,
} from "react-router-dom";

import FeedbackPage from "../pages/feedBackForm";

import ThankYouScreen from "../pages/thankyou";
export const router = createBrowserRouter([
  
       {
        path: "/:branchId",
        element: <FeedbackPage />,
      },
       {
        path: "/thankyou/:branchId",
        element: <ThankYouScreen />,
      },

]);
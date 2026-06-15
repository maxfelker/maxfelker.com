import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import HomePage from "../HomePage";
import AboutPage from '../AboutPage'
import ArticlePage from '../ArticlePage'

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "/article/:slug",
    element: <ArticlePage />,
  },
]);

export default function App() {

  return <RouterProvider router={router} />
};
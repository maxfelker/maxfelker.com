import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import HomePage from "../HomePage";
import AboutPage from '../AboutPage'
import styles from './styles.module.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
]);

export default function App() {

  return (
    <div className={styles.gradientBackground + ' fade-in-slide-up '}>
      <RouterProvider router={router} />
    </div>
  )
};
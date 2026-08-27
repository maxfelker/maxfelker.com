import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import GameFrame from "../GameFrame";
import HomePage from "../HomePage";
import AboutPage from '../AboutPage'
import ArticlePage from '../ArticlePage'

// ponytail: placeholder until phase 5 builds the real pages
const UnderConstruction = () => (
  <p style={{ padding: '2rem', color: 'var(--gray)' }}>
    This area of the realm is still under construction. Return, brave traveler.
  </p>
)

const router = createBrowserRouter([
  {
    element: <GameFrame />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/about", element: <AboutPage /> },
      { path: "/article/:slug", element: <ArticlePage /> },
      { path: "/side-quests", element: <UnderConstruction /> },
      { path: "/character-sheet", element: <UnderConstruction /> },
    ],
  },
]);

export default function App() {

  return <RouterProvider router={router} />
};

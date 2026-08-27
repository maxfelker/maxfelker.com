import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import GameFrame from "../GameFrame";
import HomePage from "../HomePage";
import ArticlePage from '../ArticlePage'
import ScenePage from '../ScenePage'
import SideQuestsPage from '../SideQuestsPage'
import CharacterSheetPage from '../CharacterSheetPage'

const router = createBrowserRouter([
  {
    element: <GameFrame />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/engineer", element: <ScenePage slug="engineer" /> },
      { path: "/alchemist", element: <ScenePage slug="alchemist" /> },
      { path: "/leader", element: <ScenePage slug="leader" /> },
      { path: "/side-quests", element: <SideQuestsPage /> },
      { path: "/character-sheet", element: <CharacterSheetPage /> },
      // the old about page's content now lives across the scenes + character sheet
      { path: "/about", element: <Navigate to="/character-sheet" replace /> },
      { path: "/article/:slug", element: <ArticlePage /> },
    ],
  },
]);

export default function App() {

  return <RouterProvider router={router} />
};

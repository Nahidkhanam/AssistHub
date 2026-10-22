import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Contact from './pages/Contact';
import Tools from './pages/Tools';
import ToolDetail from './pages/ToolDetail';
import Checker from './pages/Checker';
import Auth from './pages/Auth';
import Account from './pages/Account';
import Suggest from './pages/Suggest';
import Admin from './pages/Admin';
import Privacy from './pages/Privacy';
import RequireAuth from './components/RequireAuth';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="learn" element={<Learn />} />
        <Route path="contact" element={<Contact />} />
        <Route path="tools" element={<Tools />} />
        <Route path="tools/:slug" element={<ToolDetail />} />
        <Route path="checker" element={<Checker />} />
        <Route path="login" element={<Auth mode="login" />} />
        <Route path="register" element={<Auth mode="register" />} />
        <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
        <Route path="suggest" element={<RequireAuth><Suggest /></RequireAuth>} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="admin" element={<RequireAuth admin><Admin /></RequireAuth>} />
        <Route path="*" element={<section className="mx-auto max-w-3xl px-4 py-20"><h1 className="text-4xl font-bold text-brand">Page not found</h1><p className="mt-4">Use the main menu to go to Home, Learn or Contact us.</p></section>} />
      </Route>
    </Routes>
  );
}

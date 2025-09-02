import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import CartPage from "@/pages/cart";
import OrdersPage from "@/pages/orders";
import RestaurantsPage from "@/pages/restaurants";
import TestPage from "@/pages/test";

function App() {
  return (
    <Routes>
      <Route element={<RestaurantsPage />} path="/" />
      <Route element={<DocsPage />} path="/docs" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<BlogPage />} path="/blog" />
      <Route element={<AboutPage />} path="/about" />
      <Route element={<CartPage />} path="/cart" />
      <Route element={<OrdersPage />} path="/orders" />
      <Route element={<TestPage />} path="/test" />
    </Routes>
  );
}

export default App;

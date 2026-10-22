import { Heart, ShoppingCart, Star, Wrench, Tractor } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f3f4f6'/%3E%3Crect x='110' y='60' width='80' height='60' rx='6' fill='%23d1d5db'/%3E%3Ccircle cx='130' cy='155' r='12' fill='%23d1d5db'/%3E%3Ccircle cx='170' cy='155' r='12' fill='%23d1d5db'/%3E%3Ctext x='150' y='185' text-anchor='middle' font-family='sans-serif' font-size='11' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function ProductCard({ product, auth, cartHook, wishlistHook, isAgriculture }) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = auth || {};
  const { addToCart, cartLoading } = cartHook || {};
  const { addToWishlist, removeFromWishlist, isInWishlist } = wishlistHook || {};

  if (!product) return null;

  const isAgri = Boolean(isAgriculture || product.category?.toLowerCase() === "agriculture");

  // Only regular customers (and guests) can use cart & wishlist
  // Dealers and admins are view-only
  const isCustomer = isLoggedIn && user?.role === "user";
  const canShop    = !isLoggedIn || isCustomer;

  const inWishlist = isInWishlist?.(product._id) || false;
  const discount =
    product.discount ||
    (product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const goDetail = () => navigate(`/products/${product._id}`);

  const handleCart = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate("/login"); return; }
    addToCart?.(product._id, 1, product.color);
  };

  const handleWish = (e) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate("/login"); return; }
    inWishlist ? removeFromWishlist?.(product._id) : addToWishlist?.(product._id);
  };

  // ── Existing Automotive Card (Preserved 100% for TVS / Automotive categories) ──
  if (!isAgri) {
    return (
      <div
        onClick={goDetail}
        className="card cursor-pointer overflow-hidden group
                   hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      >
        {/* Image */}
        <div className="relative bg-gray-50 overflow-hidden">
          <img
            src={product.image || FALLBACK_IMG}
            alt={product.title}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
          />
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-[#de1c0e] text-white text-xs font-bold px-2 py-0.5 rounded-lg">
              {discount}% OFF
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
          {product.stock > 0 && product.stock < 10 && (
            <span className="absolute bottom-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Low stock · Only {product.stock} left
            </span>
          )}

          {/* Wishlist button — customers and guests only */}
          {canShop && (
            <button
              onClick={handleWish}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); if (!isLoggedIn) { navigate("/login"); return; } inWishlist ? removeFromWishlist?.(product._id) : addToWishlist?.(product._id); }}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full shadow-md z-10
                          flex items-center justify-center transition-all
                          ${inWishlist ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-500"}`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Brand */}
          <p className="text-xs text-[#0a1f44] font-bold uppercase tracking-wide mb-0.5 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> {product.brand}
          </p>

          {/* Title — always 2 lines tall */}
          <h3
            className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-2"
            style={{ minHeight: "2.6rem" }}
          >
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="flex items-center gap-0.5 bg-green-100 text-green-800 text-xs font-bold px-1.5 py-0.5 rounded">
              {product.rating}
              <Star className="w-3 h-3 fill-current text-yellow-500" />
            </span>
            {product.numReviews > 0 && (
              <span className="text-xs text-gray-400">({product.numReviews})</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-base font-extrabold text-gray-900">
              ₹{product.price?.toLocaleString("en-IN")}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice?.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Add to Cart — customers and guests only */}
          {canShop ? (
            <button
              onClick={handleCart}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); if (!isLoggedIn) { navigate("/login"); return; } if (product.stock === 0 || cartLoading) return; addToCart?.(product._id, 1, product.color); }}
              disabled={product.stock === 0 || cartLoading}
              className="w-full flex items-center justify-center gap-1.5 relative z-10
                         bg-[#0a1f44] hover:bg-[#0d2657]
                         disabled:bg-gray-200 disabled:cursor-not-allowed
                         text-white disabled:text-gray-400
                         text-xs font-semibold py-2 rounded-xl
                         transition-colors active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          ) : (
            <button
              onClick={goDetail}
              className="w-full flex items-center justify-center gap-1.5 relative z-10
                         border-2 border-gray-200 text-gray-500
                         text-xs font-semibold py-2 rounded-xl
                         transition-colors hover:border-[#0a1f44] hover:text-[#0a1f44]"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Dedicated Agriculture Marketplace Card ──
  return (
    <div
      onClick={goDetail}
      className="group bg-[#fcfbf7] border border-[#e8e5dc] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-600/50 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
    >
      {/* Product Imagery */}
      <div className="relative bg-[#f4f1e8] aspect-[4/3] overflow-hidden flex items-center justify-center">
        <img
          src={product.image || FALLBACK_IMG}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />

        {/* Discount Tag */}
        {discount > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-amber-600 text-white font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
            {discount}% OFF
          </span>
        )}

        {/* Stock overlays */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-white/95 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow">
              Out of Stock
            </span>
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <span className="absolute bottom-2 left-2 bg-amber-500 text-gray-950 font-bold text-[10px] px-2 py-0.5 rounded-md shadow-sm">
            Low Stock · {product.stock} units
          </span>
        )}

        {/* Wishlist Button */}
        {canShop && (
          <button
            onClick={handleWish}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); if (!isLoggedIn) { navigate("/login"); return; } inWishlist ? removeFromWishlist?.(product._id) : addToWishlist?.(product._id); }}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full shadow-sm z-10
                        flex items-center justify-center transition-all backdrop-blur-sm
                        ${inWishlist ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-emerald-700 hover:bg-white"}`}
          >
            <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-current" : ""}`} />
          </button>
        )}
      </div>

      {/* Info & Action */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Brand & Subcategory Label */}
          <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <Tractor className="w-3.5 h-3.5 text-emerald-600" />
              {product.brand || "Agri Equipment"}
            </span>
            {product.subCategory && (
              <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {product.subCategory}
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-sm font-bold text-gray-900 group-hover:text-emerald-900 transition-colors line-clamp-2 leading-snug mb-2"
            style={{ minHeight: "2.6rem" }}
          >
            {product.title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 text-xs font-bold px-1.5 py-0.5 rounded">
              {product.rating}
              <Star className="w-3 h-3 fill-current text-amber-500" />
            </span>
            {product.numReviews > 0 && (
              <span className="text-xs text-gray-400">({product.numReviews})</span>
            )}
          </div>
        </div>

        <div>
          {/* Price */}
          <div className="pt-2 border-t border-gray-100 flex items-baseline gap-2 mb-3">
            <span className="text-base sm:text-lg font-black text-[#14532d] tracking-tight">
              ₹{product.price?.toLocaleString("en-IN")}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.originalPrice?.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Cart CTA */}
          {canShop ? (
            <button
              onClick={handleCart}
              onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); if (!isLoggedIn) { navigate("/login"); return; } if (product.stock === 0 || cartLoading) return; addToCart?.(product._id, 1, product.color); }}
              disabled={product.stock === 0 || cartLoading}
              className="w-full flex items-center justify-center gap-2 relative z-10
                         bg-[#166534] hover:bg-[#14532d] active:bg-[#0f3d21]
                         disabled:bg-gray-200 disabled:cursor-not-allowed
                         text-white disabled:text-gray-400
                         text-xs font-bold py-2.5 rounded-xl
                         shadow-sm hover:shadow transition-all active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          ) : (
            <button
              onClick={goDetail}
              className="w-full flex items-center justify-center gap-1.5 relative z-10
                         border-2 border-emerald-800/20 text-emerald-900 bg-emerald-50/40
                         hover:bg-emerald-100 hover:border-emerald-700
                         text-xs font-bold py-2 rounded-xl transition-colors"
            >
              View Specifications
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

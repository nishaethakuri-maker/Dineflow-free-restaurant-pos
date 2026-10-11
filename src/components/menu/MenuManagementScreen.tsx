import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { FoodType, MenuItem, Recipe, RecipeIngredient } from '../../types/pos';
import {
  UtensilsCrossed,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Leaf,
  Drumstick,
  Link,
  Save,
  Layers,
} from 'lucide-react';
import { posDb } from '../../db/storage';

export const MenuManagementScreen: React.FC = () => {
  const {
    menuItems,
    categories,
    inventory,
    recipes,
    saveRecipe,
    settings,
    showToast,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('all');

  // Edit / Add Item Modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItem, setIsNewItem] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [nameNepali, setNameNepali] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [price, setPrice] = useState<number>(200);
  const [costPrice, setCostPrice] = useState<number>(80);
  const [foodType, setFoodType] = useState<FoodType>('non-veg');
  const [image, setImage] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Recipe linking modal
  const [recipeItem, setRecipeItem] = useState<MenuItem | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  const filteredItems = menuItems.filter((item) => {
    if (selectedCat !== 'all' && item.categoryId !== selectedCat) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.nameNepali && item.nameNepali.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setIsNewItem(true);
    setEditingItem({
      id: `m-${Date.now()}`,
      name: '',
      code: `DISH-${Math.floor(10 + Math.random() * 89)}`,
      categoryId: categories[0]?.id || 'cat-momo',
      price: 200,
      costPrice: 80,
      foodType: 'non-veg',
      isAvailable: true,
      description: '',
    });
    setName('');
    setNameNepali('');
    setCode(`DISH-${Math.floor(10 + Math.random() * 89)}`);
    setCategoryId(categories[0]?.id || '');
    setPrice(200);
    setCostPrice(80);
    setFoodType('non-veg');
    setImage('');
    setDescription('');
  };

  const handleOpenEdit = (item: MenuItem) => {
    setIsNewItem(false);
    setEditingItem(item);
    setName(item.name);
    setNameNepali(item.nameNepali || '');
    setCode(item.code);
    setCategoryId(item.categoryId);
    setPrice(item.price);
    setCostPrice(item.costPrice);
    setFoodType(item.foodType);
    setImage(item.image || '');
    setDescription(item.description || '');
  };

  const handleSaveItem = () => {
    if (!name.trim()) {
      showToast('Item name is required', 'error');
      return;
    }

    const currentItems = posDb.getMenuItems();
    let updated: MenuItem[];

    if (isNewItem) {
      const newItem: MenuItem = {
        id: `m-${Date.now()}`,
        name: name.trim(),
        nameNepali: nameNepali.trim() || undefined,
        code: code.trim(),
        categoryId,
        price,
        costPrice,
        foodType,
        isAvailable: true,
        image: image.trim() || undefined,
        description: description.trim() || undefined,
      };
      updated = [...currentItems, newItem];
    } else if (editingItem) {
      updated = currentItems.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              name: name.trim(),
              nameNepali: nameNepali.trim() || undefined,
              code: code.trim(),
              categoryId,
              price,
              costPrice,
              foodType,
              image: image.trim() || undefined,
              description: description.trim() || undefined,
            }
          : it
      );
    } else {
      return;
    }

    posDb.saveMenuItems(updated);
    setEditingItem(null);
    showToast('Menu item saved successfully!', 'success');
  };

  const handleToggleAvailability = (item: MenuItem) => {
    const currentItems = posDb.getMenuItems();
    const updated = currentItems.map((it) =>
      it.id === item.id ? { ...it, isAvailable: !it.isAvailable } : it
    );
    posDb.saveMenuItems(updated);
    showToast(
      `${item.name} is now ${!item.isAvailable ? 'AVAILABLE' : 'MARKED SOLD OUT'}`,
      'info'
    );
  };

  const handleDeleteItem = (itemId: string) => {
    const currentItems = posDb.getMenuItems();
    const updated = currentItems.filter((i) => i.id !== itemId);
    posDb.saveMenuItems(updated);
    showToast('Item deleted from menu', 'info');
  };

  // Recipe Config Modal
  const handleOpenRecipeModal = (item: MenuItem) => {
    setRecipeItem(item);
    const existingRecipe = recipes.find((r) => r.menuItemId === item.id);
    if (existingRecipe) {
      setRecipeIngredients([...existingRecipe.ingredients]);
    } else {
      setRecipeIngredients([]);
    }
  };

  const handleAddRecipeIngredient = (invId: string) => {
    if (recipeIngredients.some((ri) => ri.inventoryItemId === invId)) return;
    setRecipeIngredients([...recipeIngredients, { inventoryItemId: invId, quantityRequired: 0.1 }]);
  };

  const handleUpdateRecipeQty = (invId: string, qty: number) => {
    setRecipeIngredients(
      recipeIngredients.map((ri) =>
        ri.inventoryItemId === invId ? { ...ri, quantityRequired: qty } : ri
      )
    );
  };

  const handleRemoveRecipeIngredient = (invId: string) => {
    setRecipeIngredients(recipeIngredients.filter((ri) => ri.inventoryItemId !== invId));
  };

  const handleSaveRecipe = () => {
    if (!recipeItem) return;
    saveRecipe({
      id: `rec-${recipeItem.id}`,
      menuItemId: recipeItem.id,
      ingredients: recipeIngredients,
    });
    setRecipeItem(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-full pb-20 select-none">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-emerald-400" />
            <span>Menu & Recipe Engineering</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure dishes, pricing in {settings.currencySymbol}, recipe ingredients, and variants
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Menu Item</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish by name or code..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
              selectedCat === 'all'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Categories ({menuItems.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedCat === cat.id
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const category = categories.find((c) => c.id === item.categoryId);
          const hasRecipe = recipes.some((r) => r.menuItemId === item.id);

          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🥟</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-950 px-1.5 py-0.5 rounded">
                      {item.code}
                    </span>
                    <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                  </div>
                  {item.nameNepali && (
                    <p className="text-[11px] text-slate-400 truncate">{item.nameNepali}</p>
                  )}
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    {category?.name} &bull; {item.foodType.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Pricing & Recipe Status */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    {settings.currencySymbol} {item.price}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Cost: {settings.currencySymbol} {item.costPrice}
                  </span>
                </div>

                {/* Actions: Recipe linking, Edit, Toggle Availability */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenRecipeModal(item)}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition ${
                      hasRecipe
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                    title="Configure Recipe Ingredients"
                  >
                    <Link className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{hasRecipe ? 'Recipe Linked' : 'No Recipe'}</span>
                  </button>

                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={`px-2 py-1 rounded-xl text-[10px] font-bold uppercase border transition ${
                      item.isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {item.isAvailable ? 'In Stock' : 'Sold Out'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Edit Item"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Dish Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">
                {isNewItem ? 'Create New Dish' : `Edit Dish: ${editingItem.name}`}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Item Name (English):</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chicken Chhoila Set"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Item Name (Nepali script, optional):
                </label>
                <input
                  type="text"
                  value={nameNepali}
                  onChange={(e) => setNameNepali(e.target.value)}
                  placeholder="e.g. चिकेन छोइला"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Item Code:</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Category:</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Selling Price (NPR):</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cost Price (NPR):</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Food Type:</label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value as FoodType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                  >
                    <option value="veg">Veg</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="egg">Egg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Image URL:</label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Description:</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
              >
                Save Dish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Ingredients Mapping Modal */}
      {recipeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg text-white shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Link className="w-4 h-4 text-emerald-400" />
                  <span>Recipe Ingredients: {recipeItem.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deducts these raw materials from stock each time this dish is ordered & prepared
                </p>
              </div>
              <button onClick={() => setRecipeItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Currently Mapped Ingredients */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
              {recipeIngredients.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No ingredients linked to this recipe yet. Add ingredients below.
                </p>
              ) : (
                recipeIngredients.map((ri) => {
                  const invItem = inventory.find((i) => i.id === ri.inventoryItemId);
                  if (!invItem) return null;

                  return (
                    <div
                      key={ri.inventoryItemId}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-xs text-white">{invItem.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">
                          ({invItem.currentStock} {invItem.unit} in stock)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.001"
                          value={ri.quantityRequired}
                          onChange={(e) =>
                            handleUpdateRecipeQty(ri.inventoryItemId, Number(e.target.value))
                          }
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs text-right font-mono text-white"
                        />
                        <span className="text-xs font-mono text-slate-400 w-8">{invItem.unit}</span>
                        <button
                          onClick={() => handleRemoveRecipeIngredient(ri.inventoryItemId)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Ingredient from Raw Materials Dropdown */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <label className="text-[11px] text-slate-400 block">Add Raw Material to Recipe:</label>
              <div className="flex gap-2">
                <select
                  id="recipe-inv-select"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.unit})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const el = document.getElementById('recipe-inv-select') as HTMLSelectElement;
                    if (el && el.value) handleAddRecipeIngredient(el.value);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
                >
                  + Add
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setRecipeItem(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRecipe}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Recipe</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

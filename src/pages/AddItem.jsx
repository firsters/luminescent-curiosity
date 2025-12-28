import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useInventory } from "../context/InventoryContext";
import { useModal } from "../context/ModalContext";
import { useFridge } from "../context/FridgeContext";
import { fetchProductData } from "../lib/productFetcher";
import { uploadImage } from "../lib/storage";
import BarcodeScanner from "../components/BarcodeScanner";
import { compressImage } from "../lib/imageCompression";
import { safeDateToIso, parseLocal } from "../lib/dateUtils";

import { analyzeFoodImage } from "../lib/gemini";
import {
  removeBackground,
  cropTransparent,
  cropToBox,
} from "../lib/imageProcessing";

import { useInventory, CATEGORY_LABELS } from "../context/InventoryContext";

export default function AddItem() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    addItem, 
    updateItem, 
    categories, 
    updateCategories
  } = useInventory();
  const { showAlert, showConfirm } = useModal();
  const { fridges } = useFridge();

  // Check if we are in Edit Mode
  const editModeItem = location.state?.editItem;
  const isEditMode = !!editModeItem;

  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    return {
      name: "",
      foodCategory: "fruit", // fruit, vegetable, meat, dairy, frozen
      fridgeId: "", // Selected Fridge ID
      quantity: 1,
      unit: "개",
      capacity: "", // New: Capacity
      capacityUnit: "g", // New: Unit
      expiryDate: todayStr,
      buyDate: todayStr,
      barcode: "",
    };
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastAiBox, setLastAiBox] = useState(null);

  // Initialize form with Edit Data if available
  useEffect(() => {
    if (isEditMode) {
      console.log("AddItem EditMode Item:", editModeItem);
      setFormData({
        name: editModeItem.name || "",
        foodCategory: editModeItem.foodCategory || "fruit",
        fridgeId: editModeItem.fridgeId || "",
        quantity: editModeItem.quantity || 1,
        unit: editModeItem.unit || "개",
        capacity: editModeItem.capacity || "",
        capacityUnit: editModeItem.capacityUnit || "g",
        expiryDate: safeDateToIso(editModeItem.expiryDate),
        buyDate: safeDateToIso(editModeItem.addedDate),
        barcode: editModeItem.barcode || "",
      });

      if (editModeItem.photoUrl) {
        setImagePreview(editModeItem.photoUrl);
      }
    } else if (!formData.fridgeId) {
      // If we have a passed fridgeId from navigation, use it.
      if (location.state?.fridgeId) {
        setFormData((prev) => ({ ...prev, fridgeId: location.state.fridgeId }));
      } else if (fridges.length === 1) {
        // If there is only one fridge, auto-select it.
        setFormData((prev) => ({ ...prev, fridgeId: fridges[0].id }));
      }
      // Otherwise (multiple fridges & no selection passed), leave it empty
    }
  }, [isEditMode, editModeItem, fridges, location.state]);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleChipChange = (field, value) => {
    // Default Unit & Expiry Logic based on Category
    if (field === "foodCategory") {
      const categoryObj = categories.find((c) => c.id === value);
      const defaultDays = categoryObj?.defaultExpiryDays || 7;

      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + defaultDays);

      const expiryStr = `${expiryDate.getFullYear()}-${String(
        expiryDate.getMonth() + 1
      ).padStart(2, "0")}-${String(expiryDate.getDate()).padStart(2, "0")}`;

      let defaultUnit = "g";
      if (["dairy", "drink", "sauce"].includes(value)) defaultUnit = "ml";
      else if (["meat", "vegetable", "fruit"].includes(value))
        defaultUnit = "g";
      else if (["frozen", "snack"].includes(value)) defaultUnit = "g";

      setFormData((prev) => ({
        ...prev,
        [field]: value,
        expiryDate: expiryStr,
        capacityUnit: defaultUnit,
      }));
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleQuantity = (delta) => {
    setFormData((prev) => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + delta),
    }));
  };

  const handleCategoryDelete = async (id) => {
    if (!(await showConfirm("이 카테고리를 삭제하시겠습니까?"))) return;
    const newCats = categories.filter((c) => c.id !== id);
    updateCategories(newCats);

    // If selected category was deleted, reset to first available
    if (formData.foodCategory === id && newCats.length > 0) {
      setFormData((prev) => ({ ...prev, foodCategory: newCats[0].id }));
    }
  };

  const handleCategoryAdd = () => {
    if (!newCategoryName.trim()) return;
    const newId = newCategoryName.trim();
    if (categories.some((c) => c.label === newCategoryName.trim())) {
      return await showAlert("이미 존재하는 카테고리입니다.");
    }

    const newCats = [
      ...categories,
      { id: newId, label: newCategoryName.trim() },
    ];
    updateCategories(newCats);
    setNewCategoryName("");
    setFormData((prev) => ({ ...prev, foodCategory: newId }));
  };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refactored Background Removal Logic (Helper)
  const processBackgroundRemoval = async (file, boundingBox = null) => {
    if (!file) return null;
    try {
      setIsProcessing(true);
      const transparentBlob = await removeBackground(file);

      // Use AI Box for more precise vertical cropping if available
      let croppedBlob;
      if (boundingBox) {
        console.log("Using Bounding Box for cropping:", boundingBox);
        croppedBlob = await cropToBox(transparentBlob, boundingBox);
      } else {
        // Fallback to alpha-based heuristic
        croppedBlob = await cropTransparent(transparentBlob);
      }
      return croppedBlob;
    } catch (error) {
      console.error("BG Removal failed:", error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualRemoveBackground = async () => {
    if (!imageFile) return;
    try {
      const croppedBlob = await processBackgroundRemoval(imageFile, lastAiBox);
      if (croppedBlob) {
        setImageFile(croppedBlob);
        setImagePreview(URL.createObjectURL(croppedBlob));
      }
    } catch (error) {
      await showAlert("배경 제거 중 오류가 발생했습니다.");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setIsAnalyzing(true);
        const compressedFile = await compressImage(file, 400, 0.6);
        setImageFile(compressedFile);
        setImagePreview(URL.createObjectURL(compressedFile));

        // 1. AI Analysis
        const aiResult = await analyzeFoodImage(compressedFile);
        if (aiResult?.error) {
          await showAlert(`❌ 오류 발생: ${aiResult.error}`);
        } else if (aiResult) {
          setFormData((prev) => ({
            ...prev,
            name: aiResult.name || prev.name,
            foodCategory: aiResult.category || prev.foodCategory,
            expiryDate: aiResult.expiryDate || prev.expiryDate,
          }));
          const box = aiResult.boundingBox || null;
          setLastAiBox(box);

          // 3. Auto-Add Category if new
          if (
            aiResult.category &&
            !categories.find((c) => c.id === aiResult.category)
          ) {
            console.log("Auto-adding new category:", aiResult.category);
            const newCat = {
              id: aiResult.category,
              label: CATEGORY_LABELS[aiResult.category] || aiResult.category,
            };
            updateCategories([...categories, newCat]);
          }

          // 2. Automatic Background Removal
          try {
            const croppedBlob = await processBackgroundRemoval(
              compressedFile,
              box
            );
            if (croppedBlob) {
              setImageFile(croppedBlob);
              setImagePreview(URL.createObjectURL(croppedBlob));
            }
          } catch (bgError) {
            console.error(
              "Automatic BG removal failed, keeping original",
              bgError
            );
            // Non-blocking error for automation
          }

          // Restore Feedback Alert
          await showAlert(
            `✨ AI 분석 완료!\n제품명: ${aiResult.name}\n카테고리: ${aiResult.category}\n소비기한: ${aiResult.expiryDate}${aiResult.isDetected ? " (사진에서 인식됨)" : " (권장 기한)"}\n\n결과가 자동으로 입력되었습니다.`
          );
        }
      } catch (error) {
        console.error("Image processing/AI failed:", error);
        await showAlert("이미지 처리 중 오류가 발생했습니다.");
      } finally {
        setIsAnalyzing(false);
        setLoading(false);
      }
    }
  };

  const handleBarcodeDetected = async (barcode) => {
    setScanning(false);
    setLoading(true);
    setFormData((prev) => ({ ...prev, barcode }));

    try {
      const product = await fetchProductData(barcode);
      if (product) {
        // Construct full name with brand if available
        const brandPrefix = product.brand ? `[${product.brand}] ` : "";
        const fullName = `${brandPrefix}${product.name}`;

        setFormData((prev) => ({
          ...prev,
          name: fullName,
          // Only update category if we have a valid mapping, otherwise keep default or user selection
          foodCategory: product.category || prev.foodCategory,
          // We could also try to parse quantity from product.quantity string (e.g. "500g")
          // but units vary wildly, so keeping manual input for now.
        }));

        if (product.imageUrl) {
          setImageFile(null);
          setImagePreview(product.imageUrl);
        }
        await showAlert(
          `제품을 찾았습니다:\n${fullName}\n(카테고리: ${product.category})`
        );
      } else {
        // Product Not Found -> PROMPT Manual Entry
        if (
          await showConfirm(
            `제품 정보를 찾을 수 없습니다.\n(바코드: ${barcode})\n\n직접 등록하시겠습니까?`
          )
        ) {
          // User wants to register manually
          // Barcode is already set in formData via setFormData above
          // Just ensure we are ready for input
          // potentially focus the name input if we had a ref, but simple state update is enough
        } else {
          // User cancelled, maybe scanned wrong item?
          // Do we reopen scanner? Or just stay on form?
          // Current behavior: Scanner closed (setScanning(false) called at start)
          // Stays on form with barcode filled. This is fine.
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return await showAlert("이름을 입력해주세요.");
    if (!formData.fridgeId) return await showAlert("보관할 냉장고를 선택해주세요.");

    setLoading(true);
    try {
      let photoUrl = imagePreview;

      // Upload new image if selected
      if (imageFile) {
        photoUrl = await uploadImage(imageFile);
      } else if (
        imagePreview &&
        !imagePreview.startsWith("http") &&
        !imagePreview.startsWith("blob")
      ) {
        // If it's a base64 or something else not http/blob, treat as null (shouldn't happen with current logic usually)
        // But if it's existing URL (starts with http), we keep it.
        // If it is blob (preview), we should have imageFile.
      } else if (!imagePreview) {
        photoUrl = null;
      }

      // Explicitly parse dates as Local Time (00:00) to avoid UTC conversion shifts
      const itemData = {
        name: formData.name,
        fridgeId: formData.fridgeId,
        foodCategory: formData.foodCategory,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        capacityUnit: formData.capacityUnit,
        expiryDate: parseLocal(formData.expiryDate),
        addedDate: parseLocal(formData.buyDate),
        barcode: formData.barcode,
        photoUrl: photoUrl,
      };

      if (isEditMode) {
        await updateItem(editModeItem.id, itemData);
      } else {
        await addItem(itemData);
      }

      // Navigate back to the fridge we just added/updated to
      const targetFridge = fridges.find((f) => f.id === formData.fridgeId);
      navigate(
        `/inventory?fridgeId=${formData.fridgeId}&fridgeName=${
          targetFridge?.name || "냉장고"
        }`,
        { replace: true }
      );
    } catch (error) {
      await showAlert((isEditMode ? "수정" : "적재") + " 중 오류 발생: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get visually distinct style for fridge types
  const getFridgeColor = (type) => {
    switch (type) {
      case "kimchi":
        return "border-red-200 bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30";
      case "freezer":
        return "border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30";
      case "pantry":
        return "border-orange-200 bg-orange-50 text-orange-600 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-900/30";
      default:
        return "border-gray-200 bg-gray-50 text-gray-600 dark:bg-surface-dark dark:border-white/10 dark:text-gray-300";
    }
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col group/design-root overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark transition-colors duration-200">
      {scanning && (
        <BarcodeScanner
          onResult={handleBarcodeDetected}
          onClose={() => setScanning(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-10 bg-background-light dark:bg-background-dark">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined nav-icon">close</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-center">
          {isEditMode ? "음식 수정" : "음식 추가"}
        </h2>
        <div className="size-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Input Methods Grid - Only show in Add Mode */}
        {!isEditMode && (
          <div className="grid grid-cols-2 gap-2 p-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col gap-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 items-center justify-center shadow-sm active:scale-[0.98] transition-all hover:border-primary"
            >
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <span className="material-symbols-outlined text-[28px]">
                  photo_camera
                </span>
              </div>
              <span className="text-sm font-bold leading-tight whitespace-nowrap">
                사진 촬영
              </span>
            </button>

            {/* <button
              onClick={() => setScanning(true)}
              className="flex flex-col gap-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 items-center justify-center shadow-sm active:scale-[0.98] transition-all hover:border-primary"
            >
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <span className="material-symbols-outlined text-[28px]">
                  qr_code_scanner
                </span>
              </div>
              <span className="text-sm font-bold leading-tight whitespace-nowrap">
                바코드 스캔
              </span>
            </button> */}

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col gap-3 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 items-center justify-center shadow-sm active:scale-[0.98] transition-all hover:border-primary"
            >
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <span className="material-symbols-outlined text-[28px]">
                  photo_library
                </span>
              </div>
              <span className="text-sm font-bold leading-tight whitespace-nowrap">
                앨범 선택
              </span>
            </button>
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={cameraInputRef}
          onChange={handleImageChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />
        <input
          type="file"
          ref={galleryInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />

        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 pb-2">
            <div className="w-full h-40 rounded-xl overflow-hidden relative group border border-border-light dark:border-border-dark">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {/* AI Analysis Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10 backdrop-blur-sm animate-pulse">
                  <span className="material-symbols-outlined text-4xl animate-spin mb-2">
                    {isProcessing ? "auto_fix_high" : "autorenew"}
                  </span>
                  <span className="font-bold text-lg">
                    {isProcessing ? "배경 제거 중..." : "AI 분석 중..."}
                  </span>
                </div>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-black/40 hidden group-hover:flex flex-col items-center justify-center gap-2 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white font-bold text-sm transition-colors"
                >
                  사진 변경
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManualRemoveBackground();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-full text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {isProcessing ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">
                        autorenew
                      </span>
                      처리 중...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">
                        auto_fix_high
                      </span>
                      배경 제거
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* If Edit mode and no image, show option to add one */}
        {isEditMode && !imagePreview && (
          <div className="px-4 pb-2">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-500 gap-1 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined">add_a_photo</span>
              <span className="text-xs">사진 추가</span>
            </button>
          </div>
        )}

        {/* Form Fields */}
        <div className="flex flex-col gap-6 p-4">
          {/* Fridge Select (Dynamic) */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-bold">
              보관 장소 (냉장고 선택)
            </label>
            <div className="flex flex-wrap gap-2">
              {fridges.length === 0 ? (
                <div className="text-gray-500 text-sm p-4 border rounded-xl w-full text-center">
                  등록된 냉장고가 없습니다.
                  <br />
                  홈에서 냉장고를 먼저 추가해주세요.
                </div>
              ) : (
                fridges.map((fridge) => (
                  <button
                    key={fridge.id}
                    onClick={() => handleChipChange("fridgeId", fridge.id)}
                    className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl border text-sm font-bold transition-all shadow-sm
                            ${
                              formData.fridgeId === fridge.id
                                ? "border-primary bg-primary/10 ring-1 ring-primary text-primary"
                                : getFridgeColor(fridge.type)
                            }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined">
                        {fridge.type === "kimchi"
                          ? "ac_unit"
                          : fridge.type === "freezer"
                          ? "severe_cold"
                          : fridge.type === "pantry"
                          ? "shelves"
                          : "kitchen"}
                      </span>
                      {fridge.name}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-bold">이름</label>
            <div className="relative">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-text-sub-light"
                placeholder="예: 사과, 우유"
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-sub-light pointer-events-none">
                edit
              </span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-base font-bold">카테고리</label>
              <button
                onClick={() => setIsEditingCategories(!isEditingCategories)}
                className={`text-xs px-2 py-1 rounded-lg font-bold transition-colors ${
                  isEditingCategories
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}
              >
                {isEditingCategories ? "완료" : "편집"}
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
              {categories.map((cat) => (
                <div key={cat.id} className="relative group">
                  <button
                    onClick={() => handleChipChange("foodCategory", cat.id)}
                    className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 active:scale-95 transition-all border
                        ${
                          formData.foodCategory === cat.id
                            ? "bg-primary text-background-dark border-transparent font-bold"
                            : "bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark font-medium"
                        }`}
                  >
                    {cat.label}
                  </button>
                  {isEditingCategories && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCategoryDelete(cat.id);
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full size-4 flex items-center justify-center shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[10px]">
                        close
                      </span>
                    </button>
                  )}
                </div>
              ))}

              {/* Add Button in Edit Mode */}
              {isEditingCategories && (
                <div className="flex items-center gap-1 bg-surface-light dark:bg-surface-dark rounded-full border border-primary px-2 h-9">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="새 항목"
                    className="w-16 bg-transparent text-sm focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleCategoryAdd()}
                  />
                  <button
                    onClick={handleCategoryAdd}
                    className="bg-primary text-white rounded-full size-6 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      add
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <label className="text-base font-bold">용량 / 수량</label>
            <div className="flex gap-3">
              {/* Capacity Input */}
              <div className="flex-1 flex gap-1">
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="용량 (선택)"
                  className="w-full rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-right"
                />
                <select
                  name="capacityUnit"
                  value={formData.capacityUnit}
                  onChange={handleChange}
                  className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {["g", "ml", "kg", "L", "개"].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500">x</span>
                <div className="flex items-center gap-1 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-1 w-full">
                  <button
                    type="button"
                    onClick={() => handleQuantity(-1)}
                    className="size-10 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all text-gray-600 dark:text-gray-400"
                  >
                    <span className="material-symbols-outlined text-lg">
                      remove
                    </span>
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: Math.max(1, Number(e.target.value)),
                        })
                      }
                      className="w-full bg-transparent p-2 text-base focus:outline-none text-center font-bold"
                    />
                    <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                      개
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuantity(1)}
                    className="size-10 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">
                      add
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-base font-bold">소비기한</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary h-[52px]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-base font-bold">등록일</label>
              <input
                type="date"
                name="buyDate"
                value={formData.buyDate}
                onChange={handleChange}
                className="w-full rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary h-[52px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Submit */}
      <div className="w-full bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md p-4 border-t border-border-light dark:border-border-dark z-50 pb-safe">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark py-4 text-center font-bold text-text-sub-light active:scale-[0.99] transition-transform"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] rounded-xl bg-primary py-4 text-center font-bold text-background-dark text-lg shadow-lg shadow-primary/20 active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>{isEditMode ? "저장 중..." : "저장 중..."}</span>
            ) : (
              <>
                <span className="material-symbols-outlined">kitchen</span>
                {isEditMode
                  ? "수정 완료"
                  : `${
                      fridges.find((f) => f.id === formData.fridgeId)?.name ||
                      "냉장고"
                    }에 넣기`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

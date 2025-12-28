import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "./AuthContext";
import Toast from "../components/Toast";

export const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const { familyId, currentUser } = useAuth();
  const [items, setItems] = useState([]); // All items (available + consumed)
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (!familyId) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Fetch ALL items for the family
    // In production with thousands of items, we should split active vs history queries.
    // For MVP, we fetch all and filter client-side.
    const q = query(
      collection(db, "inventory"),
      where("familyId", "==", familyId)
      // orderBy('expiryDate', 'asc') // Requires composite index if mixed with equality filter
    );

    // Safe Date Helper
    const toDate = (val) => {
      if (!val) return null;
      if (typeof val.toDate === "function") return val.toDate();
      if (val instanceof Date) return val;
      return new Date(val);
    };

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const inventoryData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert FireStore timestamps to JS Dates for easier use in app
          expiryDate: toDate(doc.data().expiryDate),
          addedDate: toDate(doc.data().addedDate),
          consumedDate: toDate(doc.data().consumedDate),
        }));
        setItems(inventoryData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching inventory:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [familyId]);

  // Snapshot Comparison Logic for Item Count Changes
  useEffect(() => {
    if (loading || items.length === 0) return;

    const SNAPSHOT_KEY = "fridgy_inventory_snapshot";

    const calculateCounts = (itemList) => {
      const counts = {};
      itemList.forEach((item) => {
        if (item.status === "available") {
          const cat = item.foodCategory || "uncategorized";
          counts[cat] = (counts[cat] || 0) + 1;
        }
      });
      return counts;
    };

    const currentCounts = calculateCounts(items);

    const checkDiff = () => {
      try {
        const savedSnapshot = localStorage.getItem(SNAPSHOT_KEY);
        if (!savedSnapshot) {
          // First run, save and exit
          localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(currentCounts));
          return;
        }

        const prevCounts = JSON.parse(savedSnapshot);
        const diffs = [];

        // Compare Current vs Previous
        const allKeys = new Set([
          ...Object.keys(currentCounts),
          ...Object.keys(prevCounts),
        ]);

        allKeys.forEach((key) => {
          const current = currentCounts[key] || 0;
          const prev = prevCounts[key] || 0;
          const diff = current - prev;

          if (diff !== 0) {
            // Map category IDs to Labels (Simple fallback map)
            const CATEGORY_MAP = {
              fruit: "과일",
              vegetable: "채소",
              meat: "육류",
              dairy: "유제품",
              frozen: "냉동",
              drink: "음료",
              sauce: "소스",
              snack: "간식",
              uncategorized: "기타",
            };
            const label = CATEGORY_MAP[key] || key;
            diffs.push(`${label} ${diff > 0 ? "+" : ""}${diff}`);
          }
        });

        if (diffs.length > 0) {
          // Show Toast
          showToast(`변경알림: ${diffs.join(", ")}`);
        }

        // Update Snapshot
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(currentCounts));
      } catch (error) {
        console.error("Error in checkDiff:", error);
        // Reset storage if corrupted
        localStorage.removeItem(SNAPSHOT_KEY);
      }
    };

    // Trigger check on Visibility Change (Foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkDiff();
      }
    };

    // Also run check immediately if data updated (Real-time sync)
    // We throttle this slightly to avoid double toasts on self-updates,
    // but for shared updates, it's good to see immediately.
    // For now, let's just run it. useAuth handles local vs remote usually.
    // checkDiff();
    // Wait... if we run checkDiff() every time 'items' changes, we get notified of our OWN changes immediately.
    // Ideally we want to notify when *returning* to the app, or if a remote change happens.

    // Let's rely on visibility change for "Coming back" context.
    // AND run checkDiff on every item update to keep local storage fresh,
    // BUT only toast if it's a significant remote update?
    // Actually simplicity:
    // 1. App Load / Re-focus -> Compare with stored.
    // 2. Continuous updates -> Just update storage? NO, if we just update storage, we miss the diff.

    // Improved Strategy:
    // Always compare current 'items' with 'localStorage'.
    // If difference found -> Toast -> Update localStorage.
    // This covers both:
    // - Remote changes coming in real-time (onSnapshot fires -> items update -> effect fires -> diff found -> Toast)
    // - Coming back to app (if data was stale and refreshed)

    checkDiff();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [items, loading]);

  async function addItem(itemData) {
    if (!familyId) throw new Error("No family ID found");

    try {
      const docRef = await addDoc(collection(db, "inventory"), {
        ...itemData,
        familyId,
        status: "available", // Default status
        addedDate: Timestamp.now(),
        expiryDate: itemData.expiryDate
          ? Timestamp.fromDate(itemData.expiryDate)
          : null,
        createdBy: currentUser?.uid,
      });
      showToast(`${itemData.name}이(가) 추가되었습니다.`);
      return docRef;
    } catch (error) {
      console.error("addItem failed:", error);
      showToast("추가 중 오류가 발생했습니다.");
      throw error;
    }
  }

  async function deleteItem(id) {
    try {
      await deleteDoc(doc(db, "inventory", id));
      showToast("아이템이 삭제되었습니다.");
    } catch (error) {
      console.error("deleteItem failed:", error);
      showToast("삭제 중 오류가 발생했습니다.");
      throw error;
    }
  }

  async function updateItem(id, updates) {
    try {
      const safeUpdates = { ...updates };
      if (safeUpdates.expiryDate instanceof Date) {
        safeUpdates.expiryDate = Timestamp.fromDate(safeUpdates.expiryDate);
      }
      if (safeUpdates.addedDate instanceof Date) {
        safeUpdates.addedDate = Timestamp.fromDate(safeUpdates.addedDate);
      }
      await updateDoc(doc(db, "inventory", id), safeUpdates);
      showToast("수정되었습니다.");
    } catch (error) {
      console.error("updateItem failed:", error);
      showToast("수정 중 오류가 발생했습니다.");
      throw error;
    }
  }

  async function consumeItem(id) {
    try {
      await updateDoc(doc(db, "inventory", id), {
        status: "consumed",
        consumedDate: Timestamp.now(),
      });
      showToast("소비 완료되었습니다.");
    } catch (error) {
      console.error("consumeItem failed:", error);
      showToast("소비 처리 중 오류가 발생했습니다.");
      throw error;
    }
  }

  async function removeItemsByFilter({
    includeAvailable,
    includeExpired,
    includeConsumed,
  }) {
    if (!familyId) return;

    const batch = writeBatch(db);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine items to delete based on the agreed logic
    const itemsToDelete = items.filter((item) => {
      const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
      const isExpired = expiryDate && expiryDate < today;

      // 1. Available (Not Expired)
      if (includeAvailable && item.status === "available" && !isExpired) {
        return true;
      }
      // 2. Expired (Available but expired)
      if (includeExpired && item.status === "available" && isExpired) {
        return true;
      }
      // 3. Consumed (Status is consumed)
      if (includeConsumed && item.status === "consumed") {
        return true;
      }

      return false;
    });

    if (itemsToDelete.length === 0) return 0;

    itemsToDelete.forEach((item) => {
      const itemRef = doc(db, "inventory", item.id);
      batch.delete(itemRef);
    });

    await batch.commit();
    return itemsToDelete.length;
  }

  const value = {
    items,
    loading,
    addItem,
    deleteItem,
    updateItem,
    consumeItem,
    removeItemsByFilter,
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </InventoryContext.Provider>
  );
}

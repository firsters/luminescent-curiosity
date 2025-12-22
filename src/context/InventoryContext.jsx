import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const InventoryContext = createContext();

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const { familyId, currentUser } = useAuth();
  const [items, setItems] = useState([]); // All items (available + consumed)
  const [loading, setLoading] = useState(true);

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
        collection(db, 'inventory'), 
        where('familyId', '==', familyId)
        // orderBy('expiryDate', 'asc') // Requires composite index if mixed with equality filter
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert FireStore timestamps to JS Dates for easier use in app
        expiryDate: doc.data().expiryDate?.toDate(),
        addedDate: doc.data().addedDate?.toDate(),
        consumedDate: doc.data().consumedDate?.toDate()
      }));
      setItems(inventoryData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [familyId]);

  async function addItem(itemData) {
    if (!familyId) throw new Error("No family ID found");
    
    return addDoc(collection(db, 'inventory'), {
      ...itemData,
      familyId,
      status: 'available', // Default status
      addedDate: Timestamp.now(),
      expiryDate: itemData.expiryDate ? Timestamp.fromDate(itemData.expiryDate) : null,
      createdBy: currentUser?.uid
    });
  }

  async function deleteItem(id) {
    return deleteDoc(doc(db, 'inventory', id));
  }

  async function updateItem(id, updates) {
      const safeUpdates = { ...updates };
      if (safeUpdates.expiryDate instanceof Date) {
          safeUpdates.expiryDate = Timestamp.fromDate(safeUpdates.expiryDate);
      }
    return updateDoc(doc(db, 'inventory', id), safeUpdates);
  }

  async function consumeItem(id) {
      return updateDoc(doc(db, 'inventory', id), {
          status: 'consumed',
          consumedDate: Timestamp.now()
      });
  }

  const value = {
    items,
    loading,
    addItem,
    deleteItem,
    updateItem,
    consumeItem
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

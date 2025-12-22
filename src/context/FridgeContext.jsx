import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const FridgeContext = createContext();

export function useFridge() {
  return useContext(FridgeContext);
}

export function FridgeProvider({ children }) {
  const { familyId, currentUser } = useAuth();
  const [fridges, setFridges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setFridges([]);
      setLoading(false);
      return;
    }

    // Query fridges for this family
    // Note: If you want specific ordering, you might need a composite index on [familyId, order] or [familyId, createdAt]
    // For now, we'll sort client-side or assume default order
    const q = query(
      collection(db, 'fridges'), 
      where('familyId', '==', familyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fridgeData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort logic (can be improved later with explicit order field)
      // Custom sort: Fridge -> Kimchi -> Freezer -> Pantry -> Others
      const typeOrder = { 'fridge': 1, 'kimchi': 2, 'freezer': 3, 'pantry': 4 };
      
      fridgeData.sort((a, b) => {
          const orderA = typeOrder[a.type] || 99;
          const orderB = typeOrder[b.type] || 99;
          return orderA - orderB;
      });

      setFridges(fridgeData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching fridges:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [familyId]);

  async function addFridge(fridgeData) {
    if (!familyId) throw new Error("No family ID found");
    
    return addDoc(collection(db, 'fridges'), {
      ...fridgeData,
      familyId,
      createdAt: Timestamp.now(),
      createdBy: currentUser?.uid,
      // Default type if not provided
      type: fridgeData.type || 'fridge' 
    });
  }

  async function deleteFridge(id) {
    // TODO: Verify if inventory items exist in this fridge before deleting?
    // For now, simple delete
    return deleteDoc(doc(db, 'fridges', id));
  }

  async function updateFridge(id, updates) {
    return updateDoc(doc(db, 'fridges', id), updates);
  }

  const value = {
    fridges,
    loading,
    addFridge,
    deleteFridge,
    updateFridge
  };

  return (
    <FridgeContext.Provider value={value}>
      {children}
    </FridgeContext.Provider>
  );
}

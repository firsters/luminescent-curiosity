import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // The family ID determines which inventory/fridges the user sees
  const [familyId, setFamilyId] = useState(null); 

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Display Name
    if (name) {
        await updateProfile(user, { displayName: name });
    }

    // Create User Document in Firestore
    // Default familyId is their own UID (Solo mode initially)
    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name || user.email.split('@')[0],
        familyId: user.uid, // Initially, they are their own family
        joinedAt: new Date()
    });
    
    setFamilyId(user.uid);
    return userCredential;
  }

  function logout() {
    setFamilyId(null);
    return signOut(auth);
  }

  // Function to join another family
  async function joinFamily(newFamilyId) {
      if (!currentUser) return;
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
          familyId: newFamilyId
      });
      setFamilyId(newFamilyId);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch User Profile from Firestore to get familyId
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setFamilyId(userData.familyId);
            } else {
                // Legacy support: If user exists in Auth but not Firestore (from MVP phase), create doc now
                console.log("Legacy user detected, creating profile...");
                const defaultFamilyId = user.uid;
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    familyId: defaultFamilyId,
                    joinedAt: new Date()
                });
                setFamilyId(defaultFamilyId);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
            // Fallback
            setFamilyId(user.uid);
        }
      } else {
          setFamilyId(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    familyId,
    login,
    signup,
    logout,
    joinFamily
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

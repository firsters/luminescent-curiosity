import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useModal } from "./ModalContext";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // The family ID determines which inventory/fridges the user sees
  const [familyId, setFamilyId] = useState(null);
  const { showAlert } = useModal();

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    // Update Display Name
    if (name) {
      await updateProfile(user, { displayName: name });
    }

    // Send Verification Email
    try {
      // Force reload user to ensure latest state (token, etc.) is verified
      // and use auth.currentUser to avoid stale reference issues
      const userForVerify = auth.currentUser || user;
      await sendEmailVerification(userForVerify);
      console.log("Verification email sent to:", userForVerify.email);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      // We don't block account creation if email fails, but user will be stuck at verify screen
      await showAlert("인증 메일 전송 실패: " + error.message);
    }

    // Create User Document in Firestore
    // Default familyId is their own UID (Solo mode initially)
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: name || user.email.split("@")[0],
      familyId: user.uid, // Initially, they are their own family
      joinedAt: new Date(),
    });

    setFamilyId(user.uid);
    return userCredential;
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user doc exists
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // Create new user doc
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        familyId: user.uid, // Initially their own family
        joinedAt: new Date(),
      });
      setFamilyId(user.uid);
    } else {
      // Existing user: set familyId
      const userData = userDocSnap.data();
      setFamilyId(userData.familyId);
    }

    return result;
  }

  function logout() {
    setFamilyId(null);
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function resendVerificationEmail() {
    if (currentUser && !currentUser.emailVerified) {
      return sendEmailVerification(currentUser);
    }
    return Promise.resolve(); // Do nothing if already verified or no user
  }

  /**
   * Helper: Check if current user is the last member of their family.
   * Returns: { isLastMember: boolean, currentFamilyId: string }
   */
  async function checkLastMember() {
    if (!currentUser) return { isLastMember: false, currentFamilyId: null };

    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    const currentFamilyId = userDocSnap.exists()
      ? userDocSnap.data().familyId
      : null;

    if (!currentFamilyId) return { isLastMember: false, currentFamilyId: null };

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("familyId", "==", currentFamilyId));
    const userSnapshot = await getDocs(q);

    // If size is 1 (just me) or 0 (error case), I am the last one.
    return { isLastMember: userSnapshot.size <= 1, currentFamilyId };
  }

  /**
   * Helper: Delete all data associated with a family ID.
   * Used when the last member leaves or deletes account.
   */
  async function cleanupFamilyData(targetFamilyId) {
    if (!targetFamilyId) return;

    const batch = writeBatch(db);

    // A. Delete Inventory Items
    const inventoryRef = collection(db, "inventory");
    const inventoryQ = query(
      inventoryRef,
      where("familyId", "==", targetFamilyId),
    );
    const inventorySnapshot = await getDocs(inventoryQ);
    inventorySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // B. Delete Fridges
    const fridgeRef = collection(db, "fridges");
    const fridgeQ = query(fridgeRef, where("familyId", "==", targetFamilyId));
    const fridgeSnapshot = await getDocs(fridgeQ);
    fridgeSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  // Function to join another family
  // Now supports 'force' parameter or logic to handle data cleanup
  async function joinFamily(newFamilyId) {
    if (!currentUser) return;

    // 1. Check current status
    const { isLastMember, currentFamilyId } = await checkLastMember();

    // 2. If last member, clean up old family data
    if (isLastMember && currentFamilyId && currentFamilyId !== newFamilyId) {
      console.log("Last member leaving family. Cleaning up data...");
      await cleanupFamilyData(currentFamilyId);
    }

    // 3. Move to new family
    await updateDoc(doc(db, "users", currentUser.uid), {
      familyId: newFamilyId,
    });
    setFamilyId(newFamilyId);
  }

  // Function to delete the user account
  async function deleteAccount(password) {
    if (!currentUser) return;

    // 1. Re-authenticate
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      password,
    );
    await reauthenticateWithCredential(currentUser, credential);

    // 2. Check Family Status & Conditional Data Deletion
    try {
      const { isLastMember, currentFamilyId } = await checkLastMember();
      const userDocRef = doc(db, "users", currentUser.uid);

      if (currentFamilyId) {
        if (isLastMember) {
          console.log(
            "Last family member leaving. Deleting all shared data...",
          );
          // Delete shared data first
          await cleanupFamilyData(currentFamilyId);
          // Then delete user doc
          await deleteDoc(userDocRef);
        } else {
          console.log(
            "Leaving family group. Shared data retained for other members.",
          );
          await deleteDoc(userDocRef);
        }
      } else {
        // No family ID? Just delete user doc if it exists
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          await deleteDoc(userDocRef);
        }
      }
    } catch (error) {
      console.error("Error cleaning up user data:", error);
      throw new Error("데이터 삭제 중 오류가 발생했습니다.");
    }

    // 3. Delete Auth User
    await deleteUser(currentUser);

    setFamilyId(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch User Profile from Firestore to get familyId
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFamilyId(userData.familyId);
          } else {
            // Legacy support: If user exists in Auth but not Firestore (from MVP phase), create doc now
            console.log("Legacy user detected, creating profile...");
            const defaultFamilyId = user.uid;
            await setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || user.email.split("@")[0],
              familyId: defaultFamilyId,
              joinedAt: new Date(),
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
    loginWithGoogle,
    logout,
    resetPassword,
    resendVerificationEmail,
    joinFamily,
    deleteAccount,
    checkLastMember,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

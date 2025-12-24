import React, { useMemo } from "react";
import FridgeList from "./FridgeList";
import Layout from "../components/Layout";
import { AuthContext } from "../context/AuthContext";
import { FridgeContext } from "../context/FridgeContext";
import { InventoryContext } from "../context/InventoryContext";

export default function TestFridgeList() {
  // Mock Data
  const mockAuth = useMemo(
    () => ({
      currentUser: { uid: "test-user", email: "test@example.com" },
      logout: () => alert("Logout clicked"),
      familyId: "test-family",
    }),
    []
  );

  const mockFridges = useMemo(
    () => [
      { id: "1", name: "Main Fridge", type: "fridge" },
      { id: "2", name: "Kimchi Fridge", type: "kimchi" },
      { id: "3", name: "Freezer", type: "freezer" },
      { id: "4", name: "Pantry", type: "pantry" },
      { id: "5", name: "Extra Fridge", type: "fridge" },
      { id: "6", name: "Garage Freezer", type: "freezer" },
    ],
    []
  );

  const mockFridgeContext = useMemo(
    () => ({
      fridges: mockFridges,
      loading: false,
      addFridge: async () => alert("Add Fridge"),
      deleteFridge: async () => alert("Delete Fridge"),
      updateFridge: async () => alert("Update Fridge"),
    }),
    [mockFridges]
  );

  const mockItems = useMemo(
    () => [
      {
        id: "i1",
        name: "Apple",
        status: "available",
        fridgeId: "1",
        expiryDate: new Date(Date.now() + 86400000),
      },
      {
        id: "i2",
        name: "Milk",
        status: "available",
        fridgeId: "1",
        expiryDate: new Date(Date.now() - 86400000),
      }, // Expired
      { id: "i3", name: "Kimchi", status: "available", fridgeId: "2" },
      { id: "i4", name: "Ice Cream", status: "available", fridgeId: "3" },
    ],
    []
  );

  const mockInventoryContext = useMemo(
    () => ({
      items: mockItems,
      loading: false,
      addItem: async () => {},
      deleteItem: async () => {},
      updateItem: async () => {},
      consumeItem: async () => {},
    }),
    [mockItems]
  );

  return (
    <AuthContext.Provider value={mockAuth}>
      <FridgeContext.Provider value={mockFridgeContext}>
        <InventoryContext.Provider value={mockInventoryContext}>
          <Layout>
            <FridgeList />
          </Layout>
        </InventoryContext.Provider>
      </FridgeContext.Provider>
    </AuthContext.Provider>
  );
}

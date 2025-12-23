import React from 'react';
import FridgeList from './FridgeList';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { FridgeContext } from '../context/FridgeContext';
import { InventoryContext } from '../context/InventoryContext';

export default function TestFridgeList() {
    // Mock Data
    const mockAuth = {
        currentUser: { uid: 'test-user', email: 'test@example.com' },
        logout: () => alert('Logout clicked'),
        familyId: 'test-family'
    };

    const mockFridges = [
        { id: '1', name: 'Main Fridge', type: 'fridge' },
        { id: '2', name: 'Kimchi Fridge', type: 'kimchi' },
        { id: '3', name: 'Freezer', type: 'freezer' },
        { id: '4', name: 'Pantry', type: 'pantry' },
    ];

    const mockFridgeContext = {
        fridges: mockFridges,
        loading: false,
        addFridge: async () => alert('Add Fridge'),
        deleteFridge: async () => alert('Delete Fridge'),
        updateFridge: async () => alert('Update Fridge')
    };

    // Calculate dates for specific states
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); // D-1 (Expiring)
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1); // Expired
    const future = new Date(today); future.setDate(today.getDate() + 10); // Safe

    const mockItems = [
        // Safe Item
        { id: 'i1', name: 'Safe Item', status: 'available', fridgeId: '1', expiryDate: future },
        // Expiring Item (D-1)
        { id: 'i2', name: 'Expiring Item', status: 'available', fridgeId: '1', expiryDate: tomorrow },
        // Expired Item
        { id: 'i3', name: 'Expired Item', status: 'available', fridgeId: '1', expiryDate: yesterday },
        // No Expiry (Safe)
        { id: 'i4', name: 'No Expiry', status: 'available', fridgeId: '2' },
    ];

    const mockInventoryContext = {
        items: mockItems,
        loading: false,
        addItem: async () => {},
        deleteItem: async () => {},
        updateItem: async () => {},
        consumeItem: async () => {}
    };

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

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Product, User } from './api';

type Line = {
    product: Product;
    quantity: number;
};

type State = {
    user: User | null;
    cart: Line[];
    setUser: (user: User | null) => void;
    add: (product: Product) => void;
    quantity: (id: number, quantity: number) => void;
    remove: (id: number) => void;
    clear: () => void;
};

export const useStore = create<State>()(
    persist(
        (set) => ({
            user: null,
            cart: [],

            setUser: (user) => set({ user }),

            add: (product) =>
                set((state) => {
                    const existingLine = state.cart.find(
                        (line) => line.product.id === product.id
                    );

                    if (existingLine) {
                        return {
                            cart: state.cart.map((line) =>
                                line.product.id === product.id
                                    ? {
                                          ...line,
                                          quantity: Math.min(
                                              line.quantity + 1,
                                              product.stock
                                          ),
                                      }
                                    : line
                            ),
                        };
                    }

                    return {
                        cart: [
                            ...state.cart,
                            {
                                product,
                                quantity: 1,
                            },
                        ],
                    };
                }),

            quantity: (id, newQuantity) =>
                set((state) => ({
                    cart:
                        newQuantity < 1
                            ? state.cart.filter(
                                  (line) => line.product.id !== id
                              )
                            : state.cart.map((line) =>
                                  line.product.id === id
                                      ? {
                                            ...line,
                                            quantity: Math.min(
                                                newQuantity,
                                                line.product.stock
                                            ),
                                        }
                                      : line
                              ),
                })),

            remove: (id) =>
                set((state) => ({
                    cart: state.cart.filter(
                        (line) => line.product.id !== id
                    ),
                })),

            clear: () => set({ cart: [] }),
        }),
        {
            name: 'foodstore-cart',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                cart: state.cart,
            }),
        }
    )
);
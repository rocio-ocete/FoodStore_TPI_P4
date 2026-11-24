import axios from 'axios';
export const api = axios.create({ 
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1', 
    withCredentials: true });
api.interceptors.response.use(r => r, e => { 
    if (e.response?.status === 401) window.dispatchEvent(new Event('foodstore:unauthorized')); 
    return Promise.reject(e); });

export type User = {
    id:number;
    username:string;
    full_name:string;
    email:string;
    role:'user'|'admin';
    disabled:boolean};

export type Category = {
    id:number;
    nombre:string;
    descripcion?:string|null;
    activo:boolean};

export type Product = {
    id:number;
    categoria_id:number;
    nombre:string;
    descripcion?:string|null;
    precio_base:number;
    imagen_url?:string|null;
    stock:number;
    disponible:boolean;
    activo:boolean;
    categoria?:Category};

export type OrderItem = {
    producto_id:number;
    nombre_producto:string;
    precio_unitario:number;
    cantidad:number;
    subtotal:number};

export type Order = {
    id:number;
    usuario_id:number;
    estado:string;
    forma_pago:string;
    direccion_entrega:string;
    notas?:string|null;
    total:number;
    created_at:string;
    updated_at:string;
    items:OrderItem[]};

export function money(
    value: number | string | null | undefined
): string {
    const amount = Number(value ?? 0);

    if (!Number.isFinite(amount)) {
        return "$ 0,00";
    }

    return amount.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    });
}
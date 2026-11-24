
import { useEffect, useMemo, useState } from 'react';
import {
    useQuery,
    useMutation,
    useQueryClient
} from '@tanstack/react-query';

import {
    api,
    money,
    type Category,
    type Order,
    type Product,
    type User
} from './api';

import { useStore } from './store';

type Page = 'catalogo' | 'carrito' | 'pedidos' | 'admin';

const err = (e: unknown) => {
    if (typeof e === 'object' && e && 'response' in e) {
        return (
            e as {
                response?: {
                    data?: {
                        detail?: string;
                    };
                };
            }
        ).response?.data?.detail || 'No se pudo completar la operación';
    }

    return 'No se pudo conectar con el servidor';
};

export default function App() {
    const qc = useQueryClient();

    const {
        user,
        setUser,
        cart,
        add,
        quantity,
        remove,
        clear
    } = useStore();

    const [page, setPage] = useState<Page>('catalogo');
    const [search, setSearch] = useState('');
    const [cat, setCat] = useState('');
    const [notice, setNotice] = useState('');

    const [mode, setMode] = useState<'login' | 'register'>('login');

    const [form, setForm] = useState({
        username: '',
        password: '',
        full_name: '',
        email: ''
    });

    const [address, setAddress] = useState('');
    const [payment, setPayment] = useState('EFECTIVO');

    const [editCat, setEditCat] = useState<Category | null>(null);
    const [editProduct, setEditProduct] = useState<Product | null>(null);

    // Consultas
    const categories = useQuery({
        queryKey: ['categories'],
        queryFn: async () =>
            (await api.get<Category[]>('/categorias')).data
    });

    const products = useQuery({
        queryKey: ['products', search, cat],
        queryFn: async () =>
            (
                await api.get<{
                    total: number;
                    items: Product[];
                }>('/productos', {
                    params: {
                        search: search || undefined,
                        categoria_id: cat || undefined,
                        limit: 100
                    }
                })
            ).data
    });

    const me = useQuery({
        queryKey: ['me'],
        queryFn: async () =>
            (await api.get<User>('/auth/me')).data,
        retry: false
    });

    useEffect(() => {
        if (me.data) {
            setUser(me.data);
        }
    }, [me.data, setUser]);

    useEffect(() => {
        const f = () => {
            setUser(null);
            clear();
            setPage('catalogo');
        };

        window.addEventListener('foodstore:unauthorized', f);

        return () => {
            window.removeEventListener('foodstore:unauthorized', f);
        };
    }, [setUser, clear]);

    const orders = useQuery({
        queryKey: ['orders'],
        queryFn: async () =>
            (
                await api.get<{
                    total: number;
                    items: Order[];
                }>('/pedidos')
            ).data,
        enabled: !!user
    });

    const summary = useQuery({
        queryKey: ['summary'],
        queryFn: async () =>
            (await api.get<Record<string, number>>('/pedidos/resumen')).data,
        enabled: user?.role === 'admin'
    });

    const users = useQuery({
        queryKey: ['users'],
        queryFn: async () =>
            (await api.get<User[]>('/admin/usuarios')).data,
        enabled: user?.role === 'admin'
    });

    const total = useMemo(
        () =>
            cart.reduce(
                (s, l) => s + l.product.precio_base * l.quantity,
                0
            ),
        [cart]
    );

    const done = () => {
        qc.invalidateQueries();
        setNotice('Cambios guardados correctamente');
    };

    // Autenticación
    const auth = useMutation({
        mutationFn: async () => {
            if (mode === 'register') {
                await api.post('/auth/register', form);
            }

            await api.post(
                '/auth/token',
                new URLSearchParams({
                    username: form.username,
                    password: form.password
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            return (await api.get<User>('/auth/me')).data;
        },
        onSuccess: u => {
            setUser(u);
            setPage('catalogo');
            qc.invalidateQueries();
            setNotice('Sesión iniciada');
        },
        onError: e => setNotice(err(e))
    });

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            clear();
            setUser(null);
            setPage('catalogo');
            qc.invalidateQueries();
        }
    };

    // Pedidos
    const order = useMutation({
        mutationFn: () =>
            api.post('/pedidos', {
                items: cart.map(x => ({
                    producto_id: x.product.id,
                    cantidad: x.quantity
                })),
                direccion_entrega: address,
                forma_pago: payment
            }),
        onSuccess: () => {
            clear();
            setPage('pedidos');
            setNotice('Pedido confirmado');
            done();
        },
        onError: e => setNotice(err(e))
    });

    const cancel = useMutation({
        mutationFn: (id: number) =>
            api.patch(`/pedidos/${id}/cancelar`),
        onSuccess: done,
        onError: e => setNotice(err(e))
    });

    const state = useMutation({
        mutationFn: ({ id, estado }: {
            id: number;
            estado: string;
        }) =>
            api.patch(`/pedidos/${id}/estado`, { estado }),
        onSuccess: done,
        onError: e => setNotice(err(e))
    });

    // Categorías
    const catSave = useMutation({
        mutationFn: (d: {
            id?: number;
            nombre: string;
            descripcion: string;
        }) =>
            d.id
                ? api.put(`/categorias/${d.id}`, d)
                : api.post('/categorias', d),
        onSuccess: () => {
            setEditCat(null);
            done();
        },
        onError: e => setNotice(err(e))
    });

    const catDelete = useMutation({
        mutationFn: (id: number) =>
            api.delete(`/categorias/${id}`),
        onSuccess: done,
        onError: e => setNotice(err(e))
    });

    // Productos
    const prodSave = useMutation({
        mutationFn: (d: Record<string, unknown> & {
            id?: number;
        }) =>
            d.id
                ? api.put(`/productos/${d.id}`, d)
                : api.post('/productos', d),
        onSuccess: () => {
            setEditProduct(null);
            done();
        },
        onError: e => setNotice(err(e))
    });

    const prodDelete = useMutation({
        mutationFn: (id: number) =>
            api.delete(`/productos/${id}`),
        onSuccess: done,
        onError: e => setNotice(err(e))
    });

    const stock = useMutation({
        mutationFn: (p: {
            id: number;
            stock: number;
            disponible: boolean;
        }) =>
            api.patch(`/productos/${p.id}/stock`, {
                stock: p.stock,
                disponible: p.disponible
            }),
        onSuccess: done,
        onError: e => setNotice(err(e))
    });

    // Usuarios
    const userToggle = useMutation({
        mutationFn: (u: User) =>
            api.post(
                `/admin/usuarios/${u.id}/${u.disabled ? 'activar' : 'desactivar'}`
            ),
        onSuccess: done,
        onError: e => setNotice(err(e))
    });

    return (
        <main>
            <header>
                <button
                    className="brand"
                    onClick={() => setPage('catalogo')}
                >
                    🍔 FOOD STORE
                </button>

                <nav>
                    <button onClick={() => setPage('catalogo')}>
                        Catálogo
                    </button>

                    <button onClick={() => setPage('carrito')}>
                        Carrito ({cart.reduce((n, x) => n + x.quantity, 0)})
                    </button>

                    {user && (
                        <button onClick={() => setPage('pedidos')}>
                            Mis pedidos
                        </button>
                    )}

                    {user?.role === 'admin' && (
                        <button onClick={() => setPage('admin')}>
                            Panel
                        </button>
                    )}

                    {user ? (
                        <>
                            <span>{user.full_name}</span>
                            <button className="dark" onClick={logout}>
                                Salir
                            </button>
                        </>
                    ) : (
                        <button
                            className="dark"
                            onClick={() =>
                                document.getElementById('auth')?.scrollIntoView()
                            }
                        >
                            Ingresar
                        </button>
                    )}
                </nav>
            </header>

            {notice && (
                <div className="notice">
                    {notice}
                    <button onClick={() => setNotice('')}>×</button>
                </div>
            )}

            {/* Catálogo */}
            {page === 'catalogo' && (
                <>
                    <section className="hero">
                        <small>HECHO PARA COMPARTIR</small>
                        <h1>
                            Tu comida favorita,
                            <br />
                            a un clic.
                        </h1>
                        <p>
                            Elegí algo rico y disfrutá. Pedidos frescos,
                            simple y rápido.
                        </p>

                        <button
                            className="cta"
                            onClick={() =>
                                document.getElementById('catalogo')?.scrollIntoView()
                            }
                        >
                            Ver menú ↓
                        </button>
                    </section>

                    <section id="catalogo">
                        <div className="sectionhead">
                            <h2>El menú</h2>

                            <input
                                placeholder="Buscar productos…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="filters">
                            <button
                                className={!cat ? 'selected' : ''}
                                onClick={() => setCat('')}
                            >
                                Todas
                            </button>

                            {categories.data?.map(c => (
                                <button
                                    key={c.id}
                                    className={
                                        cat === String(c.id) ? 'selected' : ''
                                    }
                                    onClick={() => setCat(String(c.id))}
                                >
                                    {c.nombre}
                                </button>
                            ))}
                        </div>

                        {products.isLoading ? (
                            'Cargando productos…'
                        ) : products.error ? (
                            <p className="error">
                                No se pudo cargar el catálogo.
                            </p>
                        ) : (
                            <div className="products">
                                {products.data?.items.map(p => (
                                    <article key={p.id}>
                                        {p.imagen_url ? (
                                            <img
                                                className="product-image"
                                                src={p.imagen_url}
                                                alt={p.nombre}
                                                loading="lazy"
                                                onError={e => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="foodicon">
                                                {String(p.nombre ?? '')
                                                    .toLowerCase()
                                                    .includes('pizza')
                                                    ? '🍕'
                                                    : String(p.nombre ?? '')
                                                        .toLowerCase()
                                                        .includes('agua') ||
                                                      String(p.nombre ?? '')
                                                        .toLowerCase()
                                                        .includes('gaseosa')
                                                    ? '🥤'
                                                    : '🍔'}
                                            </div>
                                        )}

                                        <div className="category">
                                            {categories.data?.find(
                                                c => c.id === p.categoria_id
                                            )?.nombre}
                                        </div>

                                        <h3>{p.nombre}</h3>

                                        <p className="muted">
                                            {p.descripcion ||
                                                'Preparado para disfrutar.'}
                                        </p>

                                        <div className="bottom">
                                            <div>
                                                <strong>
                                                    {money(p.precio_base)}
                                                </strong>
                                                <small>
                                                    {p.stock > 0
                                                        ? `Stock: ${p.stock}`
                                                        : 'Sin stock'}
                                                </small>
                                            </div>

                                            <button
                                                disabled={
                                                    !p.disponible || p.stock < 1
                                                }
                                                onClick={() => add(p)}
                                            >
                                                ＋
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        {products.data?.items.length === 0 && (
                            <p>
                                No hay productos para los filtros seleccionados.
                            </p>
                        )}
                    </section>
                </>
            )}

            {/* Carrito */}
            {page === 'carrito' && (
                <section className="content">
                    <h2>Tu carrito</h2>

                    {!cart.length ? (
                        <p>Tu carrito está vacío.</p>
                    ) : (
                        <>
                            <div className="cartlines">
                                {cart.map(l => (
                                    <div
                                        className="cartline"
                                        key={l.product.id}
                                    >
                                        <div>
                                            <b>{l.product.nombre}</b>
                                            <small>
                                                {money(l.product.precio_base)} c/u
                                            </small>
                                        </div>

                                        <div className="qty">
                                            <button
                                                onClick={() =>
                                                    quantity(
                                                        l.product.id,
                                                        l.quantity - 1
                                                    )
                                                }
                                            >
                                                −
                                            </button>

                                            {l.quantity}

                                            <button
                                                onClick={() =>
                                                    quantity(
                                                        l.product.id,
                                                        l.quantity + 1
                                                    )
                                                }
                                            >
                                                ＋
                                            </button>

                                            <button
                                                onClick={() =>
                                                    remove(l.product.id)
                                                }
                                            >
                                                Quitar
                                            </button>
                                        </div>

                                        <b>
                                            {money(
                                                l.product.precio_base *
                                                l.quantity
                                            )}
                                        </b>
                                    </div>
                                ))}
                            </div>

                            <div className="checkout">
                                <h3>Confirmar pedido</h3>

                                <label>
                                    Dirección de entrega
                                    <input
                                        minLength={5}
                                        maxLength={200}
                                        value={address}
                                        onChange={e =>
                                            setAddress(e.target.value)
                                        }
                                        placeholder="Calle, número, localidad"
                                    />
                                </label>

                                <label>
                                    Forma de pago
                                    <select
                                        value={payment}
                                        onChange={e =>
                                            setPayment(e.target.value)
                                        }
                                    >
                                        <option value="EFECTIVO">
                                            Efectivo
                                        </option>
                                        <option value="TRANSFERENCIA">
                                            Transferencia
                                        </option>
                                    </select>
                                </label>

                                <div className="total">
                                    Total <b>{money(total)}</b>
                                </div>

                                <button
                                    className="cta"
                                    disabled={
                                        !user ||
                                        address.trim().length < 5 ||
                                        order.isPending
                                    }
                                    onClick={() => order.mutate()}
                                >
                                    {!user
                                        ? 'Ingresá para confirmar'
                                        : order.isPending
                                        ? 'Confirmando…'
                                        : 'Confirmar pedido'}
                                </button>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* Pedidos */}
            {page === 'pedidos' && (
                <section className="content">
                    <h2>Mis pedidos</h2>

                    {orders.isLoading ? (
                        'Cargando…'
                    ) : orders.error ? (
                        <p className="error">
                            No se pudieron cargar los pedidos.
                        </p>
                    ) : (
                        orders.data?.items.map(o => (
                            <OrderCard
                                key={o.id}
                                order={o}
                                cancel={() => cancel.mutate(o.id)}
                            />
                        ))
                    )}

                    {orders.data?.items.length === 0 && (
                        <p>Todavía no realizaste pedidos.</p>
                    )}
                </section>
            )}

            {/* Administración */}
            {page === 'admin' && user?.role === 'admin' && (
                <section className="content adminpage">
                    <h2>Administración</h2>

                    <div className="stats">
                        {[
                            'pendientes',
                            'en_preparacion',
                            'entregados',
                            'cancelados',
                            'pedidos_hoy',
                            'ingresos_entregados'
                        ].map(k => (
                            <div className="stat" key={k}>
                                <small>
                                    {k.replaceAll('_', ' ')}
                                </small>

                                <b>
                                    {k === 'ingresos_entregados'
                                        ? money(summary.data?.[k] || 0)
                                        : summary.data?.[k] ?? '—'}
                                </b>
                            </div>
                        ))}
                    </div>

                    <h3>Categorías</h3>

                    <CategoryManager
                        items={categories.data || []}
                        edit={editCat}
                        setEdit={setEditCat}
                        save={d => catSave.mutate(d)}
                        remove={id => catDelete.mutate(id)}
                    />

                    <h3>Productos y stock</h3>

                    <ProductManager
                        items={products.data?.items || []}
                        cats={categories.data || []}
                        edit={editProduct}
                        setEdit={setEditProduct}
                        save={d => prodSave.mutate(d)}
                        remove={id => prodDelete.mutate(id)}
                        stock={p => stock.mutate(p)}
                    />

                    <h3>Pedidos</h3>

                    {orders.data?.items.map(o => (
                        <OrderCard
                            key={o.id}
                            order={o}
                            admin
                            change={s =>
                                state.mutate({
                                    id: o.id,
                                    estado: s
                                })
                            }
                        />
                    ))}

                    <h3>Usuarios</h3>

                    {users.data?.map(u => (
                        <div className="adminrow" key={u.id}>
                            <span>
                                {u.full_name} · {u.username} · {u.role}
                            </span>

                            <span>
                                {u.disabled ? 'Desactivado' : 'Activo'}
                            </span>

                            {u.id !== user.id && (
                                <button
                                    onClick={() => userToggle.mutate(u)}
                                >
                                    {u.disabled ? 'Activar' : 'Desactivar'}
                                </button>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* Autenticación */}
            {!user && (
                <section id="auth" className="auth">
                    <h2>
                        {mode === 'login'
                            ? 'Ingresar'
                            : 'Crear cuenta'}
                    </h2>

                    <div className="authbox">
                        <div className="filters">
                            <button
                                className={
                                    mode === 'login' ? 'selected' : ''
                                }
                                onClick={() => setMode('login')}
                            >
                                Ingresar
                            </button>

                            <button
                                className={
                                    mode === 'register' ? 'selected' : ''
                                }
                                onClick={() => setMode('register')}
                            >
                                Registrarme
                            </button>
                        </div>

                        {mode === 'register' && (
                            <>
                                <input
                                    placeholder="Nombre completo"
                                    value={form.full_name}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            full_name: e.target.value
                                        })
                                    }
                                />

                                <input
                                    placeholder="Email"
                                    type="email"
                                    value={form.email}
                                    onChange={e =>
                                        setForm({
                                            ...form,
                                            email: e.target.value
                                        })
                                    }
                                />
                            </>
                        )}

                        <input
                            placeholder="Usuario"
                            value={form.username}
                            onChange={e =>
                                setForm({
                                    ...form,
                                    username: e.target.value
                                })
                            }
                        />

                        <input
                            placeholder="Contraseña (mínimo 8 caracteres)"
                            type="password"
                            value={form.password}
                            onChange={e =>
                                setForm({
                                    ...form,
                                    password: e.target.value
                                })
                            }
                        />

                        <button
                            className="cta"
                            disabled={
                                auth.isPending ||
                                !form.username ||
                                !form.password ||
                                (mode === 'register' &&
                                    (!form.full_name ||
                                        !form.email ||
                                        form.password.length < 8))
                            }
                            onClick={() => auth.mutate()}
                        >
                            {auth.isPending
                                ? 'Procesando…'
                                : mode === 'login'
                                ? 'Ingresar'
                                : 'Crear cuenta'}
                        </button>
                    </div>
                </section>
            )}

            <footer>
                <span>Food Store · Programación 4</span>
                <span>Trabajo práctico integrador</span>
            </footer>
        </main>
    );
}

// Componente de pedidos
function OrderCard({
    order,
    cancel,
    admin,
    change
}: {
    order: Order;
    cancel?: () => void;
    admin?: boolean;
    change?: (s: string) => void;
}) {
    return (
        <article className="order">
            <div className="orderhead">
                <b>Pedido #{order.id}</b>
                <span className="state">
                    {order.estado.replace('_', ' ')}
                </span>
                <b>{money(order.total)}</b>
            </div>

            <small>
                {new Date(order.created_at).toLocaleString('es-AR')}
                {' · '}
                {order.forma_pago}
                {' · '}
                {order.direccion_entrega}
            </small>

            <ul>
                {order.items?.map((i, n) => (
                    <li key={n}>
                        {i.cantidad} × {i.nombre_producto} — {money(i.subtotal)}
                    </li>
                ))}
            </ul>

            {cancel && order.estado === 'PENDIENTE' && (
                <button onClick={cancel}>
                    Cancelar pedido
                </button>
            )}

            {admin &&
                !['ENTREGADO', 'CANCELADO'].includes(order.estado) && (
                    <select
                        defaultValue=""
                        onChange={e =>
                            e.target.value && change?.(e.target.value)
                        }
                    >
                        <option value="">Cambiar estado…</option>

                        {(order.estado === 'PENDIENTE'
                            ? ['EN_PREPARACION', 'CANCELADO']
                            : ['ENTREGADO', 'CANCELADO']
                        ).map(s => (
                            <option key={s}>{s}</option>
                        ))}
                    </select>
                )}
        </article>
    );
}

// Administración de categorías
function CategoryManager({
    items,
    edit,
    setEdit,
    save,
    remove
}: {
    items: Category[];
    edit: Category | null;
    setEdit: (x: Category | null) => void;
    save: (x: {
        id?: number;
        nombre: string;
        descripcion: string;
    }) => void;
    remove: (id: number) => void;
}) {
    const [n, setN] = useState('');
    const [d, setD] = useState('');

    useEffect(() => {
        setN(edit?.nombre || '');
        setD(edit?.descripcion || '');
    }, [edit]);

    return (
        <>
            <form
                className="inlineform"
                onSubmit={e => {
                    e.preventDefault();

                    save({
                        id: edit?.id,
                        nombre: n,
                        descripcion: d
                    });
                }}
            >
                <input
                    required
                    minLength={2}
                    placeholder="Nombre"
                    value={n}
                    onChange={e => setN(e.target.value)}
                />

                <input
                    placeholder="Descripción"
                    value={d}
                    onChange={e => setD(e.target.value)}
                />

                <button>
                    {edit ? 'Guardar' : 'Crear categoría'}
                </button>

                {edit && (
                    <button
                        type="button"
                        onClick={() => setEdit(null)}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            {items.map(c => (
                <div className="adminrow" key={c.id}>
                    <b>{c.nombre}</b>
                    <span>{c.descripcion}</span>

                    <button onClick={() => setEdit(c)}>
                        Editar
                    </button>

                    <button
                        onClick={() =>
                            confirm('Dar de baja categoría y productos?') &&
                            remove(c.id)
                        }
                    >
                        Dar de baja
                    </button>
                </div>
            ))}
        </>
    );
}

// Administración de productos
function ProductManager({
    items,
    cats,
    edit,
    setEdit,
    save,
    remove,
    stock
}: {
    items: Product[];
    cats: Category[];
    edit: Product | null;
    setEdit: (p: Product | null) => void;
    save: (d: Record<string, unknown> & {
        id?: number;
    }) => void;
    remove: (id: number) => void;
    stock: (p: {
        id: number;
        stock: number;
        disponible: boolean;
    }) => void;
}) {
    const [n, setN] = useState('');
    const [c, setC] = useState('');
    const [price, setPrice] = useState('');
    const [qty, setQty] = useState('0');
    const [desc, setDesc] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [avail, setAvail] = useState(true);

    useEffect(() => {
        setN(edit?.nombre || '');
        setC(String(edit?.categoria_id || cats[0]?.id || ''));
        setPrice(String(edit?.precio_base ?? ''));
        setQty(String(edit?.stock ?? 0));
        setDesc(edit?.descripcion || '');
        setImageUrl(edit?.imagen_url || '');
        setAvail(edit?.disponible ?? true);
    }, [edit, cats]);

    return (
        <>
            <form
                className="inlineform"
                onSubmit={e => {
                    e.preventDefault();

                    const normalizedUrl = imageUrl.trim();

if (normalizedUrl) {
    try {
        const parsedUrl = new URL(normalizedUrl);

        if (
            parsedUrl.protocol !== 'http:' &&
            parsedUrl.protocol !== 'https:'
        ) {
            alert('La URL de la imagen debe comenzar con http:// o https://');
            return;
        }
    } catch {
        alert('Ingresá una URL de imagen válida.');
        return;
    }
}
                    save({
                        id: edit?.id,
                        nombre: n,
                        categoria_id: Number(c),
                        precio_base: Number(price),
                        stock: Number(qty),
                        descripcion: desc,
                        disponible: avail,
                        imagen_url: normalizedUrl || null
                    });
                }}
            >
                <input
                    required
                    placeholder="Nombre producto"
                    value={n}
                    onChange={e => setN(e.target.value)}
                />

                <select
                    required
                    value={c}
                    onChange={e => setC(e.target.value)}
                >
                    {cats.map(x => (
                        <option key={x.id} value={x.id}>
                            {x.nombre}
                        </option>
                    ))}
                </select>

                <input
                    required
                    type="number"
                    min="0"
                    value={price}
                    placeholder="Precio"
                    onChange={e => setPrice(e.target.value)}
                />

                <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                />

                <input
                    placeholder="Descripción"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                />

                <input
                    type="url"
                    placeholder="URL de imagen (https://...)"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    required
                />

                {imageUrl.trim() && (
                    <img
                        src={imageUrl}
                        alt="Vista previa del producto"
                        style={{
                            width: '100px',
                            height: '75px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                        }}
                    />
                )}

                <label>
                    <input
                        type="checkbox"
                        checked={avail}
                        onChange={e => setAvail(e.target.checked)}
                    />
                    Disponible
                </label>

                <button>
                    {edit ? 'Guardar' : 'Crear producto'}
                </button>

                {edit && (
                    <button
                        type="button"
                        onClick={() => setEdit(null)}
                    >
                        Cancelar
                    </button>
                )}
            </form>

            {items.map(p => (
                <div className="adminrow" key={p.id}>
                    <b>{p.nombre}</b>

                    <span>
                        {money(p.precio_base)} · stock {p.stock} ·
                        {' '}{p.disponible ? 'Activo' : 'Pausado'}
                    </span>

                    <button onClick={() => setEdit(p)}>
                        Editar
                    </button>

                    <input
                        aria-label={`Stock ${p.nombre}`}
                        type="number"
                        min="0"
                        defaultValue={p.stock}
                        id={`stock-${p.id}`}
                        className="stock-input"
                    />

                    <button
                        onClick={() => {
                            const field = document.getElementById(
                                `stock-${p.id}`
                            ) as HTMLInputElement | null;

                            if (field) {
                                stock({
                                    id: p.id,
                                    stock: Number(field.value),
                                    disponible: p.disponible
                                });
                            }
                        }}
                    >
                        Actualizar stock
                    </button>

                    <button
                        onClick={() =>
                            stock({
                                id: p.id,
                                stock: p.stock,
                                disponible: !p.disponible
                            })
                        }
                    >
                        {p.disponible ? 'Pausar' : 'Reactivar'}
                    </button>

                    <button
                        onClick={() =>
                            confirm('Dar de baja producto?') && remove(p.id)
                        }
                    >
                        Baja
                    </button>
                </div>
            ))}
        </>
    );
}

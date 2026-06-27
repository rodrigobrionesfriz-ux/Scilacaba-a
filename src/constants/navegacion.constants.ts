// Navegación del sidebar (estructura del monolito, index.html: NAV). 8 secciones.
// Cada ítem se gatea por permiso (perm) y/o adminOnly; `disponible` marca si el
// módulo ya está construido (Fase 2: solo dashboard). Hoja: solo importa iconos
// (lucide, externo). El perm de cada ítem debe existir en PERMISOS (test lo vigila).
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  BarChart3,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Flower2,
  LayoutDashboard,
  type LucideIcon,
  Notebook,
  Package,
  ScrollText,
  Settings,
  TreeDeciduous,
  Truck,
  UserRound,
  UsersRound,
  Warehouse,
  Wrench,
} from "lucide-react"

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  href: string
  perm: string | null
  adminOnly?: boolean
  disponible: boolean
}

export type NavSection = {
  section: string
  items: readonly NavItem[]
}

export const NAV: readonly NavSection[] = [
  {
    section: "PRINCIPAL",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        perm: null,
        disponible: true,
      },
    ],
  },
  {
    section: "INVENTARIO",
    items: [
      {
        id: "productos",
        label: "Productos",
        icon: Package,
        href: "/productos",
        perm: "productos.ver",
        disponible: false,
      },
      {
        id: "bodegas",
        label: "Bodegas",
        icon: Warehouse,
        href: "/bodegas",
        perm: "bodegas.ver",
        disponible: false,
      },
      {
        id: "proveedores",
        label: "Proveedores",
        icon: Truck,
        href: "/proveedores",
        perm: "proveedores.ver",
        disponible: false,
      },
      {
        id: "clientes",
        label: "Clientes",
        icon: UserRound,
        href: "/clientes",
        perm: "clientes.ver",
        disponible: false,
      },
      {
        id: "centrosCosto",
        label: "Centros de Costo",
        icon: Building2,
        href: "/centros-costo",
        perm: "centrosCosto.ver",
        disponible: false,
      },
      {
        id: "stock",
        label: "Stock por Bodega",
        icon: ClipboardList,
        href: "/stock",
        perm: "stock.ver",
        disponible: false,
      },
    ],
  },
  {
    section: "OPERACIÓN",
    items: [
      {
        id: "movimientos",
        label: "Movimientos",
        icon: ArrowLeftRight,
        href: "/movimientos",
        perm: "movimientos.ver",
        disponible: false,
      },
      {
        id: "entradas",
        label: "Nueva Entrada",
        icon: ArrowDownToLine,
        href: "/movimientos/entradas",
        perm: "movimientos.crear",
        disponible: false,
      },
      {
        id: "salidas",
        label: "Nueva Salida",
        icon: ArrowUpFromLine,
        href: "/movimientos/salidas",
        perm: "movimientos.crear",
        disponible: false,
      },
      {
        id: "tomas",
        label: "Tomas de Inventario",
        icon: ClipboardCheck,
        href: "/tomas",
        perm: "tomas.ver",
        disponible: false,
      },
    ],
  },
  {
    section: "CUADERNO DE CAMPO",
    items: [
      {
        id: "cuaderno",
        label: "Cuaderno de Campo",
        icon: Notebook,
        href: "/cuaderno",
        perm: "cuaderno.ver",
        disponible: false,
      },
    ],
  },
  {
    section: "MANTENCIONES",
    items: [
      {
        id: "mantenciones",
        label: "Servicio y Mantención",
        icon: Wrench,
        href: "/mantenciones",
        perm: "mantenciones.ver",
        disponible: false,
      },
    ],
  },
  {
    section: "TERRENO",
    items: [
      {
        id: "conteos",
        label: "Conteos en terreno",
        icon: Flower2,
        href: "/conteos",
        perm: "conteos.ver",
        disponible: false,
      },
      {
        id: "invplantas",
        label: "Inventario de Huerto",
        icon: TreeDeciduous,
        href: "/invplantas",
        perm: "invplantas.ver",
        disponible: false,
      },
    ],
  },
  {
    section: "CONTROL DE PRESUPUESTO",
    items: [
      {
        id: "presupuesto",
        label: "Control de Presupuesto",
        icon: BarChart3,
        href: "/presupuesto",
        perm: "presupuesto.ver",
        disponible: false,
      },
    ],
  },
  {
    section: "ADMINISTRACIÓN",
    items: [
      {
        id: "usuarios",
        label: "Usuarios",
        icon: UsersRound,
        href: "/usuarios",
        perm: "usuarios.ver",
        disponible: false,
      },
      {
        id: "config",
        label: "Configuración",
        icon: Settings,
        href: "/config",
        perm: "config.ver",
        disponible: false,
      },
      {
        id: "auditoria",
        label: "Auditoría",
        icon: ScrollText,
        href: "/auditoria",
        perm: null,
        adminOnly: true,
        disponible: false,
      },
    ],
  },
]

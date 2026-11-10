import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  AdminRoute,
  ClienteRoute,
  AuthRoute,
} from "./routes/ProtectedRoute.tsx";

// Páginas Públicas
import Landing from "./pages/PublicPages/landing";
import Login from "./pages/PublicPages/login";
import RegistrarCliente from "./pages/PublicPages/RegistrarCliente";
import ResetPassword from "./pages/PublicPages/ResetPassword.tsx";

// pagina de perfil
import Perfil from "./pages/Perfil.tsx";

// 🚀 NUEVA IMPORTACIÓN CORREGIDA (Igual a las de abajo)
import CatalogoPaquetes from "./pages/ClientPages/CatalogoPaquetes.tsx";

// 📦 Módulo de Paquetes
import CrearPaquete from "./pages/AdminPages/Paquetes/CrearPaquete";
import VerPaquete from "./pages/AdminPages/Paquetes/VerPaquete";
import EditarPaquete from "./pages/AdminPages/Paquetes/EditarPaquete";

// 🏙️ Módulo de Ciudades
import CrearCiudad from "./pages/AdminPages/Ciudades/CrearCiudad";
import VerCiudad from "./pages/AdminPages/Ciudades/VerCiudad";

// Módulo de Reservas
import CrearReserva from "./pages/AdminPages/Reservas/CrearReserva";
import VerReserva from "./pages/AdminPages/Reservas/VerReserva";
import EditarReserva from "./pages/AdminPages/Reservas/EditarReserva";
import ClientesArchivados from "./pages/AdminPages/Reservas/ClientesArchivados.tsx";
import ExpedienteClienteDetalle from "./pages/AdminPages/Reservas/ExpedienteClienteDetalle.tsx";
import DetReserva from "./pages/AdminPages/Reservas/DetalleReserva.tsx";
import CrearReservaRapida from "./pages/AdminPages/Reservas/CrearReservaRapida";
import CrearReservaTour from "./pages/AdminPages/Reservas/CrearReservaTour";
import VerTours from "./pages/AdminPages/Reservas/VerTours";

// Módulo de Pasajeros
import CrearPasajero from "./pages/AdminPages/Pasajeros/CrearPasajero.tsx";
import VerPasajeros from "./pages/AdminPages/Pasajeros/VerPasajeros.tsx";

// ✨ Módulo de Hoteles
import CrearHotel from "./pages/AdminPages/Hoteles/CrearHotel";
import VerHotel from "./pages/AdminPages/Hoteles/VerHotel";
import EditarHotel from "./pages/AdminPages/Hoteles/EditarHotel";

// ✈️ Módulo de Vuelos (Agregado de Mary)
import CrearVuelo from "./pages/AdminPages/Vuelos/CrearVuelo";
import VerVuelo from "./pages/AdminPages/Vuelos/VerVuelos";
import EditarVuelo from "./pages/AdminPages/Vuelos/EditarVuelo.tsx";

// Módulo de transporte
import CrearTransporte from "./pages/AdminPages/Transporte/CrearTransporte.tsx";
import VerTransporte from "./pages/AdminPages/Transporte/VerTransportes.tsx";
import EditarTransporte from "./pages/AdminPages/Transporte/EditarTransporte.tsx";

// Modulo de vista privadas cliente
import GenCliente from "./pages/ClientPages/VistaGenClient.tsx";
import DetalleReserva from "./pages/ClientPages/DetalleReserva.tsx";
import GestionarPasajeros from "./pages/ClientPages/GestionarPasajeros.tsx";
import ReservarPaquete from "./pages/ClientPages/ReservarPaquete.tsx";

//Modulo de cliente privado admin
import CrearCliente from "./pages/AdminPages/Cliente/CrearCliente.tsx";
import EditarCliente from "./pages/AdminPages/Cliente/EditarCliente.tsx";
import VerClientes from "./pages/AdminPages/Cliente/VerClientes.tsx";

// Finanzas
import VerCuentas from "./pages/AdminPages/Finanzas/VerCuentas";
import DetalleCuenta from "./pages/AdminPages/Finanzas/DetalleCuenta";
import VerGanancias from "./pages/AdminPages/Finanzas/VerGanancias";
import VerPagosProveedor from "./pages/AdminPages/Finanzas/VerPagosProveedor";
import DetallePagoProveedor from "./pages/AdminPages/Finanzas/DetallePagoProveedor";
import VerTransferencias from "./pages/AdminPages/Finanzas/VerTransferencias";
import VerFinanzasArchivadas from "./pages/AdminPages/Finanzas/VerFinanzasArchivadas";
import VerFechasImportantes from "./pages/AdminPages/FechasImportantes/VerFechasImportantes";
import FormFechaImportante from "./pages/AdminPages/FechasImportantes/FormFechaImportante";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* --------------Publicas--------------*/}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegistrarCliente />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        {/* 🚀 RUTA PÚBLICA DEL CATÁLOGO */}
        <Route path="/paquetes-disponibles" element={<CatalogoPaquetes />} />

        {/*--------------Privadas administrador--------------*/}
        {/* Reservas */}
        <Route
          path="/admin/crear-reserva"
          element={
            <AdminRoute>
              <CrearReserva />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ver-reserva"
          element={
            <AdminRoute>
              <VerReserva />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reservas/detalle/:id"
          element={
            <AdminRoute>
              <DetReserva />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reservas/:id"
          element={
            <AdminRoute>
              <EditarReserva />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reservas/archivados"
          element={
            <AdminRoute>
              <ClientesArchivados />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reservas/expediente/:userId"
          element={
            <AdminRoute>
              <ExpedienteClienteDetalle />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reservas/rapida" // Nueva ruta para crear reserva rápida
          element={
            <AdminRoute>
              <CrearReservaRapida />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reservas/tours"
          element={
            <AdminRoute>
              <CrearReservaTour />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reservas/tours/listado"
          element={
            <AdminRoute>
              <VerTours />
            </AdminRoute>
          }
        />

        {/* Pasajeros */}
        <Route
          path="/admin/crear-pasajero"
          element={
            <AdminRoute>
              <CrearPasajero />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ver-pasajeros"
          element={
            <AdminRoute>
              <VerPasajeros />
            </AdminRoute>
          }
        />

        {/* Vuelos */}
        <Route
          path="/admin/crear-vuelo"
          element={
            <AdminRoute>
              <CrearVuelo />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ver-vuelo"
          element={
            <AdminRoute>
              <VerVuelo />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/vuelo/:id"
          element={
            <AdminRoute>
              <EditarVuelo />
            </AdminRoute>
          }
        />
        {/* Transporte */}
        <Route
          path="/admin/crear-transporte"
          element={
            <AdminRoute>
              <CrearTransporte />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ver-transporte"
          element={
            <AdminRoute>
              <VerTransporte />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/transporte/:id"
          element={
            <AdminRoute>
              <EditarTransporte />
            </AdminRoute>
          }
        />

        {/* Hotel */}
        <Route
          path="/admin/crear-hotel"
          element={
            <AdminRoute>
              <CrearHotel />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ver-hotel"
          element={
            <AdminRoute>
              <VerHotel />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/hotel/:id"
          element={
            <AdminRoute>
              <EditarHotel />
            </AdminRoute>
          }
        />

        {/* Paquete */}
        <Route
          path="/admin/crear-paquete"
          element={
            <AdminRoute>
              <CrearPaquete />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/paquetes"
          element={
            <AdminRoute>
              <VerPaquete />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/editar-paquete/:id"
          element={
            <AdminRoute>
              <EditarPaquete />
            </AdminRoute>
          }
        />

        {/* Ciudad */}
        <Route
          path="/admin/crear-ciudad"
          element={
            <AdminRoute>
              <CrearCiudad />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ciudades"
          element={
            <AdminRoute>
              <VerCiudad />
            </AdminRoute>
          }
        />

        {/* Cliente */}
        <Route
          path="/admin/clientes"
          element={
            <AdminRoute>
              <VerClientes />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/crear-cliente"
          element={
            <AdminRoute>
              <CrearCliente />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/cliente/:id"
          element={
            <AdminRoute>
              <EditarCliente />
            </AdminRoute>
          }
        />

        {/* Finanzas */}
        <Route
          path="/admin/cuentas"
          element={
            <AdminRoute>
              <VerCuentas />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/finanzas"
          element={
            <AdminRoute>
              <VerCuentas />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/cuentas/:id"
          element={
            <AdminRoute>
              <DetalleCuenta />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/ganancias"
          element={
            <AdminRoute>
              <VerGanancias />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/pagos-proveedor"
          element={
            <AdminRoute>
              <VerPagosProveedor />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/pagos-proveedor/:id"
          element={
            <AdminRoute>
              <DetallePagoProveedor />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/transferencias"
          element={
            <AdminRoute>
              <VerTransferencias />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/finanzas/archivados"
          element={
            <AdminRoute>
              <VerFinanzasArchivadas />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/fechas-importantes"
          element={
            <AdminRoute>
              <VerFechasImportantes />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/fechas-importantes/nueva"
          element={
            <AdminRoute>
              <FormFechaImportante />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/fechas-importantes/:id"
          element={
            <AdminRoute>
              <FormFechaImportante />
            </AdminRoute>
          }
        />

        {/*--------------Privadas Cliente--------------*/}
        <Route
          path="/cliente/dashboard"
          element={
            <ClienteRoute>
              <GenCliente />
            </ClienteRoute>
          }
        />
        <Route
          path="/cliente/reservar/:id"
          element={
            <ClienteRoute>
              <ReservarPaquete />
            </ClienteRoute>
          }
        />
        <Route
          path="/cliente/detalle/:id"
          element={
            <ClienteRoute>
              <DetalleReserva />
            </ClienteRoute>
          }
        />
        <Route
          path="/cliente/reservas/:id/pasajeros"
          element={
            <ClienteRoute>
              <GestionarPasajeros />
            </ClienteRoute>
          }
        />

        {/*--------------Privadas (cualquier usuario autenticado)--------------*/}
        <Route
          path="/perfil"
          element={
            <AuthRoute>
              <Perfil />
            </AuthRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
